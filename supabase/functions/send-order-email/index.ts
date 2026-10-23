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

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
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

type ShopConfigRecord = Record<string, unknown>;

function parseShopConfig(
  rawConfigs: Array<{ key: string; value: unknown }> | null
) {
  const configMap: Record<string, ShopConfigRecord> = {};
  (rawConfigs || []).forEach((row) => {
    let val = row.value;
    if (typeof val === "string") {
      try {
        val = JSON.parse(val);
      } catch {
        // bỏ qua nếu parse lỗi
      }
    }
    if (val && typeof val === "object" && !Array.isArray(val)) {
      configMap[row.key] = val as ShopConfigRecord;
    }
  });

  const generalData = configMap["general"] || configMap["general_config"] || {};
  const paymentData = configMap["payment"] || configMap["payment_config"] || {};
  const getString = (value: unknown, fallback: string) =>
    typeof value === "string" && value ? value : fallback;

  return {
    shopName: getString(generalData.brandName, getString(generalData.shop_name, "Xứ Nắng Gió")),
    shopAddress: getString(generalData.address, "Thôn Trường Sanh, Xã Phước Hậu, Tỉnh Ninh Thuận"),
    shopHotline: getString(generalData.hotline, getString(generalData.zaloPhone, "0848.957.345")),
    shopWebsite: getString(generalData.website, "https://xunanggio.com").replace(/\/+$/, ""),
    depositAmount: Number(paymentData.depositAmount ?? 50000),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // 1. Nhánh gửi trực tiếp HTML
    if ((body.is_test || body.html) && (body.to || body.email)) {
      const recipientEmail = body.to || body.email;
      let finalHtml = body.html || "<p>Nội dung thông báo</p>";
      let finalSubject = body.subject || "[Xứ Nắng Gió] Thông báo từ nhà vườn";

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

    // 2. Nhánh gửi theo Template
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
      discount: dbOrder?.discount || body.discount || body.data?.DISCOUNT || 0,
    };

    if (!order.email || typeof order.email !== "string" || !order.email.includes("@")) {
      return new Response(
        JSON.stringify({ message: "Bỏ qua: Không có email người nhận hợp lệ", emailReceived: order.email }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const shop = parseShopConfig(configRes.data);

    // 👉 TẠO LINK TRA CỨU ĐƠN HÀNG TRỰC TIẾP KÈM MÃ ĐƠN
    const trackingUrl = `${shop.shopWebsite}?lookup=${encodeURIComponent(order.code)}`;

    let template = templateRes.data;
    if (!template) {
      if (requestedTemplateId === "tpl0003") {
        template = {
          id: "tpl0003",
          name: "Email cảm ơn đánh giá",
          subject: "[Xứ Nắng Gió] Cảm ơn {{CUSTOMER_NAME}} đã đánh giá đơn #{{ORDER_CODE}} • Tặng bạn mã ưu đãi",
          body: `<div style="margin: 0 auto; padding: 24px; font-family: Arial, sans-serif; background: #ffffff; border-radius: 16px; border: 1px solid #fed7aa; max-width: 560px;">
            <h2 style="color: #78350f; margin-top: 0;">💛 Xứ Nắng Gió Cảm Ơn Bạn</h2>
            <p>Chào <strong>{{CUSTOMER_NAME}}</strong>,</p>
            <p>Nhà vườn rất trân trọng đánh giá của bạn cho đơn hàng <strong>#{{ORDER_CODE}}</strong>.</p>
            <div style="background: #fffbeb; border: 1.5px dashed #f59e0b; padding: 16px; border-radius: 12px; text-align: center; margin: 16px 0;">
              <p style="margin: 0; font-size: 13px; color: #92400e; font-weight: bold;">MÃ GIẢM GIÁ CHO ĐƠN HÀNG KẾ TIẾP:</p>
              <div style="font-size: 22px; font-weight: 900; font-family: monospace; color: #b45309; margin: 8px 0;">{{ORDER_CODE}}</div>
            </div>
            <p style="font-size: 13px; color: #78716c;">Hotline / Zalo: <strong>{{SHOP_HOTLINE}}</strong> • {{SHOP_ADDRESS}}</p>
          </div>`
        };
      } else {
        template = {
          id: "tpl0001",
          name: "Email xác nhận đơn hàng",
          subject: "[Xứ Nắng Gió] Xác nhận đơn hàng #{{ORDER_CODE}} • Cảm ơn {{CUSTOMER_NAME}}",
          body: `<div style="margin: 0 auto; padding: 24px; font-family: Arial, sans-serif; background: #ffffff; border-radius: 16px; border: 1px solid #fed7aa; max-width: 580px; color: #292524;">
            <h2 style="color: #78350f; margin-top: 0; font-size: 20px;">Chào {{CUSTOMER_NAME}},</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #44403c;">
              Nhà vườn trân trọng cảm ơn bạn đã đặt niềm tin nơi nông sản Ninh Thuận. Đơn hàng của bạn đã được ghi nhận trên hệ thống và chuẩn bị bước vào khâu chọn lọc cắt hái:
            </p>
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background: #fafaf9; border-left: 4px solid #b45309; border-radius: 12px; margin: 18px 0;">
              <tr>
                <td align="left" style="padding: 14px 18px; vertical-align: middle;">
                  <div style="font-size: 11px; font-weight: bold; color: #78716c; text-transform: uppercase;">MÃ TRA CỨU ĐƠN</div>
                  <div style="font-size: 16px; font-weight: 900; font-family: monospace; color: #b45309; margin-top: 4px;">#{{ORDER_CODE}}</div>
                </td>
                <td align="right" style="padding: 14px 18px; vertical-align: middle;">
                  <div style="font-size: 11px; font-weight: bold; color: #78716c; text-transform: uppercase;">HÌNH THỨC</div>
                  <div style="font-size: 13.5px; font-weight: bold; color: #292524; margin-top: 4px;">{{PAYMENT_METHOD}}</div>
                </td>
              </tr>
            </table>
            <div style="background: #fffbeb; border: 1.5px dashed #fcd34d; padding: 18px; border-radius: 14px; margin: 18px 0;">
              <div style="font-weight: 800; color: #92400e; font-size: 13px; text-transform: uppercase; margin-bottom: 12px;">CHI TIẾT KIỆN HÀNG NÔNG SẢN</div>
              {{ITEMS_SUMMARY}}
              {{GIFTS_BLOCK}}
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top: 14px; padding-top: 10px; border-top: 1.5px solid #fde68a;">
                <tr>
                  <td align="left" style="font-size: 14px; color: #57534e; font-weight: bold;">Tổng thanh toán:</td>
                  <td align="right" style="font-size: 18px; font-weight: 900; color: #b45309; font-family: monospace;">{{TOTAL}}</td>
                </tr>
                <tr>
                  <td align="left" style="font-size: 12.5px; color: #78716c; padding-top: 6px;">Tiền cọc thanh toán:</td>
                  <td align="right" style="font-size: 13px; font-weight: bold; color: #047857; padding-top: 6px;">{{DEPOSIT_PAID}}</td>
                </tr>
                <tr>
                  <td align="left" style="font-size: 12.5px; color: #78716c; padding-top: 4px;">Còn lại thu khi nhận (COD):</td>
                  <td align="right" style="font-size: 13px; font-weight: bold; color: #292524; padding-top: 4px;">{{REMAINING_COD}}</td>
                </tr>
                <tr>
                  <td align="left" style="font-size: 12px; color: #78716c; padding-top: 6px; vertical-align: top;">Địa chỉ giao:</td>
                  <td align="right" style="font-size: 12px; color: #44403c; padding-top: 6px; max-width: 320px;">{{ADDRESS}}</td>
                </tr>
              </table>
            </div>
            <div style="text-align: center; margin: 24px 0 16px 0;">
              <a href="{{TRACKING_URL}}" target="_blank" style="background: #b45309; color: #ffffff; text-decoration: none; padding: 12px 26px; border-radius: 12px; font-weight: bold; font-size: 13px; display: inline-block;">
                Tra Cứu Tiến Độ Kiện Hàng →
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #f5f5f4; margin: 20px 0;" />
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size: 12px; color: #78716c;">
              <tr>
                <td align="left">Thương mến,<br/><strong style="color: #78350f;">Đội ngũ Nhà Vườn {{SHOP_NAME}}</strong></td>
                <td align="right">Hotline / Zalo: <strong style="color: #292524;">{{SHOP_HOTLINE}}</strong></td>
              </tr>
            </table>
          </div>`
        };
      }
    } else {
      // Tự động ép đổi link nút bấm sang {{TRACKING_URL}} nếu template DB còn lưu link cũ
      if (template.body) {
        template.body = template.body
          .replaceAll('href="{{SHOP_WEBSITE}}"', 'href="{{TRACKING_URL}}"')
          .replaceAll('href="https://xunanggio.com"', 'href="{{TRACKING_URL}}"');
      }
    }

    const totalAmount = Number(String(order.final_total).replace(/\D/g, "")) || 0;

    // 👉 ƯU TIÊN SỐ TIỀN DO CLIENT TRUYỀN SANG ĐỂ TRÁNH TÍNH NHẦM THÀNH 0Đ
    let depositPaid = 0;
    let remainingCod = totalAmount;

    if (body.data?.DEPOSIT_PAID && body.data?.REMAINING_COD) {
      depositPaid = Number(String(body.data.DEPOSIT_PAID).replace(/\D/g, "")) || 0;
      remainingCod = Number(String(body.data.REMAINING_COD).replace(/\D/g, "")) || 0;
    } else if (body.deposit_paid !== undefined) {
      depositPaid = Number(body.deposit_paid) || 0;
      remainingCod = body.remaining_cod !== undefined ? Number(body.remaining_cod) : Math.max(0, totalAmount - depositPaid);
    } else {
      const rawMethod = String(
        body.payment_method ||
        body.paymentMethod ||
        dbOrder?.payment_method ||
        order.payment_method ||
        ""
      ).toLowerCase();

      const isDeposit = rawMethod === "deposit" || rawMethod.includes("cọc");
      const isFullPrepaid = rawMethod === "full_qr" || rawMethod.includes("100%");
      const isCod = rawMethod === "cod";

      if (isDeposit) {
        depositPaid = Math.min(shop.depositAmount, totalAmount);
        remainingCod = Math.max(0, totalAmount - depositPaid);
      } else if (isFullPrepaid) {
        depositPaid = totalAmount;
        remainingCod = 0;
      } else if (isCod) {
        depositPaid = 0;
        remainingCod = totalAmount;
      } else {
        // Fallback an toàn: Mặc định là cọc 50.000đ
        depositPaid = Math.min(shop.depositAmount, totalAmount);
        remainingCod = Math.max(0, totalAmount - depositPaid);
      }
    }

    const paymentLabel = body.data?.PAYMENT_METHOD || formatPaymentMethodLabel(order.payment_method);

    // 👉 RENDER DANH SÁCH MÓN DẠNG <table> (KHÔNG BỊ LỖI DÍNH CHỮ x160.000đ)
    let itemsSummaryHtml = body.data?.ITEMS_SUMMARY || body.itemsSummaryHtml;
    if (!itemsSummaryHtml) {
      const items = (itemsRes.data && itemsRes.data.length > 0) ? itemsRes.data : (body.cart || []);
      itemsSummaryHtml = items.length > 0
        ? items.map((it: { name: string; weight_label?: string; weightLabel?: string; quantity: number; line_total?: number; price?: number }) => {
            const qty = it.quantity || 1;
            const total = it.line_total ? Number(it.line_total) : (Number(it.price || 0) * qty);
            const weight = it.weight_label || it.weightLabel ? ` (${it.weight_label || it.weightLabel})` : "";
            return `
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 8px; border-bottom: 1px dashed #fde68a; padding-bottom: 6px;">
                <tr>
                  <td align="left" style="font-size: 13.5px; color: #292524; font-family: Arial, sans-serif;">
                    • <strong>${it.name}</strong>${weight} <span style="color: #b45309; font-weight: 700;">x${qty}</span>
                  </td>
                  <td align="right" style="font-size: 13.5px; font-weight: 700; color: #78350f; font-family: Arial, sans-serif; white-space: nowrap; padding-left: 12px;">
                    ${total.toLocaleString("vi-VN")}đ
                  </td>
                </tr>
              </table>
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

      // 👉 Cung cấp biến link tra cứu trực tiếp
      TRACKING_URL: trackingUrl,
      tracking_url: trackingUrl,

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
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});