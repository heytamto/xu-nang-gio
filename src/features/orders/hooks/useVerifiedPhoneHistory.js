import { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { fetchVerifiedOrderHistory, normalizeVietnamPhone } from '../services/verifiedOrderHistoryApi';
// Deliberately independent from the Google staff session. Never persist an OTP session or history.
export function useVerifiedPhoneHistory({enabled,status,page,pageSize,refreshKey}) {
  const clientRef=useRef(null);
  const [verifiedPhone,setVerifiedPhone]=useState('');
  const [sentPhone,setSentPhone]=useState('');
  const [response,setResult]=useState(null);
  const resultKey=JSON.stringify([verifiedPhone,status,page,pageSize,refreshKey]);
  const result=response?.key===resultKey?response.data:null;
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const busyRef=useRef(false);
  const generation=useRef(0);
  function getClient(){
    if(!clientRef.current) clientRef.current=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY,{auth:{storageKey:'xng-customer-otp-session',persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    return clientRef.current;
  }
  function reset(){
    generation.current++; busyRef.current=false;
    const old=clientRef.current; clientRef.current=null;
    if(old) void old.auth.signOut({scope:'local'}).catch(()=>{});
    setVerifiedPhone('');setSentPhone('');setResult(null);setError('');setLoading(false);
  }
  useEffect(()=>{if(!enabled) reset();},[enabled]);
  useEffect(()=>()=>{generation.current++;const old=clientRef.current;clientRef.current=null;if(old)void old.auth.signOut({scope:'local'}).catch(()=>{});},[]);
  useEffect(()=>{if(!verifiedPhone)return;const timer=setTimeout(()=>reset(),15*60*1000);return()=>clearTimeout(timer);},[verifiedPhone]);
  async function sendOtp(raw){
    if(!enabled||busyRef.current)return;const id=++generation.current;busyRef.current=true;setLoading(true);setError('');setSentPhone('');setVerifiedPhone('');setResult(null);
    try{const {international,local}=normalizeVietnamPhone(raw);const {error:e}=await getClient().auth.signInWithOtp({phone:international});if(e)throw new Error('Không thể gửi mã OTP. Kiểm tra cấu hình SMS hoặc thử lại sau.');if(id===generation.current)setSentPhone(local);}
    catch(e){if(id===generation.current)setError(e.message);}finally{if(id===generation.current){busyRef.current=false;setLoading(false);}}
  }
  async function verifyOtp(token){
    if(!enabled||busyRef.current||!sentPhone)return;const id=++generation.current;busyRef.current=true;setLoading(true);setError('');
    try{if(!/^[0-9]{6}$/.test(String(token).trim()))throw new Error('Vui lòng nhập 6 chữ số OTP.');const {international}=normalizeVietnamPhone(sentPhone);const {data,error:e}=await getClient().auth.verifyOtp({phone:international,token:String(token).trim(),type:'sms'});if(e||!data?.session)throw new Error('OTP không đúng hoặc đã hết hạn.');if(id===generation.current)setVerifiedPhone(sentPhone);}
    catch(e){if(id===generation.current)setError(e.message);}finally{if(id===generation.current){busyRef.current=false;setLoading(false);}}
  }
  useEffect(()=>{
    if(!enabled||!verifiedPhone||!clientRef.current)return;
    let active=true;const id=generation.current;setResult(null);setLoading(true);setError('');
    fetchVerifiedOrderHistory(clientRef.current,{status,page,pageSize}).then(data=>{if(active&&id===generation.current)setResult({key:resultKey,data});}).catch(e=>{if(active&&id===generation.current)setError(e.message);}).finally(()=>{if(active&&id===generation.current)setLoading(false);});
    return()=>{active=false;};
  },[enabled,verifiedPhone,status,page,pageSize,refreshKey]);
  return {verifiedPhone,sentPhone,result,loading,error,sendOtp,verifyOtp,reset};
}
