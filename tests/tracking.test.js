import {test} from 'node:test';
import assert from 'node:assert/strict';
import {injectMetaPixel} from '../scripts/meta-pixel.mjs';
import {polishCheckout} from '../scripts/checkout-polish.mjs';
import {metaPurchase} from '../lib/meta-conversions.js';

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
 assert.equal((await metaPurchase({...sample,metadata:{...sample.metadata,analytics_consent:'no'}},{fetchImpl:fakeFetch,env})).sent,false);
 assert.equal((await metaPurchase({...sample,status:'requires_payment_method'},{fetchImpl:fakeFetch,env})).sent,false);
 assert.equal(calls,1);
});
