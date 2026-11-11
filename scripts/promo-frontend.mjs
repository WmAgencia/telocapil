/**
 * Adapt the original saved checkout's pricing display to match the signed
 * server-side first-purchase promotion. No browser-side amount is trusted.
 */
function replaceOne(html,from,to){
 if(!html.includes(from))throw Error('Checkout promo markup changed: '+from.slice(0,80));
 return html.replace(from,to);
}
export function upgradePromotion(html){
 html=replaceOne(html,
  "let coupon='',settings=null,stripe=null,elements=null,paymentIntentId=null,ready=false,shippingCents=null;",
  "let coupon='',settings=null,stripe=null,elements=null,paymentIntentId=null,ready=false,shippingCents=null,verifiedFirstDiscount=null;");
 html=replaceOne(html,
  "function subtotalWithDiscount(){return getTotalItems()-(coupon==='BEMVINDO'?Math.round(getTotalItems()*.05):0)}",
  "function checkoutFreight(){if(shippingCents!==null)return shippingCents;return Number(settings?.shippingFlatCents??1157)}function promoDiscount(){return verifiedFirstDiscount===null?Math.round(getTotalItems()*.10):verifiedFirstDiscount}function subtotalWithDiscount(){return getTotalItems()-promoDiscount()}");
 html=replaceOne(html,
  "document.getElementById('discount').textContent=getOriginalSubtotal()>subtotalWithDiscount()?'- '+BRL(getOriginalSubtotal()-subtotalWithDiscount()):'—';",
  "document.getElementById('discount').textContent=promoDiscount()>0?'- '+BRL(promoDiscount()):'—';document.getElementById('discount').previousElementSibling.textContent=verifiedFirstDiscount===0?'Desconto de primeira compra':'10% de desconto na primeira compra';");
 html=replaceOne(html,
  "document.getElementById('shipping').textContent=shippingCents===null?'A calcular':BRL(shippingCents);",
  "document.getElementById('shipping').textContent=BRL(checkoutFreight());");
 html=replaceOne(html,
  "const overall=subtotalWithDiscount()+(shippingCents||0);document.getElementById('total').textContent=shippingCents===null?'A calcular':BRL(overall);document.getElementById('mobTotal').textContent=shippingCents===null?BRL(subtotalWithDiscount()):BRL(overall)",
  "const overall=subtotalWithDiscount()+checkoutFreight();document.getElementById('total').textContent=BRL(overall);document.getElementById('mobTotal').textContent=BRL(overall)");
 html=replaceOne(html,
  "paymentIntentId=data.paymentIntentId;shippingCents=data.shippingCents;",
  "paymentIntentId=data.paymentIntentId;shippingCents=data.shippingCents;verifiedFirstDiscount=Number(data.firstPurchaseDiscountCents||0);const promoBadge=document.getElementById('firstPurchasePromo');if(promoBadge)promoBadge.innerHTML=verifiedFirstDiscount>0?'<strong>✓ 10% de desconto na primeira compra</strong><small>Benefício aplicado automaticamente ao seu pedido.</small>':'<strong>Desconto exclusivo da primeira compra</strong><small>Este benefício já foi utilizado para este cadastro.</small>';");
 html=replaceOne(html,
  '<div class="discount">',
  '<div class="discount" style="display:none" aria-hidden="true">');
 html=replaceOne(html,
  '<div class="totals">',
  '<div class="promo-badge" id="firstPurchasePromo"><strong>10% de desconto na primeira compra</strong><small>Desconto aplicado aos produtos para clientes elegíveis. Frete cobrado integralmente.</small></div><div class="totals">');
 html=replaceOne(html,
  '</head>',
  '<style id="popozuda-first-purchase-style">.promo-badge{margin:18px 0;padding:15px 16px;border:1px solid #e9bfd0;background:linear-gradient(135deg,#fff7fa,#fff0f4);border-radius:16px;box-shadow:0 6px 17px rgba(119,16,55,.06);display:flex;flex-direction:column;gap:5px;color:#81133d}.promo-badge strong{font-size:13px;font-weight:800;line-height:1.45}.promo-badge small{font-size:11px;color:#855f6f;line-height:1.55}.aside .totalrow:has(#discount){color:#8f1744}.aside .totalrow #discount{color:#ab1e4f;font-weight:750}</style></head>');
 html=replaceOne(html,"document.getElementById('subtotal').textContent=BRL(getOriginalSubtotal());","document.getElementById('subtotal').textContent=BRL(getTotalItems());");
 html=replaceOne(html,"data.shippingCents===0?'Frete grátis':'Frete: '+BRL(data.shippingCents)","'Frete fixo: '+BRL(data.shippingCents)");
 return html;
}
