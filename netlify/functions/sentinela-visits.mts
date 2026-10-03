import {getStore} from '@netlify/blobs';
import {createHash,timingSafeEqual} from 'node:crypto';

const zone='America/Sao_Paulo';
function day(date=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);}
function reply(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export default async function(req:Request){
 try{
  const url=new URL(req.url),store=getStore({name:'sentinela-visits-v1',consistency:'strong'});
  if(req.method==='GET'){
   const expected=process.env.SENTINELA_ANALYTICS_READ_KEY||'',provided=(req.headers.get('authorization')||'').replace(/^Bearer /,'');
   if(!/^[a-f0-9]{64}$/.test(provided))return reply({error:'Unauthorized'},401);
   if(!expected)return reply({error:'Analytics configuration unavailable'},503);
   if(expected.length!==provided.length||!timingSafeEqual(Buffer.from(expected),Buffer.from(provided)))return reply({error:'Unauthorized'},401);
   let start=await store.get('meta/start',{type:'json'}) as {date:string}|null;
   if(!start){start={date:day()};await store.setJSON('meta/start',start,{onlyIfNew:true});start=await store.get('meta/start',{type:'json'}) as {date:string};}
   const days=await Promise.all(Array.from({length:7},async(_,i)=>{const date=day(new Date(Date.now()-(6-i)*86400000));if(date<start.date)return {date,devices:null};const {blobs}=await store.list({prefix:`days/${date}/`});return {date,devices:blobs.length};}));
   return reply({timezone:zone,started_at:start.date,days,updated_at:Date.now()});
  }
  if(req.method!=='POST')return reply({error:'Method not allowed'},405);
  if(req.headers.get('origin')!==url.origin||req.headers.get('sec-fetch-site')==='cross-site')return reply({error:'Forbidden'},403);
  if(/bot|crawler|spider|headless|lighthouse|uptime|sentinela/i.test(req.headers.get('user-agent')||''))return new Response(null,{status:204});
  if(req.headers.get('sec-gpc')==='1'||req.headers.get('dnt')==='1')return new Response(null,{status:204});
  if(Number(req.headers.get('content-length')||0)>512)return reply({error:'Too large'},413);
  const raw=await req.text();if(raw.length>512)return reply({error:'Too large'},413);
  let body:{id?:string};try{body=JSON.parse(raw);}catch{return reply({error:'Invalid JSON'},400);}
  if(typeof body.id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.id))return reply({error:'Invalid ID'},400);
  const date=day(),hash=createHash('sha256').update(date+':'+body.id).digest('hex');
  await store.setJSON('meta/start',{date},{onlyIfNew:true});
  await store.set(`days/${date}/${hash}`,'1',{onlyIfNew:true});
  return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}});
 }catch{return reply({error:'Analytics unavailable'},503);}
}
