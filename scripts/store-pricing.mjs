import {CATALOG} from '../lib/catalog.js';
// Presentation and offline cart use the same product cents as the Stripe API.
const price=n=>'R$ '+(n/100).toFixed(2).replace('.',',');
const one=(html,old,now,label)=>{const n=html.split(old).length-1;if(n!==1)throw Error('Store pricing '+label+': '+n);return html.replace(old,now)};
function offerHtml(id){
 const p=CATALOG[id];
 const rows=[1,2,3].map(q=>{
  const total=q===1?p.cents:p.bundleCents[q],economy=q*p.cents-total;
  const badge=q===3?'MELHOR PREÇO':q===2?'MAIS VENDIDO':'';
  return '<label class="pop-kit-row"><input type="radio" name="pop-kit-qty" value="'+q+'"'+(q===3?' checked':'')+'><span class="pop-kit-name"><span>'+q+' '+(q===1?'unidade':'unidades')+(badge?'<em>'+badge+'</em>':'')+'</span><small>'+(economy>0?'Economize '+price(economy):'Ideal para conhecer')+'</small></span><strong>'+price(total)+'</strong></label>';
 }).join('');
 return '<section id="pop-kit-offers" aria-label="Kits especiais" class="pop-kit-offers"><h3>Escolha seu kit</h3><p>Quanto mais unidades, melhor o preço.</p>'+rows+'<div class="pop-kit-freight">Frete fixo de <b>R$ 11,57</b> para todo o pedido.</div></section>';
}
const styles='<style id="pop-kit-offers-styles">'+
'.pop-kit-offers{margin:14px 0 22px;padding:20px;border:1px solid #ecd2de;border-radius:18px;background:linear-gradient(130deg,#fff,#fff7fa);box-shadow:0 8px 24px rgba(99,20,52,.06)}'+
'.pop-kit-offers h3{margin:0;color:#75123c;font-size:21px;font-weight:800}.pop-kit-offers>p{margin:5px 0 13px;color:#826574;font-size:13px}'+
'.pop-kit-row{display:flex;gap:12px;align-items:center;padding:13px 14px;margin-top:8px;background:#fff;border:1px solid #ead5de;border-radius:13px;cursor:pointer}'+
'.pop-kit-row:has(input:checked){background:#fff2f7;border:2px solid #a21750;padding:12px 13px;box-shadow:0 4px 16px rgba(162,23,80,.07)}'+
'.pop-kit-row input{accent-color:#a21750;width:17px;height:17px;flex-shrink:0}.pop-kit-name{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}'+
'.pop-kit-name>span{font-size:14px;font-weight:750;color:#4f2b3b;display:flex;flex-wrap:wrap;gap:7px;align-items:center}'+
'.pop-kit-name em{font-style:normal;font-size:9px;border-radius:10px;color:#fff;background:#9d1247;padding:3px 7px}'+
'.pop-kit-name small{font-size:12px;color:#886a79}.pop-kit-row strong{font-size:19px;font-weight:800;white-space:nowrap;color:#9d1247}'+
'.pop-kit-freight{margin-top:15px;font-size:12px;color:#796270}.pop-kit-row:focus-within{outline:2px solid #b44b79;outline-offset:2px}'+
'.card-pricing__installments{display:none!important}'+
'@media(max-width:520px){.pop-kit-offers{padding:14px}.pop-kit-row{padding:11px}.pop-kit-row:has(input:checked){padding:10px}.pop-kit-row strong{font-size:17px}}'+
'</style>';
export function updateStorePrices(html,page){
 if(page==='checkout'){
  const old="const CATALOG={lisinha:{name:'Lisinha',price:6990},creme:{name:'Creme Popozuda',price:8990},spray:{name:'Spray Popozuda',price:6990}};";
  const now="const CATALOG="+JSON.stringify(Object.fromEntries(Object.entries(CATALOG).map(([id,p])=>[id,{name:p.name,price:p.cents}])))+";";
  html=one(html,old,now,'checkout catalog');
  const oldBundles="if(id==='creme')return sum+c*n;const deals=id==='lisinha'?{2:12990,3:16990}:{2:11990,3:15990};";
  const newBundles="const deals=id==='lisinha'?{2:"+CATALOG.lisinha.bundleCents[2]+",3:"+CATALOG.lisinha.bundleCents[3]+"}:id==='creme'?{2:"+CATALOG.creme.bundleCents[2]+",3:"+CATALOG.creme.bundleCents[3]+"}:{2:"+CATALOG.spray.bundleCents[2]+",3:"+CATALOG.spray.bundleCents[3]+"};";
  return one(html,oldBundles,newBundles,'checkout bundle pricing');
 }
 const oldL="lisinha:{name:'Lisinha',price:6990,href:'lisinha.html',img:'/media/b5c421fdf487253e1e7f0ea2.webp',bundles:{1:6990,2:12990,3:16990}}";
 const newL="lisinha:{name:'Lisinha',price:"+CATALOG.lisinha.cents+",href:'lisinha.html',img:'/media/b5c421fdf487253e1e7f0ea2.webp',bundles:{1:"+CATALOG.lisinha.cents+",2:"+CATALOG.lisinha.bundleCents[2]+",3:"+CATALOG.lisinha.bundleCents[3]+"}}";
 html=one(html,oldL,newL,'Lisinha offline cart');
 const oldC="creme:{name:'Creme Popozuda',price:8990,href:'creme.html',img:'/media/f8f257c71ee93e15963f9193.webp'}";
 const newC="creme:{name:'Creme Popozuda',price:"+CATALOG.creme.cents+",href:'creme.html',img:'/media/f8f257c71ee93e15963f9193.webp',bundles:{1:"+CATALOG.creme.cents+",2:"+CATALOG.creme.bundleCents[2]+",3:"+CATALOG.creme.bundleCents[3]+"}}";
 html=one(html,oldC,newC,'Centella offline cart');
 for(const [oldPrice,newPrice] of [
  ['R$ 69,90',price(CATALOG.lisinha.cents)],['R$ 89,90',price(CATALOG.creme.cents)],
  ['R$ 129,90',price(CATALOG.lisinha.bundleCents[2])],['R$ 169,90',price(CATALOG.lisinha.bundleCents[3])],
  ['R$ 139,80',price(CATALOG.lisinha.cents*2)],['R$ 209,70',price(CATALOG.lisinha.cents*3)],
  ['R$ 179,80',price(CATALOG.creme.cents*2)],['R$ 269,70',price(CATALOG.creme.cents*3)]
 ])html=html.replaceAll(oldPrice,newPrice);
 if(page==='lisinha')html=html.replaceAll('R$ 64,95',price(CATALOG.lisinha.cents));
 html=html.replace(/3x de R\$\s*[\d.,]+/gi,'');
 if(page==='lisinha'){
  const after=html.replace(/<kaching-bundle\b[^>]*>[\s\S]*?<\/kaching-bundle>/i,'');
  if(after===html)throw Error('Old Lisinha bundles not found');
  html=after;
 }
 if(page==='lisinha'||page==='creme'){
  html=one(html,"function bundleQty(){const bars=","function bundleQty(){const pick=document.querySelector('#pop-kit-offers input[name=pop-kit-qty]:checked');if(pick)return Number(pick.value);const bars=",'bundle selection');
  const form=/<form\b(?=[^>]*\bid="BuyButtons-ProductForm)[^>]*>/g;
  const all=[...html.matchAll(form)];
  if(all.length!==1)throw Error('Primary kit form missing on '+page+': '+all.length);
  html=html.replace(form,offerHtml(page)+all[0][0]);
  html=html.replace('</head>',styles+'</head>');
 }
 return html;
}
