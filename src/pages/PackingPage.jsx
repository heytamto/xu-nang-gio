// src/pages/PackingPage.jsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  PackageCheck, Printer, 
  CheckCircle2, Lock, ArrowLeft, Banknote, 
  ShieldCheck, AlertCircle, Gift, Check, RotateCcw,
  Layers, Package, LogOut, RefreshCw, Loader2
} from 'lucide-react';
import { 
  ORDER_STATUS, 
  normalizeOrderStatus, 
  getOrderStatusLabel 
} from '../constants/orderStatus';
import { supabase } from '../supabaseClient';

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

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [activeTab, setActiveTab] = useState('picking');

  const [warehouseOrders, setWarehouseOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const validWarehousePin = String(shopConfig?.warehousePin || '1234').trim();
  const depositConfigAmount = Number(shopConfig?.depositAmount) || 100000;

  // Map tra cứu quà tặng từ catalog (Fallback nếu đơn chỉ lưu ID quà)
  const giftCatalogMap = useMemo(() => {
    const map = new Map();
    const giftsList = [
      ...(Array.isArray(shopConfig?.giftsCatalog) ? shopConfig.giftsCatalog : []),
      ...(Array.isArray(shopConfig?.paymentGifts) ? shopConfig.paymentGifts : [])
    ];
    giftsList.forEach((g) => {
      if (g && g.id) {
        map.set(String(g.id).trim(), String(g.title || g.name || g.id).trim());
      }
    });
    return map;
  }, [shopConfig?.giftsCatalog, shopConfig?.paymentGifts]);

  const resolveGiftString = (str) => {
    if (!str) return '';
    return str.replace(/(gft\d+|gift_[a-zA-Z0-9_]+)/g, (matchedId) => {
      return giftCatalogMap.get(matchedId) || matchedId;
    });
  };

  // 1. TẢI ĐƠN HÀNG HỢP LỆ TRỰC TIẾP TỪ SUPABASE
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

      // Kéo chi tiết order_items tương ứng theo order_code
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

      const merged = ordersData.map((ord) => ({
        ...ord,
        order_items: itemsMap[ord.code] || ord.cart || []
      }));

      setWarehouseOrders(merged);
    } catch (err) {
      console.error('Lỗi tải đơn hàng kho:', err);
      if (Array.isArray(propOrders) && propOrders.length > 0) {
        setWarehouseOrders(propOrders);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, propOrders]);

  // Realtime subscription từ Supabase
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchPackableOrders();

    const channel = supabase
      .channel('public:orders:warehouse-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchPackableOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, fetchPackableOrders]);

  // Cập nhật trạng thái đơn hàng (Tự map qua getOrderStatusLabel)
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

  // State lưu vết checklist
  const [pickedItems, setPickedItems] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('warehouse_picked_items') || '{}');
    } catch {
      return {};
    }
  });

  const [checkedBoxItems, setCheckedBoxItems] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('warehouse_checked_box_items') || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('warehouse_picked_items', JSON.stringify(pickedItems));
    } catch (e) {
      console.error(e);
    }
  }, [pickedItems]);

  useEffect(() => {
    try {
      sessionStorage.setItem('warehouse_checked_box_items', JSON.stringify(checkedBoxItems));
    } catch (e) {
      console.error(e);
    }
  }, [checkedBoxItems]);

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput.trim() === validWarehousePin) {
      setIsAuthenticated(true);
      setPinError(false);
      sessionStorage.setItem('warehouse_authenticated', 'true');
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleLogoutWarehouse = () => {
    sessionStorage.removeItem('warehouse_authenticated');
    setIsAuthenticated(false);
    setPinInput('');
  };

  const togglePickedItem = (key) => {
    setPickedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleBoxItem = (orderCode, itemIdx) => {
    const key = `${orderCode}_${itemIdx}`;
    setCheckedBoxItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleResetPickingTicks = () => {
    setPickedItems({});
  };

  // Lọc chính xác các đơn "Đã xác nhận" và "Đang đóng gói" bằng normalizeOrderStatus
  const packableOrders = useMemo(() => {
    return warehouseOrders.filter((o) => {
      const statusCode = normalizeOrderStatus(o.status);
      return statusCode === ORDER_STATUS.CONFIRMED || statusCode === ORDER_STATUS.PACKING;
    });
  }, [warehouseOrders]);

  // Tính số tiền cần thu khi giao hàng
  const getCollectInfo = (order) => {
    const method = String(order.payment_method || order.paymentMethod || '').toLowerCase();
    const rawTotal = Number(order.final_total ?? order.total ?? order.totalAmount ?? 0);

    if (method.includes('100%') || method.includes('full') || method === 'full_qr') {
      return {
        type: 'PAID_FULL',
        collectAmount: 0,
        badgeText: 'ĐÃ CHUYỂN 100% (Thu 0đ)',
        badgeStyle: 'text-emerald-800 bg-emerald-50 border-emerald-300',
        printTitle: '✓ ĐÃ THANH TOÁN ĐỦ 100%',
        printSub: 'TUYỆT ĐỐI KHÔNG THU THÊM TIỀN'
      };
    }

    if (method.includes('cọc') || method.includes('deposit')) {
      const deposit = depositConfigAmount;
      const remaining = Math.max(0, rawTotal - deposit);
      return {
        type: 'DEPOSIT_REMAINING',
        collectAmount: remaining,
        depositAmount: deposit,
        badgeText: `ĐÃ CỌC ${deposit.toLocaleString('vi-VN')}đ • THU: ${remaining.toLocaleString('vi-VN')}đ`,
        badgeStyle: 'text-amber-900 bg-amber-50 border-amber-300',
        printTitle: `ĐÃ CỌC ${deposit.toLocaleString('vi-VN')} đ (THU CÒN LẠI):`,
        printSub: `Tổng đơn: ${rawTotal.toLocaleString('vi-VN')}đ - Khách đã cọc: ${deposit.toLocaleString('vi-VN')}đ`
      };
    }

    return {
      type: 'COD_FULL',
      collectAmount: rawTotal,
      badgeText: `THU HỘ COD 100%: ${rawTotal.toLocaleString('vi-VN')}đ`,
      badgeStyle: 'text-rose-900 bg-rose-50 border-rose-300',
      printTitle: 'TIỀN THU HỘ TOÀN BỘ (COD):',
      printSub: 'Khách thanh toán 100% khi nhận kiện'
    };
  };

  // Phân tích chi tiết danh sách món kèm quà tặng
  const parseOrderItems = (order) => {
    const items = [];

    // 1. Mảng quan hệ 3NF order_items
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
    }
    // 2. Mảng cart từ client
    else if (Array.isArray(order.cart) && order.cart.length > 0) {
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
    // 3. Fallback chuỗi itemsSummary
    else if (order.itemsSummary && typeof order.itemsSummary === 'string') {
      const parts = order.itemsSummary.split(',');
      parts.forEach((str) => {
        const trimmed = str.trim();
        if (!trimmed) return;

        const matchQty = trimmed.match(/x\s*(\d+)\s*$/i);
        const qty = matchQty ? Number(matchQty[1]) : 1;

        let rawName = matchQty ? trimmed.replace(/x\s*\d+\s*$/i, '').trim() : trimmed;
        rawName = rawName.replace(/:\s*[\d.]+\s*(đ|vnd)?\s*$/i, '').trim();

        let spec = 'Theo đơn';
        const specMatch = rawName.match(/\(([^)]+)\)$/);
        if (specMatch) {
          spec = specMatch[1];
        }

        if (rawName) {
          items.push({
            name: rawName,
            spec: spec,
            quantity: qty,
            isGift: false
          });
        }
      });
    }

    // Quà tặng thanh toán
    const giftTitle = order.payment_gift || order.giftTitle || order.paymentGift;
    if (giftTitle && giftTitle !== 'Không áp dụng (COD)' && giftTitle.trim() !== '') {
      const resolvedPaymentGift = giftCatalogMap.get(giftTitle) || giftTitle;
      const isAlreadyAdded = items.some((it) => it.name.includes(resolvedPaymentGift));
      if (!isAlreadyAdded) {
        items.push({
          name: `[QUÀ TẶNG] ${resolvedPaymentGift}`,
          spec: 'Tặng kèm chuyển khoản',
          quantity: 1,
          isGift: true
        });
      }
    }

    // Quà combo chiến dịch
    const rawCampGifts = order.campaign_gifts || order.campaignGifts;
    if (rawCampGifts && typeof rawCampGifts === 'string') {
      const campGifts = rawCampGifts.split('|');
      campGifts.forEach((gStr) => {
        const trimmedG = gStr.trim();
        if (trimmedG && !trimmedG.includes('Không áp dụng')) {
          const resolvedG = resolveGiftString(trimmedG);
          const isAlreadyIn = items.some((it) => it.name.includes(resolvedG));
          if (!isAlreadyIn) {
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
  };

  const pickingSummary = useMemo(() => {
    const summary = {};
    packableOrders.forEach((ord) => {
      const items = parseOrderItems(ord);
      items.forEach((item) => {
        const key = `${item.name} (${item.spec})`;
        if (!summary[key]) {
          summary[key] = {
            key,
            name: item.name,
            spec: item.spec,
            quantity: 0,
            isGift: item.isGift
          };
        }
        summary[key].quantity += item.quantity;
      });
    });
    return Object.values(summary).sort((a, b) => b.quantity - a.quantity);
  }, [packableOrders, giftCatalogMap]);

  const completedPickingCount = useMemo(() => {
    return pickingSummary.filter((it) => pickedItems[it.key]).length;
  }, [pickingSummary, pickedItems]);

  const renderSingleShippingLabelHtml = (order) => {
    const orderCode = order.code || order.orderId;
    const collectInfo = getCollectInfo(order);
    const allItems = parseOrderItems(order);

    const MAX_ITEMS = 6;
    const visibleItems = allItems.slice(0, MAX_ITEMS);
    const hasMoreItems = allItems.length > MAX_ITEMS;
    const cleanNote = String(order.customer_note || order.note || '').trim();

    const itemsRowsHtml = visibleItems.map((it, idx) => `
      <tr style="${it.isGift ? 'background: #fffbeb;' : ''}">
        <td style="text-align: center; font-weight: bold; border-right: 1px solid #000; padding: 4px 2px;">${idx + 1}</td>
        <td style="padding: 4px 6px; border-right: 1px solid #000; font-weight: bold;">
          ${it.name}
          <div style="font-size: 10px; font-weight: normal; color: ${it.isGift ? '#b45309' : '#333'};">${it.spec}</div>
        </td>
        <td style="text-align: center; font-weight: 900; font-family: monospace; font-size: 15px; padding: 4px 2px;">
          x${it.quantity}
        </td>
      </tr>
    `).join('');

    return `
      <div class="shipping-card-page">
        <div class="shipping-card">
          <div class="header-grid">
            <div class="shop-box">
              <h1 class="shop-title">☀ XỨ NẮNG GIÓ</h1>
              <div class="shop-sub">Đặc sản Phan Rang gửi xe</div>
            </div>
            <div class="code-box">
              <div class="order-code">${orderCode}</div>
              <div class="barcode-line">|||||||||||||||</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="sender-box">
              <strong>Người gửi:</strong> Xứ Nắng Gió • Hotline: <strong>${shopConfig.hotline || '0848.957.345'}</strong><br/>
              <strong>Địa chỉ gửi:</strong> ${shopConfig.address || 'Thôn Thái An, Xã Vĩnh Hải, Ninh Hải, Ninh Thuận'}
            </div>

            <div class="recipient-box">
              <div style="font-size: 9.5px; font-weight: 800; color: #555; text-transform: uppercase;">NGƯỜI NHẬN HÀNG:</div>
              <div class="recipient-name-phone">
                <span class="recipient-name">${order.customer_name || order.name || order.customerName || ''}</span>
                <span class="recipient-phone">${order.phone || ''}</span>
              </div>
              <div class="recipient-address">
                <strong>Điểm giao / Bến xe:</strong> ${order.address || ''}
              </div>
            </div>
          </div>

          <div class="items-wrapper">
            <div class="items-title">
              <span>NỘI DUNG ĐÓNG THÙNG XỐP</span>
              <span>TỔNG: ${allItems.length} MÓN</span>
            </div>
            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 28px; border-right: 1px solid #000;">STT</th>
                  <th style="text-align: left; padding-left: 6px; border-right: 1px solid #000;">Tên Sản Phẩm / Quy Cách</th>
                  <th style="width: 45px;">SL</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRowsHtml}
              </tbody>
            </table>

            ${hasMoreItems ? `
              <div class="alert-hidden">
                * Một số sản phẩm bị ẩn do danh sách quá dài (Xem chi tiết trên hệ thống)
              </div>
            ` : ''}

            ${cleanNote ? `
              <div class="note-box">
                <strong>* Ghi chú khách:</strong> ${cleanNote}
              </div>
            ` : ''}
          </div>

          ${collectInfo.type === 'PAID_FULL' ? `
            <div class="payment-block paid-block">
              <div style="font-size: 14px; font-weight: 900;">${collectInfo.printTitle}</div>
              <div style="font-size: 11px; color: #444; margin-top: 2px;">${collectInfo.printSub}</div>
            </div>
          ` : `
            <div class="payment-block cod-block">
              <div class="cod-label">${collectInfo.printTitle}</div>
              <div class="cod-price">${collectInfo.collectAmount.toLocaleString('vi-VN')} đ</div>
              <div class="cod-sub">${collectInfo.printSub}</div>
            </div>
          `}

          <div class="footer-box">
            ⚡ HÀNG NÔNG SẢN TƯƠI - XIN TRÁNH NẮNG NÓNG ⚡
          </div>
        </div>
      </div>
    `;
  };

  const executeFastPrint = (ordersToPrint, title = 'In Tem') => {
    if (!ordersToPrint || ordersToPrint.length === 0) return;

    const cardsHtml = ordersToPrint.map(ord => renderSingleShippingLabelHtml(ord)).join('');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Trình duyệt đang chặn Popup. Vui lòng cho phép popup để in tem!');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            @page {
              size: 100mm 150mm;
              margin: 0;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              margin: 0;
              padding: 0;
              background: #fff;
              color: #000;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            }
            .shipping-card-page {
              width: 100mm;
              height: 150mm;
              padding: 4mm;
              page-break-after: always;
              break-after: page;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .shipping-card-page:last-child {
              page-break-after: auto;
              break-after: auto;
            }
            .shipping-card {
              border: 2px solid #000;
              width: 92mm;
              height: 142mm;
              display: flex;
              flex-direction: column;
            }
            .header-grid {
              display: grid;
              grid-template-columns: 1fr 1.1fr;
              border-bottom: 2px solid #000;
              background: #fbfbfb;
            }
            .shop-box {
              padding: 6px;
              border-right: 1.5px solid #000;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
            .shop-title {
              font-size: 14px;
              font-weight: 900;
              text-transform: uppercase;
              margin: 0;
              letter-spacing: 0.5px;
            }
            .shop-sub {
              font-size: 9.5px;
              color: #333;
              margin-top: 2px;
              font-weight: 600;
            }
            .code-box {
              padding: 6px;
              text-align: center;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
            .order-code {
              font-family: "Courier New", Courier, monospace;
              font-size: 19px;
              font-weight: 900;
              letter-spacing: 1.5px;
            }
            .barcode-line {
              font-family: "Courier New", monospace;
              font-size: 15px;
              font-weight: 900;
              letter-spacing: 3px;
              line-height: 1;
              margin-top: 1px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr;
              border-bottom: 2px solid #000;
            }
            .sender-box {
              padding: 4px 8px;
              border-bottom: 1px dashed #777;
              font-size: 11px;
              line-height: 1.35;
              background: #fafafa;
            }
            .recipient-box {
              padding: 6px 8px;
            }
            .recipient-name-phone {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 3px;
            }
            .recipient-name {
              font-size: 16px;
              font-weight: 900;
            }
            .recipient-phone {
              font-family: "Courier New", Courier, monospace;
              font-size: 17px;
              font-weight: 900;
              background: #000;
              color: #fff;
              padding: 1px 7px;
              border-radius: 4px;
            }
            .recipient-address {
              font-size: 12px;
              font-weight: 600;
              line-height: 1.35;
            }
            .items-wrapper {
              flex: 1;
              display: flex;
              flex-direction: column;
              border-bottom: 2px solid #000;
              overflow: hidden;
            }
            .items-title {
              padding: 4px 8px;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              background: #f0f0f0;
              border-bottom: 1px solid #000;
              display: flex;
              justify-content: space-between;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11.5px;
            }
            .items-table th {
              border-bottom: 1px solid #000;
              font-size: 10px;
              padding: 3px;
              background: #fafafa;
            }
            .items-table td {
              border-bottom: 1px dashed #ddd;
            }
            .alert-hidden {
              font-size: 10px;
              color: #b91c1c;
              font-style: italic;
              font-weight: bold;
              padding: 3px 6px;
              text-align: center;
              background: #fef2f2;
            }
            .note-box {
              padding: 3px 8px;
              font-size: 10.5px;
              font-style: italic;
              color: #1e3a8a;
              background: #eff6ff;
              border-top: 1px dashed #bfdbfe;
            }
            .payment-block {
              border-bottom: 2px solid #000;
              text-align: center;
              padding: 8px 6px;
            }
            .cod-block {
              background: #000;
              color: #fff;
            }
            .cod-label {
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 0.5px;
            }
            .cod-price {
              font-size: 26px;
              font-weight: 900;
              font-family: "Courier New", Courier, monospace;
              line-height: 1.1;
              margin: 2px 0;
            }
            .cod-sub {
              font-size: 10px;
              opacity: 0.9;
            }
            .paid-block {
              background: #f5f5f5;
              padding: 12px 6px;
            }
            .footer-box {
              padding: 5px;
              text-align: center;
              font-size: 10.5px;
              font-weight: 900;
              text-transform: uppercase;
              background: #fff;
            }
          </style>
        </head>
        <body>
          ${cardsHtml}
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(function() {
                window.close();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 font-sans animate-fadeIn">
        <form onSubmit={handlePinSubmit} className="bg-white p-7 rounded-3xl border border-stone-200/90 shadow-xl max-w-sm w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-base font-black text-stone-900">Mã PIN Kho Đóng Hàng</h2>
          <p className="text-xs text-stone-500">Nhập mã PIN kho để mở bảng gom nông sản & in tem giao nhà xe</p>
          <input
            type="password"
            maxLength={8}
            value={pinInput}
            autoFocus
            onChange={(e) => {
              setPinInput(e.target.value);
              if (pinError) setPinError(false);
            }}
            placeholder="Nhập mã PIN kho"
            className="w-full text-center text-lg tracking-widest font-mono py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-amber-600 focus:outline-none font-black"
          />
          {pinError && <p className="text-xs text-rose-600 font-semibold">Mã PIN không đúng, thử lại!</p>}
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-amber-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Mở Bảng Đóng Hàng
          </button>
        </form>
      </div>
    );
  }

  // GIAO DIỆN KHO ĐÓNG GÓI KHI ĐÃ ĐĂNG NHẬP
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 font-sans">
      
      {/* KHỐI HEADER ĐƯỢC FIX CỨNG BẰNG STICKY TOP-0 (ĐỒNG BỘ Y HỆT TRANG ADMIN) */}
      <div className="sticky top-0 z-40 bg-[#faf8f5]/95 backdrop-blur-md pt-3 pb-3">
        <header className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-md space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onNavigateHome}
                className="p-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                title="Về Trang Chủ"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <PackageCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black text-stone-900">Khu Vực Soạn & Đóng Thùng Xốp</h1>
                  {isLoading && <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />}
                </div>
                <p className="text-xs text-stone-500">
                  Có <strong className="text-amber-800 font-mono">{packableOrders.length}</strong> đơn hợp lệ chờ đóng thùng
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {packableOrders.length > 0 && (
                <button
                  type="button"
                  onClick={() => executeFastPrint(packableOrders, `In ${packableOrders.length} Tem Gửi Hàng`)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-stone-900 hover:bg-amber-800 text-white text-xs font-bold rounded-2xl shadow-sm active:scale-95 cursor-pointer transition-colors"
                  title="In hàng loạt tất cả tem chờ đóng"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>In Hết ({packableOrders.length} Tem)</span>
                </button>
              )}
              <button
                type="button"
                onClick={fetchPackableOrders}
                className="p-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-600 active:scale-95 cursor-pointer transition-colors"
                title="Làm mới dữ liệu từ Supabase"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleLogoutWarehouse}
                className="p-2.5 rounded-2xl bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-600 border border-stone-200/80 transition-colors cursor-pointer"
                title="Khóa lại giao diện kho"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2 Tab chuyển đổi */}
          <div className="bg-stone-100/90 p-1.5 rounded-2xl grid grid-cols-2 gap-2 border border-stone-200/50">
            <button
              type="button"
              onClick={() => setActiveTab('picking')}
              className={`py-2 px-3 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'picking' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>📋 Bảng Soạn Hàng Tổng Hợp</span>
              <span className="text-[10.5px] font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                {completedPickingCount}/{pickingSummary.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`py-2 px-3 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'orders' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>📦 Danh Sách Đóng Kiện</span>
              <span className="text-[10.5px] font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                {packableOrders.length}
              </span>
            </button>
          </div>
        </header>
      </div>

      {/* CÁC TAB NỘI DUNG NẰM LIỀN MẠCH PHÍA DƯỚI */}
      <div className="space-y-6 pt-3">
        {activeTab === 'picking' && (
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between border-b border-stone-100 pb-3 gap-2">
              <div>
                <h3 className="text-sm font-black text-stone-900">Nông Sản & Quà Tặng Cần Gom</h3>
                <p className="text-xs text-stone-500">
                  Bấm vào món để đánh dấu đã gom đủ số lượng ngoài giàn / trong kho
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                  Đã gom: {completedPickingCount}/{pickingSummary.length} món
                </span>
                {completedPickingCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetPickingTicks}
                    className="px-2.5 py-1 text-xs font-semibold text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    title="Bỏ chọn tất cả"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {pickingSummary.length === 0 ? (
              <p className="text-xs text-stone-400 py-10 text-center italic">Hiện không có đơn nào cần chuẩn bị hàng.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {pickingSummary.map((item) => {
                  const isPicked = !!pickedItems[item.key];

                  return (
                    <div 
                      key={item.key} 
                      onClick={() => togglePickedItem(item.key)}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between shadow-2xs cursor-pointer select-none active:scale-[0.98] ${
                        isPicked 
                          ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300' 
                          : item.isGift 
                            ? 'bg-amber-50/70 border-amber-200 hover:border-amber-400' 
                            : 'bg-stone-50 border-stone-200/80 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 pr-2 min-w-0">
                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                          isPicked 
                            ? 'bg-emerald-600 border-emerald-600 text-white' 
                            : 'border-stone-300 bg-white'
                        }`}>
                          {isPicked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <span className={`font-bold text-xs block leading-snug line-clamp-2 ${
                            isPicked 
                              ? 'text-emerald-950 line-through opacity-80' 
                              : item.isGift 
                                ? 'text-amber-950 flex items-center gap-1' 
                                : 'text-stone-900'
                          }`}>
                            {item.isGift && <Gift className="w-3.5 h-3.5 text-amber-700 shrink-0" />}
                            <span>{item.name}</span>
                          </span>
                          
                          <div className="flex items-center gap-1.5 text-[10.5px]">
                            <span className={`${isPicked ? 'text-emerald-700' : 'text-stone-500'} font-medium`}>
                              {item.spec}
                            </span>
                            {isPicked && (
                              <span className="font-bold text-emerald-700 text-[10px]">
                                • Đã gom đủ
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-base font-black font-mono px-2.5 py-1 rounded-xl border ${
                          isPicked 
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                            : 'text-amber-900 bg-amber-100/90 border-amber-200'
                        }`}>
                          x{item.quantity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            {packableOrders.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 text-stone-400 text-xs">
                Hiện không có đơn nào ở trạng thái chờ đóng.
              </div>
            ) : (
              packableOrders.map((ord) => {
                const orderCode = ord.code || ord.orderId;
                const currentStatusCode = normalizeOrderStatus(ord.status);
                const isPackingNow = currentStatusCode === ORDER_STATUS.PACKING;
                const collectInfo = getCollectInfo(ord);
                const items = parseOrderItems(ord);
                const cleanNote = String(ord.customer_note || ord.note || '').trim();

                return (
                  <div 
                    key={orderCode} 
                    className={`bg-white rounded-3xl border shadow-xs p-5 sm:p-6 space-y-4 ${
                      isPackingNow 
                        ? 'border-purple-300 ring-1 ring-purple-200 bg-purple-50/10' 
                        : 'border-stone-200/90'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-black text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-md text-xs">
                            {orderCode}
                          </span>
                          <strong className="text-stone-900 text-sm">{ord.customer_name || ord.name || ord.customerName || ''}</strong>
                          {ord.phone && (
                            <span className="text-xs font-mono font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-lg">
                              {ord.phone}
                            </span>
                          )}

                          {isPackingNow ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold border px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-900 border-purple-300">
                              <Package className="w-3.5 h-3.5 text-purple-700" />
                              <span>Đang đóng gói</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold border px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-900 border-blue-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                              <span>Đã xác nhận (Chờ kho gói)</span>
                            </span>
                          )}

                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold border px-2.5 py-0.5 rounded-md ${collectInfo.badgeStyle}`}>
                            {collectInfo.type === 'PAID_FULL' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
                            {collectInfo.type === 'DEPOSIT_REMAINING' && <AlertCircle className="w-3.5 h-3.5 text-amber-600" />}
                            {collectInfo.type === 'COD_FULL' && <Banknote className="w-3.5 h-3.5 text-rose-600" />}
                            <span>{collectInfo.badgeText}</span>
                          </span>
                        </div>

                        <p className="text-stone-600 text-xs">
                          📍 <strong>Điểm giao / Bến xe:</strong> {ord.address}
                        </p>

                        {cleanNote && (
                          <p className="text-rose-700 italic text-xs">
                            * Ghi chú khách: {cleanNote}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => executeFastPrint([ord], `Tem_${orderCode}`)}
                          className="px-3.5 py-2.5 rounded-2xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-stone-500" />
                          <span>In Tem</span>
                        </button>

                        {!isPackingNow ? (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(orderCode, ORDER_STATUS.PACKING)}
                            className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                          >
                            <Package className="w-4 h-4" />
                            <span>Bắt Đầu Đóng</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(orderCode, ORDER_STATUS.SHIPPING)}
                            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Đã Gói Xong ➔ Giao Xe</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 bg-stone-50/70 p-4 rounded-2xl border border-stone-200/60">
                      <span className="text-[11px] font-extrabold uppercase text-stone-500 tracking-wider block mb-1">
                        Món cần bỏ vào thùng xốp ({items.length} món):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {items.map((it, idx) => {
                          const boxKey = `${orderCode}_${idx}`;
                          const isBoxChecked = !!checkedBoxItems[boxKey];

                          return (
                            <div 
                              key={idx} 
                              onClick={() => toggleBoxItem(orderCode, idx)}
                              className={`p-3 rounded-xl border flex items-center justify-between gap-2 shadow-2xs cursor-pointer select-none ${
                                isBoxChecked 
                                  ? 'bg-emerald-50/80 border-emerald-300' 
                                  : it.isGift 
                                    ? 'bg-amber-50/90 border-amber-300 hover:border-amber-400' 
                                    : 'bg-white border-stone-200/80 hover:border-stone-300'
                              }`}
                            >
                              <div className="flex items-start gap-2.5 min-w-0">
                                <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                                  isBoxChecked 
                                    ? 'bg-emerald-600 border-emerald-600 text-white' 
                                    : 'border-stone-300 bg-white'
                                }`}>
                                  {isBoxChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>

                                <div className="min-w-0">
                                  <div className={`font-bold text-xs truncate ${
                                    isBoxChecked 
                                      ? 'text-emerald-950 line-through opacity-80' 
                                      : it.isGift 
                                        ? 'text-amber-950 flex items-center gap-1' 
                                        : 'text-stone-900'
                                  }`}>
                                    {it.isGift && <Gift className="w-3.5 h-3.5 text-amber-700 shrink-0" />}
                                    <span>{it.name}</span>
                                  </div>
                                  <div className="text-[10.5px] text-stone-500 font-medium">
                                    Quy cách: {it.spec}
                                  </div>
                                </div>
                              </div>

                              <span className={`font-mono font-black text-sm px-2.5 py-0.5 rounded-lg border shrink-0 ${
                                isBoxChecked 
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                                  : it.isGift 
                                    ? 'bg-amber-200 text-amber-950 border-amber-300' 
                                    : 'bg-amber-100 text-amber-900 border-amber-200'
                              }`}>
                                x{it.quantity}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

    </div>
  );
}