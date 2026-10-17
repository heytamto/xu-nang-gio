// src/utils/orderQueue.js

const QUEUE_KEY = 'xng_order_outbox_queue';
const MAX_RETRIES = 5;

// 1. Lấy danh sách hàng đợi hiện tại
export const getQueue = () => {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
};

// 2. Thêm đơn hàng vào hàng đợi kiên cố
export const enqueueOrder = (orderPayload) => {
  const queue = getQueue();
  const queueItem = {
    id: orderPayload.code,
    payload: {
      ...orderPayload,
      action: orderPayload.action || 'create_order'
    },
    status: 'PENDING', // PENDING | SYNCING | SYNCED | FAILED
    retryCount: 0,
    nextRetryAt: Date.now(),
    createdAt: Date.now()
  };

  // Tránh trùng lặp mã đơn trong hàng đợi
  if (!queue.some((item) => item.id === queueItem.id)) {
    queue.push(queueItem);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }
  return queueItem;
};

// 3. Xử lý gửi 1 phần tử (Chống CORS và an toàn khi parse JSON từ Google Apps Script)
const sendOrderRequest = async (payload) => {
  const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl) throw new Error('Chưa cấu hình Webhook URL');

  // Gửi qua POST với Content-Type text/plain;charset=utf-8 để tránh preflight CORS
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }

  const rawText = await response.text();
  let result = null;
  try {
    result = JSON.parse(rawText);
  } catch (err) {
    throw new Error(`Google Apps Script trả về nội dung không phải JSON: ${rawText.slice(0, 100)}`);
  }

  if (result.status !== 'success') {
    throw new Error(result.message || 'Server xử lý thất bại');
  }

  return result;
};

// 4. Worker xử lý toàn bộ queue (Chạy tuần tự tránh Race Condition)
let isProcessing = false;

export const processOrderQueue = async () => {
  if (isProcessing || !navigator.onLine) return;
  isProcessing = true;

  try {
    const queue = getQueue();
    const now = Date.now();

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];

      // Chỉ xử lý các đơn đang chờ và đã đến lịch retry
      if (item.status === 'PENDING' && now >= item.nextRetryAt) {
        item.status = 'SYNCING';
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

        try {
          await sendOrderRequest(item.payload);
          // Gửi thành công -> đánh dấu SYNCED
          item.status = 'SYNCED';
          item.syncedAt = Date.now();
        } catch (error) {
          console.warn(`[Queue] Gửi đơn ${item.id} thất bại, thử lại sau. Lỗi:`, error.message);
          item.retryCount += 1;
          item.status = item.retryCount >= MAX_RETRIES ? 'FAILED' : 'PENDING';

          // Exponential Backoff: Thử lại sau 3s, 6s, 12s, 24s, 48s...
          const delay = Math.pow(2, item.retryCount) * 1500;
          item.nextRetryAt = Date.now() + delay;
        }

        // Cập nhật lại trạng thái vào Storage sau mỗi lượt
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      }
    }

    // Dọn dẹp những đơn đã đồng bộ thành công sau 24h
    const cleanedQueue = queue.filter((item) => {
      if (item.status === 'SYNCED') {
        return Date.now() - (item.syncedAt || 0) < 24 * 60 * 60 * 1000;
      }
      return true;
    });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(cleanedQueue));

  } finally {
    isProcessing = false;
  }
};

// 5. Kích hoạt bộ lắng nghe tự động (Auto-Drain Worker)
export const initQueueWorker = () => {
  // Lắng nghe khi thiết bị có mạng trở lại
  const handleOnline = () => {
    console.log('[Queue] Thiết bị đã online trở lại, kích hoạt đồng bộ queue...');
    processOrderQueue();
  };

  window.addEventListener('online', handleOnline);

  // Chạy định kỳ mỗi 15 giây kiểm tra đơn rớt
  const intervalId = setInterval(processOrderQueue, 15000);

  // Kích hoạt ngay lần đầu app nạp
  processOrderQueue();

  return () => {
    window.removeEventListener('online', handleOnline);
    clearInterval(intervalId);
  };
};