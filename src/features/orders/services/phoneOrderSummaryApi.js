const statuses=['all','pending','confirmed','packing','shipping','completed','cancelled','bombed'];
export async function fetchPhoneOrderSummary(client,{phone,status='all',page=1,pageSize=6}) {
 phone=String(phone||'').trim();
 if(!/^0[0-9]{9}$/.test(phone)||!statuses.includes(status)||!Number.isSafeInteger(page)||page<1||page>100000||![6,12,24].includes(pageSize)) throw new Error('Vui lòng kiểm tra số điện thoại và bộ lọc.');
 const {data,error}=await client.functions.invoke('customer-order',{body:{action:'summary',phone,status,page,pageSize}});
 let failure=data?.error;
 if(error) {try {failure=(await error.context?.json())?.error||failure;} catch {/* unavailable */}}
 if(error||failure||!data) throw new Error(failure==='RATE_LIMITED'?'Bạn đã tra cứu quá nhiều lần. Vui lòng thử lại sau.':'Không thể tra cứu đơn hàng. Vui lòng thử lại.');
 const p=data.pagination,c=data.statusCounts;
 if(!p||!c||!statuses.every(s=>Number.isSafeInteger(c[s])&&c[s]>=0)||!Number.isSafeInteger(p.totalRecords)||p.totalRecords!==c[status]||p.pageSize!==pageSize||!Number.isSafeInteger(p.page)||p.page<1||p.totalPages!==Math.max(1,Math.ceil(p.totalRecords/pageSize))||p.page>p.totalPages||!Array.isArray(data.data)||data.data.length!==Math.min(pageSize,Math.max(0,p.totalRecords-(p.page-1)*pageSize))||data.data.some(r=>!r||Object.keys(r).length!==1||!statuses.slice(1).includes(r.status))) throw new Error('Phản hồi máy chủ không hợp lệ.');
 return {counts:c,total:p.totalRecords,totalPages:p.totalPages,currentPage:p.page,pageSize,start:p.totalRecords?(p.page-1)*pageSize+1:0,end:Math.min(p.page*pageSize,p.totalRecords),items:data.data.map(r=>({status:r.status}))};
}

const searchStatuses=['all','pending','confirmed','packing','shipping','completed','cancelled','bombed'];
export async function fetchOrderSearchSummary(client,{query,status='all',page=1,pageSize=6}) {
 query=String(query||'').trim().toUpperCase();
 if((!/^0[0-9]{9}$/.test(query)&&!/^XNG[0-9]{6}-[A-Z0-9]{4}$/.test(query))||!searchStatuses.includes(status)||!Number.isSafeInteger(page)||page<1||page>100000||![6,12,24].includes(pageSize)) throw new Error('Vui lòng kiểm tra số điện thoại hoặc mã đơn và bộ lọc.');
 const {data,error}=await client.functions.invoke('customer-order',{body:{action:'search_summary',query,status,page,pageSize}});
 let failure=data?.error;
 if(error) {try {failure=(await error.context?.json())?.error||failure;} catch {/* unavailable */}}
 if(error||failure||!data) throw new Error(failure==='RATE_LIMITED'?'Bạn đã tra cứu quá nhiều lần. Vui lòng thử lại sau.':'Không thể tra cứu đơn hàng. Vui lòng thử lại.');
 const p=data.pagination,c=data.statusCounts;
 if(!p||!c||!searchStatuses.every(s=>Number.isSafeInteger(c[s])&&c[s]>=0)||!Number.isSafeInteger(p.totalRecords)||p.totalRecords!==c[status]||p.pageSize!==pageSize||!Number.isSafeInteger(p.page)||p.page<1||p.totalPages!==Math.max(1,Math.ceil(p.totalRecords/pageSize))||p.page>p.totalPages||!Array.isArray(data.data)||data.data.length!==Math.min(pageSize,Math.max(0,p.totalRecords-(p.page-1)*pageSize))||data.data.some(r=>!r||Object.keys(r).length!==1||!searchStatuses.slice(1).includes(r.status))) throw new Error('Phản hồi máy chủ không hợp lệ.');
 return {counts:c,total:p.totalRecords,totalPages:p.totalPages,currentPage:p.page,pageSize,start:p.totalRecords?(p.page-1)*pageSize+1:0,end:Math.min(p.page*pageSize,p.totalRecords),items:data.data.map(r=>({status:r.status}))};
}
