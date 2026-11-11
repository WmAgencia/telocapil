import {getLisinhaStock} from '../lib/lote-stock.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store, max-age=0');
 if(req.method!=='GET')return res.status(405).json({error:'Método não permitido'});
 const stock=await getLisinhaStock();
 return res.status(200).json({known:stock.known===true,soldOut:stock.known===true&&stock.soldOut===true});
}
