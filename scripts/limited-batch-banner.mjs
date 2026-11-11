/** Limited final-batch banner for Lisinha only. Never invent stock counts or sale expiry. */
export function addLimitedBatchBanner(html,page){
 if(!['index','lisinha'].includes(page))return html;
 if(html.includes('id="lote-especial-banner"'))return html;
 if(!/<body\b[^>]*>/i.test(html)||!html.includes('</head>'))throw Error('Banner: invalid HTML');

 if(page==='lisinha'){
  // Each browser receives one persistent seven-hour spotlight countdown.
  // Actual stock exhaustion is governed by the live stock ledger.
  const stock=/<product-inventory\b[^>]*data-product-id="9232838263011"[^>]*>[\s\S]*?<\/product-inventory>/gi;
  const matches=[...html.matchAll(stock)];
  if(matches.length!==1)throw Error('Countdown: product stock block not uniquely found: '+matches.length);
  // Transfer the real radio input into the promotion; it remains part of checkout.
  const featuredRx=/<label\b(?=[^>]*\bid="pop-featured-kit")[^>]*>[\s\S]*?<\/label>/gi;
  const featuredRows=[...html.matchAll(featuredRx)];
  if(featuredRows.length!==1)throw Error('Featured kit must be unique: '+featuredRows.length);
  const featured=featuredRows[0][0];
  html=html.replace(featuredRx,'');
  const timer='<section id="lote-especial-banner" class="lote-especial-detail" aria-label="Lote especial Lisinha" data-personal-duration="7h">'+
    '<span class="lote-especial-detail-eyebrow">LOTE ESPECIAL LIMITADO</span>'+
    '<h3>Últimas unidades disponíveis</h3>'+
    '<p>Último lote de Lisinha com preços especiais.</p>'+
    '<div class="lote-especial-timer-caption">Tempo restante do seu destaque</div>'+
    '<div class="lote-especial-clock" role="timer" aria-label="Tempo restante do destaque">'+
      '<div class="lote-timer-cell"><strong id="lote-timer-hours">07</strong><span>Horas</span></div>'+
      '<span class="lote-timer-colon" aria-hidden="true">:</span>'+
      '<div class="lote-timer-cell"><strong id="lote-timer-minutes">00</strong><span>Minutos</span></div>'+
      '<span class="lote-timer-colon" aria-hidden="true">:</span>'+
      '<div class="lote-timer-cell"><strong id="lote-timer-seconds">00</strong><span>Segundos</span></div>'+
    '</div>'+
    '<p class="lote-timer-footnote">Cada visitante tem 7 horas de destaque. Os preços e a disponibilidade dependem do estoque.</p>'+
    featured+
   '</section>';
  const style='<style id="lote-especial-banner-style">'+
   '#lote-especial-banner.lote-especial-detail{display:block;box-sizing:border-box;margin:18px 0 20px;padding:20px 16px;text-align:center;background:linear-gradient(155deg,#fff7fa,#f9edf3);border:1px solid #e6cfda;border-radius:19px;box-shadow:0 7px 24px rgba(93,29,60,.06);color:#631d3b}'+
   '.lote-especial-detail .lote-especial-detail-eyebrow{display:inline-flex;align-items:center;justify-content:center;font-size:10px;letter-spacing:.10em;font-weight:800;color:#9d1247;border:1px solid #d8b3c3;border-radius:30px;padding:6px 11px}'+
   '.lote-especial-detail h3{margin:11px 0 4px;font-size:21px;line-height:1.25;font-weight:850;letter-spacing:-.025em;color:#7a1742}'+
   '.lote-especial-detail>p{margin:0;font-size:13px;line-height:1.45;color:#835970}'+
   '.lote-especial-detail .lote-especial-timer-caption{margin:15px 0 9px;text-transform:uppercase;font-size:10px;letter-spacing:.08em;font-weight:700;color:#8e4667}'+
   '.lote-especial-clock{display:flex;align-items:center;justify-content:center;gap:7px}'+
   '.lote-timer-cell{width:74px;min-width:0;padding:10px 7px 8px;display:flex;flex-direction:column;align-items:center;gap:3px;background:#fff;border:1px solid #e5cfd9;border-radius:12px;box-shadow:0 2px 8px rgba(90,26,57,.04)}'+
   '.lote-timer-cell strong{font-size:29px;line-height:1.15;color:#71123c;letter-spacing:-.045em;font-weight:850;font-variant-numeric:tabular-nums}'+
   '.lote-timer-cell span{font-size:10px;letter-spacing:.025em;color:#846073}'+
   '.lote-timer-colon{font-size:27px;line-height:1;color:#b8899f;font-weight:700;margin-bottom:16px}'+
   '.lote-especial-detail .lote-timer-footnote{margin:11px 0 0;color:#927686;font-size:10px}'+
   '.lote-especial-detail .pop-kit-row.pop-kit-featured,.lote-especial-detail .pop-kit-row.pop-kit-featured:has(input:checked){display:flex;align-items:center;gap:13px;margin:17px 0 0;padding:16px 15px;text-align:left;background:linear-gradient(120deg,#fff9fc,#ffeaf3);border:1.5px solid #ad1a53;border-radius:16px;box-shadow:0 5px 16px rgba(132,19,66,.1);min-height:64px;transition:background .2s,box-shadow .2s,border-color .2s,transform .2s}'+
   '.lote-especial-detail .pop-kit-featured:hover{transform:translateY(-1px);box-shadow:0 8px 22px rgba(132,19,66,.13)}'+
   '.lote-especial-detail .pop-kit-featured .pop-kit-name>span{font-size:18px;line-height:1.35;color:#75123c;gap:7px}'+
   '.lote-especial-detail .pop-kit-featured .pop-kit-name em{font-size:9px;padding:4px 8px;border-radius:14px}'+
   '.lote-especial-detail .pop-kit-featured .pop-kit-name small{font-size:12px;color:#8f6077}'+
   '.lote-especial-detail .pop-kit-featured>strong{font-size:clamp(21px,3.4vw,29px);line-height:1.1;color:#961444;white-space:nowrap;letter-spacing:-.045em}'+
   '.lote-especial-detail .pop-kit-featured:not(:has(input:checked)){background:#fff9fb;border-color:#e3b7ca;box-shadow:none}'+
   '.lote-especial-detail .pop-kit-featured input{width:19px;height:19px;accent-color:#9d1247}'+
   '#lote-especial-banner.lote-destaque-finalizado .lote-especial-timer-caption{opacity:.7}'+
   '#lote-especial-banner.lote-esgotado .pop-kit-featured,#lote-especial-banner.lote-esgotado .lote-especial-clock{opacity:.55}'+
   '.pop-kit-offers.lote-esgotado .pop-kit-row{opacity:.55;cursor:not-allowed}'+
   '@media(max-width:420px){#lote-especial-banner.lote-especial-detail{padding:16px 10px}.lote-timer-cell{width:64px;padding:9px 5px 7px}.lote-timer-cell strong{font-size:26px}.lote-especial-detail h3{font-size:19px}.lote-especial-detail .pop-kit-row.pop-kit-featured,.lote-especial-detail .pop-kit-row.pop-kit-featured:has(input:checked){gap:10px;padding:12px 10px}.lote-especial-detail .pop-kit-featured .pop-kit-name>span{font-size:15px}.lote-especial-detail .pop-kit-featured .pop-kit-name em{font-size:8px}.lote-especial-detail .pop-kit-featured>strong{font-size:21px}}'+
   '</style>';
  const script = `<script id="lote-especial-timer-script">(function(){
"use strict";
const root=document.getElementById("lote-especial-banner");
if(!root)return;
const STORAGE_KEY="popozuda.lisinha.spotlight.started.v1";
const HOURS=7,MS=HOURS*3600000;
const h=document.getElementById("lote-timer-hours"),m=document.getElementById("lote-timer-minutes"),s=document.getElementById("lote-timer-seconds");
const note=root.querySelector(".lote-timer-footnote");
if(!h||!m||!s)return;
const pad=n=>String(n).padStart(2,"0");
const started=(()=>{
  let ts;
  try{ts=Number(localStorage.getItem(STORAGE_KEY));if(Number.isFinite(ts)&&ts>0)return ts;}catch(e){}
  ts=Date.now();
  try{localStorage.setItem(STORAGE_KEY,String(ts));}catch(e){
    try{const old=Number(sessionStorage.getItem(STORAGE_KEY));if(old>0)return old;sessionStorage.setItem(STORAGE_KEY,String(ts));}catch(e){}
  }
  return ts;
})();
let soldOut=false,interval=null;
function showRemaining(seconds){
  h.textContent=pad(Math.floor(seconds/3600));
  m.textContent=pad(Math.floor(seconds%3600/60));
  s.textContent=pad(seconds%60);
}
function markSoldOut(){
  if(soldOut)return;soldOut=true;
  root.classList.add("lote-esgotado");
  const heading=root.querySelector("h3");if(heading)heading.textContent="Lote esgotado";
  if(note)note.textContent="Este lote foi esgotado. A contagem foi encerrada para todos os visitantes.";
  showRemaining(0);
  document.querySelectorAll('input[name="pop-kit-qty"],form[id^="BuyButtons-ProductForm"] button').forEach(el=>{el.disabled=true;});
  const other=document.getElementById("pop-kit-offers");if(other)other.classList.add("lote-esgotado");
  if(interval)clearInterval(interval);
}
function draw(){
  if(soldOut)return;
  const seconds=Math.max(0,Math.ceil((started+MS-Date.now())/1000));
  showRemaining(seconds);
  if(seconds===0){
    root.classList.add("lote-destaque-finalizado");
    if(note)note.textContent="Seu destaque de 7 horas terminou. Os kits continuam sujeitos à disponibilidade do estoque.";
    if(interval)clearInterval(interval);
  }
}
async function refreshStock(){
  try{
    const res=await fetch("/api/lote-status",{cache:"no-store",credentials:"same-origin"});
    if(!res.ok)return;
    const data=await res.json();
    if(data.known===true && data.soldOut===true)markSoldOut();
  }catch(e){}
}
draw();
if(!root.classList.contains("lote-destaque-finalizado"))interval=setInterval(draw,1000);
refreshStock();
setInterval(refreshStock,15000);
document.addEventListener("visibilitychange",function(){if(!document.hidden){draw();refreshStock();}});
window.addEventListener("storage",function(e){if(e.key===STORAGE_KEY)location.reload();});
})();</script>`;
  return html.replace('</head>',style+'</head>').replace(stock,part=>part+timer+script);
 }
 const destination=page==='lisinha'?'#pop-kit-offers':'lisinha.html';
 const banner='<aside id="lote-especial-banner" role="region" aria-label="Lote especial Lisinha">'+
  '<div class="lote-especial-inner">'+
  '<span class="lote-especial-label">LOTE ESPECIAL LIMITADO</span>'+
  '<strong class="lote-especial-heading">Últimas unidades disponíveis</strong>'+
  '<span class="lote-especial-copy">Último lote de Lisinha com preços especiais. Aproveite enquanto houver estoque.</span>'+
  '<a class="lote-especial-cta" href="'+destination+'">Ver kits especiais</a>'+
  '</div></aside>';
 const css='<style id="lote-especial-banner-style">'+
 '#lote-especial-banner{position:relative;z-index:9;box-sizing:border-box;width:100%;padding:13px 16px;background:linear-gradient(110deg,#7b123c 0%,#a71950 55%,#6a1234 100%);color:#fff;border-bottom:1px solid rgba(255,255,255,.2)}'+
 '#lote-especial-banner .lote-especial-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px 17px;text-align:center}'+
 '#lote-especial-banner .lote-especial-label{font-size:10px;font-weight:750;letter-spacing:.1em;border:1px solid rgba(255,255,255,.55);border-radius:30px;padding:5px 9px;white-space:nowrap}'+
 '#lote-especial-banner .lote-especial-heading{font-size:18px;font-weight:850;letter-spacing:-.02em;line-height:1.3;color:#fff}'+
 '#lote-especial-banner .lote-especial-copy{font-size:12.5px;color:#ffe4ee;line-height:1.4}'+
 '#lote-especial-banner .lote-especial-cta{color:#7c1741;background:#fff;border:1px solid #fff;padding:8px 14px;border-radius:10px;font-size:12px;font-weight:800;text-decoration:none;line-height:1.3;white-space:nowrap;transition:transform .18s,box-shadow .18s}'+
 '#lote-especial-banner .lote-especial-cta:hover{transform:translateY(-1px);box-shadow:0 5px 14px rgba(0,0,0,.14)}'+
 '#lote-especial-banner .lote-especial-cta:focus-visible{outline:3px solid #ffc4d9;outline-offset:3px}'+
 '@media(max-width:600px){#lote-especial-banner{padding:12px 14px}#lote-especial-banner .lote-especial-inner{gap:6px 10px}#lote-especial-banner .lote-especial-label{font-size:9px}#lote-especial-banner .lote-especial-heading{font-size:17px;width:100%}#lote-especial-banner .lote-especial-copy{width:100%;font-size:12px}#lote-especial-banner .lote-especial-cta{margin-top:4px}}'+
 '</style>';
 return html.replace('</head>',css+'</head>').replace(/<body\b[^>]*>/i,match=>match+banner);
}
