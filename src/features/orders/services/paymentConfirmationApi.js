export async function confirmOrderPayment(client, code, receivedAmount) {
  if (typeof code !== 'string' || !code.trim() || !Number.isSafeInteger(receivedAmount) || receivedAmount <= 0) throw new Error('Mã đơn hoặc số tiền thực nhận không hợp lệ.');
  const { data, error } = await client.rpc('xng_confirm_payment_staging', { p_code: code, p_received: receivedAmount });
  if (error) throw error;
  if (data?.code !== code || data.payment_verified !== true || Number(data.deposit_paid) !== receivedAmount || !data.payment_verified_at || typeof data.status !== 'string') throw new Error('Phản hồi xác nhận thanh toán không hợp lệ.');
  return data;
}
