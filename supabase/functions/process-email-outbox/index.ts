import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const url = Deno.env.get('SUPABASE_URL') ?? '';
const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const secret = Deno.env.get('XNG_EMAIL_WORKER_SECRET') ?? '';
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const reply = (status: number, data: unknown) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
Deno.serve(async req => {
  if (req.method !== 'POST') return reply(405, {error:'Method not allowed'});
  if (!secret || req.headers.get('x-xng-worker-secret') !== secret) return reply(403,{error:'Forbidden'});
  const {data: jobs,error} = await db.rpc('xng_claim_email_jobs',{p_limit:5});
  if (error) return reply(503,{error:'Queue unavailable'});
  let finished=0, failed=0;
  for (const job of jobs ?? []) {
    let success=false;
    try {
      const res=await fetch(`${url}/functions/v1/send-order-email`,{method:'POST',headers:{'Content-Type':'application/json','x-xng-worker-secret':secret},body:JSON.stringify({event_id:job.id,order_code:job.order_code,event_type:job.event_type}),signal:AbortSignal.timeout(15000)});
      success=res.ok && (await res.json()).success===true;
    } catch { /* lease and retry protect against network errors */ }
    const result=await db.rpc('xng_finish_email_job',{p_id:job.id,p_lease:job.lease_token,p_success:success});
    if (success && !result.error && result.data===true) finished++; else failed++;
  }
  return reply(200,{finished,failed});
});
