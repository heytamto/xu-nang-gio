const messages = { INVALID_INPUT:'Thông tin đơn hàng không hợp lệ.', NOT_FOUND:'Không tìm thấy đơn khớp mã và số điện thoại.', RATE_LIMITED:'Bạn đã tra cứu quá nhiều lần. Vui lòng thử lại sau.', CANCEL_NOT_ALLOWED:'Không thể tự hủy đơn này. Vui lòng liên hệ nhà vườn.', REVIEW_NOT_ALLOWED:'Đơn chưa đủ điều kiện đánh giá.', ALREADY_REVIEWED:'Đơn đã được đánh giá.' };
export async function customerOrderAction(client, action, code, phone, input = {}) {
  code = String(code || '').trim().toUpperCase(); phone = String(phone || '').trim();
  if (!['lookup','cancel','review'].includes(action) || !/^[A-Z0-9_-]{1,50}$/.test(code) || !/^0[0-9]{9}$/.test(phone)) throw new Error(messages.INVALID_INPUT);
  const body = { action, code, phone };
  if (action === 'cancel') body.reason = input.reason;
  if (action === 'review') { body.rating = input.rating; body.content = input.content; }
  const { data, error } = await client.functions.invoke('customer-order', {body});
  let failure = data?.error;
  if (error) { try { failure = (await error.context?.json())?.error || failure; } catch { /* no response body */ } }
  if (error || failure || !data) throw new Error(messages[failure] || 'Không thể xử lý yêu cầu. Vui lòng thử lại sau.');
  if (action === 'lookup' && data.order?.code !== code || action === 'cancel' && (data.code !== code || data.status !== 'cancelled') || action === 'review' && (!data.review_id || data.status !== 'pending_moderation')) throw new Error('Phản hồi máy chủ không hợp lệ.');
  return data;
}
export function mergeVerifiedOrder(orders, order) { return [...(orders || []).filter(o => o.code !== order.code), order]; }
