import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../infrastructure/supabase/supabaseClient';
export const weatherConfigKey=['weather-config'];
export function useWeatherConfig(){return useQuery({queryKey:weatherConfigKey,staleTime:30000,queryFn:async()=>{const {data,error}=await supabase.rpc('xng_public_weather');if(error)throw error;return data;},retry:1});}
export async function saveWeatherConfig(value){const {error}=await supabase.rpc('xng_save_weather',{p_value:value});if(error)throw error;}
export function useWeather(){return useQuery({queryKey:['weather'],staleTime:q=>q.state.data?.pending?30000:300000,refetchInterval:q=>q.state.data?.pending?30000:300000,retry:1,queryFn:async({signal})=>{const r=await fetch('/api/weather',{signal});if(!r.ok)throw new Error(`Weather API HTTP ${r.status}`);if(!r.headers.get('content-type')?.includes('application/json'))throw new Error('Weather API trả về HTML hoặc sai MIME; kiểm tra route /api/weather');const data=await r.json();if(typeof data?.enabled!=='boolean')throw new Error('Weather API trả về dữ liệu không hợp lệ');return data;}});}
