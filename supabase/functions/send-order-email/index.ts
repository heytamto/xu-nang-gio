// supabase/functions/send-order-email/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response> | Response): void;
};

// 1. Khai báo CORS headers dùng chung cho mọi phản hồi
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// 2. Biến môi trường hệ thống & Khóa Service Role
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";

// Đọc key tùy chỉnh SERVICE_ROLE_KEY trước, fallback sang các biến mặc định
const SERVICE_KEY =
  Deno.env.get("SERVICE_ROLE_KEY") ||
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  Deno.env.get("SUPABASE_ANON_KEY") ||
  "";

const SENDER_EMAIL =
  Deno.env.get("SENDER_EMAIL") || "Xứ Nắng Gió <donhang@xunanggio.com>";
const REPLY_TO_EMAIL =
  Deno.env.get("REPLY_TO_EMAIL") || "hotro@xunanggio.com";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // 👉 NHÁNH 1: XỬ LÝ GỬI THỬ NGHIỆM (TEST EMAIL TỪ ADMIN)
    if (body.is_test && body.to) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: SENDER_EMAIL,
          to: [body.to],
          reply_to: REPLY_TO_EMAIL,
          subject: body.subject || "[TEST] Kiểm tra mẫu email Xứ Nắng Gió",
          html: body.html || "<p>Nội dung thử nghiệm</p>",
        }),
      });

      const resData = await res.json();
      return new Response(JSON.stringify(resData), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 👉 NHÁNH 2: XỬ LÝ ĐƠN HÀNG THẬT (TỪ APP.JSX HOẶC WEBHOOK)
    const targetCode = body.record?.code || body.order_code || body.data?.ORDER_CODE;
    if (!targetCode) {
      return new Response(
        JSON.stringify({ message: "Bỏ qua: Không tìm thấy mã đơn hàng" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestedTemplateId = body.template_id || "tpl0001";

    // Truy vấn song song dữ liệu từ Supabase
    const [orderRes, itemsRes, templateRes, configRes] = await Promise.all([
      supabase.from("orders").select("*").eq("code", targetCode).maybeSingle(),
      supabase.from("order_items").select("name, weight_label, quantity, price, line_total").eq("order_code", targetCode),
      supabase.from("email_templates").select("id, name, subject, body").eq("id", requestedTemplateId).eq("is_active", true).maybeSingle(),
      supabase.from("shop_config").select("*").limit(1),
    ]);

    // Dữ liệu đơn hàng: ưu tiên DB, fallback sang body từ client
    const dbOrder = orderRes.data;
    const order = {
      code: targetCode,
      customer_name: dbOrder?.customer_name || body.customer_name || body.data?.CUSTOMER_NAME || "Quý khách",
      email: dbOrder?.email || body.to || body.email || body.recipient_email || body.data?.CUSTOMER_EMAIL,
      phone: dbOrder?.phone || body.phone || body.data?.CUSTOMER_PHONE || "",
      address: dbOrder?.address || body.address || body.data?.SHIPPING_ADDRESS || "",
      payment_method: dbOrder?.payment_method || body.payment_method || body.data?.PAYMENT_METHOD || "deposit",
      payment_gift: dbOrder?.gift_title || dbOrder?.payment_gift || body.data?.GIFT_TITLE || "",
      campaign_gifts: dbOrder?.campaign_gifts || body.data?.CAMPAIGN_GIFTS || "",
      final_total: dbOrder?.final_total || body.final_total || body.data?.FINAL_TOTAL || 0,
      subtotal: dbOrder?.subtotal || body.subtotal || body.data?.SUBTOTAL || 0,
    };

    if (!order.email || typeof order.email !== "string" || !order.email.includes("@")) {
      return new Response(
        JSON.stringify({ message: "Bỏ qua: Không có email người nhận hợp lệ", emailReceived: order.email }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Đọc thông tin Shop từ bảng shop_config
    const configData = configRes.data?.[0] || {};
    const shopName = configData.shop_name || configData.shopName || "Nông Sản Xứ Nắng Gió";
    const shopAddress = configData.address || configData.shop_address || "Thôn Thái An, Xã Vĩnh Hải, Huyện Ninh Hải, Tỉnh Ninh Thuận";
    const shopHotline = configData.hotline || configData.phone || "0848.957.345";
    const shopWebsite = configData.website || "https://xunanggio.com";
    const configuredDeposit = Number(configData.deposit_amount ?? configData.depositAmount ?? 50000);

    // Kiểm tra Template
    if (!templateRes.data) {
      throw new Error(`Không tìm thấy template [${requestedTemplateId}] đang kích hoạt trong bảng email_templates`);
    }
    const template = templateRes.data;

    const isDeposit = String(order.payment_method || "").toLowerCase().includes("deposit") || String(order.payment_method).includes("cọc");
    const totalAmount = Number(String(order.final_total).replace(/\D/g, "")) || 0;
    const depositPaid = isDeposit ? Math.min(configuredDeposit, totalAmount) : totalAmount;
    const remainingCod = isDeposit ? Math.max(0, totalAmount - depositPaid) : 0;
    const paymentLabel = formatPaymentMethodLabel(order.payment_method);

    // Render danh sách sản phẩm
    const items = (itemsRes.data && itemsRes.data.length > 0) ? itemsRes.data : (body.cart || []);
    const itemsSummaryHtml = items.length > 0
      ? items.map((it: { name: string; weight_label?: string; weightLabel?: string; quantity: number; line_total?: number; price?: number }) => {
          const qty = it.quantity || 1;
          const total = it.line_total ? Number(it.line_total) : (Number(it.price || 0) * qty);
          const weight = it.weight_label || it.weightLabel;
          return `<div style="display:flex; justify-content:space-between; margin-bottom:6px; border-bottom:1px dashed #f0eee9; padding-bottom:4px;">
            <span>• <strong>${it.name}</strong> ${weight ? `(${weight})` : ""} x${qty}</span>
            <span style="font-weight:600; color:#78350f;">${total.toLocaleString("vi-VN")}đ</span>
          </div>`;
        }).join("")
      : "Đặc sản Ninh Thuận thu hái tươi tại giàn";

    let giftsHtml = "";
    if (order.payment_gift && order.payment_gift !== "Không áp dụng (COD)") {
      giftsHtml += `<div style="color:#047857; margin-top:4px;">🎁 <strong>Quà tặng kèm:</strong> ${order.payment_gift}</div>`;
    }
    if (order.campaign_gifts) {
      giftsHtml += `<div style="color:#047857; margin-top:2px;">🍇 <strong>Ưu đãi vườn:</strong> ${order.campaign_gifts}</div>`;
    }

    // Các biến thay thế cho template HTML
    const templateVariables: Record<string, string> = {
      CUSTOMER_NAME: order.customer_name,
      customer_name: order.customer_name,
      ORDER_CODE: order.code,
      order_code: order.code,
      code: order.code,
      ITEMS_SUMMARY: itemsSummaryHtml,
      TOTAL: totalAmount.toLocaleString("vi-VN"),
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

      // Thông tin shop từ shop_config
      SHOP_NAME: shopName,
      shop_name: shopName,
      SHOP_ADDRESS: shopAddress,
      shop_address: shopAddress,
      SHOP_HOTLINE: shopHotline,
      shop_hotline: shopHotline,
      SHOP_WEBSITE: shopWebsite,
      shop_website: shopWebsite,
    };

    const finalSubject = renderTemplate(template.subject, templateVariables);
    const finalBody = renderTemplate(template.body, templateVariables);

    // Gửi qua Resend API
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