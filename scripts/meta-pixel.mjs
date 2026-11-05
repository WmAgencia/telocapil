const PIXEL_ID='2302179570557964';
const PRODUCTS={
 lisinha:{id:'lisinha',name:'Sérum Lisinha',value:69.90},
 creme:{id:'creme',name:'Creme Centella',value:89.90},
 spray:{id:'spray',name:'Spray Popozuda',value:69.90}
};

/* Build-time injection for the Vercel storefront and Railway HTML. Do not ship
   server tokens or advanced matching data to the browser. */
export function injectMetaPixel(html,page){
 if(html.includes('id="popozuda-meta-tracking"'))return html;
 const prior=(html.match(/fbevents\.js|fbq\s*\(\s*['"]init['"]|facebook\.com\/tr\?/gi)||[]).length;
 console.log('Meta pre-existing tracker markers',page,prior);
 const client=String.raw`<script id="popozuda-meta-tracking">
(function(){
'use strict';
if(window.__popozudaMetaTracking)return;
window.__popozudaMetaTracking=true;
const PIXEL='__PIXEL_ID__',PAGE=__PAGE_JSON__,PRODUCTS=__PRODUCTS_JSON__;
const KEY='popozuda_analytics_consent_v1';
let started=false;
function track(name,data,extra){
 if(typeof window.fbq!=='function'||saved()!=='yes')return;
 try{window.fbq('trackSingle',PIXEL,name,data||{},extra||{})}catch(e){}
}
function productData(p,quantity){
 return {content_type:'product',content_ids:[p.id],contents:[{id:p.id,quantity:quantity||1}],content_name:p.name,currency:'BRL',value:p.value*(quantity||1)};
}
function start(){
 if(started)return;started=true;
 if(typeof window.fbq!=='function'){
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=true;n.version='2.0';n.queue=[];
  t=b.createElement(e);t.async=true;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
  (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
 }
 window.fbq('init',PIXEL);
 track('PageView');
 if(PRODUCTS[PAGE])track('ViewContent',productData(PRODUCTS[PAGE],1));
 if(PAGE==='checkout')track('InitiateCheckout',{currency:'BRL'});
 let attempts=0;
 const monitor=setInterval(function(){
  const store=window.__popozudaPreview;
  if(store&&typeof store.add==='function'&&!store.add.__popozudaMetaWrapped){
   const original=store.add;
   const wrapped=function(id,quantity){
    const result=original.apply(this,arguments);
    const p=PRODUCTS[id];const q=Math.max(1,Math.min(20,Number(quantity)||1));
    if(p&&result!==false)track('AddToCart',productData(p,q));
    return result;
   };
   wrapped.__popozudaMetaWrapped=true;store.add=wrapped;
  }
  if(++attempts>=30||store?.add?.__popozudaMetaWrapped)clearInterval(monitor);
 },500);
 if(PAGE==='checkout'||PAGE==='pedido'){
  const id=new URLSearchParams(location.search).get('payment_intent');
  if(id&&/^pi_[a-zA-Z0-9]+$/.test(id)){
   fetch('/api/order-status?payment_intent='+encodeURIComponent(id),{cache:'no-store'})
    .then(r=>r.ok?r.json():null).then(order=>{
      if(!order||order.status!=='succeeded'||!Number.isFinite(Number(order.amount))||Number(order.amount)<=0)return;
      const k='popozuda_meta_paid_'+id;
      if(sessionStorage.getItem(k)==='1')return;
      track('Purchase',{currency:'BRL',value:Number(order.amount)/100},{eventID:id});
      sessionStorage.setItem(k,'1');
    }).catch(()=>{});
  }
 }
}
function saved(){try{return localStorage.getItem(KEY)}catch(e){return null}}
function save(value){try{localStorage.setItem(KEY,value)}catch(e){}}
let modal=null,focusBefore=null;
const pausedNodes=[];
function clearMarketingCookies(){
 ['_fbp','_fbc'].forEach(function(name){document.cookie=name+'=; Max-Age=0; Path=/; SameSite=Lax'});
}
function lockBackground(){
 document.documentElement.classList.add('cookie-choice-open');
 Array.prototype.forEach.call(document.body.children,function(node){
  if(node===modal||['SCRIPT','STYLE','LINK'].includes(node.tagName))return;
  if(!node.inert){node.inert=true;pausedNodes.push(node)}
 });
}
function unlockBackground(){
 document.documentElement.classList.remove('cookie-choice-open');
 while(pausedNodes.length)pausedNodes.pop().inert=false;
}
function close(){
 if(!modal||modal.hidden)return;
 modal.hidden=true;unlockBackground();
 if(focusBefore&&focusBefore.isConnected&&typeof focusBefore.focus==='function'){
  try{focusBefore.focus({preventScroll:true})}catch(e){}
 }
}
function consent(choice){
 if(choice!=='yes'&&choice!=='no')return;
 save(choice);close();
 if(choice==='yes'){
  if(window.fbq)window.fbq('consent','grant');
  start();
 }else{
  if(window.fbq)window.fbq('consent','revoke');
  clearMarketingCookies();
 }
}
function show(){
 if(!modal)return;
 focusBefore=document.activeElement;
 modal.hidden=false;lockBackground();
 const accept=modal.querySelector('#cookieAccept');
 if(accept)accept.focus({preventScroll:true});
}
function trapKeys(event){
 if(!modal||modal.hidden||event.key!=='Tab')return;
 const targets=[...modal.querySelectorAll('button:not([disabled]),a[href]')].filter(el=>!el.hidden&&!el.closest('[hidden]'));
 if(!targets.length){event.preventDefault();return}
 const first=targets[0],last=targets[targets.length-1];
 if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
 else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
}
function consentUI(){
 if(document.getElementById('cookieNotice'))return;
 modal=document.createElement('section');
 modal.id='cookieNotice';
 modal.className='cookie-choice-layer';
 modal.setAttribute('role','dialog');
 modal.setAttribute('aria-modal','true');
 modal.setAttribute('aria-labelledby','cookieChoiceHeading');
 modal.setAttribute('aria-describedby','cookieChoiceDescription');
 modal.hidden=true;
 modal.innerHTML=
  '<div class="cookie-choice-card">'+
  '<div class="cookie-choice-icon-row" aria-hidden="true"><span></span><span class="cookie-choice-icon">'+
  '<svg viewBox="0 0 48 48" role="img" aria-hidden="true"><path d="M39 17a8 8 0 0 1-8-8 8 8 0 0 1-8-3 18 18 0 1 0 19 19 8 8 0 0 1-3-8Z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/><circle cx="19" cy="18" r="2.2" fill="currentColor"/><circle cx="16" cy="29" r="2.2" fill="currentColor"/><circle cx="30" cy="27" r="2.2" fill="currentColor"/></svg>'+
  '</span><span></span></div>'+
  '<h2 id="cookieChoiceHeading">Aceite os cookies para continuar</h2>'+
  '<p id="cookieChoiceDescription" class="cookie-choice-desc">Usamos cookies necessários para a loja funcionar e, com seu aceite, o Pixel da Meta para medir visitas e melhorar nossas ofertas.</p>'+
  '<p class="cookie-choice-note">Você escolhe se deseja permitir o rastreamento opcional. A loja continua disponível mesmo sem esses cookies.</p>'+
  '<div class="cookie-choice-actions">'+
  '<button type="button" id="cookieAccept" class="cookie-choice-primary"><span aria-hidden="true">✓</span> Aceitar e continuar</button>'+
  '<button type="button" id="cookieDecline" class="cookie-choice-exit cookie-choice-continue">Continuar sem cookies opcionais</button>'+
  '<a id="cookieReject" class="cookie-choice-exit" href="about:blank">Sair do site</a>'+
  '</div>'+
  '<button type="button" id="cookiePolicy" class="cookie-choice-policy">Sobre os cookies</button>'+
  '<p id="cookiePolicyInfo" class="cookie-choice-desc" hidden>Se você aceitar, usaremos o Pixel da Meta para registrar eventos como visitas, visualizações de produtos e etapas do carrinho. Você pode retirar o consentimento a qualquer momento em “Preferências de cookies” no rodapé. Nenhuma dessas ferramentas é necessária para concluir sua compra.</p>'+
  '</div>';
 document.body.appendChild(modal);
 modal.querySelector('#cookieAccept').addEventListener('click',function(){consent('yes')});
 modal.querySelector('#cookieDecline').addEventListener('click',function(){consent('no')});
 modal.querySelector('#cookieReject').addEventListener('click',function(){consent('no')});
 modal.querySelector('#cookiePolicy').addEventListener('click',function(){
  const info=modal.querySelector('#cookiePolicyInfo');info.hidden=!info.hidden;
 });
 modal.addEventListener('keydown',trapKeys);
 const footer=document.querySelector('footer');
 if(footer&&!footer.querySelector('[data-popozuda-cookie-settings]')){
  const prefs=document.createElement('button');
  prefs.type='button';prefs.className='popozuda-cookie-settings';
  prefs.textContent='Preferências de cookies';
  prefs.setAttribute('data-popozuda-cookie-settings','');
  footer.appendChild(prefs);
 }
 document.querySelectorAll('[data-popozuda-cookie-settings]').forEach(function(btn){
  btn.addEventListener('click',function(event){event.preventDefault();show()});
 });
 if(saved()==='yes'){start();return}
 if(saved()==='no')return;
 show();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',consentUI,{once:true});
else consentUI();
})();
</script>`;
 const style=String.raw`<style id="popozuda-meta-consent-style">
/* Modal Lisinha / Telocapil — sem rolagem interna, consentimento explícito.
   Conteúdo nunca inclui campos pessoais. A saída navega para about:blank. */
.cookie-choice-layer[hidden]{display:none!important}
html.cookie-choice-open,html.cookie-choice-open body{overflow:hidden!important;overscroll-behavior:none}
.cookie-choice-layer{
 box-sizing:border-box;position:fixed;inset:0;z-index:2147483000;
 display:flex;align-items:center;justify-content:center;
 overflow-x:hidden;overflow-y:auto;
 padding:16px;min-height:100dvh;
 /* Sem backdrop-filter sobre a viewport: evita reprocessar toda a página
    a cada frame/hover. Escurecimento estático preserva o destaque do modal. */
 background:rgba(24,12,22,.70);
 font-family:Manrope,Inter,system-ui,-apple-system,"Segoe UI",sans-serif;
}
.cookie-choice-layer *,.cookie-choice-layer *::before,.cookie-choice-layer *::after{
 box-sizing:border-box;
}
.cookie-choice-card{
 isolation:isolate;flex:0 1 545px;position:relative;
 min-width:0;max-width:100%;
 width:100%;max-height:none;margin:auto;overflow:hidden;
 padding:27px clamp(20px,4vw,42px) 27px;
 border:1px solid rgba(244,215,226,.8);border-radius:24px;
 background:linear-gradient(160deg,#fffefd 0%,#fff9fc 80%,#fff0f6 100%);
 box-shadow:0 26px 75px rgba(24,6,14,.34),0 6px 28px rgba(24,6,14,.11);
 color:#412536;text-align:center;
 animation:cookie-card-in .24s cubic-bezier(.2,.7,.2,1) both
}
.cookie-choice-card::after{
 content:"";position:absolute;z-index:-1;bottom:0;left:0;right:0;height:76px;
 background:radial-gradient(ellipse at 10% 100%,rgba(244,168,196,.24),transparent 65%),
 radial-gradient(ellipse at 95% 100%,rgba(248,194,213,.35),transparent 70%);
 pointer-events:none;
}
.cookie-choice-icon-row{display:flex;gap:19px;align-items:center;justify-content:center;margin-bottom:13px}
.cookie-choice-icon-row>span:first-child,.cookie-choice-icon-row>span:last-child{
 display:block;width:35px;height:2px;background:#e283a4;border-radius:10px
}
.cookie-choice-icon{
 width:64px;height:64px;flex-shrink:0;display:grid;place-items:center;
 border-radius:50%;background:#fce5ee;color:#891944
}
.cookie-choice-icon svg{display:block;width:35px;height:35px}
.cookie-choice-card h2{
 font-family:Fraunces,Georgia,serif;font-size:clamp(25px,3.7vw,34px);
 font-weight:600;line-height:1.15;letter-spacing:-.035em;
 color:#68132f;margin:0 auto 13px;max-width:480px
}
.cookie-choice-desc{
 font-size:clamp(12px,1.3vw,13.5px);line-height:1.65;color:#54434c;
 margin:0 auto 12px;max-width:450px
}
.cookie-choice-note{
 font-size:12.5px;line-height:1.55;font-weight:700;color:#77294a;
 max-width:450px;margin:0 auto 19px
}
.cookie-choice-actions{display:flex;flex-direction:column;align-items:stretch;gap:14px;width:min(390px,100%);margin:0 auto}
.cookie-choice-primary{
 display:flex;align-items:center;justify-content:center;gap:12px;
 min-height:52px;width:100%;border-radius:999px;
 padding:11px 18px;border:2px solid #a41652;
 font-family:inherit;font-size:14px;font-weight:800;
 color:#fff;background:linear-gradient(180deg,#d33172,#8b1242);
 box-shadow:0 10px 20px rgba(148,21,67,.2);cursor:pointer;
 /* Só animar transform (compositor); evitar recalcular sombra no hover. */
 transform:translate3d(0,0,0);backface-visibility:hidden;
 will-change:transform;
 transition:transform .16s ease-out
}
.cookie-choice-primary:hover{transform:translate3d(0,-2px,0)}
.cookie-choice-primary:active{transform:translate3d(0,0,0)}
.cookie-choice-primary span{
 width:23px;height:23px;display:grid;place-items:center;
 border:1.75px solid currentColor;border-radius:50%;font-size:15px;line-height:1
}
.cookie-choice-exit{
 display:inline-block;align-self:center;max-width:100%;
 color:#735366;font-family:inherit;font-size:13px;line-height:1.3;
 font-weight:600;text-align:center;text-decoration:underline;text-underline-offset:3px;
 background:transparent;border:0;cursor:pointer
}
.cookie-choice-exit:hover{color:#7c2148}
.cookie-choice-policy{
 display:inline-block;margin:17px auto 0;color:#725768;
 text-decoration:underline;text-underline-offset:3px;font-size:11px;font-weight:600
}
.cookie-choice-primary:focus-visible,.cookie-choice-exit:focus-visible,.cookie-choice-policy:focus-visible{
 outline:3px solid #c4548c;outline-offset:3px
}
@keyframes cookie-card-in{
 from{opacity:0;transform:translateY(9px) scale(.99)}to{opacity:1;transform:none}
}
/* Enquanto o diálogo estiver aberto, evita animações e filtros caros
   da hero atrás da camada escura. Fora do modal tudo segue normal. */
html.cookie-choice-open #heroCta,
html.cookie-choice-open #kitCta,
html.cookie-choice-open .hero-visual .product-frame{
 animation-play-state:paused!important
}
html.cookie-choice-open .site-header,
html.cookie-choice-open .sticky-cta{
 -webkit-backdrop-filter:none!important;
 backdrop-filter:none!important
}
html.cookie-choice-open body::before{opacity:0!important}

@media(max-width:520px){
 .cookie-choice-layer{padding:12px}
 .cookie-choice-card{border-radius:20px;padding:23px 19px 25px}
 .cookie-choice-icon-row{gap:16px;margin-bottom:11px}
 .cookie-choice-icon-row>span:first-child,.cookie-choice-icon-row>span:last-child{width:28px}
 .cookie-choice-icon{width:57px;height:57px}
 .cookie-choice-icon svg{width:30px;height:30px}
 .cookie-choice-card h2{font-size:clamp(24px,7vw,29px)}
 .cookie-choice-desc{font-size:12.5px;line-height:1.55}
 .cookie-choice-note{font-size:12px;margin-bottom:15px}
 .cookie-choice-primary{font-size:13px;min-height:49px}
 .cookie-choice-policy{margin-top:13px}
}
@media(max-height:520px){
 .cookie-choice-layer{align-items:flex-start}
 .cookie-choice-card{margin:auto}
}
@media(prefers-reduced-motion:reduce){
 .cookie-choice-card{animation:none}
 .cookie-choice-primary{transition:none}
}
.cookie-choice-policy{background:none;border:0;cursor:pointer;font-family:inherit}
.cookie-choice-continue{min-height:36px;color:#86214b}
.cookie-choice-card [hidden]{display:none!important}
.popozuda-cookie-settings{display:inline-block;margin:8px 10px;padding:4px 6px;background:transparent;border:0;color:inherit;text-decoration:underline;cursor:pointer;font:inherit}
.popozuda-cookie-settings:focus-visible{outline:2px solid #a41652;outline-offset:2px}
</style>`;
 if(!html.includes('</head>')||!html.includes('</body>'))throw Error('Meta tracker injection: invalid HTML '+page);
 const injected=client.replace('__PIXEL_ID__',PIXEL_ID).replace('__PAGE_JSON__',JSON.stringify(page)).replace('__PRODUCTS_JSON__',JSON.stringify(PRODUCTS));
 return html.replace('</head>',style+'</head>').replace('</body>',injected+'</body>');
}
