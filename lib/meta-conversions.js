import {createHash} from 'node:crypto';
/** Only confirmed, live, consented payments may enter production conversions. */
export function paymentAttribution(origin={}){
 const allowed=origin.consent===true;
 const clean=(value,max=150)=>allowed&&typeof value==='string'?value.trim().slice(0,max):'';
 const hosts=new Set(['telocapil-consecom-seller.vercel.app','popozuda-loja.vercel.app','popozuda-site-production.up.railway.app','popozuda.consecom.com.br','consecom.popozuda.com.br']);
 const safeUrl=(input)=>{if(!allowed)return '';try{const url=new URL(input);return url.protocol==='https:'&&hosts.has(url.hostname)?url.origin+url.pathname:''}catch{return ''}};
 const numericId=(value)=>allowed&&/^\d{6,25}$/.test(String(value||''))?String(value):'';
 return {analytics_consent:allowed?'yes':'no',utm_source:clean(origin.utmSource),utm_medium:clean(origin.utmMedium),utm_campaign:clean(origin.utmCampaign),utm_content:clean(origin.utmContent),utm_term:clean(origin.utmTerm),
  fbp:clean(origin.fbp,150),fbc:clean(origin.fbc,550),event_source_url:safeUrl(origin.sourceUrl),entry_url:safeUrl(origin.entryUrl),meta_campaign_id:numericId(origin.campaignId),meta_adset_id:numericId(origin.adsetId),meta_ad_id:numericId(origin.adId)};
}
export function purchaseData(pi){
 let contents=[];try{contents=JSON.parse(pi.metadata?.items||'[]').filter(x=>['lisinha','creme','spray'].includes(x.id)&&Number.isSafeInteger(x.quantity)&&x.quantity>0&&x.quantity<=20).map(({id,quantity})=>({id,quantity}))}catch{}
 return {currency:'BRL',value:Number(pi.amount_received||0)/100,content_type:'product',content_ids:contents.map(x=>x.id),contents};
}
export async function metaPurchase(pi,{created=Math.floor(Date.now()/1000),fetchImpl=fetch,env=process.env}={}){
 const skip=reason=>({sent:false,reason});
 if(pi.status!=='succeeded'||pi.livemode!==true||pi.currency!=='brl'||!Number.isSafeInteger(pi.amount_received)||pi.amount_received<=0)return skip('not_confirmed_live_payment');
 if(pi.metadata?.analytics_consent!=='yes')return skip('no_marketing_consent');
 if(env.META_TRACKING_ENABLED!=='true'||!env.META_ACCESS_TOKEN||env.META_PIXEL_ID!=='2302179570557964')return skip('missing_configuration');
 const user_data={};
 if(pi.metadata.fbp)user_data.fbp=pi.metadata.fbp;if(pi.metadata.fbc)user_data.fbc=pi.metadata.fbc;
 // The buyer explicitly consented at checkout. Hash contact details locally;
 // never submit raw email or phone to Meta and never use them for opt-outs.
 const email=String(pi.receipt_email||'').trim().toLowerCase();
 if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))user_data.em=[createHash('sha256').update(email).digest('hex')];
 let phone=String(pi.shipping?.phone||'').replace(/\D/g,'');
 if(phone.length===10||phone.length===11)phone='55'+phone;
 if(phone.length>=12&&phone.length<=15)user_data.ph=[createHash('sha256').update(phone).digest('hex')];
 if(!Object.keys(user_data).length)return skip('missing_match_data');
 const body={data:[{event_name:'Purchase',event_time:created,event_id:pi.id,action_source:'website',event_source_url:pi.metadata.event_source_url||env.SITE_URL||'',user_data,custom_data:purchaseData(pi)}]};
 const response=await fetchImpl('https://graph.facebook.com/v25.0/'+env.META_PIXEL_ID+'/events',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+env.META_ACCESS_TOKEN},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
 const result=await response.json().catch(()=>({}));
 if(!response.ok||result.events_received!==1)throw Error('CAPI rejected: HTTP '+response.status+' code '+(result.error?.code||'unknown'));
 return {sent:true,event_id:pi.id,events_received:result.events_received,fbtrace_id:result.fbtrace_id||null};
}
