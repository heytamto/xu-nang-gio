// worker.js - Backend trung gian đối soát giá siêu tốc (~20ms) Zero-Trust
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json;charset=UTF-8"
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // =========================================================================
      // 1. ENDPOINT ĐỐI SOÁT GIỎ HÀNG & VOUCHER (/api/verify)
      // =========================================================================
      if (path === "/api/verify" && request.method === "POST") {
        const payload = await request.json();
        const clientCart = Array.isArray(payload.cart) ? payload.cart : [];
        const cleanPhone = String(payload.phone || "").replace(/\D/g, "");

        // Đọc dữ liệu bảng giá, danh mục voucher và danh sách đen
        const [rawProducts, rawVouchers, isBlacklisted] = await Promise.all([
          env.XNG_KV.get("master:products", { type: "json" }),
          env.XNG_KV.get("master:vouchers", { type: "json" }),
          cleanPhone ? env.XNG_KV.get(`blacklist:${cleanPhone}`) : null
        ]);

        const priceMap = rawProducts || {};
        const voucherMap = rawVouchers || {};

        // 1. Tính toán lại giá giỏ hàng chuẩn từ KV
        let verifiedSubtotal = 0;
        const verifiedCart = clientCart.map((item) => {
          const pId = String(item.productId || item.id || "");
          const wId = String(item.weightId || "std");
          const lookupKey = `${pId}_${wId}`;

          const realUnitPrice = priceMap[lookupKey] !== undefined 
            ? Number(priceMap[lookupKey]) 
            : (Number(priceMap[pId]) || Number(item.price) || 0);
          const qty = Math.max(1, Number(item.quantity) || 1);

          verifiedSubtotal += realUnitPrice * qty;
          return { ...item, price: realUnitPrice, quantity: qty };
        });

        // 2. Bóc tách danh sách mã voucher
        const voucherCodes = String(payload.voucherCode || "")
          .split(",")
          .map((c) => c.trim().toUpperCase())
          .filter(Boolean);

        let loyaltyDiscount = 0;
        let voucherDiscount = 0;
        const appliedVouchers = [];
        const rejectedVouchers = [];

        // 3. ZERO-TRUST CHECK: Kiểm tra mã đơn cũ XNG trong KV
        const xngCode = voucherCodes.find((c) => c.startsWith("XNG"));
        let isValidOldOrder = false;

        if (xngCode && cleanPhone) {
          const existingOrder = await env.XNG_KV.get(`order:${xngCode}`, { type: "json" });

          if (existingOrder) {
            const orderPhone = String(existingOrder.phone || "").replace(/\D/g, "");
            const isPhoneMatch = orderPhone && (orderPhone.endsWith(cleanPhone.slice(-8)) || cleanPhone.endsWith(orderPhone.slice(-8)));
            const isBadStatus = existingOrder.status === "Đã hủy" || existingOrder.status === "Bom hàng" || existingOrder.status === "cancelled" || existingOrder.status === "bombed";

            // Điều kiện hợp lệ: Khớp SĐT + Chưa từng dùng làm mã giảm + Không bị hủy/bom
            if (isPhoneMatch && !existingOrder.isUsed && !isBadStatus) {
              isValidOldOrder = true;
              loyaltyDiscount = Math.min(Math.round((verifiedSubtotal * 10) / 100), 50000, verifiedSubtotal);
            }
          }
        }

        let remainingBudget = Math.max(0, verifiedSubtotal - loyaltyDiscount);

        // 4. Duyệt các mã voucher
        for (const code of voucherCodes) {
          if (code.startsWith("XNG")) {
            if (isValidOldOrder && loyaltyDiscount > 0) {
              appliedVouchers.push({
                code: code,
                discount: loyaltyDiscount,
                title: "Tri ân khách quen (Giảm 10%)"
              });
            } else {
              rejectedVouchers.push(code);
            }
            continue;
          }

          let voucher = voucherMap[code];
          const minRequired = Number(voucher?.minOrder || voucher?.min_order || 0);
          if (!voucher || (minRequired > 0 && verifiedSubtotal < minRequired)) {
            rejectedVouchers.push(code);
            continue;
          }

          let disc = 0;
          if (voucher.type === "percent") {
            disc = Math.round((verifiedSubtotal * Number(voucher.value || 0)) / 100);
            if (voucher.maxDiscount) {
              disc = Math.min(disc, Number(voucher.maxDiscount));
            }
          } else {
            disc = Number(voucher.value || voucher.discount || 0);
          }

          disc = Math.min(disc, remainingBudget);

          if (disc > 0) {
            voucherDiscount += disc;
            remainingBudget -= disc;
            appliedVouchers.push({
              code: voucher.code || code,
              discount: disc,
              title: voucher.title || voucher.desc || code
            });
          } else {
            rejectedVouchers.push(code);
          }
        }

        const totalDiscount = loyaltyDiscount + voucherDiscount;
        const finalTotal = Math.max(0, verifiedSubtotal - totalDiscount);

        // Ký số HMAC
        const signature = await generateSignature(
          `${verifiedSubtotal}:${finalTotal}:${cleanPhone}`,
          env.SECRET_SALT || "xunanggio-secret-salt-2026"
        );

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              subtotal: verifiedSubtotal,
              loyaltyDiscount,
              voucherDiscount,
              totalDiscount,
              finalTotal,
              appliedVouchers,
              rejectedVouchers,
              cart: verifiedCart,
              isRiskCustomer: Boolean(isBlacklisted),
              signature
            }
          }),
          { status: 200, headers: CORS_HEADERS }
        );
      }

      // =========================================================================
      // 2. ENDPOINT ĐỒNG BỘ ĐƠN HÀNG TỨC THÌ (/api/sync-order)
      // =========================================================================
      if (path === "/api/sync-order" && request.method === "POST") {
        const auth = request.headers.get("Authorization");
        if (auth !== `Bearer ${env.SYNC_SECRET || "sync-secret-key-123456"}`) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS_HEADERS });
        }

        const body = await request.json();
        const orderId = String(body.orderId || body.code || "").trim();
        const phone = String(body.phone || "").replace(/\D/g, "");

        if (!orderId) {
          return new Response(JSON.stringify({ error: "Thiếu orderId" }), { status: 400, headers: CORS_HEADERS });
        }

        // 1. Lưu thông tin đơn mới vào KV
        await env.XNG_KV.put(`order:${orderId}`, JSON.stringify({
          orderId: orderId,
          phone: phone,
          status: body.status || "Chờ xác nhận",
          isUsed: false,
          createdAt: body.createdAt || new Date().toISOString()
        }));

        // 2. Nếu đơn này có sử dụng mã đơn cũ (usedPreviousOrderCode), đánh dấu đơn cũ là ĐÃ DÙNG
        const usedOldCode = String(body.usedPreviousOrderCode || "").trim();
        if (usedOldCode && usedOldCode.startsWith("XNG")) {
          const oldOrderData = await env.XNG_KV.get(`order:${usedOldCode}`, { type: "json" });
          if (oldOrderData) {
            oldOrderData.isUsed = true;
            oldOrderData.usedByOrder = orderId;
            await env.XNG_KV.put(`order:${usedOldCode}`, JSON.stringify(oldOrderData));
          }
        }

        return new Response(JSON.stringify({ success: true, message: `Đã sync order ${orderId} vào KV` }), {
          status: 200,
          headers: CORS_HEADERS
        });
      }

      // =========================================================================
      // 3. ENDPOINT ĐỒNG BỘ TOÀN DIỆN DỮ LIỆU TỪ SHEET SANG KV (/api/sync)
      // =========================================================================
      if (path === "/api/sync" && request.method === "POST") {
        const auth = request.headers.get("Authorization");
        if (auth !== `Bearer ${env.SYNC_SECRET || "sync-secret-key-123456"}`) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS_HEADERS });
        }

        const body = await request.json();
        if (body.products) await env.XNG_KV.put("master:products", JSON.stringify(body.products));
        if (body.vouchers) await env.XNG_KV.put("master:vouchers", JSON.stringify(body.vouchers));
        if (body.blacklistPhone) await env.XNG_KV.put(`blacklist:${body.blacklistPhone}`, "bombed");

        // Đồng bộ hàng loạt đơn hàng từ Sheet nếu có
        if (Array.isArray(body.orders)) {
          for (const ord of body.orders) {
            const ordCode = String(ord.code || ord.orderId || "").trim();
            const ordPhone = String(ord.phone || "").replace(/\D/g, "");
            if (ordCode) {
              await env.XNG_KV.put(`order:${ordCode}`, JSON.stringify({
                orderId: ordCode,
                phone: ordPhone,
                status: ord.status || "Chờ xác nhận",
                isUsed: Boolean(ord.isUsed),
                createdAt: ord.createdAt || ""
              }));
            }
          }
        }

        return new Response(JSON.stringify({ success: true, message: "Sync KV thành công" }), {
          status: 200,
          headers: CORS_HEADERS
        });
      }

      return new Response(JSON.stringify({ status: "ready", service: "Xứ Nắng Gió Edge Worker" }), {
        status: 200,
        headers: CORS_HEADERS
      });
    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), {
        status: 500,
        headers: CORS_HEADERS
      });
    }
  }
};

async function generateSignature(message, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}