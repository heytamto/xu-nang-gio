import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const db=createClient(Deno.env.get('SUPABASE_URL') ?? '',Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',{auth:{persistSession:false}});
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const reply=(status:number,data:unknown)=>new Response(JSON.stringify(data),{status,headers});
Deno.serve(async req=>{
 if(req.method==='OPTIONS') return new Response(null,{status:204,headers});
 if(req.method!=='POST') return reply(405,{error:'Method not allowed'});
 try {
  const body=await req.json();
  const code=typeof body?.code==='string'?body.code.trim().toUpperCase():'';
  const phone=typeof body?.phone==='string'?body.phone.trim():'';
  if(!/^[A-Z0-9_-]{1,50}$/.test(code)||!/^0[0-9]{9}$/.test(phone)) return reply(400,{error:'Nhập mã đơn và số điện thoại hợp lệ'});
  const {data,error}=await db.rpc('xng_lookup_order_staging',{p_code:code,p_phone:phone});
  if(error) return reply(503,{error:'Tra cứu tạm thời không khả dụng'});
  if(data?.limited) return reply(429,{error:'Vui lòng thử lại sau'});
  return reply(200,{data:data?.order?[data.order]:[]});
 } catch {return reply(400,{error:'Yêu cầu không hợp lệ'});}
});
