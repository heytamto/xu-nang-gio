import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ArrowLeft, Plus, Trash2, RotateCcw, 
  Settings, Tag, QrCode, Check, BookOpen, 
  ShoppingBag, Calendar, User, ToggleLeft, ToggleRight,
  LayoutDashboard, TrendingUp, RefreshCw, Loader2, FileSpreadsheet,
  PhoneCall, CheckCircle2, Clock, XCircle, Truck, AlertCircle,
  Search, X, Filter
} from 'lucide-react';

const GSHEET_URL = 'https://script.google.com/macros/s/AKfycbx4uOPteTl5vmfBU5vH5cFjfNdBMAptKMal58Vh9lHofoTYIZeQqfxrICrNxLTGWlKy/exec';

const STATUS_CONFIG = {
  'Chờ xác nhận': { bg: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock },
  'Đã nhận cọc': { bg: 'bg-blue-50 text-blue-800 border-blue-200', icon: CheckCircle2 },
  'Đã thanh toán 100%': { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
  'Đang giao': { bg: 'bg-indigo-50 text-indigo-800 border-indigo-200', icon: Truck },
  'Hoàn thành': { bg: 'bg-stone-100 text-stone-800 border-stone-200', icon: Check },
  'Đã hủy': { bg: 'bg-red-50 text-red-700 border-red-200', icon: XCircle }
};

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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [savedNotice, setSavedNotice] = useState(false);
  const [actionLoadingCode, setActionLoadingCode] = useState(null);

  // Bộ lọc danh sách đơn hàng
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilterType, setDateFilterType] = useState('all'); // 'all', 'today', 'yesterday', '7days', '30days', 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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

  // Cập nhật trạng thái đơn
  const handleUpdateStatus = async (orderCode, newStatus) => {
    setActionLoadingCode(orderCode);
    try {
      await fetch(GSHEET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'update_status',
          code: orderCode,
          status: newStatus
        })
      });

      setSheetOrders((prev) =>
        prev.map((ord) => ord.code === orderCode ? { ...ord, status: newStatus } : ord)
      );

      try {
        const local = JSON.parse(localStorage.getItem('shop_orders') || '[]');
        const updatedLocal = local.map((ord) => ord.code === orderCode ? { ...ord, status: newStatus } : ord);
        localStorage.setItem('shop_orders', JSON.stringify(updatedLocal));
      } catch {}

    } catch (err) {
      alert('Lỗi cập nhật trạng thái: ' + err.message);
    } finally {
      setActionLoadingCode(null);
    }
  };

  // Xóa đơn hàng
  const handleDeleteOrder = async (orderCode) => {
    if (!window.confirm(`Xác nhận xóa hoàn toàn đơn ${orderCode} khỏi Google Sheet?`)) return;

    setActionLoadingCode(orderCode);
    try {
      await fetch(GSHEET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'delete_order',
          code: orderCode
        })
      });

      setSheetOrders((prev) => prev.filter((ord) => ord.code !== orderCode));

      try {
        const local = JSON.parse(localStorage.getItem('shop_orders') || '[]');
        const updatedLocal = local.filter((ord) => ord.code !== orderCode);
        localStorage.setItem('shop_orders', JSON.stringify(updatedLocal));
      } catch {}

    } catch (err) {
      alert('Lỗi khi xóa đơn: ' + err.message);
    } finally {
      setActionLoadingCode(null);
    }
  };

  // Chuẩn hóa dữ liệu đơn hàng
  const normalizedOrders = useMemo(() => {
    return sheetOrders.map((ord) => {
      const createdAt = ord.createdAt || ord['Thời Gian'] || ord['Ngày tạo'] || ord.date || '';
      const total = Number(String(ord.total || ord['Tổng Tiền'] || ord['Tổng đơn'] || 0).replace(/[^0-9]/g, '')) || 0;
      const code = ord.code || ord['Mã Đơn'] || 'XNG';
      const name = ord.name || ord['Tên Khách'] || ord['Khách Hàng'] || 'Khách lẻ';
      const phone = ord.phone || ord['Số ĐT'] || ord['Số Điện Thoại'] || '';
      const address = ord.address || ord['Địa Chỉ'] || '';
      const method = ord.paymentMethod || ord['Phương Thức'] || ord['Hình Thức TT'] || 'COD';
      const itemsSummary = ord.itemsSummary || ord['Sản Phẩm Đặt'] || '';
      const note = ord.note || ord['Ghi Chú'] || '';
      const status = ord.status || ord['Trạng Thái'] || 'Chờ xác nhận';

      let cart = ord.cart || [];
      if (typeof cart === 'string' && cart.startsWith('[')) {
        try { cart = JSON.parse(cart); } catch { cart = []; }
      }

      return {
        ...ord,
        code,
        name,
        phone,
        address,
        total,
        paymentMethod: method,
        itemsSummary,
        note,
        status,
        createdAt,
        cart
      };
    });
  }, [sheetOrders]);

  // Hàm parse ngày chuẩn xác hỗ trợ cả DD/MM/YYYY lẫn ISO YYYY-MM-DD
  const parseOrderDate = (dateStr) => {
    if (!dateStr) return null;
    if (typeof dateStr !== 'string') return new Date(dateStr);

    if (dateStr.includes('/')) {
      const datePart = dateStr.split(' ')[0];
      const parts = datePart.split('/');
      if (parts.length === 3) {
        return new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T00:00:00`);
      }
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  // Kiểm soát và ràng buộc khoảng ngày tối đa 30 ngày
  const handleStartDateChange = (val) => {
    setStartDate(val);
    if (val && endDate) {
      const start = new Date(val);
      const end = new Date(endDate);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        setEndDate(val);
      } else if (diffDays > 30) {
        const maxEnd = new Date(start);
        maxEnd.setDate(maxEnd.getDate() + 30);
        const maxEndStr = maxEnd.toISOString().split('T')[0];
        setEndDate(maxEndStr);
        alert('Khoảng thời gian chọn tối đa là 30 ngày. Đã tự động điều chỉnh ngày kết thúc.');
      }
    }
  };

  const handleEndDateChange = (val) => {
    if (!startDate && val) {
      setEndDate(val);
      return;
    }
    if (startDate && val) {
      const start = new Date(startDate);
      const end = new Date(val);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        alert('Ngày kết thúc không được nhỏ hơn ngày bắt đầu!');
        return;
      }
      if (diffDays > 30) {
        alert('Khoảng thời gian lọc tối đa là 30 ngày. Vui lòng chọn trong phạm vi 30 ngày!');
        const maxEnd = new Date(start);
        maxEnd.setDate(maxEnd.getDate() + 30);
        setEndDate(maxEnd.toISOString().split('T')[0]);
        return;
      }
    }
    setEndDate(val);
  };

  // Lọc đa năng: Theo SĐT, Tên, Mã đơn + Lọc ngày (tối đa 30 ngày) + Lọc Trạng thái
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;

    return normalizedOrders.filter((order) => {
      // 1. Lọc theo từ khóa tìm kiếm (SĐT, Tên, Mã)
      const rawPhone = String(order.phone || '').replace(/\D/g, '');
      const rawName = String(order.name || '').toLowerCase();
      const rawCode = String(order.code || '').toLowerCase();

      const search = searchQuery.trim().toLowerCase();
      const searchPhone = search.replace(/\D/g, '');

      const matchSearch =
        !search ||
        rawCode.includes(search) ||
        rawName.includes(search) ||
        (searchPhone && rawPhone.includes(searchPhone));

      if (!matchSearch) return false;

      // 2. Lọc theo trạng thái đơn
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }

      // 3. Lọc theo ngày
      if (dateFilterType === 'all') return true;

      const orderDate = parseOrderDate(order.createdAt);
      if (!orderDate) return true;

      const orderTime = new Date(
        orderDate.getFullYear(),
        orderDate.getMonth(),
        orderDate.getDate()
      ).getTime();

      if (dateFilterType === 'today') {
        return orderTime === todayStart;
      }

      if (dateFilterType === 'yesterday') {
        return orderTime === yesterdayStart;
      }

      if (dateFilterType === '7days') {
        const sevenDaysAgo = todayStart - 7 * 86400000;
        return orderTime >= sevenDaysAgo && orderTime <= todayStart;
      }

      if (dateFilterType === '30days') {
        const thirtyDaysAgo = todayStart - 30 * 86400000;
        return orderTime >= thirtyDaysAgo && orderTime <= todayStart;
      }

      if (dateFilterType === 'custom') {
        const startTimestamp = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
        const endTimestamp = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;

        if (startTimestamp && endTimestamp) {
          return orderTime >= startTimestamp && orderTime <= endTimestamp;
        }
        if (startTimestamp) {
          return orderTime >= startTimestamp;
        }
        if (endTimestamp) {
          return orderTime <= endTimestamp;
        }
      }

      return true;
    });
  }, [normalizedOrders, searchQuery, statusFilter, dateFilterType, startDate, endDate]);

  // Metrics thống kê theo danh sách đơn đã lọc
  const metrics = useMemo(() => {
    const validOrders = filteredOrders.filter(o => o.status !== 'Đã hủy');
    const totalRevenue = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const totalOrders = validOrders.length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    const realReceivedMoney = validOrders.reduce((sum, o) => {
      const st = o.status;
      if (st === 'Đã thanh toán 100%' || st === 'Hoàn thành') {
        return sum + (Number(o.total) || 0);
      }
      if (st === 'Đã nhận cọc') {
        return sum + (Number(shopConfig.depositAmount) || 50000);
      }
      return sum;
    }, 0);

    return { totalRevenue, totalOrders, avgOrderValue, realReceivedMoney };
  }, [filteredOrders, shopConfig.depositAmount]);

  // Xếp hạng món bán chạy
  const topProducts = useMemo(() => {
    const productStats = {};
    const validOrders = filteredOrders.filter(o => o.status !== 'Đã hủy');

    validOrders.forEach((order) => {
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

  // Cấu hình state
  const [cfg, setCfg] = useState(() => ({
    bankBin: shopConfig.bankBin || '970422',
    bankName: shopConfig.bankName || 'MB',
    accountNo: shopConfig.accountNo || '0848957345',
    accountName: shopConfig.accountName || 'TO THANH TAM',
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

  // Quản lý sản phẩm
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

  // Quản lý bài viết
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

  const handleResetFilters = () => {
    setSearchQuery('');
    setDateFilterType('all');
    setStartDate('');
    setEndDate('');
    setStatusFilter('all');
  };

  const isFiltering = searchQuery || dateFilterType !== 'all' || statusFilter !== 'all' || startDate || endDate;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* ================= TOP HEADER & TAB DÀN ĐỀU 100% ================= */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-4">
        {/* Hàng 1: Nút Back + Tiêu đề */}
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
            <p className="text-xs text-stone-500">Đồng bộ Google Sheet • Đối soát thanh toán & duyệt đơn</p>
          </div>
        </div>

        {/* Hàng 2: Tab Selector DÀN ĐỀU 4 CỘT TRÊN PC, 2 CỘT TRÊN MOBILE */}
        <div className="w-full bg-stone-100 p-1.5 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'dashboard'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="truncate">Dashboard & Đơn Hàng</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'products'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="truncate">Sản Phẩm ({products.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'config'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Settings className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="truncate">Cấu Hình & Voucher</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('posts')}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'posts'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="truncate">Chuyện Vườn ({posts.length})</span>
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Đã lưu thành công dữ liệu vào hệ thống!</span>
        </div>
      )}

      {/* ================= TAB 1: DASHBOARD & QUẢN LÝ ĐƠN HÀNG ================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Header Dashboard & Nút làm mới */}
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

            <button
              type="button"
              onClick={fetchOrdersFromSheet}
              disabled={isLoadingSheet}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Tải lại từ Google Sheet"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSheet ? 'animate-spin' : ''}`} />
              <span>Làm mới dữ liệu</span>
            </button>
          </div>

          {/* 4 Thẻ Metrics (Tính theo dữ liệu đã lọc) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-3xl border border-stone-200/90 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-stone-500 block">Doanh Thu Dự Kiến</span>
              <p className="text-lg sm:text-xl font-black text-stone-900 font-mono">
                {metrics.totalRevenue.toLocaleString('vi-VN')}đ
              </p>
              <span className="text-[10px] text-stone-400 block pt-0.5">Tổng giá trị đơn gửi</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-stone-200/90 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-emerald-700 block">Tiền Thực Nhận (Đã CK)</span>
              <p className="text-lg sm:text-xl font-black text-emerald-700 font-mono">
                {metrics.realReceivedMoney.toLocaleString('vi-VN')}đ
              </p>
              <span className="text-[10px] text-emerald-600 block pt-0.5">Sau khi đã đối soát khớp tiền</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-stone-200/90 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-stone-500 block">Số Đơn Hàng</span>
              <p className="text-lg sm:text-xl font-black text-stone-900 font-mono">
                {metrics.totalOrders} <span className="text-xs font-normal text-stone-400">đơn</span>
              </p>
              <span className="text-[10px] text-stone-400 block pt-0.5">Chưa tính đơn hủy</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-stone-200/90 shadow-xs space-y-1">
              <span className="text-[11px] font-semibold text-stone-500 block">Giá Trị TB / Đơn (AOV)</span>
              <p className="text-lg sm:text-xl font-black text-amber-800 font-mono">
                {metrics.avgOrderValue.toLocaleString('vi-VN')}đ
              </p>
              <span className="text-[10px] text-stone-400 block pt-0.5">Bình quân mỗi đơn</span>
            </div>
          </div>

          {/* Top Món Bán Chạy */}
          <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
              Đặc Sản Hút Khách Nhất (Bán Chạy)
            </h3>

            {topProducts.length === 0 ? (
              <p className="text-xs text-stone-400 italic py-4 text-center">
                Chưa có dữ liệu sản phẩm trong giai đoạn lọc này.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {topProducts.slice(0, 6).map((item, idx) => (
                  <div key={item.name} className="p-3 rounded-2xl bg-stone-50 border border-stone-200/70 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <span className="font-bold text-stone-800 truncate block">{item.name}</span>
                        <span className="text-[10px] text-stone-500">Đã bán: <strong>{item.quantity}</strong> phần</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ================= BỘ LỌC TÌM KIẾM ĐA NĂNG & CHI TIẾT ĐƠN HÀNG ================= */}
          <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-xs space-y-5">
            {/* Header danh sách đơn */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
              <div>
                <h3 className="text-sm font-black text-stone-900 uppercase tracking-wide flex items-center gap-2">
                  <span>Chi Tiết Đơn Hàng</span>
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
                    {filteredOrders.length} / {normalizedOrders.length} đơn
                  </span>
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Đối chiếu với thông báo biến động số dư ngân hàng rồi cập nhật trạng thái
                </p>
              </div>

              {isFiltering && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-bold bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-all self-start sm:self-auto"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Xóa bộ lọc</span>
                </button>
              )}
            </div>

            {/* CỤM THANH CÔNG CỤ TÌM KIẾM & LỌC NGÀY (TỐI ĐA 30 NGÀY) */}
            <div className="space-y-3 bg-stone-50/80 p-3.5 rounded-2xl border border-stone-200/80">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                {/* 1. Ô tìm kiếm theo SĐT, Tên hoặc Mã đơn */}
                <div className="sm:col-span-5 relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo số điện thoại, tên khách, mã XNG..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-stone-200 text-xs font-medium focus:border-amber-600 focus:outline-none placeholder:text-stone-400 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* 2. Bộ lọc mốc thời gian */}
                <div className="sm:col-span-4">
                  <select
                    value={dateFilterType}
                    onChange={(e) => setDateFilterType(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-700 focus:border-amber-600 focus:outline-none transition-all"
                  >
                    <option value="all">📅 Tất cả thời gian</option>
                    <option value="today">Hôm nay</option>
                    <option value="yesterday">Hôm qua</option>
                    <option value="7days">7 ngày gần nhất</option>
                    <option value="30days">30 ngày gần nhất</option>
                    <option value="custom">Tùy chọn khoảng ngày (tối đa 30 ngày)...</option>
                  </select>
                </div>

                {/* 3. Lọc theo trạng thái đơn */}
                <div className="sm:col-span-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-700 focus:border-amber-600 focus:outline-none transition-all"
                  >
                    <option value="all">⚡ Tất cả trạng thái</option>
                    <option value="Chờ xác nhận">⏳ Chờ xác nhận</option>
                    <option value="Đã nhận cọc">✅ Đã nhận cọc</option>
                    <option value="Đã thanh toán 100%">💰 Đã thanh toán 100%</option>
                    <option value="Đang giao">🚚 Đang giao</option>
                    <option value="Hoàn thành">🎉 Hoàn thành</option>
                    <option value="Đã hủy">❌ Đã hủy</option>
                  </select>
                </div>
              </div>

              {/* HÀNG NHẬP KHOẢNG NGÀY NẾU CHỌN 'CUSTOM' (GIỚI HẠN TỐI ĐA 30 NGÀY) */}
              {dateFilterType === 'custom' && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-200/60 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-stone-500 font-semibold">Từ ngày:</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="py-1.5 px-2.5 rounded-xl bg-white border border-stone-200 text-xs font-mono font-bold text-stone-800 focus:border-amber-600 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-stone-500 font-semibold">Đến ngày:</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => handleEndDateChange(e.target.value)}
                      className="py-1.5 px-2.5 rounded-xl bg-white border border-stone-200 text-xs font-mono font-bold text-stone-800 focus:border-amber-600 focus:outline-none"
                    />
                  </div>

                  <span className="text-[11px] text-amber-700 font-medium italic">
                    * Khoảng cách tối đa 30 ngày để tối ưu tốc độ tra cứu
                  </span>
                </div>
              )}
            </div>

            {/* DANH SÁCH ĐƠN HÀNG ĐÃ LỌC */}
            <div className="divide-y divide-stone-100 space-y-3 pt-1">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-10 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                  <p className="text-xs font-bold text-stone-600">Không tìm thấy đơn hàng nào khớp với điều kiện lọc</p>
                  <p className="text-[11px] text-stone-400 mt-1">Tâm hãy thử đổi số điện thoại hoặc nới rộng khoảng ngày nhé</p>
                  {isFiltering && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="mt-3 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Bỏ toàn bộ lọc
                    </button>
                  )}
                </div>
              ) : (
                filteredOrders.map((ord) => {
                  const isProcessing = actionLoadingCode === ord.code;
                  const statusMeta = STATUS_CONFIG[ord.status] || STATUS_CONFIG['Chờ xác nhận'];

                  return (
                    <div key={ord.code} className="pt-3 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                      {/* Cột trái: Thông tin khách & Món */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md text-[11px]">
                            {ord.code}
                          </span>
                          <strong className="text-stone-900 text-sm">{ord.name}</strong>
                          
                          {/* Nút bấm gọi điện thoại nhanh */}
                          {ord.phone && (
                            <a
                              href={`tel:${ord.phone}`}
                              className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-lg transition-colors"
                              title="Gọi điện xác nhận"
                            >
                              <PhoneCall className="w-3 h-3 text-amber-600" />
                              <span>{ord.phone}</span>
                            </a>
                          )}

                          <span className="text-[10.5px] text-stone-400">({ord.createdAt})</span>
                        </div>

                        {/* Địa chỉ & Món đặt */}
                        {ord.address && (
                          <p className="text-stone-600 text-[11px] line-clamp-1">
                            📍 <strong>Giao đến:</strong> {ord.address}
                          </p>
                        )}

                        {ord.itemsSummary && (
                          <p className="text-stone-700 text-[11px] font-medium bg-stone-50 p-2 rounded-xl border border-stone-100 line-clamp-2">
                            🛍️ {ord.itemsSummary}
                          </p>
                        )}

                        {ord.note && (
                          <p className="text-stone-400 text-[10.5px] italic">
                            Ghi chú: "{ord.note}"
                          </p>
                        )}
                      </div>

                      {/* Cột phải: Tiền, Đổi Trạng Thái & Xóa */}
                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100">
                        <div className="text-left md:text-right">
                          <span className="font-mono font-black text-stone-900 text-sm block">
                            {(Number(ord.total) || 0).toLocaleString('vi-VN')}đ
                          </span>
                          <span className="text-[10px] text-stone-400 font-medium">
                            {ord.paymentMethod}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Dropdown cập nhật trạng thái */}
                          <div className="relative">
                            <select
                              disabled={isProcessing}
                              value={ord.status}
                              onChange={(e) => handleUpdateStatus(ord.code, e.target.value)}
                              className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl border appearance-none pr-6 cursor-pointer focus:outline-none transition-colors ${statusMeta.bg}`}
                            >
                              <option value="Chờ xác nhận">⏳ Chờ xác nhận</option>
                              <option value="Đã nhận cọc">✅ Đã nhận cọc</option>
                              <option value="Đã thanh toán 100%">💰 Đã thanh toán 100%</option>
                              <option value="Đang giao">🚚 Đang giao</option>
                              <option value="Hoàn thành">🎉 Hoàn thành</option>
                              <option value="Đã hủy">❌ Đã hủy</option>
                            </select>
                          </div>

                          {/* Nút Xóa đơn */}
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleDeleteOrder(ord.code)}
                            className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-stone-100 transition-colors disabled:opacity-40"
                            title="Xóa đơn khỏi Google Sheet"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: QUẢN LÝ SẢN PHẨM ================= */}
      {activeTab === 'products' && (
        <div className="space-y-6">
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
                  placeholder="0848957345"
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