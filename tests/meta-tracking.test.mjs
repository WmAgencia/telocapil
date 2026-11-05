import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {JSDOM} from 'jsdom';
import {injectMetaPixel} from '../scripts/meta-pixel.mjs';
const pages=JSON.parse(gunzipSync(Buffer.from(Array.from({length:17},(_,i)=>fs.readFileSync(new URL('../payload/'+String(i).padStart(2,'0')+'.txt',import.meta.url),'utf8')).join(''),'base64')));
const controller=[...pages.lisinha.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]).find(x=>x.includes('Offline reproduction controller'));
async function fixture(page='lisinha',consent='yes',cart={},options={}){
 const calls=[];
 const markup='<html><head></head><body><form data-replica-add="lisinha"><input name="quantity" value="1"><button>Comprar</button></form><footer></footer><script>'+controller+'</script></body></html>';
 const html=injectMetaPixel(markup,page);
 const dom=new JSDOM(html,{url:'https://telocapil-consecom-seller.vercel.app/'+page+'.html?utm_source=meta&utm_campaign=audit&tracking_debug=1'+(options.payment?'&payment_intent=pi_fixture123':''),runScripts:'dangerously',beforeParse(w){w.localStorage.setItem('popozuda_analytics_consent_v1',consent);w.localStorage.setItem('popozuda_cart',JSON.stringify(cart));w.fbq=(...args)=>calls.push(args);w.structuredClone=structuredClone;w.fetch=async()=>({ok:true,json:async()=>options.order||{}});}});
 await new Promise(r=>setTimeout(r,30));
 return {dom,w:dom.window,calls,events:name=>calls.filter(x=>x[0]==='trackSingle'&&x[2]===name)};
}
test('refusal does not initialize or emit pixel events',async()=>{const f=await fixture('lisinha','no');assert.equal(f.calls.length,0);f.dom.window.close()});
test('accepted product page emits exactly one page view and view content',async()=>{const f=await fixture();assert.equal(f.events('PageView').length,1);assert.equal(f.events('ViewContent').length,1);f.dom.window.close()});
test('native product submit emits one actual cart addition with event id',async()=>{const f=await fixture();f.w.document.querySelector('form').dispatchEvent(new f.w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(f.events('AddToCart').length,1);assert.equal(f.events('AddToCart')[0][3].value,69.9);assert.ok(f.events('AddToCart')[0][4].eventID);f.dom.window.close()});
test('nonempty checkout carries kit prices and item quantities',async()=>{const f=await fixture('checkout','yes',{lisinha:2,creme:1});assert.equal(f.events('InitiateCheckout').length,1);const p=f.events('InitiateCheckout')[0][3];assert.equal(p.value,219.8);assert.deepEqual(JSON.parse(JSON.stringify(p.content_ids)),['lisinha','creme']);assert.equal(p.contents[0].quantity,2);f.dom.window.close()});
test('empty checkout does not emit initiate checkout',async()=>{const f=await fixture('checkout');assert.equal(f.events('InitiateCheckout').length,0);f.dom.window.close()});

test('revocation stops future cart events and clears attribution',async()=>{const f=await fixture();f.w.document.querySelector('[data-popozuda-cookie-settings]').click();f.w.document.getElementById('cookieDecline').click();f.w.document.querySelector('form').dispatchEvent(new f.w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(f.events('AddToCart').length,0);assert.equal(f.w.sessionStorage.getItem('popozuda_attribution_v1'),null);f.dom.window.close()});
test('sandbox, unconfirmed and refused orders never emit Purchase',async()=>{for(const order of [{status:'succeeded',livemode:false,trackingAllowed:true,amount:8387},{status:'processing',livemode:true,trackingAllowed:true,amount:8387},{status:'succeeded',livemode:true,trackingAllowed:false,amount:8387}]){const f=await fixture('pedido','yes',{}, {payment:true,order});assert.equal(f.events('Purchase').length,0);f.dom.window.close()}});
test('confirmed live receipt uses the same deduplication ID and contents as CAPI',async()=>{const f=await fixture('pedido','yes',{}, {payment:true,order:{status:'succeeded',livemode:true,trackingAllowed:true,amount:8387,contents:[{id:'lisinha',quantity:1}]}});assert.equal(f.events('Purchase').length,1);assert.equal(f.events('Purchase')[0][4].eventID,'pi_fixture123');assert.equal(f.events('Purchase')[0][3].value,83.87);assert.equal(f.w.localStorage.getItem('popozuda_meta_paid_pi_fixture123'),'1');f.dom.window.close()});
