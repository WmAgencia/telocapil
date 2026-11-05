import Stripe from 'stripe';
import crypto from 'node:crypto';
import {moneySummary} from '../lib/catalog.js';
import {enabled} from './checkout-config.js';
import {identity,reserve,attach,release} from '../lib/first-purchase.js';
const clean=(x,n=120)=>typeof x==='string'?x.trim().slice(0,n):'';
function validCPF(s){const c=s.replace(/\D/g,'');if(c.length!==11||/^(\d)\1+$/.test(c))return false;for(let j=9;j<=10;j++){let sum=0;for(let i=0;i<j;i++)sum+=Number(c[i])*(j+1-i);if(Number(c[j])!==((sum*10)%11)%10)return false}return true}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'Método não permitido'});
 if(!enabled())return res.status(503).json({error:'Pagamento temporariamente indisponível'});
 let claim=null,ident=null;
 try{
  const input=req.body||{},c=input.customer||{},email=clean(c.email,254),name=clean(c.name),phone=clean(c.phone,30),cpf=clean(c.cpf,14),postalCode=clean(c.postalCode,8),state=clean(c.state,2),city=clean(c.city,80),line1=clean(c.line1,120),number=clean(c.number,20),district=clean(c.district,60);
  if(!/^\S+@\S+\.\S+$/.test(email)||!name||!phone||!validCPF(cpf)||!/^\d{8}$/.test(postalCode)||!/^[A-Z]{2}$/.test(state)||!city||!line1||!number||!district)return res.status(400).json({error:'Dados de entrega inválidos'});
  if(input.coupon)return res.status(400).json({error:'O desconto de primeira compra é automático; remova o cupom'});
  const token=clean(input.checkoutToken,80);
  if(!/^[0-9a-f-]{36}$/i.test(token))return res.status(400).json({error:'Identificador de checkout inválido'});
  const subtotal=moneySummary(input.items,'',0),threshold=Number(process.env.SHIPPING_FREE_THRESHOLD_CENTS||0);
  let freight=Number(process.env.SHIPPING_FLAT_CENTS);
  if(!Number.isSafeInteger(freight)||freight<0||freight>100000)throw Error('Frete inválido');
  if(subtotal.quantities.some(i=>['lisinha','spray'].includes(i.id)&&i.quantity>=2)||(threshold>0&&subtotal.subtotal>=threshold))freight=0;
  const base=moneySummary(input.items,'',freight);
  ident=identity(email,cpf);
  claim=await reserve(ident,token);
  if(claim.pending)return res.status(409).json({error:'Existe uma compra em andamento com esses dados. Conclua-a ou aguarde alguns minutos para tentar novamente.'});
  const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);
  if(claim.reusedIntent){
    const old=await stripe.paymentIntents.retrieve(claim.reusedIntent);
    if(old.metadata?.origin!=='popozuda-reproducao'||old.metadata?.cpf_key!==ident.cpfKey)throw Error('Pedido já existente inválido');
    const previousDiscount=Number(old.metadata.first_purchase_discount||0);
    return res.status(200).json({clientSecret:old.client_secret,paymentIntentId:old.id,shippingCents:freight,amount:old.amount,firstPurchaseDiscountCents:previousDiscount,firstPurchaseEligible:previousDiscount>0,baseAmount:base.amount});
  }
  const promo=claim.eligible?Math.round(base.amount*.10):0;
  const finalAmount=base.amount-promo;
  if(finalAmount<50)throw Error('Valor abaixo do mínimo');
  const origin=input.origin||{};
  const data={amount:finalAmount,currency:'brl',automatic_payment_methods:{enabled:true},receipt_email:email,
    shipping:{name,phone,address:{country:'BR',postal_code:postalCode,line1:line1+' '+number,line2:district+' '+clean(c.line2,80),city,state}},
    metadata:{
      order_id:crypto.randomUUID(),origin:'popozuda-reproducao',items:JSON.stringify(base.quantities),
      subtotal:String(base.subtotal),discount:String(base.discount+promo),shipping:String(freight),
      first_purchase_discount:String(promo),first_purchase:claim.eligible?'1':'0',
      cpf_key:ident.cpfKey,email_key:ident.emailKey,
      utm_source:clean(origin.utmSource,90),utm_campaign:clean(origin.utmCampaign,90),utm_content:clean(origin.utmContent,90),
      fbp:clean(origin.fbp,150),fbc:clean(origin.fbc,150)
    }
  };
  const idempotencyKey='pz-first-'+crypto.createHash('sha256').update(token).digest('hex');
  const pi=await stripe.paymentIntents.create(data,{idempotencyKey});
  if(claim.eligible){
    try{await attach(ident,claim.hash,pi.id)}
    catch(e){try{await stripe.paymentIntents.cancel(pi.id)}catch{}throw e}
  }
  return res.status(200).json({clientSecret:pi.client_secret,paymentIntentId:pi.id,shippingCents:freight,amount:finalAmount,baseAmount:base.amount,firstPurchaseDiscountCents:promo,firstPurchaseEligible:claim.eligible});
 }catch(e){
  if(claim?.eligible&&!claim.reusedIntent&&ident)await release(ident,claim.hash);
  console.error('checkout.prepare',e.type||e.message);
  return res.status(e.statusCode===429?429:503).json({error:'Não foi possível preparar o pagamento. Verifique seus dados e tente novamente.'});
 }
}
