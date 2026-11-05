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
