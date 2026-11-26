import React, { useState } from 'react';
import ModalPortal from '../../../shared/components/ModalPortal';
import { supabase } from '../../../infrastructure/supabase/supabaseClient';
import { customerOrderAction } from '../services/customerOrderApi';
export default function VerifiedReviewModal({order, phone, onClose, onSuccess}) {
  const [rating,setRating]=useState(5), [content,setContent]=useState(''), [busy,setBusy]=useState(false), [error,setError]=useState('');
  async function submit(e) { e.preventDefault(); if(busy) return; setBusy(true); setError(''); try { await customerOrderAction(supabase,'review',order.code,phone,{rating,content:content.trim()}); onSuccess(order.code); } catch(err) {setError(err.message);} finally {setBusy(false);} }
  return (
    <ModalPortal onClose={onClose} closeOnEscape={!busy}><div className="fixed inset-0 z-[9999] bg-stone-950/70 grid place-items-center p-4"><form role="dialog" aria-modal="true" aria-label="Đánh giá đơn hàng" onSubmit={submit} className="bg-white rounded-3xl p-6 w-full max-w-lg space-y-4"><h2 className="font-black text-xl">Đánh giá {order.code}</h2><div className="flex gap-2">{[1,2,3,4,5].map(n=><button key={n} type="button" aria-label={`${n} sao`} aria-pressed={rating===n} onClick={()=>setRating(n)} className={`text-3xl ${n<=rating?'text-amber-500':'text-stone-300'}`}>★</button>)}</div><textarea aria-label="Nội dung đánh giá" required maxLength={2000} value={content} onChange={e=>setContent(e.target.value)} className="w-full rounded-xl border p-3"/><p className="text-sm text-stone-600">Đánh giá văn bản sẽ được nhà vườn duyệt. Nếu đủ điều kiện, có thể nhập mã đơn làm voucher cho lần mua sau. Chưa hỗ trợ ảnh trong bản thử nghiệm.</p>{error&&<p role="alert" className="text-red-700">{error}</p>}<div className="flex gap-2"><button type="button" disabled={busy} onClick={onClose} className="border rounded-xl px-4 py-2">Đóng</button><button disabled={busy||!content.trim()} className="bg-amber-800 text-white rounded-xl px-4 py-2">{busy?'Đang gửi…':'Gửi đánh giá'}</button></div></form></div>
    </ModalPortal>
  );
}
