import fs from 'node:fs';
import path from 'node:path';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';

const root=process.cwd();
const chunks=Array.from({length:17},(_,i)=>fs.readFileSync(path.join(root,'payload',String(i).padStart(2,'0')+'.txt'),'utf8'));
const pages=JSON.parse(gunzipSync(Buffer.from(chunks.join(''),'base64')).toString('utf8'));
const routes={index:'index.html',lisinha:'lisinha.html',creme:'creme.html',spray:'spray.html',checkout:'checkout.html'};
const remote=new Set();

function attr(tag,n){
 const m=tag.match(new RegExp('(?:\\s|^)'+n+'\\s*=\\s*(?:"([^"]*)"|\\x27([^\\x27]*)\\x27)','i'));
 return m?(m[1]??m[2]):'';
}
function removeAttr(tag,n){
 return tag.replace(new RegExp('\\s'+n+'\\s*=\\s*(?:"[^"]*"|\\x27[^\\x27]*\\x27)','gi'),'');
}
function absolute(u){
 u=u.replaceAll('&amp;','&');
 if(u.startsWith('//'))return 'https:'+u;
 if(u.startsWith('/cdn/shop/'))return 'https://popozuda.com.br'+u;
 return u;
}
function fromSrcset(srcset){
 if(!srcset)return '';
 const candidates=[...srcset.matchAll(/(?:https?:)?\/\/[^\s,]+/g)].map(m=>m[0].replaceAll('&amp;','&'));
 if(candidates.length)return absolute(candidates.find(u=>/[?&]width=1080(?:\D|$)/.test(u))||candidates.find(u=>/[?&]width=900(?:\D|$)/.test(u))||candidates.at(-1));
 return srcset.trim().split(/\s+\d+w/)[0].trim();
}
function fixImg(tag){
 let src=attr(tag,'src');
 if(!src||src==='about:blank'||src.startsWith('blob:'))src=fromSrcset(attr(tag,'data-srcset')||attr(tag,'data-src')||attr(tag,'srcset'));
 for(const n of ['src','srcset','data-srcset','data-src'])tag=removeAttr(tag,n);
 if(!src)return '';
 src=absolute(src);
 if(/^https?:\/\//i.test(src))remote.add(src);
 tag=tag.replace(/\s*\/?>$/,end=>' src="'+src.replaceAll('&','&amp;')+'"'+end);
 tag=tag.replace(/(class=["'])([^"']*)(["'])/i,(full,start,classes,end)=>start+classes.replace(/\b(?:no-js-hidden|lazyloading|loading)\b/g,'loaded')+end);
 return tag;
}

function fixSource(tag){
 const value=attr(tag,'srcset')||attr(tag,'data-srcset');
 if(!value)return tag;
 const src=fromSrcset(value);
 if(!src)return tag;
 tag=removeAttr(removeAttr(tag,'srcset'),'data-srcset');
 if(/^https?:\/\//i.test(src))remote.add(src);
 return tag.replace(/\s*\/?>$/,end=>' srcset="'+src.replaceAll('&','&amp;')+' 1x"'+end);
}
const communityUrls=[
 'https://popozuda.com.br/cdn/shop/files/preview_images/moast-video-first-frame-ade548ff-6c68-4bfa-9fdc-b739e8b572f8.jpg?v=1792012654&width=720',
 'https://popozuda.com.br/cdn/shop/files/preview_images/moast-video-first-frame-438b264d-19ee-4a6f-888e-0ff373fef3ee.jpg?v=1792012649&width=720',
 'https://popozuda.com.br/cdn/shop/files/preview_images/moast-video-first-frame-2d9a58aa-8d37-4405-b3d9-0c456bdd0030.jpg?v=1792012662&width=720',
 'https://popozuda.com.br/cdn/shop/files/preview_images/moast-video-first-frame-181f6903-12bf-4777-94df-083a35d9d67f.jpg?v=1792012665&width=720',
 'https://popozuda.com.br/cdn/shop/files/preview_images/moast-video-first-frame-2f3881b1-c60e-41e0-976a-f1ddbb4b0b79.jpg?v=1792012657&width=720'
];
function makeCommunity(){
 for(const u of communityUrls)remote.add(u);
 return '<div class="popozuda-community-gallery" aria-label="Galeria da comunidade Popozuda">'+communityUrls.map((src,i)=>'<img src="'+src.replaceAll('&','&amp;')+'" alt="Comunidade Popozuda, imagem '+(i+1)+'" loading="lazy">').join('')+'</div>';
}

// Replace the low-resolution or transient <img> source inside each original
// product gallery with the official media address preserved by Shopify.
function restoreGallerySources(html){
 return html.replace(/(<div\b(?=[^>]*\bclass="[^"]*\bproduct-media\b)(?=[^>]*\bdata-media-src="[^"]+")[^>]*>)(\s*)(<img\b[^>]*>)/gi,(full,open,space,img)=>{
  const raw=attr(open,'data-media-src');
  if(!raw)return full;
  const src=absolute(raw);
  if(!/^https:\/\//i.test(src))return full;
  const cleaned=removeAttr(removeAttr(removeAttr(img,'src'),'srcset'),'data-srcset').replace(/\sloading=(?:"[^"]*"|'[^']*')/i,'');
  const next=cleaned.replace(/\s*\/?>$/,end=>' src="'+src.replaceAll('&','&amp;')+'" loading="eager"'+end);
  return open+space+next;
 });
}

const bridgeRx=/<script>\s*\(function\(\)\{\s*try\s*\{\s*if\(window\.parent[\s\S]*?<\/script>/i;
const bridge='<script>(function(){window.addEventListener("message",function(event){if(event.source!==window)return;const d=event.data||{};if(d.type==="navigate"){const routes={index:"index.html",lisinha:"lisinha.html",creme:"creme.html",spray:"spray.html",checkout:"checkout.html"};if(d.anchor)sessionStorage.setItem("popozuda-anchor",d.anchor);location.href=routes[d.page]||"index.html"}else if(d.type==="cart"){try{localStorage.setItem("popozuda_cart",JSON.stringify(d.cart||{}))}catch(e){}}});document.addEventListener("DOMContentLoaded",function(){const anchor=sessionStorage.getItem("popozuda-anchor");if(anchor){sessionStorage.removeItem("popozuda-anchor");document.getElementById(anchor)?.scrollIntoView({behavior:"instant"})}})})();</script>';

for(const [name,file] of Object.entries(routes)){
 let html=pages[name];
 html=html.replace(bridgeRx,bridge);
 html=restoreGallerySources(html);
 html=html.replace(/<img\b[^>]*>/gi,fixImg);
 html=html.replace(/<source\b[^>]*>/gi,fixSource);
 html=html.replace(/<moast-carousel\b[\s\S]*?<\/moast-carousel>/gi,makeCommunity);

 html=html.replaceAll('JSON.stringify(window.parent.__popCart||{})','(localStorage.getItem("popozuda_cart")||"{}")');
 html=html.replace(/\bno-js-hidden\b/g,'loaded');
 html=html.replace('</head>','<style id="popozuda-static-media">img.media__image.loading,.image-zoom-reveal img.media__image{opacity:1!important;transform:none!important}.media--loading{background-color:transparent}.popozuda-community-gallery{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;padding:32px 0 40px;scrollbar-width:thin}.popozuda-community-gallery img{width:250px;height:330px;flex:none;object-fit:cover;border-radius:20px;scroll-snap-align:start;background:#fff0ef}@media(max-width:767px){.popozuda-community-gallery img{width:220px;height:300px}}</style></head>');

 // Shopify's reveal observers are unavailable in the saved site. Always display
 // the licensed photographs even where their original animation was not fired.
 html=html.replace('</head>','<style id="popozuda-gallery-reveal">.media-gallery__item img.media__image,.media-gallery__grid-thumbnails img.media__image,.testimonial-slider img.media__image,.video-card img.media__image,.products-bundle-selection img.media__image,.product-card__media img.media__image,.media.image-zoom-reveal img.media__image{opacity:1!important;visibility:visible!important;transform:none!important;filter:none!important}.testimonial-slider__slide--active .testimonial-slider__slide-avatar,.testimonial-slider__thumbnails .testimonial-slider__slide-avatar{opacity:1!important;visibility:visible!important}.media-gallery .media__image{content-visibility:visible!important}.media-gallery .media--loading{background:transparent!important}</style></head>');
 html=html.replace(/<html\b/i,'<html data-popozuda-static="true"');
 html=html.replace(/Com tecnologia da Shopify/gi,'');
 if(name==='checkout'){
  html=html.replace(/<div id="onefile-preview-disclaimer"[^>]*>[\s\S]*?<\/div>/gi,'');
  html=html.replaceAll('window.parent.location.href','window.location.href').replaceAll('window.top.location.href','window.location.href');
 }
 fs.writeFileSync(path.join(root,file),html,'utf8');
 console.log('Generated',file,'bytes',Buffer.byteLength(html));
}

const galleryExpectations={lisinha:5,creme:7,spray:5};
const galleryUrls=new Map();
for(const name of ['lisinha','creme','spray']){
 const html=fs.readFileSync(path.join(root,routes[name]),'utf8');
 const canonical=[...html.matchAll(/<div\b[^>]*\bclass="[^"]*\bproduct-media\b[^"]*"[^>]*\bdata-media-src="([^"]+)"/gi)].map(x=>absolute(x[1]));
 const uniq=[...new Set(canonical)];
 if(uniq.length<galleryExpectations[name])throw Error('Galeria '+name+' incompleta no HTML: '+uniq.length);
 galleryUrls.set(name,uniq);
 for(const url of uniq)remote.add(url);
}
const testimonialSrcs=[...new Set([...fs.readFileSync(path.join(root,'lisinha.html'),'utf8').matchAll(/https:\/\/popozuda\.com\.br\/cdn\/shop\/files\/ps[1-5]\.webp[^"'\s<>]*/gi)].map(x=>absolute(x[0])))];
for(const url of testimonialSrcs)remote.add(url);

const mediaDir=path.join(root,'media');
fs.mkdirSync(mediaDir,{recursive:true});
const files=new Map();
const failed=[];
const pending=[...remote];
async function download(u){
 const pathname=new URL(u).pathname;
 const ext=(pathname.match(/\.(?:webp|svg|png|jpe?g|avif|gif)$/i)||[])[0]||'.img';
 const name=createHash('sha256').update(u).digest('hex').slice(0,24)+ext;
 const urls=[u];
 try{
  const p=new URL(u);
  if(p.hostname==='popozuda.com.br'&&p.pathname.startsWith('/cdn/shop/files/'))
    urls.push('https://cdn.shopify.com/s/files/1/0791/5385/6739/files/'+p.pathname.split('/').pop()+p.search);
 }catch(e){}
 for(const url of urls){
  try{
   const response=await fetch(url,{headers:{Accept:'image/avif,image/webp,image/*,*/*;q=0.8'},signal:AbortSignal.timeout(7500)});
   if(!response.ok)continue;
   const type=response.headers.get('content-type')||'';
   if(!type.startsWith('image/'))continue;
   const bytes=Buffer.from(await response.arrayBuffer());
   if(bytes.length<100||bytes.length>8000000)continue;
   fs.writeFileSync(path.join(mediaDir,name),bytes);
   files.set(u,'media/'+name);
   return;
  }catch(e){}
 }
 failed.push(u);
}
if(process.env.POPOZUDA_SKIP_MEDIA!=='true'){
 await Promise.all(Array.from({length:12},async()=>{while(pending.length)await download(pending.shift())}));
}
// Original video miniatures no longer served by Shopify: use other licensed official
// community images so these thumbnails never become empty rectangles.
let officialSubstitutions=0;
const replacementImages=communityUrls.filter(u=>files.has(u));
for(const unavailable of failed){
 if(unavailable.includes('moast-video-first-frame')&&replacementImages.length){
  files.set(unavailable,files.get(replacementImages[officialSubstitutions % replacementImages.length]));
  officialSubstitutions++;
 }
}
const unresolved=failed.filter(u=>!files.has(u));
const galleryAudit={};
for(const [name,urls] of galleryUrls){
 const missing=urls.filter(u=>!files.has(u));
 galleryAudit[name]={total:urls.length,local:urls.length-missing.length,missing:missing.length};
 if(missing.length)throw Error('Faltam '+missing.length+' imagens oficiais na galeria '+name+': '+missing.join(', '));
}
const missingTestimonials=testimonialSrcs.filter(u=>!files.has(u));
if(missingTestimonials.length)throw Error('Imagens de depoimentos não recuperadas: '+missingTestimonials.join(', '));
for(const file of Object.values(routes)){
 let html=fs.readFileSync(path.join(root,file),'utf8');
 for(const [url,local] of files){
  html=html.replaceAll(url.replaceAll('&','&amp;'),local).replaceAll(url,local);
 }
 fs.writeFileSync(path.join(root,file),html);
}
const report={generatedAt:new Date().toISOString(),galleryAudit,testimonialImages:testimonialSrcs.length,missingTestimonials:missingTestimonials.length,embeddedImages:Object.keys(routes).length,externalImageUrls:remote.size,locallySaved:files.size,originalUnavailable:failed.length,officialSubstitutions,remoteFallbacks:unresolved.length,failed:unresolved.slice(0,30)};
fs.writeFileSync(path.join(root,'image-build-report.json'),JSON.stringify(report,null,2));
console.log('Popozuda image audit',JSON.stringify({external:remote.size,local:files.size,originalUnavailable:failed.length,officialSubstitutions,remoteFallbacks:unresolved.length}));
if(failed.length)console.warn('Media download failures:',JSON.stringify(failed));
