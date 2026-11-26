import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../infrastructure/supabase/supabaseClient';
import { quoteCheckoutVoucher } from '../../vouchers/services/voucherQuoteApi';
export function useCheckoutVoucherState() {
  const [voucherInput,setVoucherInput]=useState('');
  const [appliedVouchers,setAppliedVouchers]=useState([]);
  const [voucherError,setVoucherError]=useState('');
  const [isValidatingVoucher,setIsValidatingVoucher]=useState(false);
  return {voucherInput,setVoucherInput,appliedVouchers,setAppliedVouchers,voucherError,setVoucherError,isValidatingVoucher,setIsValidatingVoucher};
}
export function useCheckoutVoucherActions({state,cleanPhone,isPhoneValid,clientSubtotal}) {
  const {appliedVouchers,setAppliedVouchers,setVoucherInput,setVoucherError,setIsValidatingVoucher}=state;
  const lastPhone=useRef(cleanPhone), currentPhone=useRef(cleanPhone), busy=useRef(false);
  currentPhone.current=cleanPhone;
  useEffect(()=>{
    if(lastPhone.current!==cleanPhone){setAppliedVouchers([]);setVoucherInput('');setVoucherError('');lastPhone.current=cleanPhone;}
  },[cleanPhone,setAppliedVouchers,setVoucherInput,setVoucherError]);
  const applySpecificCode=async raw=>{
    const code=String(raw||'').trim().toUpperCase();if(!code||busy.current)return;
    setVoucherError('');
    if(code.startsWith('XNG')&&!isPhoneValid){setVoucherError('Nhập số điện thoại hợp lệ để áp dụng mã tri ân đơn cũ.');return;}
    busy.current=true;setIsValidatingVoucher(true);
    const phone=cleanPhone;
    try{const v=await quoteCheckoutVoucher(supabase,{code,phone,subtotal:clientSubtotal,applied:appliedVouchers});if(currentPhone.current!==phone)return;setAppliedVouchers(prev=>prev.some(x=>x.code===v.code)?prev:[...prev,v]);setVoucherInput('');}
    catch(e){if(currentPhone.current===phone)setVoucherError(e.message);}
    finally{busy.current=false;setIsValidatingVoucher(false);}
  };
  const handleRemoveVoucher=code=>{setAppliedVouchers(prev=>prev.filter(v=>v.code!==code));setVoucherError('');};
  // No automatic voucher/history discovery by unverified phone.
  return {singleSuggestedVoucher:null,applySpecificCode,handleRemoveVoucher};
}
