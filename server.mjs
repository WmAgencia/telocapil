import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {brotliCompressSync,gzipSync,constants as zconstants} from 'node:zlib';
import {createHash} from 'node:crypto';
import checkoutConfig from './api/checkout-config.js';
import createPaymentIntent from './api/create-payment-intent.js';
import orderStatus from './api/order-status.js';
import stripeWebhook from './api/stripe-webhook.js';
import trackingConfig from './api/tracking-config.js';
import {identity,reserve,release} from './lib/first-purchase.js';
const root=path.dirname(fileURLToPath(import.meta.url));
const handlers=new Map([['/api/checkout-config',checkoutConfig],['/api/create-payment-intent',createPaymentIntent],['/api/order-status',orderStatus],['/api/stripe-webhook',stripeWebhook],['/api/tracking-config',trackingConfig]]);
const files=new Map([['/','index.html'],['/index.html','index.html'],['/lisinha.html','lisinha.html'],['/creme.html','creme.html'],['/spray.html','spray.html'],['/checkout.html','checkout.html'],['/pedido.html','public/pedido.html'],['/products/lisinha','lisinha.html'],['/products/popozuda-cream','creme.html'],['/products/spray-popozuda','spray.html']]);
const types={'.html':'text/html; charset=utf-8','.webp':'image/webp','.avif':'image/avif','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2','.css':'text/css','.js':'text/javascript','.json':'application/json'};
const port=Number(process.env.PORT||3000);
const htmlCache=new Map();
async function readJson(req){let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>65536)throw Error('Payload muito grande');chunks.push(chunk)}if(!chunks.length)return {};return JSON.parse(Buffer.concat(chunks).toString('utf8'))}
// Validate the database without initiating a payment or collecting customer data.
const probeIdentity=identity('checkout-health@popozuda.invalid','00000000000');
const probeToken='startup-'+Date.now()+'-'+Math.random();
const probeReservation=await reserve(probeIdentity,probeToken);
if(!probeReservation.eligible)throw Error('First purchase database validation failed');
await release(probeIdentity,probeReservation.hash);
console.log('First purchase database verified');
http.createServer(async(req,res)=>{
 res.status=function(code){this.statusCode=code;return this};
 res.json=function(obj){this.setHeader('Content-Type','application/json; charset=utf-8');this.end(JSON.stringify(obj));return this};
 res.send=function(data){this.end(data);return this};
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
 const url=new URL(req.url||'/','http://localhost');
 if(url.pathname==='/health')return res.status(200).json({ok:true,store:'popozuda'});
 const handler=handlers.get(url.pathname);
 if(handler){req.query=Object.fromEntries(url.searchParams);
  try{if(req.method==='POST'&&url.pathname!=='/api/stripe-webhook')req.body=await readJson(req);await handler(req,res)}
  catch(e){console.error('api_error',url.pathname,e?.message);if(!res.headersSent)res.status(400).json({error:'Não foi possível processar esta solicitação.'})}return;
 }
 if(req.method!=='GET'&&req.method!=='HEAD')return res.status(405).end();
 let target=files.get(url.pathname);
 if(!target&&url.pathname.startsWith('/media/')){const basename=path.basename(url.pathname);if(basename===url.pathname.slice('/media/'.length))target='media/'+basename}
 if(!target)return res.status(404).end('Página não encontrada');
 try{
   const ext=path.extname(target).toLowerCase();
   const isHtml=ext==='.html';
   let record=isHtml?htmlCache.get(target):null;
   if(!record){
     const plain=await fs.readFile(path.join(root,target));
     record={plain};
     if(isHtml){
       record.brotli=brotliCompressSync(plain,{params:{[zconstants.BROTLI_PARAM_QUALITY]:5}});
       record.gzip=gzipSync(plain,{level:6});
       record.etag='W/"'+createHash('sha256').update(plain).digest('hex').slice(0,20)+'"';
       htmlCache.set(target,record);
     }
   }
   res.setHeader('Content-Type',types[ext]||'application/octet-stream');
   res.setHeader('Cache-Control',isHtml?'public, max-age=0, must-revalidate':'public, max-age=31536000, immutable');
   if(isHtml){
     res.setHeader('Vary','Accept-Encoding');
     res.setHeader('ETag',record.etag);
     if(req.headers['if-none-match']===record.etag)return res.status(304).end();
   }
   let content=record.plain;
   if(isHtml){
     const accept=req.headers['accept-encoding']||'';
     if(accept.includes('br')){res.setHeader('Content-Encoding','br');content=record.brotli}
     else if(accept.includes('gzip')){res.setHeader('Content-Encoding','gzip');content=record.gzip}
   }
   res.setHeader('Content-Length',content.byteLength);
   if(req.method==='HEAD')res.end();else res.end(content);
 }catch(e){console.error('static.file',target,e?.code||e?.message);res.status(404).end('Arquivo não encontrado')}
}).listen(port,'0.0.0.0',()=>console.log('Popozuda listening on '+port));
