import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const extensions={webp:'webp',png:'png',jpeg:'jpg',jpg:'jpg',gif:'gif',avif:'avif','svg+xml':'svg'};
export function optimizeHtml(html,mediaDir){
 fs.mkdirSync(mediaDir,{recursive:true});
 let extractedImages=0,bytesRemovedFromHtml=0;
 html=html.replace(/data:image\/(svg\+xml|webp|png|jpe?g|avif|gif);base64,([a-z0-9+/=]{90,})/gi,(raw,type,payload)=>{
  const bytes=Buffer.from(payload,'base64');
  if(bytes.length<60||bytes.length>10000000)return raw;
  const digest=crypto.createHash('sha256').update(bytes).digest('hex').slice(0,24);
  const filename=digest+'.'+extensions[type.toLowerCase()];
  const dest=path.join(mediaDir,filename);
  if(!fs.existsSync(dest))fs.writeFileSync(dest,bytes);
  extractedImages++;bytesRemovedFromHtml+=raw.length;
  return '/media/'+filename;
 });
 let seen=0,heroImages=0;
 html=html.replace(/<img\b[^>]*>/gi,tag=>{
  if(!/\bsrc\s*=\s*["'][^"']+["']/i.test(tag))return tag;
  seen++;
  const isHero=/\balt=["']Popozuda["']/i.test(tag)&&/\bclass=["'][^"']*media__image/i.test(tag)&&!/\blogo\b/i.test(tag);
  const isCard=/\bclass=["'][^"']*product-card/i.test(tag);
  if(isHero)heroImages++;
  if(!/\bdecoding=/i.test(tag))tag=tag.replace(/\/?>$/,end=>' decoding="async"'+end);
  if(isHero&&heroImages<=2){
   tag=tag.replace(/\sloading\s*=\s*(?:"lazy"|'lazy')/i,' loading="eager"');
   if(!/\bloading\s*=/i.test(tag))tag=tag.replace(/\/?>$/,end=>' loading="eager"'+end);
   if(!/\bfetchpriority\s*=/i.test(tag))tag=tag.replace(/\/?>$/,end=>' fetchpriority="high"'+end);
  }else if(isCard){
   tag=tag.replace(/\sloading\s*=\s*(?:"eager"|'eager')/i,' loading="lazy"');
   if(!/\bloading\s*=/i.test(tag))tag=tag.replace(/\/?>$/,end=>' loading="lazy"'+end);
  }else if(!/\bloading\s*=/i.test(tag))tag=tag.replace(/\/?>$/,end=>' loading="lazy"'+end);
  return tag;
 });
 const css='<style id="popozuda-mobile-stability">html,body{overflow-x:clip}img{max-width:100%;font-style:normal}.media-gallery__carousel-thumbnails .media__image{opacity:1!important;visibility:visible!important}@media(max-width:767px){.media-gallery__carousel-wrapper{height:auto!important;min-height:0!important}.media-gallery__item{height:auto!important}html,body{width:100%;max-width:100%;overflow-x:clip}.slide__media motion-component,.slide__media picture,.slide__media img{opacity:1!important;visibility:visible!important}.slide__media img{max-width:100%;object-fit:cover}.shopify-section,.section,.product,.product__media-wrapper,.product__info-wrapper,.media-gallery{min-width:0;max-width:100%}.media-gallery__item img,.media-gallery__grid-thumbnails img{display:block;object-fit:contain;max-width:100%}video,iframe{max-width:100%}.popozuda-community-gallery{overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch}}@media(prefers-reduced-motion:reduce){.scroll-trigger,.animate--slide-in,.animate--fade-in{animation:none!important;transition:none!important;opacity:1!important}}</style>';
 html=html.replace('</head>',css+'</head>');
 return {html,report:{extractedImages,bytesRemovedFromHtml,remainingBytes:Buffer.byteLength(html)}};
}
