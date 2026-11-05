/** Hide dead account controls and products outside the three-item licensed catalog. */
export function polishStorefront(html) {
  html=html.replaceAll('<p>USE O CUPOM <strong>BEMVINDO</strong> E GANHE 5% OFF</p>','<p><strong>10% OFF</strong> NA PRIMEIRA COMPRA · DESCONTO AUTOMÁTICO</p>');
  html=html.replaceAll("alert('Esta funcionalidade não faz parte desta loja.');","/* unsupported action has been hidden */");
  html=html.replace("let footer=dialog.querySelector('#replica-cart-bottom');","const caption=dialog.querySelector('caption');if(caption)caption.textContent='Total do carrinho '+format(total());let footer=dialog.querySelector('#replica-cart-bottom');");
  html=html.replace("el.setAttribute('aria-label','Total de itens no carrinho: '+count())","el.setAttribute('aria-label','Total de itens no carrinho: '+count());el.querySelectorAll('.visually-hidden').forEach(text=>text.remove())");
  const css=String.raw`<style id="popozuda-verified-links">
    /* The captured transition has no Shopify lifecycle to dismiss it. */
    page-transition{display:none!important}
    .media-gallery__carousel-wrapper{height:auto!important}
    .media-gallery__carousel-wrapper>.media-gallery__item{height:auto!important}
    /* Captured predictive results have no search controller. Hidden descendants
       must not intercept clicks through the media visibility overrides. */
    predictive-search .search__content,predictive-search .search__spinner{display:none!important}
    a[href^="#conta-indisponivel"],a[href^="#link-indisponivel"],
    product-card:has(a[href^="#produto-indisponivel"]){display:none!important}
    .cart-drawer__empty-description:has(a[href^="#link-indisponivel"]){display:none!important}
  </style>`;
  // Product shots must remain fully visible, instead of being cropped by Shopify's
  // original cover/crop card templates.  Scope changes to catalog media only.
  const productPhotoFix=String.raw`<style id="popozuda-product-photo-contain">
    product-card .product-card__media,
    product-card .product-card__image-wrapper,
    product-card .card__media,
    .product-card .product-card__media,
    .product-card .product-card__image-wrapper,
    .product-card .card__media {
      display:flex!important;align-items:center!important;justify-content:center!important;
      min-width:0;overflow:hidden;
    }
    product-card .product-card__media img,
    product-card .product-card__image-wrapper img,
    product-card .card__media img,
    .product-card .product-card__media img,
    .product-card .product-card__image-wrapper img,
    .product-card .card__media img {
      display:block!important;width:100%!important;height:100%!important;
      object-fit:contain!important;object-position:center center!important;
      opacity:1!important;visibility:visible!important;transform:none!important;
    }
    @media(max-width:767px){
      product-card .product-card__media img,
      product-card .product-card__image-wrapper img,
      .product-card .product-card__media img,
      .product-card .product-card__image-wrapper img {
        object-fit:contain!important;object-position:center!important;
      }
    }
  </style>`;
  const js=String.raw`<script id="popozuda-prune-inactive-actions">(function(){
    document.addEventListener('submit',event=>{
      const form=event.target.closest('form[data-replica-search]');if(!form)return;
      event.preventDefault();event.stopImmediatePropagation();
      const query=(form.querySelector('[name="q"]')?.value||'').trim().toLowerCase();
      location.href=query.includes('lisin')?'lisinha.html':query.includes('spray')?'spray.html':query.includes('creme')||query.includes('popozuda')?'creme.html':'index.html#catalogo';
    },true);
    document.addEventListener('click',event=>{
      const open=event.target.closest('[aria-controls="search-drawer-dialog"]');
      const dialog=document.getElementById('search-drawer-dialog');
      if(open&&dialog&&!dialog.open){event.preventDefault();dialog.showModal();dialog.querySelector('[name="q"]')?.focus()}
      if(event.target.closest('#search-drawer-dialog .dialog__close')){event.preventDefault();dialog?.close()}
    });
    // Keep keyboard activation equivalent to selecting an offer with a pointer.
    document.addEventListener('keydown',event=>{
      const offer=event.target.closest('.kaching-bundles__bar-main');
      if(offer&&(event.key==='Enter'||event.key===' ')){event.preventDefault();offer.click()}
    });
    document.querySelectorAll('media-gallery').forEach(gallery=>{
      const thumbs=[...gallery.querySelectorAll('.media-gallery__carousel-thumbnails .carousel__thumbnail')];
      const prev=[...gallery.querySelectorAll('button[data-ref="prev"]')];
      const next=[...gallery.querySelectorAll('button[data-ref="next"]')];
      function sync(){
        const index=Math.max(0,thumbs.findIndex(t=>t.classList.contains('is-active')));
        prev.forEach(button=>{button.disabled=index===0;button.classList.toggle('swiper-button-disabled',button.disabled);button.setAttribute('aria-disabled',String(button.disabled))});
        next.forEach(button=>{button.disabled=index===thumbs.length-1;button.classList.toggle('swiper-button-disabled',button.disabled);button.setAttribute('aria-disabled',String(button.disabled))});
      }
      function move(delta){
        const index=Math.max(0,thumbs.findIndex(t=>t.classList.contains('is-active')));
        thumbs[Math.max(0,Math.min(thumbs.length-1,index+delta))]?.click();sync();
      }
      if(thumbs.length){prev.forEach(button=>button.addEventListener('click',()=>move(-1)));next.forEach(button=>button.addEventListener('click',()=>move(1)));thumbs.forEach(t=>t.addEventListener('click',()=>queueMicrotask(sync)));sync()}
    });
    document.querySelectorAll('products-bought-together').forEach(group=>{
      const cards=[...group.querySelectorAll('.product-bought-together__item')];
      const button=group.querySelector('[ref="addAllToCart"]');
      function selection(){return cards.filter(card=>card.querySelector('input[type="checkbox"]:checked')).map(card=>({id:card.querySelector('form[data-replica-add]')?.dataset.replicaAdd,quantity:Number(card.querySelector('[name="quantity"]')?.value||1)})).filter(item=>['lisinha','creme','spray'].includes(item.id))}
      function update(){
        const items=selection(),count=items.reduce((sum,item)=>sum+item.quantity,0);
        const total=items.reduce((sum,item)=>sum+(window.__popozudaPreview?.calcLine(item.id,item.quantity)||0),0);
        const amount=group.querySelector('[ref="subTotal"]'),counter=group.querySelector('[ref="itemCount"]');
        if(amount)amount.textContent=(total/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
        if(counter)counter.textContent=count+(count===1?' item':' itens');
        if(button)button.disabled=!count;
      }
      cards.forEach(card=>{
        const title=card.querySelector('.product-card__title')?.textContent.trim()||'produto';
        card.querySelector('input[type="checkbox"]')?.setAttribute('aria-label','Adicionar '+title);
        const quantity=card.querySelector('[name="quantity"]');
        quantity?.setAttribute('aria-label','Quantidade de '+title);
        quantity?.querySelectorAll('option').forEach(option=>{if(Number(option.value)>20)option.remove()});
      });
      group.addEventListener('change',update);
      button?.addEventListener('click',event=>{event.preventDefault();selection().forEach(item=>window.__popozudaPreview?.add(item.id,item.quantity))});update();
    });
    document.querySelectorAll('.cart-drawer__close').forEach(button=>button.setAttribute('aria-label','Fechar carrinho'));
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
  return html.replace('</head>',css+productPhotoFix+'</head>').replace('</body>',js+'</body>');
}
