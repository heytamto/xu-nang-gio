// src/pages/PackingPage.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  PackageCheck, RefreshCw, Printer, 
  CheckCircle2, Lock, ArrowLeft, Banknote, 
  ShieldCheck, AlertCircle, Gift, Check, RotateCcw,
  Layers, Package
} from 'lucide-react';
import { ORDER_STATUS, normalizeOrderStatus } from '../constants/orderStatus';

const POLLING_INTERVAL_SECONDS = 20;

export default function PackingPage({ 
  orders = [], 
  shopConfig = {}, 
  onRefresh, 
  onUpdateStatus, 
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBackgroundPolling, setIsBackgroundPolling] = useState(false);
  const [countdown, setCountdown] = useState(POLLING_INTERVAL_SECONDS);

  // Tạo map tra cứu mã quà -> tên quà tiếng Việt từ catalog quà tặng (Fallback)
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

  // Hàm chuyển đổi chuỗi mã quà raw thành tên tiếng Việt (Fallback nếu có đơn cũ sót lại)
  const resolveGiftString = (str) => {
    if (!str) return '';
    return str.replace(/(gift_[a-zA-Z0-9_]+)/g, (matchedId) => {
      return giftCatalogMap.get(matchedId) || matchedId;
    });
  };

  const effectiveOrders = useMemo(() => {
    if (Array.isArray(orders) && orders.length > 0) {
      return orders;
    }
    try {
      return JSON.parse(localStorage.getItem('shop_orders') || '[]');
    } catch {
      return [];
    }
  }, [orders]);

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

  const validWarehousePin = String(shopConfig?.warehousePin || '1234').trim();
  const depositConfigAmount = Number(shopConfig?.depositAmount) || 50000;

  const onRefreshRef = useRef(onRefresh);
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (isAuthenticated && onRefresh) {
      onRefresh();
    }
  }, [isAuthenticated, onRefresh]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (onRefreshRef.current) {
            setIsBackgroundPolling(true);
            Promise.resolve(onRefreshRef.current())
              .catch((err) => console.warn('Lỗi polling ngầm:', err))
              .finally(() => {
                setTimeout(() => setIsBackgroundPolling(false), 800);
              });
          }
          return POLLING_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAuthenticated]);

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput.trim() === validWarehousePin) {
      setIsAuthenticated(true);
      setPinError(false);
      try {
        sessionStorage.setItem('warehouse_authenticated', 'true');
      } catch (err) {
        console.error(err);
      }
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setCountdown(POLLING_INTERVAL_SECONDS);
    try {
      if (onRefresh) {
        await onRefresh();
      }
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 600);
    }
  };

  const togglePickedItem = (key) => {
    setPickedItems((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleBoxItem = (orderCode, itemIdx) => {
    const key = `${orderCode}_${itemIdx}`;
    setCheckedBoxItems((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleResetPickingTicks = () => {
    setPickedItems({});
  };

  const getCollectInfo = (order) => {
    const method = String(order.paymentMethod || '').toLowerCase();
    const rawTotal = typeof order.total === 'number' 
      ? order.total 
      : (typeof order.totalAmount === 'number'
          ? order.totalAmount
          : (Number(String(order.total || order.totalAmount || '').replace(/[^0-9]/g, '')) || 0));

    if (method.includes('100%') || method.includes('full') || method === 'full_qr') {
      return {
        type: 'PAID_FULL',
        collectAmount: 0,
        badgeText: 'ĐÃ CHUYỂN FULL 100% (Thu 0đ)',
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
        badgeText: `ĐÃ CỌC ${deposit.toLocaleString('vi-VN')}đ • THU CÒN LẠI: ${remaining.toLocaleString('vi-VN')}đ`,
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

  // Lọc đơn hợp lệ vào kho (Đã xác nhận hoặc Đang đóng gói)
  const packableOrders = useMemo(() => {
    return effectiveOrders.filter((o) => {
      const statusCode = normalizeOrderStatus(o.status);
      return statusCode === ORDER_STATUS.CONFIRMED || statusCode === ORDER_STATUS.PACKING;
    });
  }, [effectiveOrders]);

  // PARSE VÀ MAP TÊN QUÀ TẶNG CHUẨN XÁC
  const parseOrderItems = (order) => {
    let items = [];

    if (Array.isArray(order.cart) && order.cart.length > 0) {
      // 1. Thêm các món chính
      order.cart.forEach((c) => {
        items.push({
          name: c.name,
          spec: c.weightLabel || c.unit || 'Tiêu chuẩn',
          quantity: Number(c.quantity) || 1,
          isGift: false
        });

        // 2. Bóc tách quà combo từ item trong cart
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
    } else if (order.itemsSummary && typeof order.itemsSummary === 'string') {
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
    const giftTitle = order.giftTitle || order.paymentGift;
    if (giftTitle && giftTitle !== 'Không áp dụng (COD)' && giftTitle.trim() !== '') {
      const resolvedPaymentGift = giftCatalogMap.get(giftTitle) || giftTitle;
      items.push({
        name: `[QUÀ TẶNG] ${resolvedPaymentGift}`,
        spec: 'Tặng kèm chuyển khoản',
        quantity: 1,
        isGift: true
      });
    }

    // Quà combo nếu đọc từ chuỗi campaignGifts trên Sheet
    if ((!Array.isArray(order.cart) || order.cart.length === 0) && order.campaignGifts && typeof order.campaignGifts === 'string') {
      const campGifts = order.campaignGifts.split('|');
      campGifts.forEach((gStr) => {
        const trimmedG = gStr.trim();
        if (trimmedG && !trimmedG.includes('Không áp dụng')) {
          const resolvedG = resolveGiftString(trimmedG);
          items.push({
            name: resolvedG.startsWith('[QUÀ') ? resolvedG : `[QUÀ TẶNG] ${resolvedG}`,
            spec: 'Quà quê tặng kèm',
            quantity: 1,
            isGift: true
          });
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
    const cleanNote = String(order.note || '').trim();

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
              <strong>Địa chỉ gửi:</strong> ${shopConfig.address || 'Trường Sanh, Phước Hậu, Ninh Thuận'}
            </div>

            <div class="recipient-box">
              <div style="font-size: 9.5px; font-weight: 800; color: #555; text-transform: uppercase;">NGƯỜI NHẬN HÀNG:</div>
              <div class="recipient-name-phone">
                <span class="recipient-name">${order.name || order.customerName || ''}</span>
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
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 font-sans">
        <form onSubmit={handlePinSubmit} className="bg-white p-7 rounded-3xl border border-stone-200/90 shadow-xl max-w-sm w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-base font-black text-stone-900">Mã PIN Kho Đóng Hàng</h2>
          <p className="text-xs text-stone-500">Mã PIN quản trị viên cấp qua Google Sheet (Cột H: warehousePin)</p>
          <input
            type="password"
            maxLength={8}
            value={pinInput}
            autoFocus
            onChange={(e) => setPinInput(e.target.value)}
            placeholder="Nhập mã PIN kho"
            className="w-full text-center text-lg tracking-widest font-mono py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-amber-600 focus:outline-none font-black"
          />
          {pinError && <p className="text-xs text-rose-600 font-semibold">Mã PIN không đúng, thử lại!</p>}
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Mở Bảng Đóng Hàng
          </button>
        </form>
      </div>
    );
  }

  const isScanning = isRefreshing || isBackgroundPolling;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans animate-fadeIn">
      {/* Header & Tabs */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-4">
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
              <h1 className="text-base sm:text-lg font-black text-stone-900">Khu Vực Soạn & Đóng Thùng Xốp</h1>
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
                className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-amber-800 text-white text-xs font-bold rounded-2xl shadow-sm transition-all active:scale-95 cursor-pointer"
                title="In hàng loạt tất cả tem chờ đóng"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>In Hết ({packableOrders.length} Tem)</span>
              </button>
            )}

            <button
              type="button"
              disabled={isRefreshing}
              onClick={handleManualRefresh}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all select-none cursor-pointer ${
                isScanning
                  ? 'bg-amber-50 text-amber-900 border-amber-300 opacity-90'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-transparent hover:border-stone-300 active:scale-95'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-amber-600' : 'text-stone-600'}`} />
              <span>
                {isScanning ? 'Đang cập nhật...' : `Làm mới (${countdown}s)`}
              </span>
            </button>
          </div>
        </div>

        {/* Tab chuyển đổi */}
        <div className="bg-stone-100 p-1.5 rounded-2xl grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('picking')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'picking' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
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
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'orders' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>📦 Danh Sách Đóng Kiện</span>
            <span className="text-[10.5px] font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
              {packableOrders.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: BẢNG SOẠN HÀNG TỔNG HỢP */}
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
                    className={`p-3.5 rounded-2xl border flex items-center justify-between shadow-2xs cursor-pointer select-none transition-all duration-200 active:scale-[0.98] ${
                      isPicked
                        ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300'
                        : item.isGift
                          ? 'bg-amber-50/70 border-amber-200 hover:border-amber-400'
                          : 'bg-stone-50 border-stone-200/80 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 pr-2 min-w-0">
                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isPicked 
                          ? 'bg-emerald-600 border-emerald-600 text-white' 
                          : 'border-stone-300 bg-white'
                      }`}>
                        {isPicked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <span className={`font-bold text-xs block leading-snug line-clamp-2 transition-all ${
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
                      <span className={`text-base font-black font-mono px-2.5 py-1 rounded-xl border transition-colors ${
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

      {/* TAB 2: DANH SÁCH ĐÓNG TỪNG KIỆN */}
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
              const cleanNote = String(ord.note || '').trim();

              return (
                <div 
                  key={orderCode} 
                  className={`bg-white rounded-3xl border shadow-xs p-5 sm:p-6 space-y-4 transition-all ${
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
                        <strong className="text-stone-900 text-sm">{ord.name || ord.customerName || ''}</strong>
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
                          onClick={() => onUpdateStatus(orderCode, 'Đang đóng gói')}
                          className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                        >
                          <Package className="w-4 h-4" />
                          <span>Bắt Đầu Đóng</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(orderCode, 'Đang giao')}
                          className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
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
                            className={`p-3 rounded-xl border flex items-center justify-between gap-2 shadow-2xs cursor-pointer select-none transition-colors ${
                              isBoxChecked
                                ? 'bg-emerald-50/80 border-emerald-300'
                                : it.isGift 
                                  ? 'bg-amber-50/90 border-amber-300 hover:border-amber-400' 
                                  : 'bg-white border-stone-200/80 hover:border-stone-300'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                isBoxChecked 
                                  ? 'bg-emerald-600 border-emerald-600 text-white' 
                                  : 'border-stone-300 bg-white'
                              }`}>
                                {isBoxChecked && <Check className="w-3 h-3 stroke-[3]" />}
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
  );
}