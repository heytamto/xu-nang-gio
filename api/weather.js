import { randomUUID } from 'node:crypto';

function normalize(d,c) {
  const w=d.current, day=d.forecast?.forecastday?.[0]?.day;
  if (!Number.isFinite(w?.temp_c)||!Number.isFinite(w?.humidity)||!Number.isFinite(w?.wind_kph)||!Number.isFinite(day?.mintemp_c)||!Number.isFinite(day?.maxtemp_c)||!Number.isFinite(day?.daily_chance_of_rain)) throw new Error('Invalid provider response');
  return {enabled:true,latitude:c.latitude,longitude:c.longitude,timezone:c.timezone,current:{temperature_2m:w.temp_c,relative_humidity_2m:w.humidity,wind_speed_10m:w.wind_kph,conditionCode:w.condition?.code,is_day:w.is_day,time:w.last_updated},daily:{temperature_2m_min:[day.mintemp_c],temperature_2m_max:[day.maxtemp_c],precipitation_probability_max:[day.daily_chance_of_rain]},fetchedAt:new Date().toISOString()};
}
export function createWeatherHandler({fetcher=fetch,env=process.env,token=randomUUID,now=Date.now}={}) {
  let pending;
  async function rpc(name,body) {
    const key=env.SUPABASE_SERVICE_ROLE_KEY;
    if(!env.SUPABASE_URL||!key) throw new Error('Missing backend config');
    const r=await fetcher(`${env.SUPABASE_URL.replace(/\/$/,'')}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(4000)});
    if(!r.ok) throw new Error('Cache RPC failed'); return r.json();
  }
  function cached(r) {
    if(!r.payload||!(Date.parse(r.staleUntil)>now())) return {status:200,body:{enabled:true,pending:true,config:r.config},ttl:5};
    const fresh=r.state==='fresh';
    const until=Date.parse(fresh?r.expiresAt:r.staleUntil);
    return {status:200,body:{...r.payload,config:r.config,stale:!fresh,staleUntil:r.staleUntil},ttl:Math.max(0,Math.min(fresh?60:10,Math.floor((until-now())/1000)))};
  }
  async function load() {
    const id=token();
    const r=await rpc('xng_weather_cache_claim',{p_token:id});
    if(r.state==='disabled') return {status:200,body:{enabled:false},ttl:30};
    if(r.state!=='claimed') return cached(r);
    try {
      const c=r.config;
      if(!env.WEATHERAPI_KEY||!Number.isFinite(c.latitude)||!Number.isFinite(c.longitude)) throw new Error('Invalid config');
      const params=new URLSearchParams({key:env.WEATHERAPI_KEY,q:`${c.latitude},${c.longitude}`,days:'1',aqi:'no',alerts:'no'});
      const response=await fetcher(`https://api.weatherapi.com/v1/forecast.json?${params}`,{signal:AbortSignal.timeout(8000)});
      if(!response.ok) throw new Error('Provider unavailable');
      const payload=normalize(await response.json(),c);
      if(await rpc('xng_weather_cache_complete',{p_key:r.key,p_token:id,p_payload:payload})!==true) return cached(r);
      return {status:200,body:{...payload,config:c,stale:false,staleUntil:new Date(now()+7200000).toISOString()},ttl:60};
    } catch {
      try {await rpc('xng_weather_cache_fail',{p_key:r.key,p_token:id});} catch { /* lease expires */ }
      return cached(r);
    }
  }
  return async function handler(req,res){
    if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed'});}
    // Reject query variants so callers cannot deliberately fragment the CDN cache.
    if(req.url?.includes('?')){res.setHeader('Cache-Control','no-store');return res.status(400).json({error:'Unexpected query'});}
    try {
      pending ??= load().finally(()=>{pending=undefined;});
      const result=await pending;
      res.setHeader('Cache-Control',result.ttl?`public, max-age=0, s-maxage=${result.ttl}, must-revalidate`:'no-store');
      return res.status(result.status).json(result.body);
    } catch {res.setHeader('Cache-Control','no-store');return res.status(503).json({error:'Weather unavailable'});}
  };
}
export default createWeatherHandler();
