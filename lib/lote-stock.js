import pg from 'pg';
const {Pool}=pg;
let pool,initializing;
function database(){
 if(!process.env.DATABASE_URL)return null;
 if(!pool)pool=new Pool({connectionString:process.env.DATABASE_URL,max:3,connectionTimeoutMillis:8000,idleTimeoutMillis:30000});
 return pool;
}
async function initialize(){
 const db=database();if(!db)return false;
 if(!initializing)initializing=(async()=>{
   await db.query("CREATE TABLE IF NOT EXISTS popozuda_lote_stock (sku text PRIMARY KEY, remaining_units integer NOT NULL CHECK (remaining_units >= 0), updated_at timestamptz NOT NULL DEFAULT now())");
   await db.query("CREATE TABLE IF NOT EXISTS popozuda_lote_sales (payment_intent text PRIMARY KEY, sku text NOT NULL, quantity integer NOT NULL CHECK (quantity > 0), created_at timestamptz NOT NULL DEFAULT now())");
   return true;
 })().catch(e=>{initializing=null;throw e});
 return initializing;
}
// No inventory estimate is assumed. A verified remaining_units must be set by the merchant.
export async function getLisinhaStock(){
 if(!database())return {known:false,soldOut:false};
 try{
  await initialize();
  const r=await database().query("SELECT remaining_units,updated_at FROM popozuda_lote_stock WHERE sku='lisinha'");
  if(r.rowCount===0)return {known:false,soldOut:false};
  return {known:true,soldOut:r.rows[0].remaining_units===0,remainingUnits:r.rows[0].remaining_units,updatedAt:r.rows[0].updated_at};
 }catch(e){console.error("stock.read",e.message);return {known:false,soldOut:false};}
}
export function purchasedLisinhaQuantity(pi){
 let items;try{items=JSON.parse(pi?.metadata?.items||'[]')}catch{return 0}
 if(!Array.isArray(items))return 0;
 return items.filter(x=>x?.id==='lisinha'&&Number.isSafeInteger(x.quantity)&&x.quantity>0).reduce((sum,x)=>sum+x.quantity,0);
}
export async function recordLisinhaSale(pi){
 const quantity=purchasedLisinhaQuantity(pi);
 if(!quantity||pi?.livemode!==true||pi?.status!=='succeeded')return {recorded:false};
 await initialize();const db=database();if(!db)throw Error("Stock database missing");
 const client=await db.connect();
 try{
  await client.query('BEGIN');
  const inserted=await client.query("INSERT INTO popozuda_lote_sales(payment_intent,sku,quantity) VALUES($1,'lisinha',$2) ON CONFLICT (payment_intent) DO NOTHING RETURNING payment_intent",[pi.id,quantity]);
  if(inserted.rowCount){
    await client.query("UPDATE popozuda_lote_stock SET remaining_units=GREATEST(0,remaining_units-$1),updated_at=now() WHERE sku='lisinha'",[quantity]);
  }
  await client.query('COMMIT');
  return {recorded:!!inserted.rowCount};
 }catch(e){try{await client.query('ROLLBACK')}catch{}throw e}finally{client.release();}
}
