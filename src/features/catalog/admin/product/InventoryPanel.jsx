import React, { useEffect, useState } from 'react';
import { supabase } from '../../../../infrastructure/supabase/supabaseClient';

function InventoryRow({ row, reload }) {
  const [balance,setBalance]=useState(row.balance ?? '');
  const [low,setLow]=useState(row.low_threshold);
  const [unit,setUnit]=useState(row.unit);
  const [factors,setFactors]=useState(row.factors);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  async function save(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const values=Object.fromEntries(row.weights.map(w=>[w.id,Number(factors[w.id])]));
      const {error}=await supabase.rpc('xng_inventory_save',{p_product:row.id,p_balance:Number(balance),p_low:Number(low),p_unit:unit,p_factors:values,p_revision:row.revision});
      if(error) throw error;
      await reload();
    } catch(e) {setError(e.message+' — tải lại nếu tồn kho vừa thay đổi.');} finally {setBusy(false);}
  }
  const field='w-full rounded-xl border border-stone-200 p-2 text-sm';
  return <form onSubmit={save} className="border border-stone-200 rounded-2xl p-3 space-y-3">
    <div className="flex justify-between gap-2"><strong>{row.name}</strong><span className="text-xs text-stone-500">{row.revision ? 'Đang theo dõi' : 'Chưa theo dõi'}</span></div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      <label>Tồn khả dụng<input className={field} type="number" required min="0" step="0.001" value={balance} onChange={e=>setBalance(e.target.value)}/></label>
      <label>Ngưỡng cảnh báo<input className={field} type="number" required min="0" step="0.001" value={low} onChange={e=>setLow(e.target.value)}/></label>
      <label>Đơn vị tồn<input className={field} required maxLength={30} value={unit} disabled={!!row.revision} onChange={e=>setUnit(e.target.value)}/></label>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{row.weights.map(w=><label key={w.id}>{w.label} — lượng trừ ({unit})<input className={field} type="number" required min="0.001" step="0.001" value={factors[w.id]??''} onChange={e=>setFactors(old=>({...old,[w.id]:e.target.value}))}/></label>)}</div>
    {error&&<p role="alert" className="text-red-700 text-xs">{error}</p>}
    <button disabled={busy} className="rounded-xl bg-amber-800 text-white px-4 py-2 text-sm disabled:opacity-50">{busy?'Đang lưu…':'Lưu tồn kho'}</button>
  </form>;
}
export default function InventoryPanel(){
  const [rows,setRows]=useState([]); const [error,setError]=useState(''); const [loading,setLoading]=useState(false); const [open,setOpen]=useState(false);
  async function reload(){setLoading(true);setError('');try{const {data,error}=await supabase.rpc('xng_inventory_list');if(error)throw error;setRows(data??[]);}catch(e){setError(e.message);}finally{setLoading(false);}}
  useEffect(()=>{if(open)reload();},[open]);
  return <section className="rounded-3xl bg-white border border-stone-200 p-4 space-y-3"><button type="button" className="font-bold" onClick={()=>setOpen(v=>!v)}>Tồn kho thực tế {open?'−':'+'}</button>{open&&<><p className="text-xs text-stone-500">Nhập lượng còn có thể bán (đã loại trừ đơn hiện có). Các quy cách dùng chung tồn; ví dụ 500g trừ 0.5 kg. Chưa cấu hình thì vẫn dùng trạng thái còn hàng cũ.</p><button type="button" onClick={reload} disabled={loading} className="text-sm underline">{loading?'Đang tải…':'Tải lại tồn kho'}</button>{error&&<p role="alert">{error}</p>}{rows.map(r=><InventoryRow key={`${r.id}:${r.revision}`} row={r} reload={reload}/>)}</>}</section>;
}
