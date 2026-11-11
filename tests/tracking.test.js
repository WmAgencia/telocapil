import {test} from 'node:test';
import assert from 'node:assert/strict';
import {injectMetaPixel} from '../scripts/meta-pixel.mjs';
import {polishCheckout} from '../scripts/checkout-polish.mjs';
import {metaPurchase,paymentAttribution} from '../lib/meta-conversions.js';
import {moneySummary} from '../lib/catalog.js';
import {SHIPPING_FLAT_CENTS,firstPurchaseDiscountCents} from '../lib/checkout-pricing.js';
import {upgradePromotion} from '../scripts/promo-frontend.mjs';

test('Pixel, custom events and cookie gating are injected once',()=>{
 const html='<html><head></head><body></body></html>';
 const out=injectMetaPixel(html,'pedido');
 assert.equal(out.match(/id="popozuda-meta-tracking"/g)?.length,1);
 assert.match(out,/trackSingleCustom/);
 assert.match(out,/saved\(\)!=='yes'/);
 assert.match(out,/customEvent:trackCustom,cartData/);
 assert.equal(injectMetaPixel(out,'pedido'),out);
});
test('Checkout instruments completed payment details and actual confirmation',()=>{
 const original='<html><head></head><body><a class="brand" aria-label="Voltar à loja">Loja</a><script>'+
  "const el=elements.create('payment',{layout:'tabs'});document.getElementById('payment-element').textContent='';el.mount('#payment-element');"+
  "const result=await stripe.confirmPayment({elements});"+
  "const theme=appearance:{theme:'stripe',variables:{colorPrimary:'#980d3e',borderRadius:'6px'}};</script></body></html>";
 const out=polishCheckout(original,'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=');
 assert.match(out,/AddPaymentInfo/);
 assert.match(out,/event\?\.complete/);
 assert.match(out,/CheckoutPaymentDetailsComplete/);
 assert.match(out,/CheckoutPaymentAttempt/);
 assert.match(out,/stripe\.confirmPayment/);
});
test('CAPI only sends confirmed consented live payments with deterministic dedup id',async()=>{
 const sample={id:'pi_test_mock',status:'succeeded',livemode:true,currency:'brl',amount_received:8387,
  metadata:{analytics_consent:'yes',fbp:'fb.1.1700000000.123',event_source_url:'https://telocapil-consecom-seller.vercel.app/checkout.html',items:JSON.stringify([{id:'lisinha',quantity:1}])}};
 let calls=0,body;
 const env={META_TRACKING_ENABLED:'true',META_ACCESS_TOKEN:'not-a-real-token',META_PIXEL_ID:'2302179570557964'};
 const fakeFetch=async(url,options)=>{calls++;body=JSON.parse(options.body);assert.match(url,/2302179570557964\/events/);return{ok:true,status:200,json:async()=>({events_received:1})}};
 assert.equal((await metaPurchase(sample,{fetchImpl:fakeFetch,env})).sent,true);
 assert.equal(body.data[0].event_id,sample.id);
 assert.equal(body.data[0].custom_data.value,83.87);
 assert.equal(body.data[0].event_name,'Purchase');
 assert.equal(calls,1);
 const withHashedContact={...sample,receipt_email:'Teste@Example.com',shipping:{phone:'(15) 99999-9999'},metadata:{...sample.metadata,fbp:'',fbc:''}};
 assert.equal((await metaPurchase(withHashedContact,{fetchImpl:fakeFetch,env})).sent,true);
 assert.match(body.data[0].user_data.em[0],/^[a-f0-9]{64}$/);
 assert.match(body.data[0].user_data.ph[0],/^[a-f0-9]{64}$/);
 assert.equal(body.data[0].user_data.fbp,undefined);
 assert.equal(calls,2);
 assert.equal((await metaPurchase({...sample,metadata:{...sample.metadata,analytics_consent:'no'}},{fetchImpl:fakeFetch,env})).sent,false);
 assert.equal((await metaPurchase({...sample,status:'requires_payment_method'},{fetchImpl:fakeFetch,env})).sent,false);
 assert.equal(calls,2);
});

test('Attribution persists original landing, accepts both new store domains and rejects unrelated hosts',()=>{
 const a=paymentAttribution({consent:true,sourceUrl:'https://popozuda-loja.vercel.app/checkout.html?private=ignored',
  entryUrl:'https://popozuda-loja.vercel.app/products/lisinha?fbclid=hidden',
  utmSource:'facebook',utmCampaign:'telocapil-nov',campaignId:'120260145640490386',adsetId:'120260145649490386',adId:'120260175612310386'});
 assert.equal(a.event_source_url,'https://popozuda-loja.vercel.app/checkout.html');
 assert.equal(a.entry_url,'https://popozuda-loja.vercel.app/products/lisinha');
 assert.equal(a.utm_campaign,'telocapil-nov');
 assert.equal(a.meta_ad_id,'120260175612310386');
 assert.equal(paymentAttribution({consent:true,entryUrl:'https://other.invalid/product',sourceUrl:'https://other.invalid/checkout'}).entry_url,'');
 assert.equal(paymentAttribution({consent:false,entryUrl:'https://popozuda-loja.vercel.app/products/lisinha',utmCampaign:'test'}).utm_campaign,'');
 const source='<html><head></head><body><script>origin:{utmSource:attribution.utm_source||\'\',fbc:window.__popozudaTracking?.getAttribution()?.fbc||\'\'}</script></body></html>';
 const result=injectMetaPixel(source,'checkout');
 assert.match(result,/entryUrl:a.entryUrl/);
 assert.match(result,/campaignId:a.campaign_id/);
 assert.match(result,/adId:a.ad_id/);
 assert.match(result,/result.entryUrl=location.origin\+location.pathname/);
});

test('Flat freight is charged only once on all quantities and discount does not reduce it',()=>{
 assert.equal(SHIPPING_FLAT_CENTS,1157);
 for(const quantity of [1,2,3,5]){
  const order=moneySummary([{id:'lisinha',quantity}],'',SHIPPING_FLAT_CENTS);
  assert.equal(order.shippingCents,1157);
  assert.equal(order.amount,order.subtotal+1157);
  const discount=firstPurchaseDiscountCents(order.subtotal,true);
  assert.equal(discount,Math.round(order.subtotal*.10));
  assert.equal(order.amount-discount,order.subtotal-discount+1157);
 }
 assert.equal(firstPurchaseDiscountCents(2990,false),0);
});
test('Frontend never grants free shipping and discounts only product subtotal',()=>{
 const source=String(upgradePromotion);
 assert.match(source,/shippingFlatCents\?\?1157/);
 assert.match(source,/getTotalItems\(\)\*\.10/);
 assert.doesNotMatch(source,/freeShippingThresholdCents/);
 assert.doesNotMatch(source,/getTotalItems\(\)\+checkoutFreight\(\)/);
});
