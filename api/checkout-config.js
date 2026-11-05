import {CATALOG} from '../lib/catalog.js';
export function enabled(){
 const key=process.env.STRIPE_SECRET_KEY||'',pub=process.env.STRIPE_PUBLISHABLE_KEY||'';
 const live=/^(?:sk|rk)_live_/.test(key);
 const shipping=Number(process.env.SHIPPING_FLAT_CENTS);
 const promo=Number(process.env.FIRST_PURCHASE_DISCOUNT_PERCENT);
 return !!(key&&pub&&process.env.STRIPE_WEBHOOK_SECRET&&
   Number.isSafeInteger(shipping)&&shipping>0&&shipping<100000&&
   process.env.DATABASE_URL&&process.env.PROMO_HASH_SECRET?.length>=48&&
   promo===10&&process.env.ENABLE_CHECKOUT==='true'&&
   (!live||process.env.ENABLE_LIVE_PAYMENTS==='true'));
}
export default function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({error:'Método não permitido'});
 const ok=enabled();
 return res.status(200).json({
  enabled:ok,publishableKey:ok?process.env.STRIPE_PUBLISHABLE_KEY:null,
  pricing:Object.fromEntries(Object.entries(CATALOG).map(([id,p])=>[id,p.cents])),
  shippingFlatCents:Number(process.env.SHIPPING_FLAT_CENTS)||2329,
  freeShippingThresholdCents:Number(process.env.SHIPPING_FREE_THRESHOLD_CENTS)||0,
  firstPurchasePercent:10,
  firstPurchaseEligibility:'validated_before_payment',
  reason:ok?null:'Pagamento temporariamente indisponível. Tente novamente mais tarde.'
 });
}
