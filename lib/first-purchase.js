import crypto from 'node:crypto';
import pg from 'pg';
const {Pool}=pg;
let pool,readyPromise;
function db(){
 const key=process.env.PROMO_HASH_SECRET||'';
 if(!process.env.DATABASE_URL||key.length<48)throw Error('Promoção não configurada');
 if(!pool)pool=new Pool({connectionString:process.env.DATABASE_URL,max:5,connectionTimeoutMillis:8000,idleTimeoutMillis:30000});
 return pool;
}
function sha(kind,val){return crypto.createHmac('sha256',process.env.PROMO_HASH_SECRET).update(kind+':'+val).digest('hex')}
export function identity(email,cpf){
 db();let c=String(cpf||'').replace(/\D/g,''),e=String(email||'').trim().toLowerCase();
 if(c.length!==11||!e.includes('@'))throw Error('Identificação inválida');
 return{cpfKey:sha('cpf',c),emailKey:sha('email',e)};
}
export function tokenHash(token){db();return sha('token',String(token||''))}
async function initialize(){
 if(!readyPromise)readyPromise=(async()=>{
  await db().query("CREATE TABLE IF NOT EXISTS popozuda_first_purchase (cpf_key text PRIMARY KEY,email_key text NOT NULL UNIQUE,token_key text NOT NULL,payment_intent text UNIQUE,status text NOT NULL CHECK (status IN ('reserved','paid')),reserved_until timestamptz,paid_at timestamptz,updated_at timestamptz NOT NULL DEFAULT now())");
 })().catch(err=>{readyPromise=null;throw err});
 await readyPromise;
}
async function lock(client,ident){
 for(const key of [ident.cpfKey,ident.emailKey].sort())await client.query('SELECT pg_advisory_xact_lock(hashtext($1)::bigint)',[key]);
}
export async function reserve(ident,token){
 await initialize();const hash=tokenHash(token),client=await db().connect();
 try{
  await client.query('BEGIN');await lock(client,ident);
  const found=await client.query("SELECT cpf_key,email_key,token_key,payment_intent,status,(reserved_until>now()) AS active FROM popozuda_first_purchase WHERE cpf_key=$1 OR email_key=$2 FOR UPDATE",[ident.cpfKey,ident.emailKey]);
  const rows=found.rows,current=rows[0];
  if(current?.active&&current.token_key!==hash){
    await client.query('COMMIT');return{eligible:false,hash,pending:true};
  }
  if(rows.some(r=>r.status==='paid')||rows.length>1){
    await client.query('COMMIT');return{eligible:false,hash};
  }
  if(current?.active&&current.token_key===hash){
    await client.query('COMMIT');return{eligible:true,hash,reusedIntent:current.payment_intent||null,waiting:!current.payment_intent};
  }
  if(current){
    await client.query("UPDATE popozuda_first_purchase SET cpf_key=$1,email_key=$2,token_key=$3,payment_intent=NULL,status='reserved',reserved_until=now()+interval '35 minutes',paid_at=NULL,updated_at=now() WHERE cpf_key=$4",
    [ident.cpfKey,ident.emailKey,hash,current.cpf_key]);
  }else{
    await client.query("INSERT INTO popozuda_first_purchase (cpf_key,email_key,token_key,status,reserved_until) VALUES ($1,$2,$3,'reserved',now()+interval '35 minutes')",
    [ident.cpfKey,ident.emailKey,hash]);
  }
  await client.query('COMMIT');return{eligible:true,hash};
 }catch(e){try{await client.query('ROLLBACK')}catch{}throw e}finally{client.release()}
}
export async function attach(ident,hash,intent){
 await initialize();
 const r=await db().query("UPDATE popozuda_first_purchase SET payment_intent=$1,updated_at=now() WHERE cpf_key=$2 AND email_key=$3 AND token_key=$4 AND status='reserved' AND reserved_until>now()",
 [intent,ident.cpfKey,ident.emailKey,hash]);
 if(r.rowCount!==1)throw Error('Reserva de desconto expirada');
}
export async function release(ident,hash){
 try{await initialize();await db().query("DELETE FROM popozuda_first_purchase WHERE cpf_key=$1 AND email_key=$2 AND token_key=$3 AND status='reserved' AND payment_intent IS NULL",
 [ident.cpfKey,ident.emailKey,hash]);}catch(e){console.error('promo.release',e.message)}
}
export async function markPaid(pi){
 const meta=pi.metadata||{},cpfKey=meta.cpf_key,emailKey=meta.email_key;
 if(!/^[a-f0-9]{64}$/.test(cpfKey||'')||!/^[a-f0-9]{64}$/.test(emailKey||''))return;
 await initialize();const client=await db().connect();
 try{
  await client.query('BEGIN');await lock(client,{cpfKey,emailKey});
  const rows=(await client.query("SELECT cpf_key,status,payment_intent FROM popozuda_first_purchase WHERE cpf_key=$1 OR email_key=$2 FOR UPDATE",[cpfKey,emailKey])).rows;
  if(rows.length){
   for(const row of rows)await client.query("UPDATE popozuda_first_purchase SET status='paid',payment_intent=COALESCE(payment_intent,$1),reserved_until=NULL,paid_at=COALESCE(paid_at,now()),updated_at=now() WHERE cpf_key=$2",[pi.id,row.cpf_key]);
  }else{
   await client.query("INSERT INTO popozuda_first_purchase (cpf_key,email_key,token_key,payment_intent,status,paid_at) VALUES ($1,$2,$3,$4,'paid',now())",[cpfKey,emailKey,'completed:'+pi.id,pi.id]);
  }
  await client.query('COMMIT');
 }catch(e){try{await client.query('ROLLBACK')}catch{}throw e}finally{client.release()}
}
