import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ArrowLeft, Plus, Trash2, RotateCcw, 
  Settings, Tag, QrCode, Check, BookOpen, 
  ShoppingBag, Calendar, User, ToggleLeft, ToggleRight,
  LayoutDashboard, TrendingUp, RefreshCw, Loader2, FileSpreadsheet
} from 'lucide-react';

const GSHEET_URL = 'https://script.google.com/macros/s/AKfycbx4uOPteTl5vmfBU5vH5cFjfNdBMAptKMal58Vh9lHofoTYIZeQqfxrICrNxLTGWlKy/exec';

export default function AdminPage({ 
  products = [], 
  onSaveProducts, 
  onResetProducts,
  posts = [],
  onSavePosts,
  onResetPosts,
  shopConfig = {},
  onSaveConfig,
  onResetConfig,
  onNavigateHome 
}) {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'products' | 'config' | 'posts'
  const [timeRange, setTimeRange] = useState('day');
  const [savedNotice, setSavedNotice] = useState(false);

  // Sheet API Data States
  const [sheetOrders, setSheetOrders] = useState([]);
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Fetch từ Google Sheet
  const fetchOrdersFromSheet = useCallback(async () => {
    setIsLoadingSheet(true);
    setLoadError(null);
    try {
      const res = await fetch(GSHEET_URL, { method: 'GET', redirect: 'follow' });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSheetOrders(json.data);
      } else if (Array.isArray(json)) {
        setSheetOrders(json);
      } else {
        throw new Error('Dữ liệu không đúng định dạng');
      }
    } catch (err) {
      console.warn('Lỗi fetch Google Sheet:', err);
      setLoadError('Chưa tải được từ Sheet (dùng dữ liệu máy tạm).');
      try {
        const local = JSON.parse(localStorage.getItem('shop_orders') || '[]');
        setSheetOrders(local);
      } catch {
        setSheetOrders([]);
      }
    } finally {
      setIsLoadingSheet(false);
    }
  }, []);

  useEffect(() => {
    fetchOrdersFromSheet();
  }, [fetchOrdersFromSheet]);

  // Chuẩn hóa dữ liệu đơn hàng
  const normalizedOrders = useMemo(() => {
    return sheetOrders.map((ord) => {
      const createdAt = ord.createdAt || ord['Thời Gian'] || ord['Ngày tạo'] || ord.date || '';
      const total = Number(String(ord.total || ord['Tổng Tiền'] || ord['Tổng đơn'] || 0).replace(/[^0-9]/g, '')) || 0;
      const code = ord.code || ord['Mã Đơn'] || 'XNG';
      const name = ord.name || ord['Tên Khách'] || ord['Khách Hàng'] || 'Khách lẻ';
      const phone = ord.phone || ord['Số ĐT'] || ord['Số Điện Thoại'] || '';
      const method = ord.paymentMethod || ord['Phương Thức'] || ord['Hình Thức TT'] || 'COD';
      const itemsSummary = ord.itemsSummary || ord['Sản Phẩm Đặt'] || '';
      const voucher = ord.voucherCode || ord['Voucher'] || '';

      let cart = ord.cart || [];
      if (typeof cart === 'string' && cart.startsWith('[')) {
        try { cart = JSON.parse(cart); } catch { cart = []; }
      }

      return {
        ...ord,
        code,
        name,
        phone,
        total,
        paymentMethod: method,
        itemsSummary,
        voucherCode: voucher,
        createdAt,
        cart
      };
    });
  }, [sheetOrders]);

  // Lọc theo ngày/tuần/tháng
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return normalizedOrders.filter((order) => {
      if (!order.createdAt || timeRange === 'all') return true;

      let orderDate;
      if (order.createdAt.includes('/')) {
        const parts = order.createdAt.split(' ')[0].split('/');
        if (parts.length === 3) {
          orderDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      } else {
        orderDate = new Date(order.createdAt);
      }

      if (!orderDate || isNaN(orderDate.getTime())) return true;

      if (timeRange === 'day') {
        return (
          orderDate.getDate() === now.getDate() &&
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      }
      if (timeRange === 'week') {
        const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }
      if (timeRange === 'month') {
        return (
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      }
      return true;
    });
  }, [normalizedOrders, timeRange]);

  // Metrics
  const metrics = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const totalDeposits = filteredOrders.reduce((sum, o) => {
      const pm = String(o.paymentMethod).toLowerCase();
      if (pm.includes('100') || pm.includes('full')) return sum + (Number(o.total) || 0);
      if (pm.includes('cọc') || pm.includes('deposit')) return sum + (Number(shopConfig.depositAmount) || 50000);
      return sum;
    }, 0);

    return { totalRevenue, totalOrders, avgOrderValue, totalDeposits };
  }, [filteredOrders, shopConfig.depositAmount]);

  // Bóc tách & xếp hạng đặc sản hút khách nhất
  const topProducts = useMemo(() => {
    const productStats = {};

    filteredOrders.forEach((order) => {
      if (Array.isArray(order.cart) && order.cart.length > 0) {
        order.cart.forEach((item) => {
          const key = item.name || 'Đặc sản';
          if (!productStats[key]) productStats[key] = { name: key, quantity: 0, revenue: 0 };
          const qty = Number(item.quantity) || 1;
          productStats[key].quantity += qty;
          productStats[key].revenue += ((Number(item.price) || 0) * qty);
        });
        return;
      }

      if (order.itemsSummary && typeof order.itemsSummary === 'string') {
        const parts = order.itemsSummary.split(',');
        parts.forEach((p) => {
          const trimmed = p.trim();
          if (!trimmed) return;

          const matchQty = trimmed.match(/x(\d+)\s*$/i);
          let qty = 1;
          let prodName = trimmed;

          if (matchQty) {
            qty = Number(matchQty[1]) || 1;
            prodName = trimmed.replace(/x\d+\s*$/i, '').trim();
          }

          if (!productStats[prodName]) {
            productStats[prodName] = { name: prodName, quantity: 0, revenue: 0 };
          }
          productStats[prodName].quantity += qty;
        });
      }
    });

    return Object.values(productStats).sort((a, b) => b.quantity - a.quantity);
  }, [filteredOrders]);

  // ================= CẤU HÌNH & VOUCHER STATE =================
  const [cfg, setCfg] = useState(() => ({
    bankBin: shopConfig.bankBin || '970422',
    bankName: shopConfig.bankName || 'MB Bank',
    accountNo: shopConfig.accountNo || '',
    accountName: shopConfig.accountName || '',
    depositAmount: shopConfig.depositAmount || 50000,
    hotline: shopConfig.hotline || '',
    loyaltyDiscountPercent: shopConfig.loyaltyDiscountPercent || 10,
    vouchers: shopConfig.vouchers || []
  }));

  const [newVoucher, setNewVoucher] = useState({
    code: '',
    type: 'percent',
    value: 10,
    minOrder: 0,
    requireNewCustomer: false,
    requireOldCustomer: true,
    desc: ''
  });

  const handleAddVoucher = (e) => {
    e.preventDefault();
    if (!newVoucher.code.trim()) return;

    const formattedCode = newVoucher.code.trim().toUpperCase();
    if (cfg.vouchers.some(v => v.code === formattedCode)) {
      alert('Mã voucher này đã tồn tại!');
      return;
    }

    const updatedVouchers = [
      ...cfg.vouchers,
      {
        ...newVoucher,
        code: formattedCode,
        value: Number(newVoucher.value) || 0,
        minOrder: Number(newVoucher.minOrder) || 0,
        desc: newVoucher.desc.trim() || `Ưu đãi mã ${formattedCode}`
      }
    ];

    setCfg({ ...cfg, vouchers: updatedVouchers });
    setNewVoucher({
      code: '',
      type: 'percent',
      value: 10,
      minOrder: 0,
      requireNewCustomer: false,
      requireOldCustomer: true,
      desc: ''
    });
  };

  const handleRemoveVoucher = (code) => {
    setCfg({
      ...cfg,
      vouchers: cfg.vouchers.filter(v => v.code !== code)
    });
  };

  const handleSaveConfig = () => {
    if (onSaveConfig) onSaveConfig(cfg);
    showSavedToast();
  };

  // ================= SẢN PHẨM STATE =================
  const [newProduct, setNewProduct] = useState({
    name: '',
    basePrice: '',
    unit: 'kg',
    category: 'fresh',
    badge: 'Đặc sản mới',
    source: 'Vườn nhà Tâm (Phước Hậu)',
    desc: '',
    image: '',
    inStock: true
  });

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!newProduct.name.trim() || !newProduct.basePrice) {
      alert('Vui lòng nhập tên sản phẩm và giá cơ bản!');
      return;
    }

    const productItem = {
      id: 'sp-' + Date.now(),
      name: newProduct.name.trim(),
      basePrice: Number(newProduct.basePrice) || 0,
      unit: newProduct.unit.trim() || 'kg',
      category: newProduct.category,
      badge: newProduct.badge.trim() || null,
      source: newProduct.source.trim() || 'Vườn nhà Tâm',
      desc: newProduct.desc.trim() || `Đặc sản tươi ngon thu hoạch từ vườn nhà.`,
      image: newProduct.image.trim() || 'https://images.unsplash.com/photo-1616684000067-36952fde56ec?auto=format&fit=crop&w=600&q=80',
      inStock: newProduct.inStock,
      weights: [
        { id: 'opt1', label: `1 ${newProduct.unit.trim() || 'kg'}`, multiplier: 1 },
        { id: 'opt2', label: `Combo 2 ${newProduct.unit.trim() || 'kg'}`, multiplier: 1.95 }
      ]
    };

    if (onSaveProducts) onSaveProducts([productItem, ...products]);
    setNewProduct({
      name: '',
      basePrice: '',
      unit: 'kg',
      category: 'fresh',
      badge: 'Đặc sản mới',
      source: 'Vườn nhà Tâm (Phước Hậu)',
      desc: '',
      image: '',
      inStock: true
    });
    showSavedToast();
  };

  const handleToggleStock = (id) => {
    if (onSaveProducts) {
      onSaveProducts(products.map((p) => p.id === id ? { ...p, inStock: !p.inStock } : p));
    }
  };

  const handleDeleteProduct = (id) => {
    if (!window.confirm('Tâm có chắc muốn xóa đặc sản này khỏi kệ không?')) return;
    if (onSaveProducts) onSaveProducts(products.filter((p) => p.id !== id));
  };

  // ================= BÀI VIẾT / CẨM NANG STATE =================
  const [newPost, setNewPost] = useState({
    title: '',
    category: 'Chuyện Vườn',
    image: '',
    desc: '',
    content: '',
    author: 'Tâm (Vườn Xứ Nắng Gió)'
  });

  const handleAddPost = (e) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.desc.trim()) {
      alert('Vui lòng nhập tiêu đề và tóm tắt bài viết!');
      return;
    }

    const postItem = {
      id: 'post-' + Date.now(),
      title: newPost.title.trim(),
      category: newPost.category,
      desc: newPost.desc.trim(),
      content: newPost.content.trim() || newPost.desc.trim(),
      image: newPost.image.trim() || 'https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?auto=format&fit=crop&w=600&q=80',
      author: newPost.author.trim() || 'Tâm & Vườn nhà',
      date: new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    };

    if (onSavePosts) onSavePosts([postItem, ...posts]);
    setNewPost({
      title: '',
      category: 'Chuyện Vườn',
      image: '',
      desc: '',
      content: '',
      author: 'Tâm (Vườn Xứ Nắng Gió)'
    });
    showSavedToast();
  };

  const handleDeletePost = (id) => {
    if (!window.confirm('Tâm có chắc muốn xóa bài viết này không?')) return;
    if (onSavePosts) onSavePosts(posts.filter((p) => p.id !== id));
  };

  const showSavedToast = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateHome}
            className="p-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
            title="Quay lại cửa hàng"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black text-stone-900">Trang Quản Trị Vườn</h1>
            <p className="text-xs text-stone-500">Đồng bộ Google Sheet, theo dõi doanh thu và sản phẩm</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-2xl overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'dashboard' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-amber-600" />
            <span>Dashboard GGSheet</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'products' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
            <span>Sản Phẩm ({products.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'config' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-amber-600" />
            <span>Cấu Hình & Voucher</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('posts')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'posts' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
            <span>Chuyện Vườn ({posts.length})</span>
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Đã lưu thành công dữ liệu vào hệ thống!</span>
        </div>
      )}

      {/* ================= TAB 1: DASHBOARD LIÊN KẾT GOOGLE SHEET ================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-black text-stone-900">Thống Kê Doanh Thu Từ Google Sheet</h2>
                {isLoadingSheet && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />}
              </div>
              <p className="text-[11px] text-stone-500">
                Đồng bộ trực tiếp qua Apps Script • Tổng nhận: <strong>{normalizedOrders.length}</strong> dòng
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchOrdersFromSheet}
                disabled={isLoadingSheet}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="Tải lại từ Google Sheet"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSheet ? 'animate-spin' : ''}`} />
                <span>Làm mới</span>
              </button>

              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
                {[
                  { id: 'day', label: 'Hôm nay' },
                  { id: 'week', label: '7 ngày' },
                  { id: 'month', label: 'Tháng này' },
                  { id: 'all', label: 'Toàn bộ' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTimeRange(t.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      timeRange === t.id ? 'bg-white text-amber-800 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4 Thẻ Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-3xl border border-stone-200/90 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-stone-500 block">Tổng Doanh Thu</span>
              <p className="text-lg sm:text-xl font-black text-amber-800 font-mono">
                {metrics.totalRevenue.toLocaleString('vi-VN')}đ
              </p>
              <span className="text-[10px] text-stone-400 block pt-0.5">Tiền đơn thực tế</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-stone-200/90 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-stone-500 block">Số Đơn Hàng</span>
              <p className="text-lg sm:text-xl font-black text-stone-900 font-mono">
                {metrics.totalOrders} <span className="text-xs font-normal text-stone-400">đơn</span>
              </p>
              <span className="text-[10px] text-stone-400 block pt-0.5">Trong giai đoạn này</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-stone-200/90 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-stone-500 block">Giá Trị TB / Đơn (AOV)</span>
              <p className="text-lg sm:text-xl font-black text-stone-900 font-mono">
                {metrics.avgOrderValue.toLocaleString('vi-VN')}đ
              </p>
              <span className="text-[10px] text-stone-400 block pt-0.5">Bình quân mỗi đơn</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-stone-200/90 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-stone-500 block">Tiền Cọc / Đã Nhận</span>
              <p className="text-lg sm:text-xl font-black text-emerald-700 font-mono">
                {metrics.totalDeposits.toLocaleString('vi-VN')}đ
              </p>
              <span className="text-[10px] text-stone-400 block pt-0.5">Cọc 50k & CK 100%</span>
            </div>
          </div>

          {/* Top Món Bán Chạy & Danh Sách Đơn Hàng */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-stone-200/90 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                Đặc Sản Hút Khách Nhất
              </h3>

              {topProducts.length === 0 ? (
                <p className="text-xs text-stone-400 italic py-6 text-center">
                  Chưa có thông tin chi tiết món cho giai đoạn này.
                </p>
              ) : (
                <div className="divide-y divide-stone-100">
                  {topProducts.map((item, idx) => (
                    <div key={item.name} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 truncate pr-2">
                        <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <span className="font-semibold text-stone-800 truncate block">{item.name}</span>
                          <span className="text-[10px] text-stone-400">
                            Đã bán: <strong>{item.quantity}</strong> phần
                          </span>
                        </div>
                      </div>
                      {item.revenue > 0 && (
                        <span className="font-mono font-bold text-stone-900 shrink-0">
                          {item.revenue.toLocaleString('vi-VN')}đ
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-stone-200/90 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                Đơn Hàng Trên Google Sheet ({filteredOrders.length})
              </h3>

              <div className="divide-y divide-stone-100 max-h-80 overflow-y-auto pr-1">
                {filteredOrders.map((ord, idx) => (
                  <div key={ord.code || idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md text-[11px]">
                          {ord.code}
                        </span>
                        <span className="font-bold text-stone-800">{ord.name}</span>
                      </div>
                      <p className="text-[11px] text-stone-500">
                        {ord.phone} • {ord.paymentMethod}
                      </p>
                      {ord.itemsSummary && (
                        <p className="text-[10.5px] text-stone-400 line-clamp-1 italic">
                          {ord.itemsSummary}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-black text-stone-900 block">
                        {(Number(ord.total) || 0).toLocaleString('vi-VN')}đ
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {ord.createdAt || 'Mới đây'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: QUẢN LÝ SẢN PHẨM ================= */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* Form thêm sản phẩm mới */}
          <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
              <Plus className="w-4 h-4 text-amber-600" />
              <span>Thêm Đặc Sản Mới Lên Kệ</span>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-semibold text-stone-600 block mb-1">Tên đặc sản *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nho Xanh Ninh Thuận (NH01-48)"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-medium text-stone-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-600 block mb-1">Phân loại</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-medium text-stone-800"
                  >
                    <option value="fresh">Trái cây tươi hái tại giàn</option>
                    <option value="dried">Đặc sản sấy dẻo thủ công</option>
                    <option value="drinks">Rượu nho / Mật nho nguyên chất</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-stone-600 block mb-1">Giá bán cơ bản (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    placeholder="VD: 65000"
                    value={newProduct.basePrice}
                    onChange={(e) => setNewProduct({ ...newProduct, basePrice: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-mono font-bold text-stone-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-600 block mb-1">Đơn vị tính</label>
                  <input
                    type="text"
                    placeholder="kg, hộp, chai, túi..."
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800 font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-600 block mb-1">Huy hiệu (Badge)</label>
                  <input
                    type="text"
                    placeholder="VD: Bao ngọt từng quả"
                    value={newProduct.badge}
                    onChange={(e) => setNewProduct({ ...newProduct, badge: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-600 block mb-1">Ảnh sản phẩm (URL)</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={newProduct.image}
                    onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-600 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-600 block mb-1">Nguồn gốc vườn</label>
                  <input
                    type="text"
                    placeholder="Vườn nhà Tâm (Phước Hậu)"
                    value={newProduct.source}
                    onChange={(e) => setNewProduct({ ...newProduct, source: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-600 block mb-1">Mô tả đặc điểm</label>
                <textarea
                  rows="2"
                  placeholder="Quả mọng, ngọt đậm vị..."
                  value={newProduct.desc}
                  onChange={(e) => setNewProduct({ ...newProduct, desc: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-700 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-700">
                  <input
                    type="checkbox"
                    checked={newProduct.inStock}
                    onChange={(e) => setNewProduct({ ...newProduct, inStock: e.target.checked })}
                    className="w-4 h-4 rounded-md accent-amber-600"
                  />
                  <span>Đang có sẵn ở vườn (Mở bán ngay)</span>
                </label>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Đăng Sản Phẩm Mới</span>
                </button>
              </div>
            </form>
          </div>

          {/* Danh sách đặc sản hiện có */}
          <div className="bg-white rounded-3xl border border-stone-200/90 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-stone-900">Danh Sách Đặc Sản ({products.length})</h2>
                <p className="text-xs text-stone-500">Bật/tắt trạng thái thu hoạch hoặc xóa sản phẩm</p>
              </div>
              <button
                type="button"
                onClick={onResetProducts}
                className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Khôi phục mặc định</span>
              </button>
            </div>

            <div className="divide-y divide-stone-100">
              {products.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <img 
                      src={p.image || "https://images.unsplash.com/photo-1616684000067-36952fde56ec?auto=format&fit=crop&w=600&q=80"} 
                      alt={p.name} 
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-stone-100" 
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">{p.name}</span>
                        {p.badge && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                            {p.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-stone-500 text-[11px] font-mono block mt-0.5">
                        {p.basePrice?.toLocaleString('vi-VN')}đ / {typeof p.unit === 'object' ? p.unit?.label : p.unit}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStock(p.id)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-colors ${
                        p.inStock 
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' 
                          : 'bg-stone-100 text-stone-500 hover:bg-stone-200 border border-stone-200'
                      }`}
                    >
                      {p.inStock ? (
                        <>
                          <ToggleRight className="w-4 h-4 text-emerald-600" />
                          <span>Đang bán</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 text-stone-400" />
                          <span>Tạm hết lứa</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-stone-100 transition-colors"
                      title="Xóa khỏi kệ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: CẤU HÌNH & VOUCHER ================= */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
              <QrCode className="w-4 h-4 text-amber-600" />
              <span>Cấu Hình Thanh Toán & VietQR</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
              <div>
                <label className="font-semibold text-stone-600 block mb-1">Mã BIN Ngân Hàng:</label>
                <input
                  type="text"
                  value={cfg.bankBin}
                  onChange={(e) => setCfg({ ...cfg, bankBin: e.target.value })}
                  placeholder="970422 (MB Bank)"
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-600 block mb-1">Tên Ngân Hàng hiển thị:</label>
                <input
                  type="text"
                  value={cfg.bankName}
                  onChange={(e) => setCfg({ ...cfg, bankName: e.target.value })}
                  placeholder="MB Bank"
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-600 block mb-1">Số Tài Khoản:</label>
                <input
                  type="text"
                  value={cfg.accountNo}
                  onChange={(e) => setCfg({ ...cfg, accountNo: e.target.value })}
                  placeholder="Số tài khoản nhận tiền"
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-mono font-bold text-stone-800"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-600 block mb-1">Tên Chủ Tài Khoản:</label>
                <input
                  type="text"
                  value={cfg.accountName}
                  onChange={(e) => setCfg({ ...cfg, accountName: e.target.value.toUpperCase() })}
                  placeholder="TO THANH TAM"
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-600 block mb-1">Số Tiền Cọc Mặc Định (VNĐ):</label>
                <input
                  type="number"
                  value={cfg.depositAmount}
                  onChange={(e) => setCfg({ ...cfg, depositAmount: Number(e.target.value) || 0 })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-mono font-bold text-amber-700"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-600 block mb-1">% Giảm Khi Nhập Mã Đơn Cũ (XNG):</label>
                <input
                  type="number"
                  value={cfg.loyaltyDiscountPercent}
                  onChange={(e) => setCfg({ ...cfg, loyaltyDiscountPercent: Number(e.target.value) || 0 })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-mono font-bold text-emerald-700"
                />
              </div>
            </div>
          </div>

          {/* Quản lý danh sách Voucher */}
          <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                <Tag className="w-4 h-4 text-amber-600" />
                <span>Danh Sách Mã Giảm Giá ({cfg.vouchers.length})</span>
              </div>
            </div>

            <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-stone-50/50">
              {cfg.vouchers.map((v) => (
                <div key={v.code} className="p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                        {v.code}
                      </span>
                      <span className="font-bold text-stone-800">
                        {v.type === 'percent' ? `Giảm ${v.value}%` : `Giảm ${v.value.toLocaleString('vi-VN')}đ`}
                      </span>
                      {v.requireNewCustomer && (
                        <span className="bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-md text-[10px]">
                          Khách mới
                        </span>
                      )}
                      {v.requireOldCustomer && (
                        <span className="bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-md text-[10px]">
                          Khách quen
                        </span>
                      )}
                    </div>
                    <p className="text-stone-500 text-[11px]">
                      {v.desc} • Đơn tối thiểu: {v.minOrder ? `${v.minOrder.toLocaleString('vi-VN')}đ` : '0đ'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveVoucher(v.code)}
                    className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-stone-200/60 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Form tạo Voucher */}
            <form onSubmit={handleAddVoucher} className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
              <span className="font-bold text-xs text-stone-800 block">Thêm mã voucher mới:</span>

              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
                <div>
                  <label className="text-[10px] text-stone-500 font-semibold block mb-1">Mã CODE *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: LAMQUEN"
                    value={newVoucher.code}
                    onChange={(e) => setNewVoucher({ ...newVoucher, code: e.target.value.toUpperCase() })}
                    className="w-full p-2 rounded-xl border border-stone-200 bg-white font-mono uppercase font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-stone-500 font-semibold block mb-1">Loại giảm</label>
                  <select
                    value={newVoucher.type}
                    onChange={(e) => setNewVoucher({ ...newVoucher, type: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 bg-white"
                  >
                    <option value="percent">Giảm theo %</option>
                    <option value="fixed">Giảm số tiền cố định (VNĐ)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-stone-500 font-semibold block mb-1">Mức giảm (%/VNĐ) *</label>
                  <input
                    type="number"
                    required
                    value={newVoucher.value}
                    onChange={(e) => setNewVoucher({ ...newVoucher, value: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 bg-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-stone-500 font-semibold block mb-1">Đơn tối thiểu</label>
                  <input
                    type="number"
                    value={newVoucher.minOrder}
                    onChange={(e) => setNewVoucher({ ...newVoucher, minOrder: e.target.value })}
                    placeholder="0"
                    className="w-full p-2 rounded-xl border border-stone-200 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-stone-500 font-semibold block mb-1">Mô tả ngắn</label>
                  <input
                    type="text"
                    placeholder="VD: Quà làm quen"
                    value={newVoucher.desc}
                    onChange={(e) => setNewVoucher({ ...newVoucher, desc: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 bg-white"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
                    <input
                      type="checkbox"
                      checked={newVoucher.requireNewCustomer}
                      onChange={(e) => setNewVoucher({ 
                        ...newVoucher, 
                        requireNewCustomer: e.target.checked,
                        requireOldCustomer: e.target.checked ? false : newVoucher.requireOldCustomer 
                      })}
                      className="w-4 h-4 rounded-md accent-amber-600"
                    />
                    <span>Chỉ cho khách mới</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
                    <input
                      type="checkbox"
                      checked={newVoucher.requireOldCustomer}
                      onChange={(e) => setNewVoucher({ 
                        ...newVoucher, 
                        requireOldCustomer: e.target.checked,
                        requireNewCustomer: e.target.checked ? false : newVoucher.requireNewCustomer 
                      })}
                      className="w-4 h-4 rounded-md accent-amber-600"
                    />
                    <span>Chỉ cho khách quen</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-900 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Voucher</span>
                </button>
              </div>
            </form>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleSaveConfig}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Lưu Toàn Bộ Cấu Hình</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= TAB 4: CHUYỆN VƯỜN & CẨM NANG ================= */}
      {activeTab === 'posts' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
              <Plus className="w-4 h-4 text-amber-600" />
              <span>Viết Bài Mới (Chuyện Vườn / Cẩm Nang)</span>
            </div>

            <form onSubmit={handleAddPost} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-semibold text-stone-600 block mb-1">Tiêu đề bài viết *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Cách bảo quản táo gió giòn ngọt cả tuần trong tủ lạnh"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-medium text-stone-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-600 block mb-1">Chuyên mục</label>
                  <select
                    value={newPost.category}
                    onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white font-medium text-stone-800"
                  >
                    <option value="Chuyện Vườn">Chuyện Vườn</option>
                    <option value="Mẹo Nhà Nông">Mẹo Nhà Nông</option>
                    <option value="Đặc Sản Bản Địa">Đặc Sản Bản Địa</option>
                    <option value="Món Ngon">Món Ngon Gia Đình</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-600 block mb-1">Ảnh bìa (URL)</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={newPost.image}
                    onChange={(e) => setNewPost({ ...newPost, image: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-600 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-600 block mb-1">Tác giả</label>
                  <input
                    type="text"
                    placeholder="Tâm (Vườn Xứ Nắng Gió)"
                    value={newPost.author}
                    onChange={(e) => setNewPost({ ...newPost, author: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-600 block mb-1">Tóm tắt ngắn *</label>
                <textarea
                  rows="2"
                  required
                  placeholder="Vài câu tóm tắt nội dung bài viết..."
                  value={newPost.desc}
                  onChange={(e) => setNewPost({ ...newPost, desc: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-700 resize-none"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-600 block mb-1">Nội dung chi tiết</label>
                <textarea
                  rows="4"
                  placeholder="Nội dung chi tiết bài viết..."
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-700 resize-y"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Đăng Bài Viết Ngay</span>
                </button>
              </div>
            </form>
          </div>

          {/* Danh sách bài đã đăng */}
          <div className="bg-white rounded-3xl border border-stone-200/90 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-stone-900">Danh Sách Bài Đã Đăng ({posts.length})</h2>
                <p className="text-xs text-stone-500">Các bài viết đang hiển thị trên Blog</p>
              </div>
              <button
                type="button"
                onClick={onResetPosts}
                className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Khôi phục mặc định</span>
              </button>
            </div>

            <div className="divide-y divide-stone-100">
              {posts.map((post) => (
                <div key={post.id} className="py-3.5 flex items-start justify-between gap-4 text-xs">
                  <div className="flex items-start gap-3">
                    <img 
                      src={post.image || 'https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?auto=format&fit=crop&w=600&q=80'} 
                      alt={post.title} 
                      className="w-16 h-14 rounded-xl object-cover shrink-0 border border-stone-100" 
                    />
                    <div className="space-y-1">
                      <span className="font-bold text-stone-900 text-xs line-clamp-1">{post.title}</span>
                      <p className="text-stone-500 text-[11px] line-clamp-2 leading-relaxed">{post.desc || post.excerpt}</p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60">
                      {post.category || 'Chuyện Vườn'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeletePost(post.id)}
                      className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-stone-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
