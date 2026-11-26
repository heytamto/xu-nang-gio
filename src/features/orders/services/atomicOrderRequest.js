export async function submitAtomicOrder(client, orderData) {
  const { customer, cart, requestId } = orderData;
  if (!requestId) throw new Error('Thiếu mã yêu cầu đặt hàng');
  const code = orderData.code || orderData.orderCode;
  const order = {
    code,
    customer_name: String(customer?.name || '').trim(),
    phone: String(customer?.phone || '').replace(/\D/g, ''),
    email: String(customer?.email || '').trim(),
    address: String(customer?.address || '').trim(),
    customer_note: String(customer?.note || '').trim(),
    payment_method: orderData.paymentMethod,
    deposit_amount_expected: Number(orderData.deposit_amount_expected ?? (orderData.paymentMethod === 'cod' ? 0 : NaN)),
    payment_gift_id: orderData.paymentGiftId || null,
    campaign_gifts: orderData.campaignGifts || null,
    subtotal: Number(orderData.subtotal),
    discount: Number(orderData.discount),
    shipping_fee: Number(orderData.shipping_fee),
    final_total: Number(orderData.finalTotal),
    voucher_codes: orderData.voucherCode || null,
    used_previous_order_code: orderData.usedPreviousOrderCode || null,
  };
  const items = (cart || []).map(item => ({
    product_id: String(item.productId || item.product_id || ''),
    name: item.name,
    weight_id: String(item.weightId || 'std'),
    flavor: item.flavor || null,
    weight_label: item.weightLabel || '',
    price: Number(item.price),
    quantity: Number(item.quantity),
    campaign_gift_title: item.campaign_gift_title || null,
  }));
  const { data, error } = await client.rpc('create_order_atomic_v2', {
    p_request_id: requestId, p_order: order, p_items: items,
  });
  if (error) throw error;
  if (data?.success !== true || data.code !== code) throw new Error('Máy chủ chưa xác nhận đơn hàng');
  return { success: true, orderCode: data.code, replayed: data.replayed === true };
}

