/** Visual-only checkout refinements: Stripe owns the actual Card/Pix selection. */
export function polishCheckout(html,logoSource){
  if(!logoSource?.startsWith('data:image/svg+xml;base64,'))throw Error('Logo oficial da Popozuda não encontrada');
  const originalLogo=/<a\b(?=[^>]*class="brand")(?=[^>]*aria-label="Voltar à loja")[^>]*>[^<]*<\/a>/;
  if(!originalLogo.test(html))throw Error('Cabeçalho do checkout não encontrado');
  html=html.replace(originalLogo,'<a aria-label="Voltar à loja" class="brand checkout-brand" href="./index.html"><img src="'+logoSource+'" alt="Popozuda" width="184" height="35"></a>');
  const oldAppearance="appearance:{theme:'stripe',variables:{colorPrimary:'#980d3e',borderRadius:'6px'}}";
  const newAppearance="appearance:{theme:'stripe',variables:{colorPrimary:'#921342',colorBackground:'#ffffff',colorText:'#382531',colorDanger:'#bb2d4d',fontFamily:'Plus Jakarta Sans, system-ui, sans-serif',fontSizeBase:'15px',spacingUnit:'5px',borderRadius:'15px'},rules:{'.Tab':{border:'1px solid #ecd6df',borderRadius:'15px',padding:'15px',boxShadow:'0 3px 12px rgba(94,21,52,.05)',backgroundColor:'#fffbfd'},'.Tab:hover':{color:'#8f1747',borderColor:'#c27b98'},'.Tab--selected':{borderColor:'#921342',backgroundColor:'#fff5f9',boxShadow:'0 0 0 1px #921342, 0 5px 18px rgba(146,19,66,.08)'},'.TabLabel':{fontWeight:'600'},'.Input':{borderRadius:'12px',borderColor:'#ead3dc',boxShadow:'none'},'.Input:focus':{borderColor:'#921342',boxShadow:'0 0 0 3px rgba(146,19,66,.12)'},'.Label':{color:'#4d3440'}}}";
  if(!html.includes(oldAppearance))throw Error('Inicialização segura Stripe não encontrada');
  html=html.replace(oldAppearance,newAppearance);
  const css=String.raw`<style id="popozuda-checkout-final">
  .checkout-brand{display:flex!important;justify-content:center;align-items:center!important;width:100%;max-width:100%;padding:8px 0 12px;margin:0 auto 4px!important;text-decoration:none!important}
  .checkout-brand img{display:block;width:174px;height:auto;max-height:43px;object-fit:contain}
  .wizard-progress{margin-top:14px!important}
  .wizard-panel[data-wizard-step="3"] .group:has(#shippingInfo){display:none!important}
  .wizard-panel[data-wizard-step="3"] .group:has(#payment-element){margin-top:18px!important}
  .wizard-panel[data-wizard-step="3"] .group:has(#payment-element)>h2{font-size:26px!important;margin:0 0 8px}
  .wizard-panel[data-wizard-step="3"] .group:has(#payment-element)>.muted{display:none!important}
  .wizard-panel[data-wizard-step="3"] .group:has(#payment-element) .method-head{display:none!important}
  .wizard-panel[data-wizard-step="3"] .group:has(#payment-element) .method{background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important}
  .wizard-panel[data-wizard-step="3"] .group:has(#payment-element) .payment-area{border:0!important;background:transparent!important;padding:0!important;box-shadow:none!important;min-height:120px}
  .checkout-payment-choices{display:flex;align-items:center;gap:9px;margin:18px 0 13px;flex-wrap:wrap;color:#74334d;font-weight:650;font-size:14px}
  .checkout-payment-choices svg{width:19px;height:19px;stroke:#9a1749}
  .checkout-payment-choices small{font-size:12px;font-weight:450;color:#7a6970;display:block;margin-top:3px}
  .wizard-review{border:1px solid #ebd6df!important;background:linear-gradient(125deg,#fff7f9,#fffdfd)!important;padding:19px 21px!important;border-radius:17px!important;box-shadow:0 4px 16px rgba(110,28,58,.045)}
  .wizard-review strong{color:#8c1343;font-size:14px!important}
  .wizard-review p{color:#493640!important;font-size:13px!important;line-height:1.85!important;word-break:break-word}
  .wizard-panel[data-wizard-step="3"] .security{margin-top:14px;color:#6c5d65;font-size:12px}
  #payment-element{border:0!important;border-radius:0!important;background:none!important;overflow:visible!important}
  .wizard-panel[data-wizard-step="3"] .payment-area{min-height:0!important;padding:0!important}.wizard-panel[data-wizard-step="3"] #payment-element{min-height:54px}.wizard-panel[data-wizard-step="3"] .checkout-payment-choices{margin:12px 0 16px!important}@media(max-width:767px){.wizard-panel[data-visible="true"]{padding:18px!important}.wizard-progress .wizard-label{white-space:normal!important}.wizard-panel[data-wizard-step="3"] .payment-area{min-height:0!important}#pay{width:100%;min-height:52px}}.aside .promo-badge{display:none!important}
  .aside .totals{display:flex;flex-direction:column;gap:0;padding-top:13px}
  .aside .totalrow{font-size:14px!important;display:flex;align-items:baseline;justify-content:space-between;padding:12px 0!important;gap:12px;color:#48333e}
  .aside .totalrow:has(#shipping){order:2}.aside .totalrow:has(#subtotal){order:1}
  .aside .totalrow:has(#discount){order:3;color:#9c1246!important}
  .aside .totalrow:has(#discount) #discount{color:#9c1246!important;font-weight:800}
  .aside .totalrow.grand{order:4;border-top:1px solid #e8cdd7!important;margin-top:10px!important;padding-top:20px!important;font-size:20px!important;font-weight:800!important;color:#7e123d}
  .aside .totalrow.grand #total{font-size:22px!important;color:#7e123d}
  .aside .sumhead h2{font-size:21px;font-weight:750}
  .aside-content>.muted{display:none!important}
  @media(max-width:800px){.checkout-brand{padding-top:4px}.checkout-brand img{width:155px}.checkout-payment-choices{margin:12px 0}.wizard-panel[data-wizard-step="3"] .group:has(#payment-element)>h2{font-size:23px!important}}
  </style>`;
  const script=String.raw`<script id="popozuda-checkout-final-behavior">(function(){
    document.querySelector('.checkout-brand')?.setAttribute('title','Voltar à loja Popozuda');
    const discount=document.getElementById('discount')?.closest('.totalrow');
    const freight=document.getElementById('shipping')?.closest('.totalrow');
    if(discount&&freight)discount.before(freight);
    const group=document.getElementById('payment-element')?.closest('.group');
    if(group){
      const title=document.createElement('div');title.className='checkout-payment-choices';
      title.innerHTML='<span aria-hidden="true"><svg fill="none" viewBox="0 0 24 24" stroke-width="1.8"><rect x="2.5" y="4.5" width="19" height="15" rx="3"/><path d="M3 9.5h18"/></svg></span><span>Escolha como deseja pagar<small>Cartão ou Pix. Somente a opção selecionada será exibida abaixo.</small></span>';
      group.querySelector('.payment-area')?.before(title);
    }
  })();</script>`;
  const paymentInit="const el=elements.create('payment',{layout:'tabs'});document.getElementById('payment-element').textContent='';el.mount('#payment-element');";
  const paymentFix="const el=elements.create('payment',{layout:'tabs'});const slot=document.getElementById('payment-element');slot.textContent='';el.on('ready',()=>{slot.dataset.status='ready'});el.on('loaderror',()=>{slot.dataset.status='error';slot.textContent='Não foi possível carregar Cartão/Pix. Atualize a página e tente novamente.'});el.mount('#payment-element');";
  if(!html.includes(paymentInit))throw Error('Stripe Payment Element não encontrado');
  html=html.replace(paymentInit,paymentFix);
  return html.replace('</head>',css+'</head>').replace('</body>',script+'</body>');
}
