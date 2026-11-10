// supabase/functions/lookup-order/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RATE_LIMIT_WINDOW_SECS = 60;
const MAX_REQUESTS_PER_WINDOW = 5;

// Định nghĩa kiểu dữ liệu cho Body request gửi lên
interface LookupRequestBody {
  phone?: string;
  code?: string;
  tenant_id?: string;
}

// Định nghĩa kiểu dữ liệu hàng trả về từ bảng orders
interface OrderRecord {
  id: string;
  code: string;
  status: string;
  customer_name: string | null;
  customer_phone: string | null;
  shipping_address: string | null;
  created_at: string;
  items: unknown;
  total_amount: number;
}

// Định nghĩa kiểu dữ liệu sau khi che (mask) thông tin nhạy cảm
interface SanitizedOrderRecord extends Omit<OrderRecord, "customer_phone"> {
  customer_phone: string;
}

// Phản hồi pipeline của Upstash Redis REST
interface RedisCommandResult {
  result: number | null;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const upstashUrl = Deno.env.get("UPSTASH_REDIS_REST_URL");
const upstashToken = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  if (!upstashUrl || !upstashToken) {
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW };
  }

  const key = `rate_limit:lookup:${ip}`;

  const res = await fetch(`${upstashUrl}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${upstashToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, RATE_LIMIT_WINDOW_SECS],
    ]),
  });

  const data = (await res.json()) as [RedisCommandResult, unknown];
  const currentCount = data[0]?.result ?? 1;

  if (currentCount > MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - currentCount };
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const clientIp =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "127.0.0.1";

    const { allowed, remaining } = await checkRateLimit(clientIp);

    if (!allowed) {
      return new Response(
        JSON.stringify({
          error: "Thao tác quá nhanh. Vui lòng thử lại sau 1 phút để bảo vệ thông tin.",
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": `${RATE_LIMIT_WINDOW_SECS}`,
          },
        }
      );
    }

    const payload = (await req.json()) as Partial<LookupRequestBody>;
    const phone = payload.phone?.trim();
    const code = payload.code?.trim();
    const tenant_id = payload.tenant_id?.trim();

    if (!phone && !code) {
      return new Response(
        JSON.stringify({ error: "Vui lòng cung cấp mã đơn hàng hoặc số điện thoại." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let query = supabase
      .from("orders")
      .select("id, code, status, customer_name, customer_phone, shipping_address, created_at, items, total_amount");

    if (tenant_id) {
      query = query.eq("tenant_id", tenant_id);
    }

    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, "");
      query = query.or(`customer_phone.eq.${cleanPhone},phone.eq.${cleanPhone}`);
    } else if (code) {
      query = query.eq("code", code.toUpperCase());
    }

    const { data, error: dbError } = await query
      .order("created_at", { ascending: false })
      .limit(5);

    if (dbError) throw dbError;

    const orders = (data ?? []) as OrderRecord[];

    const sanitizedOrders: SanitizedOrderRecord[] = orders.map((o) => ({
      id: o.id,
      code: o.code,
      status: o.status,
      created_at: o.created_at,
      shipping_address: o.shipping_address,
      items: o.items,
      total_amount: o.total_amount,
      customer_name: o.customer_name,
      customer_phone: o.customer_phone
        ? o.customer_phone.replace(/(\d{3})\d+(\d{3})/, "$1****$2")
        : "",
    }));

    return new Response(
      JSON.stringify({
        data: sanitizedOrders,
        rateLimit: { remaining },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi xử lý tra cứu đơn hàng";

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});