export function upgradeCheckout(html){
const css=String.raw`<style id="popozuda-checkout-steps">
.development{display:none!important}.main{padding-top:32px}.breadcrumb{display:none!important}
.wizard-progress{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:30px 0 34px}
.wizard-progress button{border:0;background:none;padding:0;color:#8a8a8a;display:flex;flex-direction:column;gap:8px;align-items:flex-start;min-width:0;text-align:left;font-weight:600}
.wizard-progress button:focus-visible{outline:2px solid #a2144d;outline-offset:5px;border-radius:5px}
.wizard-progress .wizard-label{display:flex;gap:8px;align-items:center;font-size:12px;white-space:nowrap}
.wizard-progress .wizard-number{display:grid;place-items:center;width:27px;height:27px;border-radius:50%;border:1px solid #c9c9c9;font-size:12px;flex:none}
.wizard-progress .wizard-meter{width:100%;height:3px;background:#e9e9e9;border-radius:4px;overflow:hidden}
.wizard-progress .wizard-meter::before{content:'';display:block;width:0;height:100%;background:#a2144d;transition:width .2s ease}
.wizard-progress button[data-status="current"],.wizard-progress button[data-status="done"]{color:#94143e}
.wizard-progress button[data-status="current"] .wizard-number,.wizard-progress button[data-status="done"] .wizard-number{background:#a2144d;border-color:#a2144d;color:white}
.wizard-progress button[data-status="current"] .wizard-meter::before,.wizard-progress button[data-status="done"] .wizard-meter::before{width:100%}
.wizard-progress button:disabled{cursor:default}
.wizard-panel{display:none;animation:wizard-in .18s ease-out}.wizard-panel[data-visible="true"]{display:block}
@keyframes wizard-in{from{opacity:.65;transform:translateY(7px)}to{opacity:1;transform:none}}
.wizard-panel>.group:first-child{margin-top:0}.wizard-panel h2{font-size:23px;margin:0 0 10px}
.wizard-hint{color:#696969;font-size:13px;line-height:1.6;margin:0 0 22px}
.wizard-personal{display:grid;gap:14px}.wizard-personal label.field{font-size:13px}
.wizard-buttons{display:flex;gap:12px;align-items:center;margin-top:24px}
.wizard-buttons .wizard-next{background:#a2144d;color:#fff;border:0;padding:15px 22px;min-height:54px;border-radius:7px;flex:1;font-weight:700}
.wizard-buttons .wizard-next:hover{background:#841039}
.wizard-buttons .wizard-back{border:1px solid #dedede;background:#fff;border-radius:7px;padding:14px 18px;min-height:54px;color:#333}
.wizard-buttons .wizard-back:hover{border-color:#a2144d;color:#a2144d}
#checkoutForm[data-current-step="1"] #pay,#checkoutForm[data-current-step="1"] #checkoutNotice,#checkoutForm[data-current-step="2"] #pay,#checkoutForm[data-current-step="2"] #checkoutNotice{display:none!important}
#checkoutForm[data-current-step="3"] #wizardNext,#checkoutForm[data-current-step="1"] #wizardBack{display:none!important}
.wizard-review{border:1px solid #e2e2e2;border-radius:8px;background:#fbfbfb;padding:15px 17px;font-size:13px;margin:16px 0 25px;line-height:1.65}
.wizard-review strong{display:block;font-size:13px;margin-bottom:4px}.wizard-review p{margin:0;color:#555}
.wizard-panel .group{margin:20px 0}.wizard-panel .payment-area{min-height:60px}.wizard-panel .security{margin-bottom:16px}
#checkoutForm[data-current-step="3"] #pay{margin-top:18px}
@media(max-width:800px){.main{padding-top:25px}.wizard-progress{margin:24px 0 28px}.wizard-progress .wizard-label{font-size:11px;gap:5px}.wizard-progress .wizard-number{width:24px;height:24px}.wizard-panel h2{font-size:21px}}
@media(max-width:360px){.wizard-progress{gap:7px}.wizard-progress .wizard-label{font-size:10px}.wizard-buttons .wizard-back{padding:12px}}
@media(prefers-reduced-motion:reduce){.wizard-panel{animation:none}.wizard-progress .wizard-meter::before{transition:none}}
</style>`;
const script=String.raw`<script id="popozuda-progressive-checkout">(function(){
'use strict';
const form=document.getElementById('checkoutForm');if(!form||form.dataset.wizardReady)return;
const groups=[...form.querySelectorAll(':scope > section.group')];if(groups.length<4)return;
const [contact,delivery,shipping,payment]=groups;
const alertArea=document.getElementById('feedback'),pay=document.getElementById('pay');
const field=name=>form.querySelector('[name="'+name+'"]');
const label=name=>field(name)?.closest('label.field');
const first=field('firstName'),last=field('lastName');
if(!first||!last||!label('email')||!label('phone')||!label('cpf'))return;
form.dataset.wizardReady='true';
const progress=document.createElement('nav');progress.className='wizard-progress';progress.setAttribute('aria-label','Etapas da compra');
const labels=['Dados pessoais','Endereço','Pagamento'];
const items=labels.map((title,i)=>{const btn=document.createElement('button');btn.type='button';btn.dataset.step=String(i+1);btn.innerHTML='<span class="wizard-label"><span class="wizard-number">'+(i+1)+'</span><span>'+title+'</span></span><span class="wizard-meter"></span>';btn.title=title;progress.append(btn);return btn});
const crumb=document.querySelector('.breadcrumb');if(crumb)crumb.replaceWith(progress);else form.before(progress);
const panels=labels.map((_,i)=>{const panel=document.createElement('section');panel.className='wizard-panel';panel.dataset.wizardStep=String(i+1);panel.setAttribute('aria-label',labels[i]);form.prepend(panel);return panel});
for(let i=panels.length-1;i>=0;i--)form.prepend(panels[i]);
const [personal,address,final]=panels;
personal.innerHTML='<h2>Seus dados</h2><p class="wizard-hint">Só precisamos dessas informações para identificar seu pedido.</p><div class="wizard-personal"></div>';
const personFields=personal.querySelector('.wizard-personal');
const fullLabel=document.createElement('label');fullLabel.className='field';fullLabel.textContent='Nome completo';
const full=document.createElement('input');full.name='fullName';full.type='text';full.required=true;full.autocomplete='name';full.placeholder='Seu nome completo';full.maxLength=120;fullLabel.append(full);personFields.append(fullLabel);
const firstLabel=label('firstName'),lastLabel=label('lastName');first.removeAttribute('required');last.removeAttribute('required');first.type='hidden';last.type='hidden';firstLabel?.remove();lastLabel?.remove();personal.append(first,last);
for(const name of ['phone','email','cpf']){const l=label(name);if(l)personFields.append(l)}
const phone=field('phone');phone.type='tel';phone.placeholder='(11) 99999-9999';phone.autocomplete='tel';phone.maxLength=18;
const cpf=field('cpf');cpf.placeholder='000.000.000-00';
const newsletter=document.getElementById('newsletter');if(newsletter){newsletter.checked=false;newsletter.closest('.checkline')?.remove();newsletter.hidden=true;newsletter.style.display='none';personal.append(newsletter)}
contact.remove();
for(const row of [...delivery.querySelectorAll('.two')])if(!row.children.length)row.remove();
field('country')?.closest('label.field')?.remove();
delivery.querySelector('h2').textContent='Endereço de entrega';
const hint=document.createElement('p');hint.className='wizard-hint';hint.textContent='Informe onde você deseja receber o pedido.';delivery.querySelector('h2').after(hint);address.append(delivery);
const review=document.createElement('div');review.className='wizard-review';review.setAttribute('aria-live','polite');final.append(review,shipping,payment);
const controls=document.createElement('div');controls.className='wizard-buttons';
const back=document.createElement('button');back.type='button';back.id='wizardBack';back.className='wizard-back';back.textContent='Voltar';
const next=document.createElement('button');next.type='button';next.id='wizardNext';next.className='wizard-next';next.textContent='Continuar para endereço';
controls.append(back,next);form.insertBefore(controls,alertArea);
let step=1,maxReached=1;
function notify(message){alertArea.textContent=message;alertArea.classList.add('visible');alertArea.scrollIntoView({block:'nearest'})}
function clearMessage(){alertArea.textContent='';alertArea.classList.remove('visible')}
function splitName(){const parts=full.value.trim().replace(/\s+/g,' ').split(' ').filter(Boolean);first.value=parts.shift()||'';last.value=parts.join(' ')}
full.addEventListener('input',splitName);
phone.addEventListener('input',()=>{const d=phone.value.replace(/\D/g,'').slice(0,11);phone.value=d.length>10?'('+d.slice(0,2)+') '+d.slice(2,7)+'-'+d.slice(7):d.length>6?'('+d.slice(0,2)+') '+d.slice(2,6)+'-'+d.slice(6):d.length>2?'('+d.slice(0,2)+') '+d.slice(2):d});
cpf.addEventListener('input',()=>{const d=cpf.value.replace(/\D/g,'').slice(0,11);cpf.value=d.replace(/^(\d{3})(\d)/,'$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/,'$1.$2.$3').replace(/(\d{3})(\d{1,2})$/,'$1-$2')});
function validCpf(v){const d=v.replace(/\D/g,'');if(d.length!==11||/^(\d)\1{10}$/.test(d))return false;for(let i=9;i<11;i++){let sum=0;for(let j=0;j<i;j++)sum+=Number(d[j])*(i+1-j);if(Number(d[i])!==((sum*10)%11)%10)return false}return true}
function validate(n){for(const input of panels[n-1].querySelectorAll('input[required],select[required]')){if(!input.checkValidity()){input.reportValidity();input.focus();return false}}
if(n===1){if(full.value.trim().length<3){notify('Informe seu nome completo.');full.focus();return false}const digits=phone.value.replace(/\D/g,'');if(digits.length<10||digits.length>11){notify('Informe um telefone com DDD válido.');phone.focus();return false}if(!validCpf(cpf.value)){notify('Confira o CPF informado.');cpf.focus();return false}splitName()}
if(n===2&&field('postalCode').value.replace(/\D/g,'').length!==8){notify('Confira o CEP informado.');field('postalCode').focus();return false}return true}
function addressReview(){const v=name=>(field(name)?.value||'').trim();review.innerHTML='<strong>Entrega para</strong><p></p>';review.querySelector('p').textContent=[full.value.trim(),v('line1')+', '+v('number')+(v('line2')?' — '+v('line2'):''),v('district')+' · '+v('city')+'/'+v('state'),'CEP '+v('postalCode')].join(' · ')}
function show(n){step=n;maxReached=Math.max(maxReached,n);form.dataset.currentStep=String(n);panels.forEach((panel,i)=>{const active=i===n-1;panel.dataset.visible=String(active);panel.hidden=!active;panel.setAttribute('aria-hidden',String(!active))});items.forEach((btn,i)=>{btn.dataset.status=i+1===n?'current':i+1<n?'done':'upcoming';btn.disabled=i+1>maxReached;btn.setAttribute('aria-current',i+1===n?'step':'false')});next.textContent=n===1?'Continuar para endereço':'Continuar para pagamento';if(n===3)addressReview();clearMessage();if(progress.getBoundingClientRect().top<0)progress.scrollIntoView({behavior:'smooth',block:'start'})}
next.addEventListener('click',async()=>{if(!validate(step))return;if(step===1)show(2);else if(step===2){show(3);for(let i=0;i<25;i++){if(step!==3)return;if(!pay.disabled){if(!document.querySelector('#payment-element iframe'))pay.click();return}await new Promise(resolve=>setTimeout(resolve,150))}}});
back.addEventListener('click',()=>{if(step>1){if(document.querySelector('#payment-element iframe')){notify('Para alterar dados após preparar o pagamento, volte ao carrinho e inicie um novo pedido.');return}show(step-1)}});
items.forEach((btn,i)=>btn.addEventListener('click',()=>{if(i+1>=step||i+1>maxReached)return;if(document.querySelector('#payment-element iframe')){notify('Para alterar dados após preparar o pagamento, volte ao carrinho e inicie um novo pedido.');return}show(i+1)}));
form.addEventListener('submit',event=>{if(step!==3){event.preventDefault();event.stopImmediatePropagation();notify('Conclua os dados e o endereço antes de pagar.');return}splitName()},true);
document.getElementById('checkoutNotice')?.setAttribute('aria-live','polite');
show(1);
})();</script>`;

const premium=String.raw\`<style id="popozuda-checkout-premium">
:root{--pop-wine:#9e1349;--pop-wine-deep:#700d34;--pop-blush:#fff6f3;--pop-gold:#f1f7ad;--pop-line:#ecd9df;--pop-text:#2f232c;--pop-shadow:0 18px 48px rgba(100,24,55,.10),0 3px 12px rgba(100,24,55,.045)}
body{background:linear-gradient(135deg,#fffaf8 0%,#fff 55%,#fff9f7 100%);color:var(--pop-text)}
.shell{box-shadow:none!important;background:transparent!important}
.main{background:transparent!important;padding-bottom:55px}
.aside{background:linear-gradient(150deg,#fff7f5,#fff1f1)!important;border-left:1px solid var(--pop-line)!important}
.brand{color:var(--pop-wine)!important;display:inline-block;font-size:30px!important;font-weight:800!important;letter-spacing:-1.3px}
.wizard-progress{gap:13px;margin-top:28px;margin-bottom:30px}
.wizard-progress button{padding:0 2px;transition:color .2s ease;letter-spacing:.01em}
.wizard-progress .wizard-number{width:32px;height:32px;font-weight:800;border:1px solid #dcc3cd;box-shadow:0 3px 10px rgba(112,13,52,.035)}
.wizard-progress button[data-status="current"] .wizard-number{box-shadow:0 5px 16px rgba(158,19,73,.25)}
.wizard-progress .wizard-meter{height:4px;background:#f1e2e7}
.wizard-panel[data-visible="true"]{background:linear-gradient(180deg,#fff 0%,#fffdfd 100%);border:1px solid var(--pop-line);padding:clamp(20px,3vw,34px);border-radius:24px;box-shadow:var(--pop-shadow)}
.wizard-panel h2{color:#3e2130;font-size:clamp(22px,2vw,27px)!important;letter-spacing:-.04em;font-weight:750}
.wizard-hint{margin-bottom:24px;color:#82727b}
.wizard-panel .field{color:#5c3d4d;font-weight:650;font-size:13px;line-height:1.5}
.wizard-panel input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]),.wizard-panel select,.wizard-panel textarea{
 width:100%;min-height:51px;padding:12px 15px!important;border:1px solid #e7d4dc!important;border-radius:13px!important;
 background:#fffcfd!important;color:#34252e!important;box-shadow:0 2px 4px rgba(100,24,55,.025);
 transition:border-color .18s ease,box-shadow .18s ease,background-color .18s ease
}
.wizard-panel input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]):focus,.wizard-panel select:focus,.wizard-panel textarea:focus{
 outline:0!important;background:#fff!important;border-color:#bc376a!important;
 box-shadow:0 0 0 4px rgba(169,27,79,.11)!important
}
.wizard-panel input::placeholder{color:#a3949c}
.wizard-personal,.wizard-panel .fields{gap:15px}
.wizard-buttons{margin-top:20px}
.wizard-buttons .wizard-next,#pay{border-radius:15px!important;min-height:54px;box-shadow:0 11px 22px rgba(158,19,73,.2);background:linear-gradient(135deg,var(--pop-wine),var(--pop-wine-deep))!important;border:0!important;color:white!important;transition:transform .2s ease,box-shadow .2s ease}
.wizard-buttons .wizard-next:hover,#pay:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 14px 28px rgba(158,19,73,.27)}
.wizard-buttons .wizard-back{border-radius:15px;border:1px solid var(--pop-line);background:#fff9fb;min-height:54px}
.wizard-review{background:#fff7fa;border:1px solid #f0d8e1;border-radius:16px;padding:16px 20px}
#payment-element{border-radius:16px;overflow:hidden}
#shippingInfo{color:#62414f}
.cep-status{font-size:12px!important;margin:9px 0 0!important;color:#75606c;line-height:1.5}
.cep-status[data-kind="success"]{color:#247453}
.cep-status[data-kind="error"]{color:#9c2141}
.cep-status[data-kind="loading"]{color:var(--pop-wine)}
.aside-content{padding-top:24px!important}
.sumhead h2{font-size:21px;letter-spacing:-.03em;color:#442232}
.aside .item{border-radius:15px}
.aside .thumb{border-radius:13px;overflow:hidden;background:#f6edf1}
.aside .discount{background:#fff;border:1px solid var(--pop-line);padding:8px;border-radius:16px;box-shadow:0 4px 20px rgba(124,22,54,.045);gap:8px}
.aside .discount input{border:0!important;box-shadow:none!important;background:transparent!important;border-radius:9px;padding:10px!important}
.aside .discount button{border-radius:11px!important;background:#fff1f5;border:1px solid #edd0d9!important;color:#8f1947;font-weight:700}
.aside .totalrow{padding-block:8px}
.aside .totalrow.grand{border-top:1px solid #ead6de;margin-top:10px;padding-top:17px;font-size:19px;font-weight:800;color:#72203f}
.aside .muted{font-size:12px;line-height:1.5;color:#866e79}
#checkoutForm .security{color:#86747d}
@media(min-width:1000px){.aside{min-height:100vh}.aside-content{position:sticky;top:28px}}
@media(max-width:800px){
 body{background:#fff9f8}.main{padding:22px 18px 32px!important}
 .wizard-panel[data-visible="true"]{padding:22px 18px;border-radius:20px;box-shadow:0 12px 30px rgba(100,24,55,.07)}
 .wizard-progress{gap:8px;margin:22px 0 25px}.wizard-progress .wizard-number{width:27px;height:27px}
 .wizard-progress .wizard-label{font-size:10px!important;gap:5px!important}
 .aside{border-left:0!important;border-top:1px solid var(--pop-line)!important}
 .aside-content{padding:22px 18px!important}
 .mob-summary{border-radius:15px!important;background:#fff7fb!important}
}
@media(prefers-reduced-motion:reduce){.wizard-buttons .wizard-next,#pay,.wizard-panel input,.wizard-panel select{transition:none!important}}
</style>\`;
const cepFill=String.raw\`<script id="popozuda-cep-autofill">(function(){
'use strict';
const form=document.getElementById('checkoutForm');
if(!form)return;
const get=name=>form.querySelector('[name="'+name+'"]');
const cep=get('postalCode');if(!cep)return;
cep.setAttribute('inputmode','numeric');cep.setAttribute('autocomplete','postal-code');
cep.setAttribute('placeholder','00000-000');
const status=document.createElement('p');status.className='cep-status';
status.setAttribute('role','status');status.setAttribute('aria-live','polite');
const parent=cep.closest('label.field');parent?.after(status);
let timer=0,current='',controller=null;
const msg=(m,kind)=>{status.textContent=m;status.dataset.kind=kind||''};
const val=name=>get(name);
const normalize=data=>{
 if(!data||data.erro||data.errors)return null;
 const street=data.logradouro||data.street||'';
 const district=data.bairro||data.neighborhood||'';
 const city=data.localidade||data.city||'';
 const state=data.uf||data.state||'';
 if(!city||!/^[A-Z]{2}$/.test(state))return null;
 return {street,district,city,state};
};
async function lookup(digits){
 if(controller)controller.abort();const ctl=new AbortController();controller=ctl;
 msg('Buscando endereço pelo CEP…','loading');
 for(const url of ['https://viacep.com.br/ws/'+digits+'/json/','https://brasilapi.com.br/api/cep/v1/'+digits]){
  if(ctl.signal.aborted||cep.value.replace(/\\D/g,'')!==digits)return;
  try{
   const result=await fetch(url,{signal:ctl.signal,cache:'no-store',headers:{'Accept':'application/json'}});
   if(!result.ok)continue;
   const data=normalize(await result.json());
   if(!data)continue;
   if(cep.value.replace(/\\D/g,'')!==digits)return;
   [['line1',data.street],['district',data.district],['city',data.city],['state',data.state]].forEach(([name,content])=>{
     const control=val(name);if(!control||!content)return;
     control.value=content;
     control.dispatchEvent(new Event('input',{bubbles:true}));
     control.dispatchEvent(new Event('change',{bubbles:true}));
   });
   msg('Endereço encontrado! Confira o número e complemento.','success');
   const number=val('number');if(number&&!number.value)number.focus({preventScroll:true});
   return;
  }catch(error){if(error.name==='AbortError')return}
 }
 if(!ctl.signal.aborted)msg('Não foi possível localizar o CEP. Preencha o endereço manualmente.','error');
}
cep.addEventListener('input',()=>{
 const digits=cep.value.replace(/\\D/g,'').slice(0,8);
 cep.value=digits.length>5?digits.slice(0,5)+'-'+digits.slice(5):digits;
 clearTimeout(timer);
 if(controller)controller.abort();
 if(digits.length!==8){current='';msg(digits?'Digite os 8 números do CEP.':'','');return}
 if(digits===current&&status.dataset.kind==='success')return;
 current=digits;timer=setTimeout(()=>lookup(digits),340);
});
cep.addEventListener('blur',()=>{const digits=cep.value.replace(/\\D/g,'');if(digits.length===8&&status.dataset.kind!=='success'){clearTimeout(timer);lookup(digits)}});
})();</script>\`;

return html.replace(/<div class="development">[\s\S]*?<\/div>/,'')
.replace('Preços e frete sujeitos à validação antes da publicação.','Frete calculado automaticamente antes do pagamento.')
.replace('Política de privacidade e termos de compra: configurar a versão oficial aprovada.','Pagamento protegido e dados utilizados somente para processar o pedido.')
.replace('</head>',css+premium+'</head>')
.replace('</body>',script+cepFill+'</body>');
}
