const statuses = ['all','pending','confirmed','packing','shipping','completed','cancelled','bombed'];
export function normalizeVietnamPhone(value) {
  const phone = String(value || '').trim();
  if (/^0[0-9]{9}$/.test(phone)) return {local:phone, international:'+84'+phone.slice(1)};
  if (/^\+84[0-9]{9}$/.test(phone)) return {local:'0'+phone.slice(3), international:phone};
  throw new Error('Vui lòng nhập số điện thoại Việt Nam hợp lệ.');
}
export async function fetchVerifiedOrderHistory(client, {status='all',page=1,pageSize=6}={}) {
  if (!statuses.includes(status) || !Number.isSafeInteger(page) || page<1 || ![6,12,24].includes(pageSize)) throw new Error('Bộ lọc không hợp lệ.');
  const {data,error}=await client.rpc('xng_verified_order_history_staging',{p_status:status,p_page:page,p_page_size:pageSize});
  if(error||!data||data.error) throw new Error(data?.error==='PHONE_VERIFICATION_REQUIRED'?'Phiên xác minh đã hết hạn. Vui lòng xác minh lại số điện thoại.':data?.error==='RATE_LIMITED'?'Bạn đã tra cứu quá nhiều lần. Vui lòng thử lại sau.':'Không thể tải lịch sử đơn hàng.');
  const p=data.pagination,c=data.statusCounts;
  if(!Array.isArray(data.data)||data.data.length>pageSize||!p||!c||!statuses.every(s=>Number.isSafeInteger(c[s])&&c[s]>=0)||!Number.isSafeInteger(p.page)||p.page<1||p.pageSize!==pageSize||!Number.isSafeInteger(p.totalRecords)||p.totalRecords<0||p.totalRecords!==c[status]||!Number.isSafeInteger(p.totalPages)||p.totalPages!==Math.max(1,Math.ceil(p.totalRecords/pageSize))||p.page>p.totalPages||data.data.some(o=>!o?.code)) throw new Error('Phản hồi lịch sử đơn hàng không hợp lệ.');
  return {counts:c,total:p.totalRecords,totalPages:p.totalPages,currentPage:p.page,pageSize,start:p.totalRecords?(p.page-1)*pageSize+1:0,end:Math.min(p.page*pageSize,p.totalRecords),items:data.data};
}
