/** Hide dead account controls and products outside the three-item licensed catalog. */
export function polishStorefront(html) {
  html=html.replaceAll("alert('Esta funcionalidade não faz parte desta loja.');","/* unsupported action has been hidden */");
  const css=String.raw`<style id="popozuda-verified-links">
    /* The captured transition has no Shopify lifecycle to dismiss it. */
    page-transition{display:none!important}
    /* Captured predictive results have no search controller. Hidden descendants
       must not intercept clicks through the media visibility overrides. */
    predictive-search .search__content{display:none!important}
    a[href^="#conta-indisponivel"],a[href^="#link-indisponivel"],
    product-card:has(a[href^="#produto-indisponivel"]){display:none!important}
    .cart-drawer__empty-description:has(a[href^="#link-indisponivel"]){display:none!important}
  </style>`;
  const js=String.raw`<script id="popozuda-prune-inactive-actions">(function(){
    // Keep keyboard activation equivalent to selecting an offer with a pointer.
    document.addEventListener('keydown',event=>{
      const offer=event.target.closest('.kaching-bundles__bar-main');
      if(offer&&(event.key==='Enter'||event.key===' ')){event.preventDefault();offer.click()}
    });
    document.querySelectorAll('media-gallery').forEach(gallery=>{
      const thumbs=[...gallery.querySelectorAll('.media-gallery__carousel-thumbnails .carousel__thumbnail')];
      const prev=gallery.querySelector('button[data-ref="prev"]');
      const next=gallery.querySelector('button[data-ref="next"]');
      function sync(){
        const index=Math.max(0,thumbs.findIndex(t=>t.classList.contains('is-active')));
        if(prev)prev.disabled=index===0;
        if(next)next.disabled=index===thumbs.length-1;
      }
      function move(delta){
        const index=Math.max(0,thumbs.findIndex(t=>t.classList.contains('is-active')));
        thumbs[Math.max(0,Math.min(thumbs.length-1,index+delta))]?.click();sync();
      }
      if(thumbs.length){prev?.addEventListener('click',()=>move(-1));next?.addEventListener('click',()=>move(1));thumbs.forEach(t=>t.addEventListener('click',()=>queueMicrotask(sync)));sync()}
    });
    function prune(){
      document.querySelectorAll('product-card:has(a[href^="#produto-indisponivel"])').forEach(card=>{
        const slide=card.closest('.swiper-slide');(slide||card).remove();
      });
      document.querySelectorAll('a[href^="#conta-indisponivel"],a[href^="#link-indisponivel"]').forEach(a=>{
        const wrap=a.closest('.header__icon--account,.header__account,.header__icon--user,.cart-drawer__empty-description');
        (wrap||a).remove();
      });
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',prune,{once:true});else prune();
    new MutationObserver(()=>{
      if(document.querySelector('product-card:has(a[href^="#produto-indisponivel"]),a[href^="#conta-indisponivel"],a[href^="#link-indisponivel"]'))prune();
    }).observe(document.documentElement,{subtree:true,childList:true});
  })();</script>`;
  return html.replace('</head>',css+'</head>').replace('</body>',js+'</body>');
}
