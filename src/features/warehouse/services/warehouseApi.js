export async function fetchWarehouseOrders(client) {
  const {data,error}=await client.rpc('xng_warehouse_orders_staging');
  if(error)throw error;
  if(!Array.isArray(data)||data.some(o=>!o?.code||!['confirmed','packing'].includes(o.status)||typeof o.can_fulfill!=='boolean'||!Array.isArray(o.order_items))) throw new Error('Phản hồi danh sách kho không hợp lệ.');
  return data;
}
export async function advanceWarehouseOrder(client,code,status) {
  if(!code||!['packing','shipping'].includes(status))throw new Error('Trạng thái kho không hợp lệ.');
  const {data,error}=await client.rpc('xng_warehouse_advance_staging',{p_code:code,p_status:status});
  if(error)throw error;
  if(data?.code!==code||data.status!==status)throw new Error('Máy chủ chưa xác nhận trạng thái kho.');
  return data;
}
export async function attachWarehousePhoto(client,code,path) {
  const {data,error}=await client.rpc('xng_warehouse_attach_photo_staging',{p_code:code,p_path:path});
  if(error)throw error;
  if(data?.code!==code||data.packing_image!==path)throw new Error('Máy chủ chưa xác nhận ảnh đóng hàng.');
  return data;
}
export function warehousePhotoPath(code,file,uuid) {
  const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file?.type];
  if(typeof code!=='string'||!/^[A-Z0-9_-]{1,50}$/.test(code)||!ext||!Number.isSafeInteger(file?.size)||file.size<=0||file.size>5*1024*1024||!(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(uuid||'')))throw new Error('Ảnh phải là JPEG, PNG hoặc WebP, tối đa 5 MB.');
  return `packing/${code}/${uuid}.${ext}`;
}
export async function warehousePhotoUrl(client,value) {
  if(typeof value!=='string'||!/^packing\/[A-Z0-9_-]{1,50}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/.test(value))return null;
  const {data,error}=await client.storage.from('order-deliveries').createSignedUrl(value,120);
  if(error)return null;
  return data?.signedUrl||null;
}
