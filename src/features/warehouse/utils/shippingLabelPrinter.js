// src/utils/shippingLabelPrinter.js

export function renderSingleShippingLabelHtml(order, shopConfig = {}, collectInfo, allItems = []) {
  const orderCode = order.code || order.orderId;
  const MAX_ITEMS = 6;
  const visibleItems = allItems.slice(0, MAX_ITEMS);
  const hasMoreItems = allItems.length > MAX_ITEMS;
  const cleanNote = String(order.customer_note || order.note || '').trim();

  const itemsRowsHtml = visibleItems.map((it, idx) => `
    <tr style="${it.isGift ? 'background: #fffbeb;' : ''}">
      <td style="text-align: center; font-weight: bold; border-right: 1px solid #000; padding: 4px 2px;">${idx + 1}</td>
      <td style="padding: 4px 6px; border-right: 1px solid #000; font-weight: bold;">
        ${it.name}
        <div style="font-size: 11px; font-weight: normal; color: ${it.isGift ? '#b45309' : '#333'};">${it.spec}</div>
      </td>
      <td style="text-align: center; font-weight: 900; font-family: monospace; font-size: 16px; padding: 4px 2px;">
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
            <div style="font-size: 10.5px; font-weight: 800; color: #555; text-transform: uppercase;">NGƯỜI NHẬN HÀNG:</div>
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
                <th style="width: 32px; border-right: 1px solid #000;">STT</th>
                <th style="text-align: left; padding-left: 6px; border-right: 1px solid #000;">Tên Sản Phẩm / Quy Cách</th>
                <th style="width: 50px;">SL</th>
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
            <div style="font-size: 15px; font-weight: 900;">${collectInfo.printTitle}</div>
            <div style="font-size: 12px; color: #444; margin-top: 2px;">${collectInfo.printSub}</div>
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
}

export function executeFastPrint(ordersToPrint, shopConfig, getCollectInfo, parseOrderItems, title = 'In Tem') {
  if (!ordersToPrint || ordersToPrint.length === 0) return;

  const cardsHtml = ordersToPrint.map((ord) => {
    const collectInfo = getCollectInfo(ord);
    const allItems = parseOrderItems(ord);
    return renderSingleShippingLabelHtml(ord, shopConfig, collectInfo, allItems);
  }).join('');

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
          @page { size: 100mm 150mm; margin: 0; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          html, body {
            margin: 0; padding: 0; background: #fff; color: #000;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          }
          .shipping-card-page {
            width: 100mm; height: 150mm; padding: 4mm;
            page-break-after: always; break-after: page;
            display: flex; align-items: center; justify-content: center;
          }
          .shipping-card-page:last-child { page-break-after: auto; break-after: auto; }
          .shipping-card {
            border: 2px solid #000; width: 92mm; height: 142mm;
            display: flex; flex-direction: column;
          }
          .header-grid {
            display: grid; grid-template-columns: 1fr 1.1fr;
            border-bottom: 2px solid #000; background: #fbfbfb;
          }
          .shop-box {
            padding: 6px; border-right: 1.5px solid #000;
            display: flex; flex-direction: column; justify-content: center;
          }
          .shop-title {
            font-size: 15px; font-weight: 900; text-transform: uppercase;
            margin: 0; letter-spacing: 0.5px;
          }
          .shop-sub { font-size: 10.5px; color: #333; margin-top: 2px; font-weight: 600; }
          .code-box {
            padding: 6px; text-align: center;
            display: flex; flex-direction: column; justify-content: center;
          }
          .order-code {
            font-family: "Courier New", Courier, monospace;
            font-size: 20px; font-weight: 900; letter-spacing: 1.5px;
          }
          .barcode-line {
            font-family: "Courier New", monospace;
            font-size: 16px; font-weight: 900; letter-spacing: 3px; line-height: 1; margin-top: 1px;
          }
          .info-grid { display: grid; grid-template-columns: 1fr; border-bottom: 2px solid #000; }
          .sender-box {
            padding: 5px 8px; border-bottom: 1px dashed #777;
            font-size: 11.5px; line-height: 1.35; background: #fafafa;
          }
          .recipient-box { padding: 6px 8px; }
          .recipient-name-phone { display: flex; align-items: center; gap: 8px; margin-bottom: 3px; }
          .recipient-name { font-size: 17px; font-weight: 900; }
          .recipient-phone {
            font-family: "Courier New", Courier, monospace;
            font-size: 18px; font-weight: 900; background: #000; color: #fff;
            padding: 1px 7px; border-radius: 4px;
          }
          .recipient-address { font-size: 12.5px; font-weight: 600; line-height: 1.35; }
          .items-wrapper {
            flex: 1; display: flex; flex-direction: column;
            border-bottom: 2px solid #000; overflow: hidden;
          }
          .items-title {
            padding: 4px 8px; font-size: 11px; font-weight: 800; text-transform: uppercase;
            background: #f0f0f0; border-bottom: 1px solid #000;
            display: flex; justify-content: space-between;
          }
          .items-table { width: 100%; border-collapse: collapse; font-size: 12px; }
          .items-table th { border-bottom: 1px solid #000; font-size: 10.5px; padding: 4px; background: #fafafa; }
          .items-table td { border-bottom: 1px dashed #ddd; }
          .alert-hidden {
            font-size: 10.5px; color: #b91c1c; font-style: italic; font-weight: bold;
            padding: 4px 6px; text-align: center; background: #fef2f2;
          }
          .note-box {
            padding: 4px 8px; font-size: 11px; font-style: italic; color: #1e3a8a;
            background: #eff6ff; border-top: 1px dashed #bfdbfe;
          }
          .payment-block { border-bottom: 2px solid #000; text-align: center; padding: 8px 6px; }
          .cod-block { background: #000; color: #fff; }
          .cod-label { font-size: 11.5px; font-weight: 800; letter-spacing: 0.5px; }
          .cod-price {
            font-size: 27px; font-weight: 900;
            font-family: "Courier New", Courier, monospace; line-height: 1.1; margin: 2px 0;
          }
          .cod-sub { font-size: 10.5px; opacity: 0.9; }
          .paid-block { background: #f5f5f5; padding: 12px 6px; }
          .footer-box {
            padding: 5px; text-align: center; font-size: 11px;
            font-weight: 900; text-transform: uppercase; background: #fff;
          }
        </style>
      </head>
      <body>
        ${cardsHtml}
        <script>
          window.onload = function() {
            window.focus();
            window.print();
            setTimeout(function() { window.close(); }, 400);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}