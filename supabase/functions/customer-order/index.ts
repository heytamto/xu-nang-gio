import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {auth:{persistSession:false}});
const headers = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const reply = (status:number, data:unknown) => new Response(JSON.stringify(data), {status,headers});
Deno.serve(async req => {
 if (req.method==='OPTIONS') return new Response(null,{status:204,headers});
 if (req.method!=='POST') return reply(405,{error:'METHOD_NOT_ALLOWED'});
 let body;
 try { const raw=await req.text(); if(raw.length>12000) return reply(413,{error:'INVALID_INPUT'}); body=JSON.parse(raw); } catch {return reply(400,{error:'INVALID_INPUT'});}
 const action=body?.action, code=typeof body?.code==='string'?body.code.trim().toUpperCase():'', phone=typeof body?.phone==='string'?body.phone.trim():'';
 if(action==='search_summary') {
  const query=typeof body.query==='string'?body.query.trim().toUpperCase():'';
  const status=body.status, page=body.page, pageSize=body.pageSize;
  if((!/^0[0-9]{9}$/.test(query)&&!/^XNG[0-9]{6}-[A-Z0-9]{4}$/.test(query))||!['all','pending','confirmed','packing','shipping','completed','cancelled','bombed'].includes(status)||!Number.isSafeInteger(page)||page<1||page>100000||![6,12,24].includes(pageSize)) return reply(400,{error:'INVALID_INPUT'});
  try {
   const {data,error}=await db.rpc('xng_order_search_summary',{p_query:query,p_status:status,p_page:page,p_page_size:pageSize});
   if(error||!data) return reply(503,{error:'TEMPORARILY_UNAVAILABLE'});
   if(data.error) return reply(data.error==='RATE_LIMITED'?429:400,{error:data.error});
   return reply(200,data);
  } catch {return reply(503,{error:'TEMPORARILY_UNAVAILABLE'});}
 }
 if(action==='summary') {
  const status=body.status, page=body.page, pageSize=body.pageSize;
  if(!/^0[0-9]{9}$/.test(phone)||!['all','pending','confirmed','packing','shipping','completed','cancelled','bombed'].includes(status)||!Number.isSafeInteger(page)||page<1||page>100000||![6,12,24].includes(pageSize)) return reply(400,{error:'INVALID_INPUT'});
  try {
   const {data,error}=await db.rpc('xng_phone_order_summary',{p_phone:phone,p_status:status,p_page:page,p_page_size:pageSize});
   if(error||!data) return reply(503,{error:'TEMPORARILY_UNAVAILABLE'});
   if(data.error) return reply(data.error==='RATE_LIMITED'?429:400,{error:data.error});
   return reply(200,data);
  } catch {return reply(503,{error:'TEMPORARILY_UNAVAILABLE'});}
 }
 if(action==='voucher') {
  if(!code || code.length>50 || /[\x00-\x1f\x7f]/.test(code) || !Number.isSafeInteger(body.subtotal) || body.subtotal<0 || (code.startsWith('XNG') && !/^0[0-9]{9}$/.test(phone))) return reply(400,{error:'INVALID_INPUT'});
  try {
   const {data,error}=await db.rpc('xng_voucher_quote_staging',{p_code:code,p_phone:phone||null,p_subtotal:body.subtotal});
   if(error||!data) return reply(503,{error:'TEMPORARILY_UNAVAILABLE'});
   if(data.error) return reply(({INVALID_INPUT:400,RATE_LIMITED:429,VOUCHER_NOT_AVAILABLE:409} as Record<string,number>)[data.error]??503,{error:data.error});
   return reply(200,data);
  } catch {return reply(503,{error:'TEMPORARILY_UNAVAILABLE'});}
 }
 if(!['lookup','cancel','review'].includes(action)||!/^[A-Z0-9_-]{1,50}$/.test(code)||!/^0[0-9]{9}$/.test(phone)) return reply(400,{error:'INVALID_INPUT'});
 const input=action==='cancel'?{reason:typeof body.reason==='string'?body.reason:''}:action==='review'?{rating:body.rating,content:typeof body.content==='string'?body.content:''}:{};
 try {
  const {data,error}=await db.rpc('xng_customer_action_staging',{p_action:action,p_code:code,p_phone:phone,p_input:input});
  if(error||!data) return reply(503,{error:'TEMPORARILY_UNAVAILABLE'});
  if(data.error) return reply(({INVALID_INPUT:400,NOT_FOUND:404,RATE_LIMITED:429,CANCEL_NOT_ALLOWED:409,REVIEW_NOT_ALLOWED:409,ALREADY_REVIEWED:409} as Record<string,number>)[data.error]??503,{error:data.error});
  return reply(200,data);
 } catch {return reply(503,{error:'TEMPORARILY_UNAVAILABLE'});}
});
