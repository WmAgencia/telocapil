/** Limited final-batch banner for Lisinha only. Never invent stock counts or sale expiry. */
export function addLimitedBatchBanner(html,page){
 if(!['index','lisinha'].includes(page))return html;
 if(html.includes('id="lote-especial-banner"'))return html;
 if(!/<body\b[^>]*>/i.test(html)||!html.includes('</head>'))throw Error('Banner: invalid HTML');

 if(page==='lisinha'){
  // A shared, non-resetting end to this seven-hour visual campaign. The timer
  // does not claim the product discount or remaining inventory expires then.
  const HIGHLIGHT_END_ISO='2026-11-11T07:48:00.000Z';
  const stock=/<product-inventory\b[^>]*data-product-id="9232838263011"[^>]*>[\s\S]*?<\/product-inventory>/gi;
  const matches=[...html.matchAll(stock)];
  if(matches.length!==1)throw Error('Countdown: product stock block not uniquely found: '+matches.length);
  const timer='<section id="lote-especial-banner" class="lote-especial-detail" aria-label="Lote especial Lisinha" data-highlight-end="'+HIGHLIGHT_END_ISO+'">'+
    '<span class="lote-especial-detail-eyebrow">LOTE ESPECIAL LIMITADO</span>'+
    '<h3>Últimas unidades disponíveis</h3>'+
    '<p>Último lote de Lisinha com preços especiais.</p>'+
    '<div class="lote-especial-timer-caption">Contagem do destaque especial</div>'+
    '<div class="lote-especial-clock" role="timer" aria-label="Tempo restante do destaque">'+
      '<div class="lote-timer-cell"><strong id="lote-timer-hours">07</strong><span>Horas</span></div>'+
      '<span class="lote-timer-colon" aria-hidden="true">:</span>'+
      '<div class="lote-timer-cell"><strong id="lote-timer-minutes">00</strong><span>Minutos</span></div>'+
      '<span class="lote-timer-colon" aria-hidden="true">:</span>'+
      '<div class="lote-timer-cell"><strong id="lote-timer-seconds">00</strong><span>Segundos</span></div>'+
    '</div>'+
    '<p class="lote-timer-footnote">O prazo é deste destaque; a disponibilidade do lote depende do estoque.</p>'+
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
   '#lote-especial-banner.lote-destaque-finalizado{display:none!important}'+
   '@media(max-width:420px){#lote-especial-banner.lote-especial-detail{padding:16px 10px}.lote-timer-cell{width:64px;padding:9px 5px 7px}.lote-timer-cell strong{font-size:26px}.lote-especial-detail h3{font-size:19px}}'+
   '</style>';
  const script='<script id="lote-especial-timer-script">(function(){'+
   'const root=document.getElementById("lote-especial-banner");if(!root)return;'+
   'const deadline=Date.parse(root.dataset.highlightEnd);'+
   'const hours=document.getElementById("lote-timer-hours"),minutes=document.getElementById("lote-timer-minutes"),seconds=document.getElementById("lote-timer-seconds");'+
   'if(!Number.isFinite(deadline)||!hours||!minutes||!seconds)return;'+
   'const pad=n=>String(n).padStart(2,"0");'+
   'let interval;function draw(){const remain=Math.max(0,Math.ceil((deadline-Date.now())/1000));'+
   'hours.textContent=pad(Math.floor(remain/3600));minutes.textContent=pad(Math.floor(remain%3600/60));seconds.textContent=pad(remain%60);'+
   'if(remain===0){root.classList.add("lote-destaque-finalizado");if(interval)clearInterval(interval);}}'+
   'draw();if(!root.classList.contains("lote-destaque-finalizado"))interval=setInterval(draw,1000);'+
   'document.addEventListener("visibilitychange",function(){if(!document.hidden)draw()});'+
   '})();</script>';
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
