// supabase/functions/send-order-email/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response> | Response): void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";

const SERVICE_KEY =
  Deno.env.get("SERVICE_ROLE_KEY") ||
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  Deno.env.get("SUPABASE_ANON_KEY") ||
  "";

const SENDER_EMAIL =
  Deno.env.get("SENDER_EMAIL") || "Xứ Nắng Gió <donhang@xunanggio.com>";
const REPLY_TO_EMAIL =
  Deno.env.get("REPLY_TO_EMAIL") || "hotro@xunanggio.com";

// Khởi tạo Supabase client với quyền service role an toàn
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

function formatPaymentMethodLabel(method: string | undefined): string {
  const normalized = String(method || "").trim().toLowerCase();
  const paymentMap: Record<string, string> = {
    deposit: "Chuyển khoản đặt cọc",
    full_qr: "Chuyển khoản đủ 100% (Mã VietQR)",
    cod: "Thanh toán khi nhận hàng (COD)",
    bank_transfer: "Chuyển khoản ngân hàng",
  };
  return paymentMap[normalized] || "Chuyển khoản";
}

function renderTemplate(
  templateStr: string,
  variables: Record<string, string>
): string {
  let result = templateStr;
  for (const [key, val] of Object.entries(variables)) {
    result = result.replaceAll(`{{${key}}}`, val ?? "");
  }
  return result;
}

// Bóc tách cấu hình từ các dòng key-value của bảng shop_configs
function parseShopConfig(rawConfigs: any[] | null) {
  const configMap: Record<string, any> = {};
  (rawConfigs || []).forEach((row: any) => {
    let val = row.value;
    if (typeof val === "string") {
      try {
        val = JSON.parse(val);
      } catch {
        // Bỏ qua nếu không parse được JSON
      }
    }
    if (val && typeof val === "object") {
      configMap[row.key] = val;
    }
  });

  const general = configMap["general"] || configMap["general_config"] || {};
  const payment = configMap["payment"] || configMap["payment_config"] || {};

  return {
    shopName: general.brandName || general.shopName || "Xứ Nắng Gió",
    shopAddress: general.address || "Thôn Trường Sanh, Xã Phước Hậu, Tỉnh Ninh Thuận",
    shopHotline: general.hotline || general.zaloPhone || "0848.957.345",
    shopWebsite: general.website || "https://xunanggio.com",
    depositAmount: Number(payment.depositAmount ?? 50000),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // 👉 NHÁNH 1: GỬI TRỰC TIẾP HTML (TEST TỪ ADMIN HOẶC DỰNG SẴN TỪ CLIENT)
    if ((body.is_test || body.html) && (body.to || body.email)) {
      const recipientEmail = body.to || body.email;

      let finalHtml = body.html || "<p>Nội dung thông báo</p>";
      let finalSubject = body.subject || "[Xứ Nắng Gió] Thông báo từ nhà vườn";

      // Đảm bảo thay thế biến shop nếu chuỗi HTML truyền sang còn sót
      if (finalHtml.includes("{{SHOP_") || finalSubject.includes("{{SHOP_")) {
        const { data: rawConfigs } = await supabase.from("shop_configs").select("*");
        const shop = parseShopConfig(rawConfigs);

        const shopVars: Record<string, string> = {
          SHOP_NAME: shop.shopName,
          shop_name: shop.shopName,
          SHOP_ADDRESS: shop.shopAddress,
          shop_address: shop.shopAddress,
          SHOP_HOTLINE: shop.shopHotline,
          shop_hotline: shop.shopHotline,
          SHOP_WEBSITE: shop.shopWebsite,
          shop_website: shop.shopWebsite,
        };

        finalHtml = renderTemplate(finalHtml, shopVars);
        finalSubject = renderTemplate(finalSubject, shopVars);
      }

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: SENDER_EMAIL,
          to: [recipientEmail],
          reply_to: REPLY_TO_EMAIL,
          subject: finalSubject,
          html: finalHtml,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        console.error("Resend API báo lỗi (Nhánh gửi trực tiếp HTML):", resData);
        return new Response(JSON.stringify({ error: resData }), {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, data: resData }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 👉 NHÁNH 2: XỬ LÝ GỬI THEO TEMPLATE TỰ ĐỘNG (TỪ APP.JSX, REVIEW MODAL HOẶC WEBHOOK)
    const targetCode =
      body.record?.code ||
      body.order_code ||
      body.data?.ORDER_CODE ||
      body.data?.order_code ||
      "";

    if (!targetCode && !body.template_id) {
      return new Response(
        JSON.stringify({ message: "Bỏ qua: Không tìm thấy mã đơn hàng hoặc template_id hợp lệ" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestedTemplateId = body.template_id || "tpl0001";

    // Truy vấn song song dữ liệu từ Supabase
    const [orderRes, itemsRes, templateRes, configRes] = await Promise.all([
      targetCode
        ? supabase.from("orders").select("*").eq("code", targetCode).maybeSingle()
        : Promise.resolve({ data: null }),
      targetCode
        ? supabase.from("order_items").select("name, weight_label, quantity, price, line_total").eq("order_code", targetCode)
        : Promise.resolve({ data: null }),
      supabase.from("email_templates").select("id, name, subject, body").eq("id", requestedTemplateId).eq("is_active", true).maybeSingle(),
      supabase.from("shop_configs").select("*"),
    ]);

    // Dữ liệu đơn hàng
    const dbOrder = orderRes.data;
    const order = {
      code: targetCode || body.voucher_code || "XNG-DONHANG",
      customer_name: dbOrder?.customer_name || body.customer_name || body.data?.CUSTOMER_NAME || "Quý khách",
      email: dbOrder?.email || body.to || body.email || body.recipient_email || body.data?.CUSTOMER_EMAIL,
      phone: dbOrder?.phone || body.phone || body.data?.CUSTOMER_PHONE || "",
      address: dbOrder?.address || body.address || body.data?.SHIPPING_ADDRESS || body.data?.ADDRESS || "",
      payment_method: dbOrder?.payment_method || body.payment_method || body.data?.PAYMENT_METHOD || "deposit",
      payment_gift: dbOrder?.gift_title || dbOrder?.payment_gift || body.data?.GIFT_TITLE || "",
      campaign_gifts: dbOrder?.campaign_gifts || body.data?.CAMPAIGN_GIFTS || "",
      final_total: dbOrder?.final_total || body.final_total || body.data?.FINAL_TOTAL || body.data?.TOTAL || 0,
      subtotal: dbOrder?.subtotal || body.subtotal || body.data?.SUBTOTAL || 0,
    };

    if (!order.email || typeof order.email !== "string" || !order.email.includes("@")) {
      return new Response(
        JSON.stringify({ message: "Bỏ qua: Không có email người nhận hợp lệ", emailReceived: order.email }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Bóc tách cấu hình shop_configs
    const shop = parseShopConfig(configRes.data);

    // Fallback template nếu DB chưa nạp template
    let template = templateRes.data;
    if (!template) {
      console.warn(`Không tìm thấy template [${requestedTemplateId}] trong DB, kích hoạt fallback.`);
      if (requestedTemplateId === "tpl0003") {
        template = {
          id: "tpl0003",
          name: "Email cảm ơn đánh giá",
          subject: "[Xứ Nắng Gió] Cảm ơn {{CUSTOMER_NAME}} đã đánh giá đơn #{{ORDER_CODE}} • Tặng bạn mã ưu đãi",
          body: `<div style="margin: 0; padding: 24px; font-family: Arial, sans-serif; background: #ffffff; border-radius: 16px; border: 1px solid #fed7aa; max-width: 560px; margin: 0 auto;">
            <h2 style="color: #78350f;">💛 Xứ Nắng Gió Cảm Ơn Bạn</h2>
            <p>Chào <strong>{{CUSTOMER_NAME}}</strong>,</p>
            <p>Nhà vườn rất trân trọng đánh giá của bạn cho đơn hàng <strong>#{{ORDER_CODE}}</strong>.</p>
            <div style="background: #fffbeb; border: 1.5px dashed #f59e0b; padding: 16px; border-radius: 12px; text-align: center; margin: 16px 0;">
              <p style="margin: 0; font-size: 13px; color: #92400e; font-weight: bold;">MÃ GIẢM GIÁ CHO ĐƠN HÀNG KẾ TIẾP:</p>
              <div style="font-size: 22px; font-weight: 900; font-family: monospace; color: #b45309; margin: 8px 0;">{{ORDER_CODE}}</div>
            </div>
            <p style="font-size: 13px; color: #78716c;">Hotline / Zalo: <strong>{{SHOP_HOTLINE}}</strong></p>
          </div>`
        };
      } else {
        template = {
          id: "tpl0001",
          name: "Email xác nhận đơn hàng",
          subject: "[Xứ Nắng Gió] Xác nhận đơn hàng #{{ORDER_CODE}} • Cảm ơn {{CUSTOMER_NAME}}",
          body: `<div style="margin: 0; padding: 24px; font-family: Arial, sans-serif; background: #ffffff; border-radius: 16px; border: 1px solid #fed7aa; max-width: 560px; margin: 0 auto;">
            <h2 style="color: #78350f;">🍇 {{SHOP_NAME}}</h2>
            <p>Chào <strong>{{CUSTOMER_NAME}}</strong>,</p>
            <p>Nhà vườn đã nhận được đơn hàng <strong>#{{ORDER_CODE}}</strong> của bạn.</p>
            <div style="background: #fffbeb; border: 1.5px dashed #fcd34d; padding: 16px; border-radius: 12px; margin: 16px 0;">
              <div style="font-weight: bold; color: #92400e; margin-bottom: 8px;">Chi tiết kiện hàng:</div>
              {{ITEMS_SUMMARY}}
              <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #fde68a; font-weight: bold; color: #b45309;">
                Tổng thanh toán: {{TOTAL}}đ
              </div>
            </div>
            <p style="font-size: 13px; color: #78716c;">Hotline hỗ trợ: <strong>{{SHOP_HOTLINE}}</strong></p>
          </div>`
        };
      }
    }

    const isDeposit = String(order.payment_method || "").toLowerCase().includes("deposit") || String(order.payment_method).includes("cọc");
    const totalAmount = Number(String(order.final_total).replace(/\D/g, "")) || 0;
    const depositPaid = isDeposit ? Math.min(shop.depositAmount, totalAmount) : totalAmount;
    const remainingCod = isDeposit ? Math.max(0, totalAmount - depositPaid) : 0;
    const paymentLabel = formatPaymentMethodLabel(order.payment_method);

    // Render danh sách sản phẩm
    let itemsSummaryHtml = body.data?.ITEMS_SUMMARY || body.itemsSummaryHtml;
    if (!itemsSummaryHtml) {
      const items = (itemsRes.data && itemsRes.data.length > 0) ? itemsRes.data : (body.cart || []);
      itemsSummaryHtml = items.length > 0
        ? items.map((it: { name: string; weight_label?: string; weightLabel?: string; quantity: number; line_total?: number; price?: number }) => {
            const qty = it.quantity || 1;
            const total = it.line_total ? Number(it.line_total) : (Number(it.price || 0) * qty);
            const weight = it.weight_label || it.weightLabel ? ` (${it.weight_label || it.weightLabel})` : "";
            return `
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px dashed #fde68a;">
                <span style="color: #292524; font-size: 14px;">• <strong>${it.name}</strong>${weight} <span style="color: #b45309; font-weight: 700;">x${qty}</span></span>
                <span style="font-weight: 700; color: #78350f; font-size: 14px;">${total.toLocaleString("vi-VN")}đ</span>
              </div>
            `;
          }).join("")
        : "Đặc sản Ninh Thuận thu hái tươi tại giàn";
    }

    let giftsHtml = "";
    if (order.payment_gift && order.payment_gift !== "Không áp dụng (COD)") {
      giftsHtml += `<div style="color: #047857; margin-top: 6px; font-size: 13.5px;">🎁 <strong>Quà tặng kèm:</strong> ${order.payment_gift}</div>`;
    }
    if (order.campaign_gifts) {
      giftsHtml += `<div style="color: #047857; margin-top: 4px; font-size: 13.5px;">🍇 <strong>Ưu đãi vườn:</strong> ${order.campaign_gifts}</div>`;
    }

    const templateVariables: Record<string, string> = {
      CUSTOMER_NAME: order.customer_name,
      customer_name: order.customer_name,
      ORDER_CODE: order.code,
      order_code: order.code,
      code: order.code,
      VOUCHER_CODE: body.data?.VOUCHER_CODE || order.code,
      voucher_code: body.data?.VOUCHER_CODE || order.code,
      ITEMS_SUMMARY: itemsSummaryHtml,
      TOTAL: totalAmount.toLocaleString("vi-VN") + "đ",
      FINAL_TOTAL: totalAmount.toLocaleString("vi-VN") + "đ",
      total_amount: totalAmount.toLocaleString("vi-VN") + "đ",
      PAYMENT_METHOD: paymentLabel,
      payment_method: paymentLabel,
      DEPOSIT_PAID: depositPaid.toLocaleString("vi-VN") + "đ",
      deposit_paid: depositPaid.toLocaleString("vi-VN") + "đ",
      REMAINING_COD: remainingCod.toLocaleString("vi-VN") + "đ",
      remaining_cod: remainingCod.toLocaleString("vi-VN") + "đ",
      ADDRESS: order.address,
      address: order.address,
      PHONE: order.phone,
      phone: order.phone,
      GIFTS_BLOCK: giftsHtml,
      gifts_block: giftsHtml,

      // Thông tin shop
      SHOP_NAME: shop.shopName,
      shop_name: shop.shopName,
      SHOP_ADDRESS: shop.shopAddress,
      shop_address: shop.shopAddress,
      SHOP_HOTLINE: shop.shopHotline,
      shop_hotline: shop.shopHotline,
      SHOP_WEBSITE: shop.shopWebsite,
      shop_website: shop.shopWebsite,
    };

    const finalSubject = renderTemplate(template.subject, templateVariables);
    const finalBody = renderTemplate(template.body, templateVariables);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: SENDER_EMAIL,
        to: [order.email],
        reply_to: REPLY_TO_EMAIL,
        subject: finalSubject,
        html: finalBody,
      }),
    });

    const resData = await res.json();
    if (!res.ok) {
      console.error("Resend API báo lỗi:", resData);
      return new Response(JSON.stringify({ error: resData }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, data: resData }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Lỗi Edge Function send-order-email:", errorMsg);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});