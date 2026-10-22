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

// 2. Biến môi trường hệ thống
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const SENDER_EMAIL =
  Deno.env.get("SENDER_EMAIL") || "Xứ Nắng Gió <donhang@xunanggio.com>";
const REPLY_TO_EMAIL =
  Deno.env.get("REPLY_TO_EMAIL") || "hotro@xunanggio.com";

const supabase = createClient(
  SUPABASE_URL ?? "",
  SUPABASE_SERVICE_ROLE_KEY ?? ""
);

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
  // Trả về CORS cho preflight request
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

    // 👉 NHÁNH 2: XỬ LÝ ĐƠN HÀNG THẬT (TỪ WEBHOOK HOẶC TRANG CHECKOUT)
    const targetCode = body.record?.code || body.order_code;
    if (!targetCode) {
      return new Response(
        JSON.stringify({ message: "Bỏ qua: Không tìm thấy mã đơn hàng" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const [orderRes, itemsRes, templateRes, configRes] = await Promise.all([
      supabase.from("orders").select("*").eq("code", targetCode).maybeSingle(),
      supabase.from("order_items").select("name, weight_label, quantity, price, line_total").eq("order_code", targetCode),
      supabase.from("email_templates").select("id, name, subject, body").eq("id", "tpl0001").eq("is_active", true).maybeSingle(),
      supabase.from("shop_config").select("deposit_amount, depositAmount").limit(1),
    ]);

    const order = orderRes.data || body.record;
    if (!order || !order.email || !order.email.includes("@")) {
      return new Response(
        JSON.stringify({ message: "Bỏ qua: Không có email người nhận hợp lệ" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!templateRes.data) {
      throw new Error("Không tìm thấy template tpl0001 đang kích hoạt");
    }

    const template = templateRes.data;
    const configData = configRes.data?.[0];
    const configuredDeposit = Number(configData?.deposit_amount ?? configData?.depositAmount ?? 100000);

    const isDeposit = String(order.payment_method || "").toLowerCase() === "deposit";
    const totalAmount = Number(order.final_total) || 0;
    const depositPaid = isDeposit ? Math.min(configuredDeposit, totalAmount) : totalAmount;
    const remainingCod = isDeposit ? Math.max(0, totalAmount - depositPaid) : 0;
    const paymentLabel = formatPaymentMethodLabel(order.payment_method);

    const items = itemsRes.data || [];
    const itemsSummaryHtml = items.length > 0
      ? items.map((it: { name: string; weight_label?: string; quantity: number; line_total: number }) => 
          `<div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <span>• ${it.name} ${it.weight_label ? `(${it.weight_label})` : ""} <strong>x${it.quantity}</strong></span>
            <span style="font-weight:600;">${Number(it.line_total).toLocaleString("vi-VN")}đ</span>
          </div>`
        ).join("")
      : "Đặc sản Ninh Thuận hái tươi tại giàn";

    let giftsHtml = "";
    if (order.payment_gift && order.payment_gift !== "Không áp dụng (COD)") {
      giftsHtml += `<div>• Quà thanh toán: <strong>${order.payment_gift}</strong></div>`;
    }
    if (order.campaign_gifts) {
      giftsHtml += `<div>• Quà khuyến mãi: <strong>${order.campaign_gifts}</strong></div>`;
    }

    const templateVariables: Record<string, string> = {
      CUSTOMER_NAME: order.customer_name || "Quý khách",
      ORDER_CODE: order.code,
      ITEMS_SUMMARY: itemsSummaryHtml,
      TOTAL: totalAmount.toLocaleString("vi-VN"),
      PAYMENT_METHOD: paymentLabel,
      ADDRESS: order.address || "",
      customer_name: order.customer_name || "Quý khách",
      code: order.code,
      order_code: order.code,
      total_amount: `${totalAmount.toLocaleString("vi-VN")}đ`,
      deposit_paid: `${depositPaid.toLocaleString("vi-VN")}đ`,
      remaining_cod: `${remainingCod.toLocaleString("vi-VN")}đ`,
      address: order.address || "",
      phone: order.phone || "",
      gifts_block: giftsHtml,
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
    return new Response(JSON.stringify(resData), {
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