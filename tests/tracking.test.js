import {test} from 'node:test';
import assert from 'node:assert/strict';
import {injectMetaPixel} from '../scripts/meta-pixel.mjs';
import {polishCheckout} from '../scripts/checkout-polish.mjs';
import {metaPurchase,paymentAttribution} from '../lib/meta-conversions.js';
import {moneySummary} from '../lib/catalog.js';
import {SHIPPING_FLAT_CENTS,firstPurchaseDiscountCents} from '../lib/checkout-pricing.js';
import {upgradePromotion} from '../scripts/promo-frontend.mjs';
import {CATALOG,linePrice} from '../lib/catalog.js';
import {updateStorePrices} from '../scripts/store-pricing.mjs';
import {addLimitedBatchBanner} from '../scripts/limited-batch-banner.mjs';

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

test('Lisinha and Centella bundles match Stripe amounts and freight',()=>{
 const expected={lisinha:[1490,2290,2990],creme:[1990,2990,3990]};
 for(const [id,prices] of Object.entries(expected))for(const quantity of [1,2,3]){
  assert.equal(linePrice(id,quantity),prices[quantity-1]);
  const summary=moneySummary([{id,quantity}],'',SHIPPING_FLAT_CENTS);
  assert.equal(summary.amount,prices[quantity-1]+1157);
  assert.equal(summary.amount-firstPurchaseDiscountCents(summary.subtotal,true),prices[quantity-1]-Math.round(prices[quantity-1]*.1)+1157);
 }
 assert.equal(CATALOG.spray.cents,6990);
});
test('Store and checkout offer same kit prices without old Kaching selectors',()=>{
 const fake='<html><head></head><body><script>lisinha:{name:\'Lisinha\',price:6990,href:\'lisinha.html\',img:\'/media/b5c421fdf487253e1e7f0ea2.webp\',bundles:{1:6990,2:12990,3:16990}} creme:{name:\'Creme Popozuda\',price:8990,href:\'creme.html\',img:\'/media/f8f257c71ee93e15963f9193.webp\'} function bundleQty(){const bars=</script><kaching-bundle>Old</kaching-bundle><form data-replica-add="lisinha" id="BuyButtons-ProductForm-test">Comprar</form><p>R$ 69,90 R$ 129,90 R$ 169,90 R$ 89,90</p></body></html>';
 const newLisinha=updateStorePrices(fake,'lisinha');
 assert.match(newLisinha,/R\$ 14,90/);
 assert.match(newLisinha,/R\$ 22,90/);
 assert.match(newLisinha,/R\$ 29,90/);
 assert.match(newLisinha,/value="3" checked/);
 assert.match(newLisinha,/id="pop-featured-kit"/);
 assert.match(newLisinha,/querySelector\('input\[name=pop-kit-qty\]:checked'\)/);
 assert.doesNotMatch(newLisinha,/<kaching-bundle>/);
 const newCream=updateStorePrices(fake.replace('data-replica-add="lisinha"','data-replica-add="creme"').replace('<kaching-bundle>Old</kaching-bundle>',''),'creme');
 assert.match(newCream,/R\$ 19,90/);
 assert.match(newCream,/R\$ 39,90/);
 const checkout="<html><script>const CATALOG={lisinha:{name:'Lisinha',price:6990},creme:{name:'Creme Popozuda',price:8990},spray:{name:'Spray Popozuda',price:6990}};if(id==='creme')return sum+c*n;const deals=id==='lisinha'?{2:12990,3:16990}:{2:11990,3:15990};</script></html>";
 const withItem=checkout.replace('</script>',"id==='creme'?CATALOG[id].price*n:const d=id==='lisinha'?{2:12990,3:16990}:{2:11990,3:15990};</script>");
 const updated=updateStorePrices(withItem,'checkout');
 assert.match(updated,/price":1490/);
 assert.match(updated,/price":1990/);
 assert.match(updated,/id==='creme'\?\{2:2990,3:3990\}/);
});

test('Final-batch banner on home, and persistent per-visitor seven-hour countdown with global stock cutoff on Lisinha',()=>{
 const home='<html><head></head><body class="store"><main>Shop</main></body></html>';
 const homeBanner=addLimitedBatchBanner(home,'index');
 assert.match(homeBanner,/LOTE ESPECIAL LIMITADO/);
 assert.match(homeBanner,/Últimas unidades disponíveis/);
 assert.equal(addLimitedBatchBanner(homeBanner,'index'),homeBanner);
 const product='<html><head></head><body><product-inventory data-product-id="9232838263011">Em estoque e pronto para envio</product-inventory><section id="pop-kit-offers">Escolha seu kit<label class="pop-kit-row pop-kit-featured" id="pop-featured-kit"><input type="radio" name="pop-kit-qty" value="3" checked><span>3 unidades</span><strong>R$ 29,90</strong></label><label class="pop-kit-row"><input type="radio" name="pop-kit-qty" value="1">1 unidade</label><label class="pop-kit-row"><input type="radio" name="pop-kit-qty" value="2">2 unidades</label></section></body></html>';
 const updated=addLimitedBatchBanner(product,'lisinha');
 assert.match(updated,/Últimas unidades disponíveis/);
 assert.match(updated,/Último lote de Lisinha com preços especiais/);
 assert.match(updated,/id="lote-especial-banner"/);
 assert.match(updated,/id="lote-timer-hours">07/);
 assert.match(updated,/id="lote-timer-minutes">00/);
 assert.match(updated,/id="lote-timer-seconds">00/);
 assert.match(updated,/data-personal-duration="7h"/);
 assert.match(updated,/localStorage.getItem\(STORAGE_KEY\)/);
 assert.match(updated,/started\+MS-Date.now\(\)/);
 assert.match(updated,/fetch\("\/api\/lote-status"/);
 assert.match(updated,/data.known===true && data.soldOut===true/);
 assert.match(updated,/markSoldOut\(\)/);
 assert.equal(addLimitedBatchBanner(updated,'lisinha'),updated);
 assert.ok(updated.indexOf('</product-inventory>') < updated.indexOf('id="lote-especial-banner"'));
 assert.ok(updated.indexOf('id="lote-especial-banner"') < updated.indexOf('id="pop-kit-offers"'));
 assert.ok(updated.indexOf('id="pop-featured-kit"') > updated.indexOf('id="lote-especial-banner"'));
 assert.ok(updated.indexOf('id="pop-featured-kit"') < updated.indexOf('id="pop-kit-offers"'));
 assert.equal((updated.match(/id="pop-featured-kit"/g)||[]).length,1);
 assert.match(updated,/3 unidades/);
 assert.match(updated,/R\$ 29,90/);
 assert.match(updated,/<section id="pop-kit-offers">Escolha seu kit<label class="pop-kit-row"><input[^>]*value="1"/);
 assert.match(updated,/lote-destaque-finalizado \.lote-especial-timer-caption/);
 assert.match(updated,/lote-esgotado \.pop-kit-featured/);
 assert.doesNotMatch(updated,/lote-destaque-finalizado\{display:none/);
 assert.doesNotMatch(updated,/2300|2\.300|Ofertas acabam em 7 horas/i);
 for(const page of ['creme','spray','checkout'])assert.equal(addLimitedBatchBanner(home,page),home);
});

// Stock accounting never assumes the rough batch estimate as a verified count.
test('Confirmed Lisinha quantity extraction is independent from other products',async()=>{
 const {purchasedLisinhaQuantity}=await import('../lib/lote-stock.js');
 assert.equal(purchasedLisinhaQuantity({metadata:{items:JSON.stringify([{id:'creme',quantity:2},{id:'lisinha',quantity:3}])}}),3);
 assert.equal(purchasedLisinhaQuantity({metadata:{items:'not-json'}}),0);
 assert.equal(purchasedLisinhaQuantity({metadata:{items:JSON.stringify([{id:'lisinha',quantity:-2}])}}),0);
});
