import React,{useEffect,useState} from 'react';
import { ClipboardList, ShoppingBag, Wallet, PackageCheck, Clock, Boxes, AlertTriangle, Mail, RefreshCw, CirclePause, CirclePlay } from 'lucide-react';
import {supabase} from '../../../infrastructure/supabase/supabaseClient';
export default function OperationsPanel({setConfirmModalConfig}){
 const [data,setData]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[refreshing,setRefreshing]=useState(false);
 async function refresh(){setRefreshing(true);try{const {data,error}=await supabase.rpc('xng_operations_summary');if(error)throw error;setData(data);setError('');}catch(e){setError(e.message);}finally{setRefreshing(false);}}
 useEffect(()=>{refresh();const timer=setInterval(refresh,30000);return()=>clearInterval(timer);},[]);
 function toggle(){
  if(!data||busy||error)return;
  const nextOpen=!data.accepting;
  setConfirmModalConfig({
   title:nextOpen?'Mở lại nhận đơn':'Tạm ngừng nhận đơn',
   message:nextOpen?'Khách hàng có thể đặt đơn mới trở lại.':'Khách hàng sẽ không thể tạo đơn mới. Các đơn hiện tại vẫn được xử lý bình thường.',
   isDanger:!nextOpen,
   confirmLabel:nextOpen?'Mở lại':'Tạm ngừng',
   onConfirm:()=>saveCheckoutState(nextOpen)
  });
 }
 async function saveCheckoutState(nextOpen){
  setBusy(true);
  try{const {error}=await supabase.rpc('xng_set_checkout_open',{p_open:nextOpen});if(error)throw error;await refresh();}catch(e){setError(e.message);}finally{setBusy(false);}
 }
 const cards = [
  {key:'pending',label:'Chờ xác nhận',Icon:ShoppingBag,tone:'bg-amber-100 text-amber-800'},
  {key:'payment',label:'Chờ đối soát',Icon:Wallet,tone:'bg-blue-100 text-blue-700'},
  {key:'packing',label:'Cần xử lý kho',Icon:PackageCheck,tone:'bg-emerald-100 text-emerald-800'},
  {key:'overdue',label:'Chờ xác nhận >24h',Icon:Clock,tone:'bg-rose-100 text-rose-700',warning:true},
  {key:'low_stock',label:'Tồn thấp',Icon:Boxes,tone:'bg-orange-100 text-orange-800',warning:true},
  {key:'email_failed',label:'Email thất bại',Icon:AlertTriangle,tone:'bg-rose-100 text-rose-700',warning:true},
  {key:'email_delayed',label:'Email chờ >15 phút',Icon:Mail,tone:'bg-amber-100 text-amber-800',warning:true},
 ];
 return (
  <section className="bg-white border border-stone-200/90 rounded-3xl shadow-2xs overflow-hidden font-sans">
   <div className="px-5 py-4 border-b border-stone-100 flex flex-wrap justify-between items-center gap-3 bg-gradient-to-r from-stone-50/60 to-white">
    <div className="flex items-center gap-3 min-w-0">
     <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0"><ClipboardList className="w-5 h-5" aria-hidden="true" /></div>
     <div><h3 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">Công việc cần xử lý</h3><p className="text-xs text-stone-500 font-medium mt-0.5">Theo dõi tình trạng vận hành cửa hàng</p></div>
    </div>
    <div className="flex flex-wrap items-center gap-2">
    <button type="button" disabled={busy||refreshing||!data||!!error} onClick={toggle} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs sm:text-sm font-bold transition-colors disabled:opacity-50 cursor-pointer ${data?.accepting?'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100':'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'}`}>
     {data?.accepting?<CirclePause className="w-4 h-4 shrink-0" aria-hidden="true"/>:<CirclePlay className="w-4 h-4 shrink-0" aria-hidden="true"/>}
     {busy?'Đang cập nhật…':data?(data.accepting?'Đang nhận đơn · Tạm ngừng':'Đang tạm ngừng · Mở lại'):'Đang kiểm tra…'}
    </button>
    <button type="button" onClick={refresh} disabled={refreshing||busy} title="Cập nhật dữ liệu" aria-label="Cập nhật dữ liệu" className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-100 px-3 py-2 text-xs sm:text-sm font-bold text-stone-700 hover:bg-stone-200 transition-colors disabled:opacity-50 cursor-pointer">
     <RefreshCw className={`w-4 h-4 shrink-0 ${refreshing?'animate-spin':''}`} aria-hidden="true"/>
     <span>Cập nhật</span>
    </button>
    </div>
   </div>
   {error&&<p role="alert" className="mx-4 mt-3 text-red-700 text-xs">{error}</p>}
   {data&&<div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4">{cards.map(({key,label,Icon,tone,warning})=>{
    const count=data[key];
    return <div key={key} className="rounded-2xl bg-stone-50/70 border border-stone-100 p-3 flex items-center gap-3 min-w-0">
     <div className={`w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl flex items-center justify-center ${Number(count)===0?'bg-stone-100 text-stone-400':tone}`}><Icon className="w-5 h-5" aria-hidden="true"/></div>
     <div className="min-w-0"><strong className={`block text-xl font-black font-mono tabular-nums ${warning&&Number(count)>0?'text-rose-700':'text-stone-900'}`}>{count??'—'}</strong><span className="block text-xs text-stone-600 font-medium break-words">{label}</span></div>
    </div>;
   })}</div>}
   <div className="px-5 py-3 border-t border-stone-100 bg-stone-50/50"><span className="text-xs text-stone-500">Tự động cập nhật mỗi 30 giây</span></div>
  </section>
 );
}
