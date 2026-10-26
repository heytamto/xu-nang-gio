// src/pages/PackingPage.jsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  PackageCheck, ArrowLeft, RefreshCw, Loader2, Layers, LogOut 
} from 'lucide-react';
import { ORDER_STATUS, normalizeOrderStatus, getOrderStatusLabel } from '../constants/orderStatus';
import { supabase } from '../supabaseClient';
import WarehousePinModal from '../components/packing/WarehousePinModal';
import PickingSummaryTab from '../components/packing/PickingSummaryTab';
import PackingOrderCard from '../components/packing/PackingOrderCard';
import { executeFastPrint } from '../utils/shippingLabelPrinter';

export default function PackingPage({ 
  orders: propOrders = [], 
  shopConfig = {}, 
  onNavigateHome 
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem('warehouse_authenticated') === 'true';
    } catch {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState('picking');
  const [warehouseOrders, setWarehouseOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [uploadingOrderCode, setUploadingOrderCode] = useState(null);
  const [previewImages, setPreviewImages] = useState({});

  const validWarehousePin = String(shopConfig?.warehousePin || '1234').trim();
  const configuredDeposit = Number(shopConfig?.depositAmount) || 50000;

  // Map tra cứu quà tặng
  const giftCatalogMap = useMemo(() => {
    const map = new Map();
    const giftsList = [
      ...(Array.isArray(shopConfig?.giftsCatalog) ? shopConfig.giftsCatalog : []),
      ...(Array.isArray(shopConfig?.paymentGifts) ? shopConfig.paymentGifts : [])
    ];
    giftsList.forEach((g) => {
      if (g?.id) map.set(String(g.id).trim(), String(g.title || g.name || g.id).trim());
    });
    return map;
  }, [shopConfig?.giftsCatalog, shopConfig?.paymentGifts]);

  const resolveGiftString = useCallback((str) => {
    if (!str) return '';
    return str.replace(/(gft\d+|gift_[a-zA-Z0-9_]+)/g, (matchedId) => giftCatalogMap.get(matchedId) || matchedId);
  }, [giftCatalogMap]);

  // Phân tích danh sách món cho từng đơn
  const parseOrderItems = useCallback((order) => {
    const items = [];

    if (Array.isArray(order.order_items) && order.order_items.length > 0) {
      order.order_items.forEach((oi) => {
        items.push({
          name: oi.name || oi.product_name || 'Đặc sản Ninh Thuận',
          spec: oi.weight_label || oi.spec || 'Tiêu chuẩn',
          quantity: Number(oi.quantity) || 1,
          isGift: Boolean(oi.is_gift)
        });
        if (oi.campaign_gift_title) {
          items.push({
            name: `[QUÀ TẶNG] ${oi.campaign_gift_title}`,
            spec: 'Quà quê tặng kèm',
            quantity: Number(oi.quantity) || 1,
            isGift: true
          });
        }
      });
    } else if (Array.isArray(order.cart) && order.cart.length > 0) {
      order.cart.forEach((c) => {
        items.push({
          name: c.name || c.product_name || 'Đặc sản Ninh Thuận',
          spec: c.weightLabel || c.unit || 'Tiêu chuẩn',
          quantity: Number(c.quantity) || 1,
          isGift: false
        });
        const giftId = c.campaign_gift;
        if (giftId) {
          const resolvedTitle = c.campaign_gift_title || giftCatalogMap.get(giftId) || giftId;
          items.push({
            name: `[QUÀ TẶNG] ${resolvedTitle}`,
            spec: 'Quà quê tặng kèm',
            quantity: Number(c.quantity) || 1,
            isGift: true
          });
        }
      });
    }

    const giftTitle = order.payment_gift || order.giftTitle || order.paymentGift;
    if (giftTitle && giftTitle !== 'Không áp dụng (COD)' && giftTitle.trim() !== '') {
      const resolvedPaymentGift = giftCatalogMap.get(giftTitle) || giftTitle;
      if (!items.some((it) => it.name.includes(resolvedPaymentGift))) {
        items.push({
          name: `[QUÀ TẶNG] ${resolvedPaymentGift}`,
          spec: 'Tặng kèm chuyển khoản',
          quantity: 1,
          isGift: true
        });
      }
    }

    const rawCampGifts = order.campaign_gifts || order.campaignGifts;
    if (rawCampGifts && typeof rawCampGifts === 'string') {
      rawCampGifts.split('|').forEach((gStr) => {
        const trimmedG = gStr.trim();
        if (trimmedG && !trimmedG.includes('Không áp dụng')) {
          const resolvedG = resolveGiftString(trimmedG);
          if (!items.some((it) => it.name.includes(resolvedG))) {
            items.push({
              name: resolvedG.startsWith('[QUÀ') ? resolvedG : `[QUÀ TẶNG] ${resolvedG}`,
              spec: 'Quà quê tặng kèm',
              quantity: 1,
              isGift: true
            });
          }
        }
      });
    }

    return items;
  }, [giftCatalogMap, resolveGiftString]);

  // Tính thông tin thu hộ
  const getCollectInfo = useCallback((order) => {
    const method = String(order.payment_method || order.paymentMethod || '').toLowerCase();
    const rawTotal = Number(order.final_total ?? order.total ?? order.totalAmount ?? 0);
    const depositPaidFromDb = Number(order.deposit_paid ?? 0);
    const isVerified = Boolean(order.payment_verified);

    if (method.includes('100%') || method.includes('full') || method === 'full_qr') {
      return {
        type: 'PAID_FULL',
        collectAmount: 0,
        badgeText: 'ĐÃ CHUYỂN 100% (Thu 0đ)',
        badgeStyle: 'text-emerald-900 bg-emerald-100 border-emerald-300 font-bold',
        printTitle: '✓ ĐÃ THANH TOÁN ĐỦ 100%',
        printSub: 'TUYỆT ĐỐI KHÔNG THU THÊM TIỀN'
      };
    }

    if (method.includes('cọc') || method.includes('deposit')) {
      const actualDeposit = depositPaidFromDb > 0 
        ? depositPaidFromDb 
        : (isVerified ? Math.min(configuredDeposit, rawTotal) : Math.min(configuredDeposit, rawTotal));
      const remaining = Math.max(0, rawTotal - actualDeposit);

      return {
        type: 'DEPOSIT_REMAINING',
        collectAmount: remaining,
        depositAmount: actualDeposit,
        badgeText: `ĐÃ CỌC ${actualDeposit.toLocaleString('vi-VN')}đ • THU CÒN LẠI: ${remaining.toLocaleString('vi-VN')}đ`,
        badgeStyle: 'text-amber-950 bg-amber-100 border-amber-300 font-bold',
        printTitle: `ĐÃ CỌC ${actualDeposit.toLocaleString('vi-VN')} đ (THU CÒN LẠI):`,
        printSub: `Tổng đơn: ${rawTotal.toLocaleString('vi-VN')}đ - Khách đã cọc: ${actualDeposit.toLocaleString('vi-VN')}đ`
      };
    }

    return {
      type: 'COD_FULL',
      collectAmount: rawTotal,
      badgeText: `THU HỘ COD 100%: ${rawTotal.toLocaleString('vi-VN')}đ`,
      badgeStyle: 'text-rose-950 bg-rose-100 border-rose-300 font-bold',
      printTitle: 'TIỀN THU HỘ TOÀN BỘ (COD):',
      printSub: 'Khách thanh toán 100% khi nhận kiện'
    };
  }, [configuredDeposit]);

  // Nạp đơn hàng từ Supabase
  const fetchPackableOrders = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const { data: ordersData, error: ordersErr } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersErr) throw ordersErr;
      if (!Array.isArray(ordersData) || ordersData.length === 0) {
        setWarehouseOrders([]);
        return;
      }

      const orderCodes = ordersData.map((o) => o.code).filter(Boolean);
      let itemsMap = {};

      if (orderCodes.length > 0) {
        const { data: itemsData, error: itemsErr } = await supabase
          .from('order_items')
          .select('*')
          .in('order_code', orderCodes);

        if (!itemsErr && Array.isArray(itemsData)) {
          itemsData.forEach((it) => {
            const key = it.order_code;
            if (!itemsMap[key]) itemsMap[key] = [];
            itemsMap[key].push(it);
          });
        }
      }

      setWarehouseOrders(ordersData.map((ord) => ({
        ...ord,
        order_items: itemsMap[ord.code] || ord.cart || []
      })));
    } catch (err) {
      console.error('Lỗi tải đơn hàng kho:', err);
      if (Array.isArray(propOrders) && propOrders.length > 0) setWarehouseOrders(propOrders);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, propOrders]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchPackableOrders();

    const channel = supabase
      .channel('public:orders:warehouse-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchPackableOrders)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, fetchPackableOrders]);

  // Upload ảnh đóng thùng
  const handleUploadPackingPhoto = async (orderCode, file) => {
    if (!file) return;
    setUploadingOrderCode(orderCode);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${orderCode}_${Date.now()}.${fileExt}`;
      const filePath = `packing/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('order-deliveries')
        .upload(filePath, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: publicUrlData } = supabase.storage
        .from('order-deliveries')
        .getPublicUrl(filePath);

      const imageUrl = publicUrlData?.publicUrl;

      const { error: updateErr } = await supabase
        .from('orders')
        .update({
          packing_image: imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('code', orderCode);

      if (updateErr) throw updateErr;

      setWarehouseOrders((prev) =>
        prev.map((o) => (o.code === orderCode ? { ...o, packing_image: imageUrl } : o))
      );
      setPreviewImages((prev) => ({ ...prev, [orderCode]: imageUrl }));
    } catch (err) {
      console.error('Lỗi upload ảnh đóng hàng:', err);
      alert('Không thể tải ảnh lên: ' + err.message);
    } finally {
      setUploadingOrderCode(null);
    }
  };

  // Cập nhật trạng thái đơn hàng
  const handleUpdateStatus = async (orderCode, targetStatusCode) => {
    const finalLabel = getOrderStatusLabel(targetStatusCode);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: finalLabel,
          updated_at: new Date().toISOString()
        })
        .eq('code', orderCode);

      if (error) throw error;
      await fetchPackableOrders();
    } catch (err) {
      alert('Không thể cập nhật trạng thái đơn: ' + err.message);
    }
  };

  // Checkbox picking state
  const [pickedItems, setPickedItems] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('warehouse_picked_items') || '{}'); } catch { return {}; }
  });
  const [checkedBoxItems, setCheckedBoxItems] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('warehouse_checked_box_items') || '{}'); } catch { return {}; }
  });

  useEffect(() => {
    try { sessionStorage.setItem('warehouse_picked_items', JSON.stringify(pickedItems)); } catch (e) {}
  }, [pickedItems]);

  useEffect(() => {
    try { sessionStorage.setItem('warehouse_checked_box_items', JSON.stringify(checkedBoxItems)); } catch (e) {}
  }, [checkedBoxItems]);

  const packableOrders = useMemo(() => {
    return warehouseOrders.filter((o) => {
      const statusCode = normalizeOrderStatus(o.status);
      return statusCode === ORDER_STATUS.CONFIRMED || statusCode === ORDER_STATUS.PACKING;
    });
  }, [warehouseOrders]);

  // Gom hàng tổng hợp
  const pickingSummary = useMemo(() => {
    const summary = {};
    packableOrders.forEach((ord) => {
      parseOrderItems(ord).forEach((item) => {
        const key = `${item.name} (${item.spec})`;
        if (!summary[key]) {
          summary[key] = { key, name: item.name, spec: item.spec, quantity: 0, isGift: item.isGift };
        }
        summary[key].quantity += item.quantity;
      });
    });
    return Object.values(summary).sort((a, b) => b.quantity - a.quantity);
  }, [packableOrders, parseOrderItems]);

  if (!isAuthenticated) {
    return (
      <WarehousePinModal
        validPin={validWarehousePin}
        onAuthenticated={() => {
          setIsAuthenticated(true);
          sessionStorage.setItem('warehouse_authenticated', 'true');
        }}
      />
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 font-sans text-stone-800">
      <div className="sticky top-0 z-40 bg-[#faf8f5]/95 backdrop-blur-md pt-3 pb-3">
        <header className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/90 shadow-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <button
                type="button"
                onClick={onNavigateHome}
                className="p-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                title="Về Trang Chủ"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <PackageCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-2xl font-black text-stone-900">Khu Vực Soạn & Đóng Thùng Xốp</h1>
                  {isLoading && <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />}
                </div>
                <p className="text-xs sm:text-sm text-stone-600 font-normal mt-0.5">
                  Có <strong className="text-amber-800 font-mono text-base">{packableOrders.length}</strong> đơn hợp lệ chờ đóng thùng
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {packableOrders.length > 0 && (
                <button
                  type="button"
                  onClick={() => executeFastPrint(packableOrders, shopConfig, getCollectInfo, parseOrderItems, `In ${packableOrders.length} Tem Gửi Hàng`)}
                  className="flex items-center gap-2 px-5 py-3 bg-stone-900 hover:bg-amber-800 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-sm active:scale-95 cursor-pointer transition-colors"
                >
                  <Layers className="w-4 h-4" />
                  <span>In Hết ({packableOrders.length} Tem)</span>
                </button>
              )}
              <button
                type="button"
                onClick={fetchPackableOrders}
                className="p-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-600 active:scale-95 cursor-pointer transition-colors"
                title="Làm mới dữ liệu từ Supabase"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => {
                  sessionStorage.removeItem('warehouse_authenticated');
                  setIsAuthenticated(false);
                }}
                className="p-3 rounded-2xl bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-600 border border-stone-200/80 transition-colors cursor-pointer"
                title="Khóa lại giao diện kho"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="bg-stone-100/90 p-1.5 rounded-2xl grid grid-cols-2 gap-2 border border-stone-200/50">
            <button
              type="button"
              onClick={() => setActiveTab('picking')}
              className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold cursor-pointer flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'picking' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>📋 Bảng Soạn Hàng Tổng Hợp</span>
              <span className="text-xs font-mono bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full font-bold">
                {pickingSummary.filter((it) => pickedItems[it.key]).length}/{pickingSummary.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold cursor-pointer flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'orders' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>📦 Danh Sách Đóng Kiện</span>
              <span className="text-xs font-mono bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full font-bold">
                {packableOrders.length}
              </span>
            </button>
          </div>
        </header>
      </div>

      <div className="space-y-6 pt-3">
        {activeTab === 'picking' && (
          <PickingSummaryTab
            pickingSummary={pickingSummary}
            pickedItems={pickedItems}
            onTogglePickedItem={(key) => setPickedItems((prev) => ({ ...prev, [key]: !prev[key] }))}
            onResetTicks={() => setPickedItems({})}
          />
        )}

        {activeTab === 'orders' && (
          <div className="space-y-5">
            {packableOrders.length === 0 ? (
              <div className="p-16 text-center bg-white rounded-3xl border border-stone-200 text-stone-500 text-sm">
                Hiện không có đơn nào ở trạng thái chờ đóng.
              </div>
            ) : (
              packableOrders.map((ord) => {
                const orderCode = ord.code || ord.orderId;
                const collectInfo = getCollectInfo(ord);
                const items = parseOrderItems(ord);

                return (
                  <PackingOrderCard
                    key={orderCode}
                    order={ord}
                    collectInfo={collectInfo}
                    items={items}
                    checkedBoxItems={checkedBoxItems}
                    onToggleBoxItem={(idx) => {
                      const key = `${orderCode}_${idx}`;
                      setCheckedBoxItems((prev) => ({ ...prev, [key]: !prev[key] }));
                    }}
                    onPrintSingle={() => executeFastPrint([ord], shopConfig, getCollectInfo, parseOrderItems, `Tem_${orderCode}`)}
                    onUpdateStatus={(targetStatusCode) => handleUpdateStatus(orderCode, targetStatusCode)}
                    onUploadPhoto={(file) => handleUploadPackingPhoto(orderCode, file)}
                    isUploading={uploadingOrderCode === orderCode}
                    packingImageUrl={previewImages[orderCode] || ord.packing_image}
                  />
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}