import {paymentAttribution} from '../lib/meta-conversions.js';
import Stripe from 'stripe';
import crypto from 'node:crypto';
import {moneySummary} from '../lib/catalog.js';
import {SHIPPING_FLAT_CENTS,firstPurchaseDiscountCents} from '../lib/checkout-pricing.js';
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
  const tracking=paymentAttribution(input.origin);
  const token=clean(input.checkoutToken,80);
  if(!/^[0-9a-f-]{36}$/i.test(token))return res.status(400).json({error:'Identificador de checkout inválido'});
  // Exactly one shipping fee per order, including multi-unit kits.
  const freight=SHIPPING_FLAT_CENTS;
  const base=moneySummary(input.items,'',freight);
  ident=identity(email,cpf);
  claim=await reserve(ident,token);
  if(claim.pending)return res.status(409).json({error:'Existe uma compra em andamento com esses dados. Conclua-a ou aguarde alguns minutos para tentar novamente.'});
  if(claim.waiting)return res.status(409).json({error:'Seu pagamento está sendo preparado. Aguarde alguns segundos e tente novamente.'});
  const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);
  if(claim.reusedIntent){
    const old=await stripe.paymentIntents.retrieve(claim.reusedIntent);
    if(old.metadata?.origin!=='popozuda-reproducao'||old.metadata?.cpf_key!==ident.cpfKey||old.metadata?.email_key!==ident.emailKey)throw Error('Pedido não pertence ao cadastro atual');
    if(old.status==='succeeded'||old.status==='processing')return res.status(409).json({error:'Já existe um pagamento enviado para processamento. Aguarde a confirmação antes de tentar outra compra.'});
    if(old.status==='canceled')return res.status(409).json({error:'Este pagamento foi cancelado. Aguarde alguns minutos e reinicie a compra.'});
    if(!['requires_payment_method','requires_confirmation','requires_action'].includes(old.status))return res.status(409).json({error:'Seu pagamento ainda está sendo processado. Aguarde alguns minutos.'});
    // A reloaded checkout must not overwrite the ad that originally sourced the
    // PaymentIntent. Only fill empty attribution keys, while respecting consent withdrawal.
    const changes={analytics_consent:tracking.analytics_consent};
    if(tracking.analytics_consent==='no'){
      changes.fbp='';changes.fbc='';
    }else{
      for(const [key,value] of Object.entries(tracking)){
        if(key==='analytics_consent'||!value||old.metadata?.[key])continue;
        changes[key]=value;
      }
    }
    if(Object.entries(changes).some(([key,value])=>(old.metadata?.[key]||'')!==value))await stripe.paymentIntents.update(old.id,{metadata:changes});
    if(old.metadata?.items!==JSON.stringify(base.quantities)||Number(old.metadata?.shipping)!==freight){
      // Only an unconfirmed intent can accept a revised basket. Stripe rejects
      // updates if a concurrent confirmation has already moved it to processing.
      if(old.status!=='requires_payment_method')return res.status(409).json({error:'O pagamento anterior já foi iniciado. Conclua-o antes de alterar o carrinho.'});
      const revisedPromo=firstPurchaseDiscountCents(base.subtotal,old.metadata.first_purchase==='1');
      const revised=await stripe.paymentIntents.update(old.id,{
        amount:base.amount-revisedPromo,
        shipping:{name,phone,address:{country:'BR',postal_code:postalCode,line1:line1+' '+number,line2:district+' '+clean(c.line2,80),city,state}},
        receipt_email:email,
        metadata:{items:JSON.stringify(base.quantities),subtotal:String(base.subtotal),discount:String(base.discount+revisedPromo),shipping:String(freight),first_purchase_discount:String(revisedPromo)}
      });
      return res.status(200).json({clientSecret:revised.client_secret,paymentIntentId:revised.id,shippingCents:freight,amount:revised.amount,firstPurchaseDiscountCents:revisedPromo,firstPurchaseEligible:revisedPromo>0,baseAmount:base.amount,continued:true});
    }
    const previousDiscount=Number(old.metadata.first_purchase_discount||0);
    const oldAddress=old.shipping?.address||{};
    const sameAddress=old.shipping?.name===name&&old.shipping?.phone===phone&&oldAddress.postal_code===postalCode&&oldAddress.line1===line1+' '+number&&oldAddress.city===city&&oldAddress.state===state&&oldAddress.line2===district+' '+clean(c.line2,80);
    if(sameAddress)return res.status(200).json({clientSecret:old.client_secret,paymentIntentId:old.id,shippingCents:freight,amount:old.amount,firstPurchaseDiscountCents:previousDiscount,firstPurchaseEligible:previousDiscount>0,baseAmount:base.amount,continued:true});
    if(old.status!=='requires_action'){
      // A returning customer may have corrected their delivery address after reload.
      // Update the SAME PaymentIntent; never issue a duplicate charge or discount.
      const refreshed=await stripe.paymentIntents.update(old.id,{shipping:{name,phone,address:{country:'BR',postal_code:postalCode,line1:line1+' '+number,line2:district+' '+clean(c.line2,80),city,state}},receipt_email:email});
      return res.status(200).json({clientSecret:refreshed.client_secret,paymentIntentId:refreshed.id,shippingCents:freight,amount:refreshed.amount,firstPurchaseDiscountCents:previousDiscount,firstPurchaseEligible:previousDiscount>0,baseAmount:base.amount,continued:true});
    }
    return res.status(200).json({clientSecret:old.client_secret,paymentIntentId:old.id,shippingCents:freight,amount:old.amount,firstPurchaseDiscountCents:previousDiscount,firstPurchaseEligible:previousDiscount>0,baseAmount:base.amount,continued:true});
  }
  const promo=firstPurchaseDiscountCents(base.subtotal,claim.eligible);
  const finalAmount=base.amount-promo;
  if(finalAmount<50)throw Error('Valor abaixo do mínimo');
  const data={amount:finalAmount,currency:'brl',automatic_payment_methods:{enabled:true},receipt_email:email,
    shipping:{name,phone,address:{country:'BR',postal_code:postalCode,line1:line1+' '+number,line2:district+' '+clean(c.line2,80),city,state}},
    metadata:{
      order_id:crypto.randomUUID(),origin:'popozuda-reproducao',items:JSON.stringify(base.quantities),
      subtotal:String(base.subtotal),discount:String(base.discount+promo),shipping:String(freight),
      first_purchase_discount:String(promo),first_purchase:claim.eligible?'1':'0',
      cpf_key:ident.cpfKey,email_key:ident.emailKey,
      ...tracking
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
