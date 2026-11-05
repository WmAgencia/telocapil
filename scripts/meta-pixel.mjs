const PIXEL_ID='2302179570557964';
const PRODUCTS={
 lisinha:{id:'lisinha',name:'Sérum Lisinha',value:69.90},
 creme:{id:'creme',name:'Creme Centella',value:89.90},
 spray:{id:'spray',name:'Spray Popozuda',value:69.90}
};

/* Build-time injection for the Vercel storefront and Railway HTML. Do not ship
   server tokens or advanced matching data to the browser. */
export function injectMetaPixel(html,page){
 if(html.includes('id="popozuda-meta-tracking"'))return html;
 const prior=(html.match(/fbevents\.js|fbq\s*\(\s*['"]init['"]|facebook\.com\/tr\?/gi)||[]).length;
 console.log('Meta pre-existing tracker markers',page,prior);
 const client=String.raw`<script id="popozuda-meta-tracking">
(function(){
'use strict';
if(window.__popozudaMetaTracking)return;
window.__popozudaMetaTracking=true;
const PIXEL='__PIXEL_ID__',PAGE=__PAGE_JSON__,PRODUCTS=__PRODUCTS_JSON__;
const KEY='popozuda_analytics_consent_v1';
let started=false;
function track(name,data,extra){
 if(typeof window.fbq!=='function')return;
 try{window.fbq('trackSingle',PIXEL,name,data||{},extra||{})}catch(e){}
}
function productData(p,quantity){
 return {content_type:'product',content_ids:[p.id],contents:[{id:p.id,quantity:quantity||1}],content_name:p.name,currency:'BRL',value:p.value*(quantity||1)};
}
function start(){
 if(started)return;started=true;
 if(typeof window.fbq!=='function'){
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=true;n.version='2.0';n.queue=[];
  t=b.createElement(e);t.async=true;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
  (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
 }
 window.fbq('init',PIXEL);
 track('PageView');
 if(PRODUCTS[PAGE])track('ViewContent',productData(PRODUCTS[PAGE],1));
 if(PAGE==='checkout')track('InitiateCheckout',{currency:'BRL'});
 let attempts=0;
 const monitor=setInterval(function(){
  const store=window.__popozudaPreview;
  if(store&&typeof store.add==='function'&&!store.add.__popozudaMetaWrapped){
   const original=store.add;
   const wrapped=function(id,quantity){
    const result=original.apply(this,arguments);
    const p=PRODUCTS[id];const q=Math.max(1,Math.min(20,Number(quantity)||1));
    if(p&&result!==false)track('AddToCart',productData(p,q));
    return result;
   };
   wrapped.__popozudaMetaWrapped=true;store.add=wrapped;
  }
  if(++attempts>=30||store?.add?.__popozudaMetaWrapped)clearInterval(monitor);
 },500);
 if(PAGE==='checkout'||PAGE==='pedido'){
  const id=new URLSearchParams(location.search).get('payment_intent');
  if(id&&/^pi_[a-zA-Z0-9]+$/.test(id)){
   fetch('/api/order-status?payment_intent='+encodeURIComponent(id),{cache:'no-store'})
    .then(r=>r.ok?r.json():null).then(order=>{
      if(!order||order.status!=='succeeded'||!Number.isFinite(Number(order.amount))||Number(order.amount)<=0)return;
      const k='popozuda_meta_paid_'+id;
      if(sessionStorage.getItem(k)==='1')return;
      track('Purchase',{currency:'BRL',value:Number(order.amount)/100},{eventID:id});
      sessionStorage.setItem(k,'1');
    }).catch(()=>{});
  }
 }
}
function saved(){try{return localStorage.getItem(KEY)}catch(e){return null}}
function save(value){try{localStorage.setItem(KEY,value)}catch(e){}}
function consentUI(){
 const previous=saved();
 if(previous==='yes'){start();return}
 if(previous==='no')return;
 const panel=document.createElement('div');panel.id='popozuda-meta-consent';
 panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Preferências de cookies');
 panel.innerHTML='<span>Usamos cookies opcionais para medir visitas e resultados dos anúncios. Você pode aceitar ou continuar apenas com os essenciais.</span><div><button type="button" data-choice="no">Só essenciais</button><button type="button" data-choice="yes">Aceitar métricas</button></div>';
 panel.addEventListener('click',function(ev){const b=ev.target.closest('button[data-choice]');if(!b)return;const choice=b.dataset.choice;save(choice);panel.remove();if(choice==='yes')start()});
 document.body.appendChild(panel);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',consentUI,{once:true});
else consentUI();
})();
</script>`;
 const style=String.raw`<style id="popozuda-meta-consent-style">
 #popozuda-meta-consent{position:fixed;z-index:2147483000;left:16px;bottom:16px;width:min(580px,calc(100vw - 32px));background:#fff;color:#33232a;border:1px solid #ead8df;border-radius:15px;box-shadow:0 10px 30px #0002;padding:15px 17px;font:13px/1.5 system-ui,sans-serif;display:flex;gap:15px;align-items:center}
 #popozuda-meta-consent div{flex:none;display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}
 #popozuda-meta-consent button{border:1px solid #9e1349;padding:8px 11px;border-radius:10px;background:#fff;color:#9e1349;font:600 12px system-ui;cursor:pointer}
 #popozuda-meta-consent button[data-choice="yes"]{background:#9e1349;color:#fff}
 @media(max-width:650px){#popozuda-meta-consent{display:block}#popozuda-meta-consent div{margin-top:10px;justify-content:flex-start}}
 </style>`;
 if(!html.includes('</head>')||!html.includes('</body>'))throw Error('Meta tracker injection: invalid HTML '+page);
 const injected=client.replace('__PIXEL_ID__',PIXEL_ID).replace('__PAGE_JSON__',JSON.stringify(page)).replace('__PRODUCTS_JSON__',JSON.stringify(PRODUCTS));
 return html.replace('</head>',style+'</head>').replace('</body>',injected+'</body>');
}
