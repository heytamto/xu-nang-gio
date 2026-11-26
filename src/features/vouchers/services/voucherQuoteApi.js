export async function quoteCheckoutVoucher(client, {code,phone='',subtotal,applied=[]}) {
  code=String(code||'').trim().toUpperCase();
  phone=String(phone||'').trim();
  if(!code||code.length>50||!Number.isSafeInteger(subtotal)||subtotal<0||(code.startsWith('XNG')&&!/^0[0-9]{9}$/.test(phone))) throw new Error('Mã ưu đãi, số điện thoại hoặc tổng tiền không hợp lệ.');
  if(applied.some(v=>v.code===code)) throw new Error('Mã ưu đãi đã được áp dụng.');
  if(code.startsWith('XNG')&&applied.some(v=>v.isPreviousOrder||v.isLoyalty)) throw new Error('Mỗi đơn chỉ áp dụng một mã tri ân.');
  if(applied.some(v=>v.canStack===false)) throw new Error('Không thể dùng chung với mã ưu đãi hiện tại.');
  const {data,error}=await client.functions.invoke('customer-order',{body:{action:'voucher',code,phone:code.startsWith('XNG')?phone:'',subtotal}});
  let failure=data?.error;
  if(error){try{failure=(await error.context?.json())?.error||failure;}catch{}}
  if(error||failure||!data?.voucher) throw new Error(failure==='VOUCHER_NOT_AVAILABLE'?'Mã ưu đãi không khả dụng hoặc chưa đủ điều kiện.':failure==='RATE_LIMITED'?'Quá nhiều yêu cầu, vui lòng thử lại sau.':'Không thể xác thực mã ưu đãi. Vui lòng thử lại.');
  const v=data.voucher;
  if(v.code!==code||!['percent','fixed'].includes(v.type)||typeof v.canStack!=='boolean'||!Number.isSafeInteger(v.discount)||v.discount<0||v.discount>subtotal||!Number.isSafeInteger(v.maxDiscount)||v.maxDiscount<0||Boolean(v.isPreviousOrder)!==code.startsWith('XNG')||(v.type==='percent'&&(!Number.isFinite(v.percent??v.value)||(v.percent??v.value)<0||(v.percent??v.value)>100))||(v.type==='fixed'&&(!Number.isSafeInteger(v.value)||v.value<0))) throw new Error('Phản hồi voucher không hợp lệ.');
  if(applied.length&&v.canStack===false) throw new Error('Mã này không được dùng chung với mã khác.');
  return {...v, ...(v.type==='fixed'?{discount:v.value}:{}), desc:v.desc||(v.type==='percent'?`Giảm ${v.percent??v.value}%`:`Giảm ${v.value.toLocaleString('vi-VN')}đ`)};
}
