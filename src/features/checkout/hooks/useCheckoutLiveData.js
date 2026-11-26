import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../infrastructure/cache/queryKeys";
import { checkoutProductIds, applyCheckoutPrices } from "../utils/checkoutPriceSync";
import { supabase } from "../../../infrastructure/supabase/supabaseClient";

export function useCheckoutLiveData({ cart, shopConfig, selectedGiftId, setSelectedGiftId, setAppliedVouchers }) {
  const client = useQueryClient();
  const productIds = checkoutProductIds(cart);
  const [priceChangeNotice, setPriceChangeNotice] = useState(null);
  const prices = useQuery({
    queryKey: queryKeys.checkoutPrices(productIds),
    enabled: productIds.length > 0,
    staleTime: 0,
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase.from("products")
        .select("id, name, base_price, in_stock, flavors, product_weights(*)")
        .in("id", productIds).abortSignal(signal);
      if (error) throw error;
      return data ?? [];
    },
  });
  // Keep legacy payment gift types supported by the existing selector.
  const gifts = useQuery({
    queryKey: queryKeys.checkoutGifts(),
    staleTime: 5 * 60_000,
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase.from("gifts").select("*")
        .order("id", { ascending: true }).abortSignal(signal);
      if (error) throw error;
      return data ?? [];
    },
  });
  const paymentGifts = useMemo(() => gifts.data ?? [], [gifts.data]);
  const syncedCart = useMemo(() => applyCheckoutPrices(cart, prices.data), [cart, prices.data]);
  useEffect(() => {
    if (syncedCart.some((item, index) => Number(item.price) !== Number(cart[index]?.price))) {
      setPriceChangeNotice("Giá một số sản phẩm trong giỏ vừa được đồng bộ cập nhật theo bảng giá mới nhất từ vườn.");
    }
  }, [syncedCart, cart]);
  useEffect(() => {
    if (gifts.isSuccess && selectedGiftId && !paymentGifts.some(g => g.id === selectedGiftId && g.is_active !== false && g.inStock !== false && g.active !== false)) {
      setSelectedGiftId("");
    }
  }, [gifts.isSuccess, paymentGifts, selectedGiftId, setSelectedGiftId]);
  useEffect(() => {
    let isMounted = true;
    const pending = new Set();
    let timer;
    const invalidate = kind => () => {
      if (!isMounted) return;
      const queryKey = kind === 'prices' ? queryKeys.checkoutPricesRoot() : queryKeys.checkoutGifts();
      void client.cancelQueries({ queryKey });
      void client.invalidateQueries({ queryKey, refetchType: 'none' });
      pending.add(kind);
      if (timer) return;
      timer = setTimeout(() => {
        timer = undefined;
        for (const key of pending) void client.invalidateQueries({ queryKey: key === 'prices' ? queryKeys.checkoutPricesRoot() : queryKeys.checkoutGifts() });
        pending.clear();
      }, 250);
    };
    const masterChannel = supabase.channel("master-checkout-realtime-listener")
      .on("postgres_changes", { event: "*", schema: "public", table: "gifts" }, invalidate('gifts'))
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, invalidate('prices'))
      .on("postgres_changes", { event: "*", schema: "public", table: "product_weights" }, invalidate('prices'))
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vouchers" },
        (payload) => {
          if (!isMounted) return;
          if (payload.eventType === "UPDATE") {
            setAppliedVouchers((prevApplied) =>
              prevApplied.map((v) => {
                if (v.code === payload.new.code) {
                  return {
                    ...v,
                    type: payload.new.type,
                    value: Number(payload.new.value) || 0,
                    percent:
                      payload.new.type === "percent"
                        ? Number(payload.new.value)
                        : undefined,
                    maxDiscount: Number(payload.new.max_discount ?? 0),
                    minOrder: Number(payload.new.min_order ?? 0),
                    canStack: Boolean(payload.new.can_stack),
                  };
                }
                return v;
              }),
            );
          } else if (payload.eventType === "DELETE") {
            setAppliedVouchers((prevApplied) =>
              prevApplied.filter((v) => v.code !== payload.old.code),
            );
          }
        },
      )
      .subscribe();
    return () => {
      isMounted = false;
      clearTimeout(timer);
      supabase.removeChannel(masterChannel);
    };
  }, [client, setAppliedVouchers]);
  return { syncedCart, paymentGifts, liveConfig: shopConfig, priceChangeNotice, setPriceChangeNotice, isSyncingPrice: prices.isFetching, priceSyncFailed: prices.isError };
}
