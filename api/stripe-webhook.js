import Stripe from 'stripe';
import {markPaid} from '../lib/first-purchase.js';
import {metaPurchase} from '../lib/meta-conversions.js';
export const config={api:{bodyParser:false}};
async function rawBody(req){const chunks=[];for await(const ch of req)chunks.push(Buffer.from(ch));return Buffer.concat(chunks)}
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).end();
 if(!process.env.STRIPE_SECRET_KEY||!process.env.STRIPE_WEBHOOK_SECRET)return res.status(503).end();
 let event;
 try{const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);event=stripe.webhooks.constructEvent(await rawBody(req),req.headers['stripe-signature'],process.env.STRIPE_WEBHOOK_SECRET)}catch(e){console.warn('stripe.webhook.invalid_signature',e?.type||'signature_invalid');return res.status(400).send('Assinatura inválida')}
 if(event.type==='payment_intent.payment_failed')console.info('stripe.payment_failed',JSON.stringify({intent:event.data.object.id,code:event.data.object.last_payment_error?.code||'unknown',origin:event.data.object.metadata?.origin||'unknown'}));
 if(event.type==='payment_intent.succeeded'&&event.data.object.metadata?.origin==='popozuda-reproducao'){
  const pi=event.data.object;
  if(pi.status!=='succeeded'||pi.amount_received<=0)return res.status(400).json({error:'Pagamento não confirmado'});
  // Sandbox events never reach the live promotion ledger or production Pixel.
  if(event.livemode!==true||pi.livemode!==true)return res.status(200).json({received:true,test:true});
  console.log('Pagamento confirmado',JSON.stringify({intent:pi.id,order:pi.metadata.order_id,amount:pi.amount_received}));
  try{await markPaid(pi)}catch(e){console.error('promo.webhook',e.message);return res.status(500).json({error:'Registro do pagamento pendente'})}
  try{console.log('meta_purchase_delivery',JSON.stringify(await metaPurchase(pi,{created:event.created})))}catch(e){console.error('Meta CAPI',e.message);return res.status(500).json({error:'Entrega de evento pendente'})}
 }
 return res.status(200).json({received:true});
}
