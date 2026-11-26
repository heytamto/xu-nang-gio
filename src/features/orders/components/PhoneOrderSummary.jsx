import React,{useState,useRef} from 'react';
import {Search,Loader2} from 'lucide-react';
import {supabase} from '../../../infrastructure/supabase/supabaseClient';
import {fetchOrderSearchSummary} from '../services/phoneOrderSummaryApi';
import {LookupOrderFilters,LookupOrderPagination} from './LookupOrderPagination';
import {LOOKUP_STATUS_FILTERS} from '../utils/lookupOrderPagination';
import {ORDER_STATUS_MAP} from '../constants/orderStatus';
export default function PhoneOrderSummary({onDetail,initialQuery=''}) {
 const [phone,setPhone]=useState(initialQuery),[result,setResult]=useState(null),[status,setStatus]=useState('all'),[size,setSize]=useState(6),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const lock=useRef(false);
 async function load(nextStatus='all',page=1,pageSize=size) {
  if(lock.current)return;lock.current=true;setLoading(true);setError('');
  try {const next=await fetchOrderSearchSummary(supabase,{query:phone,status:nextStatus,page,pageSize});setResult(next);setStatus(nextStatus);setSize(pageSize);}
  catch(e){setError(e.message);setResult(null);} finally{lock.current=false;setLoading(false);}
 }
 return <div className="space-y-4">
  <form onSubmit={e=>{e.preventDefault();void load('all',1,size);}} className="flex flex-col sm:flex-row gap-3">
   <input type="text" autoComplete="off" aria-label="Số điện thoại hoặc mã đơn" placeholder="Số điện thoại hoặc mã XNG..." required value={phone} disabled={loading} onChange={e=>{setPhone(e.target.value);setResult(null);setError('');}} className="flex-1 min-w-0 h-12 rounded-2xl border border-stone-200 bg-stone-50 px-4"/>
   <button disabled={loading} className="h-12 rounded-2xl bg-amber-500 text-stone-950 font-black px-8 flex items-center justify-center gap-2 disabled:opacity-50">{loading?<Loader2 className="w-5 h-5 animate-spin"/>:<Search className="w-5 h-5"/>} Tra cứu ngay</button>
  </form>
  <p className="text-sm text-stone-500">Chỉ hiển thị số lượng và trạng thái đơn. Xác minh mã đơn và số điện thoại để xem chi tiết, hủy hoặc đánh giá.</p>
  {error&&<p role="alert" className="text-sm text-rose-700">{error}</p>}
  {result&&<div className="space-y-3" aria-busy={loading}>
   <p className="text-sm font-bold">Tìm thấy {result.counts.all} đơn hàng phù hợp</p>
   <fieldset disabled={loading} className="min-w-0 space-y-3 disabled:opacity-60">
    <LookupOrderFilters status={status} counts={result.counts} pageSize={size} onStatusChange={v=>load(v,1,size)} onPageSizeChange={v=>load(status,1,v)}/>
    {result.total===0?<p className="text-sm text-stone-500 p-4">Không có đơn hàng phù hợp.</p>:<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{result.items.map((r,i)=><div key={result.start+i} className="rounded-2xl border border-stone-200 p-4 flex items-center justify-between gap-3"><span className="font-bold text-sm">Đơn thứ {result.start+i}</span><span className={`rounded-full border px-3 py-1 text-xs font-bold ${ORDER_STATUS_MAP[r.status]?.bg||''}`}>{LOOKUP_STATUS_FILTERS.find(s=>s.value===r.status)?.label}</span></div>)}</div>}
    <LookupOrderPagination result={result} onPageChange={p=>load(status,p,size)}/>
   </fieldset>
   {result.counts.all>0&&<button type="button" disabled={loading} onClick={()=>onDetail(phone.trim().toUpperCase())} className="rounded-xl border border-amber-800 text-amber-800 font-bold px-4 py-2 text-sm">Xác minh để xem chi tiết</button>}
  </div>}
 </div>;
}
