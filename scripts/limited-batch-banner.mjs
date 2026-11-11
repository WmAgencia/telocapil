/** Limited final-batch banner for Lisinha only. Never invent stock counts or sale expiry. */
export function addLimitedBatchBanner(html,page){
 if(!['index','lisinha'].includes(page))return html;
 if(html.includes('id="lote-especial-banner"'))return html;
 if(!/<body\b[^>]*>/i.test(html)||!html.includes('</head>'))throw Error('Banner: invalid HTML');
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
