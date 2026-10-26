// src/pages/AdminPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, LayoutDashboard, ShoppingBag, 
  Settings, BookOpen, Check, Feather, PackageCheck,
  Lock, KeyRound, LogOut, ShieldAlert, MessageSquare,
  RefreshCw, FileSpreadsheet
} from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

import DashboardTab from '../components/admin/DashboardTab';
import ProductsTab from '../components/admin/ProductsTab';
import StoriesTab from '../components/admin/StoriesTab';
import PostsTab from '../components/admin/PostsTab';
import ReviewManagementTab from '../components/admin/ReviewManagementTab';
import ConfigVoucherTab from '../components/admin/ConfigVoucherTab';

import EditProductModal from '../components/admin/EditProductModal';
import EditPostModal from '../components/admin/EditPostModal';
import EditStoryModal from '../components/admin/EditStoryModal';
import ConfirmModal from '../components/admin/ConfirmModal';
import BankReconciliationModal from '../components/admin/BankReconciliationModal';

import { supabase } from '../supabaseClient';
import { formatDate } from '../utils/dateUtils';
import { 
  ORDER_STATUS, 
  ORDER_STATUS_MAP, 
  normalizeOrderStatus 
} from '../constants/orderStatus';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'tam2026';
const ALLOWED_ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || 'xunanggio@gmail.com')
  .split(',')
  .map((e) => e.trim().toLowerCase());

export default function AdminPage({ 
  products = [], 
  categories = [], // 1. Nhận danh mục từ DB truyền xuống qua App.jsx
  onSaveProducts, 
  onResetProducts,
  posts = [], 
  onSavePosts, 
  onResetPosts,
  stories = [], 
  onSaveStories, 
  onResetStories,
  shopConfig = {}, 
  onSaveConfig, 
  onResetConfig,
  onUpdateOrderStatus,
  onNavigateHome,
  onNavigatePacking
}) {
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('xng_admin_user') || localStorage.getItem('xng_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [passInput, setPassInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const isAuthenticated = Boolean(adminUser);

  // Hook đăng nhập Google
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });

        if (!userInfoRes.ok) {
          throw new Error('Không thể lấy thông tin tài khoản Google');
        }

        const profile = await userInfoRes.json();
        const email = (profile.email || '').toLowerCase();

        if (ALLOWED_ADMIN_EMAILS.includes(email)) {
          const userObj = { email, name: profile.name, picture: profile.picture };
          sessionStorage.setItem('xng_admin_user', JSON.stringify(userObj));
          localStorage.setItem('xng_admin_user', JSON.stringify(userObj));
          setAdminUser(userObj);
          setLoginError('');
        } else {
          setLoginError(`Email ${email} không có quyền quản trị vườn.`);
        }
      } catch (err) {
        console.error('Lỗi lấy hồ sơ Google:', err);
        setLoginError('Đăng nhập Google thất bại. Vui lòng thử lại hoặc dùng mật khẩu.');
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: (err) => {
      console.warn('Lỗi Google OAuth:', err);
      setLoginError('Đăng nhập Google không thành công. Kiểm tra Authorized Origins hoặc adblock.');
      setIsGoogleLoading(false);
    }
  });

  const handlePasswordLogin = (e) => {
    if (e) e.preventDefault();
    if (passInput.trim() === ADMIN_PASSWORD) {
      const userObj = { email: 'admin@xunanggio.vn', name: 'Chủ Vườn' };
      sessionStorage.setItem('xng_admin_user', JSON.stringify(userObj));
      setAdminUser(userObj);
      setLoginError('');
    } else {
      setLoginError('Mật khẩu quản trị không chính xác.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('xng_admin_user');
    localStorage.removeItem('xng_admin_user');
    setAdminUser(null);
    if (onNavigateHome) onNavigateHome();
  };

  const [activeTab, setActiveTab] = useState('dashboard');
  const [savedNotice, setSavedNotice] = useState(false);
  const [actionLoadingCode, setActionLoadingCode] = useState(null);
  const [confirmingOrderCode, setConfirmingOrderCode] = useState(null);
  const [modalConfig, setModalConfig] = useState(null);
  const [isReconcileOpen, setIsReconcileOpen] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editingStory, setEditingStory] = useState(null);

  const [dbOrders, setDbOrders] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('shop_orders') || '[]');
    } catch {
      return [];
    }
  });
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const fetchOrdersFromDatabase = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingOrders(true);
    try {
      const { data: ordersData, error: ordersErr } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersErr) throw ordersErr;

      if (!Array.isArray(ordersData) || ordersData.length === 0) {
        setDbOrders([]);
        return;
      }

      const orderCodes = ordersData.map((o) => o.code).filter(Boolean);
      let itemsMap = {};

      if (orderCodes.length > 0) {
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('*')
          .in('order_code', orderCodes);

        if (Array.isArray(itemsData)) {
          itemsData.forEach((item) => {
            const key = item.order_code;
            if (!itemsMap[key]) itemsMap[key] = [];
            itemsMap[key].push(item);
          });
        }
      }

      const mergedOrders = ordersData.map((ord) => ({
        ...ord,
        status: normalizeOrderStatus(ord.status),
        order_items: itemsMap[ord.code] || ord.cart || []
      }));

      setDbOrders(mergedOrders);
      try {
        localStorage.setItem('shop_orders', JSON.stringify(mergedOrders));
      } catch (e) {
        console.error(e);
      }
    } catch (err) {
      console.error('Lỗi tải đơn hàng từ Supabase:', err);
      try {
        const local = JSON.parse(localStorage.getItem('shop_orders') || '[]');
        setDbOrders(local);
      } catch {
        setDbOrders([]);
      }
    } finally {
      setIsLoadingOrders(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrdersFromDatabase();
    }
  }, [isAuthenticated, fetchOrdersFromDatabase]);

  const showSavedToast = (msg = 'Đã lưu thay đổi thành công!') => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleUpdateStatus = async (orderCode, newStatusRaw, reason = null) => {
    const normalizedStatus = normalizeOrderStatus(newStatusRaw);

    setActionLoadingCode(orderCode);
    try {
      const updatePayload = { 
        status: normalizedStatus,
        updated_at: new Date().toISOString()
      };

      if (reason) {
        updatePayload.cancel_reason = reason;
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('code', orderCode)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('Cập nhật thất bại. Bạn có thể chưa có quyền UPDATE do chính sách RLS trên Supabase.');
      }

      setDbOrders((prev) => {
        const nextOrders = prev.map((ord) => 
          (ord.code === orderCode 
            ? { ...ord, status: normalizedStatus, ...(reason ? { cancel_reason: reason } : {}) } 
            : ord)
        );
        try {
          localStorage.setItem('shop_orders', JSON.stringify(nextOrders));
        } catch (e) {
          console.error(e);
        }
        return nextOrders;
      });
      
      if (onUpdateOrderStatus) {
        onUpdateOrderStatus(orderCode, normalizedStatus, reason);
      }

      const statusLabel = ORDER_STATUS_MAP[normalizedStatus]?.label || normalizedStatus;
      showSavedToast(`Đã chuyển đơn ${orderCode} sang "${statusLabel}"`);
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái đơn:', err);
      setModalConfig({ 
        title: 'Lỗi Cập Nhật Trạng Thái', 
        message: err.message || 'Không thể lưu trạng thái vào cơ sở dữ liệu. Vui lòng kiểm tra quyền RLS.', 
        isAlert: true 
      });
    } finally {
      setActionLoadingCode(null);
    }
  };

  const handleConfirmPaymentAndNotify = async (order) => {
    if (!order || !order.code) return;

    setConfirmingOrderCode(order.code);

    try {
      const totalOrderNum = Number(order.final_total || order.total || 0);
      const configuredDeposit = Number(shopConfig?.depositAmount || 50000);
      
      const verifiedAmount = order.payment_method === 'deposit' 
        ? Math.min(configuredDeposit, totalOrderNum) 
        : totalOrderNum;

      const updatedStatus = ORDER_STATUS.CONFIRMED;
      const nowIso = new Date().toISOString();

      const { error: dbError } = await supabase
        .from('orders')
        .update({
          status: updatedStatus,
          payment_verified: true,
          deposit_paid: verifiedAmount,
          payment_verified_at: nowIso,
          updated_at: nowIso
        })
        .eq('code', order.code);

      if (dbError) throw dbError;

      const customerEmail = order.email || order.customer?.email;
      let emailSent = false;

      if (customerEmail && customerEmail.includes('@')) {
        try {
          const remainingCod = Math.max(0, totalOrderNum - verifiedAmount);
          const { error: mailError } = await supabase.functions.invoke('send-order-email', {
            body: {
              to: customerEmail,
              template: 'payment_success',
              order_code: order.code,
              customer_name: order.customer_name || order.name || 'Quý khách',
              payment_method: order.payment_method,
              deposit_paid: verifiedAmount,
              final_total: totalOrderNum,
              remaining_cod: remainingCod,
              items: order.order_items || order.cart || []
            }
          });
          if (!mailError) emailSent = true;
        } catch (mailErr) {
          console.warn('Gửi email thông báo thất bại:', mailErr);
        }
      }

      setDbOrders((prev) => {
        const nextOrders = prev.map((o) =>
          o.code === order.code
            ? {
                ...o,
                status: updatedStatus,
                payment_verified: true,
                deposit_paid: verifiedAmount,
                payment_verified_at: nowIso
              }
            : o
        );
        try {
          localStorage.setItem('shop_orders', JSON.stringify(nextOrders));
        } catch (e) {
          console.error(e);
        }
        return nextOrders;
      });

      if (onUpdateOrderStatus) {
        onUpdateOrderStatus(order.code, updatedStatus);
      }

      showSavedToast(
        `Đã duyệt đơn #${order.code}!` + (emailSent ? ` (Đã gửi email đến ${customerEmail})` : '')
      );
    } catch (err) {
      console.error('Lỗi khi duyệt thanh toán:', err);
      setModalConfig({
        title: 'Lỗi Duyệt Thanh Toán',
        message: err.message || 'Không thể cập nhật đơn hàng.',
        isAlert: true
      });
    } finally {
      setConfirmingOrderCode(null);
    }
  };

  const handleDeleteOrder = (orderCode) => {
    setModalConfig({
      title: 'Xác Nhận Xóa Đơn',
      message: `Bạn có chắc muốn xóa vĩnh viễn đơn ${orderCode} khỏi cơ sở dữ liệu?`,
      confirmLabel: 'Đồng ý xóa',
      onConfirm: async () => {
        setActionLoadingCode(orderCode);
        try {
          const { error } = await supabase
            .from('orders')
            .delete()
            .eq('code', orderCode);

          if (error) throw error;

          setDbOrders((prev) => {
            const nextOrders = prev.filter((ord) => ord.code !== orderCode);
            try {
              localStorage.setItem('shop_orders', JSON.stringify(nextOrders));
            } catch (e) {
              console.error(e);
            }
            return nextOrders;
          });
          showSavedToast(`Đã xóa đơn hàng ${orderCode}`);
        } catch (err) {
          setModalConfig({ title: 'Lỗi', message: err.message, isAlert: true });
        } finally {
          setActionLoadingCode(null);
        }
      }
    });
  };

  const handleSaveProducts = async (newProducts) => {
    if (onSaveProducts) onSaveProducts(newProducts);
    showSavedToast('Đã lưu danh mục sản phẩm!');
  };

  const handleSaveStories = async (newStories) => {
    if (onSaveStories) onSaveStories(newStories);
    showSavedToast('Đã lưu danh sách chuyện vườn!');
  };

  const handleSavePosts = async (newPosts) => {
    if (onSavePosts) onSavePosts(newPosts);
    showSavedToast('Đã lưu bài viết cẩm nang!');
  };

  // Bật/tắt bán đồng bộ trực tiếp Supabase Database
  const handleToggleProductStock = async (productId) => {
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) return;

    const nextStock = !(targetProduct.inStock ?? targetProduct.in_stock ?? true);

    try {
      const { error } = await supabase
        .from('products')
        .update({ in_stock: nextStock })
        .eq('id', productId);

      if (error) throw error;

      const updated = products.map((p) =>
        p.id === productId ? { ...p, inStock: nextStock, in_stock: nextStock } : p
      );
      handleSaveProducts(updated);
      showSavedToast(`Đã ${nextStock ? 'mở bán' : 'tắt bán'} sản phẩm #${productId}`);
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái kho:', err);
      setModalConfig({
        title: 'Lỗi Cập Nhật Kho',
        message: err.message || 'Không thể đổi trạng thái kho. Vui lòng kiểm tra quyền RLS.',
        isAlert: true
      });
    }
  };

  // Xóa sản phẩm đồng bộ trực tiếp Supabase Database
  const handleDeleteProduct = (productId, productName) => {
    setModalConfig({
      title: 'Gỡ Khỏi Kệ Bán',
      message: `Bạn có chắc muốn xóa vĩnh viễn "${productName}" (#${productId}) khỏi cơ sở dữ liệu?`,
      confirmLabel: 'Đồng ý xóa',
      onConfirm: async () => {
        try {
          await supabase.from('product_weights').delete().eq('product_id', productId);
          const { error } = await supabase.from('products').delete().eq('id', productId);

          if (error) throw error;

          const updated = products.filter((p) => p.id !== productId);
          handleSaveProducts(updated);
          showSavedToast(`Đã xóa vĩnh viễn "${productName}"`);
        } catch (err) {
          console.error('Lỗi xóa sản phẩm:', err);
          setModalConfig({ title: 'Lỗi Xóa Sản Phẩm', message: err.message, isAlert: true });
        }
      }
    });
  };

  // Xóa câu chuyện đồng bộ trực tiếp Supabase Database
  const handleDeleteStory = (storyId, storyTitle) => {
    setModalConfig({
      title: 'Xóa Chuyện Vườn',
      message: `Bạn có chắc muốn xóa mẩu chuyện "${storyTitle}" (#${storyId}) khỏi cơ sở dữ liệu?`,
      confirmLabel: 'Xóa chuyện',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('stories').delete().eq('id', storyId);
          if (error) throw error;

          const updated = stories.filter((s) => s.id !== storyId);
          handleSaveStories(updated);
          showSavedToast(`Đã xóa câu chuyện "${storyTitle}"`);
        } catch (err) {
          console.error('Lỗi xóa câu chuyện:', err);
          setModalConfig({ title: 'Lỗi Xóa Câu Chuyện', message: err.message, isAlert: true });
        }
      }
    });
  };

  // Xóa bài viết cẩm nang đồng bộ trực tiếp Supabase Database
  const handleDeletePost = (postId, postTitle) => {
    setModalConfig({
      title: 'Xóa Bài Viết',
      message: `Bạn có chắc muốn xóa bài "${postTitle}" (#${postId}) khỏi cẩm nang?`,
      confirmLabel: 'Xóa bài',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('posts').delete().eq('id', postId);
          if (error) throw error;

          const updated = posts.filter((p) => p.id !== postId);
          handleSavePosts(updated);
          showSavedToast(`Đã xóa bài viết "${postTitle}"`);
        } catch (err) {
          console.error('Lỗi xóa bài viết:', err);
          setModalConfig({ title: 'Lỗi Xóa Bài Viết', message: err.message, isAlert: true });
        }
      }
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 font-sans animate-fadeIn text-stone-800">
        <div className="w-full max-w-md bg-white p-7 sm:p-9 rounded-3xl border border-stone-200/90 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-100/90 text-amber-900 flex items-center justify-center border border-amber-200 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">Khu Vực Quản Trị Vườn</h2>
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed font-normal">
              Dành riêng cho chủ vườn Xứ Nắng Gió ({ALLOWED_ADMIN_EMAILS.join(', ')})
            </p>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              disabled={isGoogleLoading}
              onClick={() => loginWithGoogle()}
              className="w-full h-11 px-4 rounded-2xl border border-stone-300 hover:border-amber-500 bg-white hover:bg-stone-50 text-stone-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-60"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isGoogleLoading ? 'Đang xác thực Google...' : 'Đăng nhập với Google'}</span>
            </button>
            
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-stone-200"></div>
              <span className="shrink mx-3 text-stone-400 text-xs font-bold uppercase tracking-wider">Hoặc dùng mật khẩu</span>
              <div className="flex-grow border-t border-stone-200"></div>
            </div>

            <form onSubmit={handlePasswordLogin} className="space-y-3.5 text-left">
              <div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu quản trị..."
                    value={passInput}
                    onChange={(e) => {
                      setPassInput(e.target.value);
                      setLoginError('');
                    }}
                    className="w-full h-11 text-xs sm:text-sm pl-11 pr-4 rounded-2xl border border-stone-200 bg-stone-50/80 focus:bg-white focus:outline-none focus:border-amber-700 font-medium text-stone-900 transition-all shadow-2xs"
                  />
                </div>

                {loginError && (
                  <div className="flex items-center gap-1.5 text-rose-600 text-xs font-semibold mt-2 px-1">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full h-11 px-4 rounded-2xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs sm:text-sm tracking-wide transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Đăng Nhập Mật Khẩu</span>
              </button>
            </form>
          </div>

          {onNavigateHome && (
            <button
              type="button"
              onClick={onNavigateHome}
              className="text-xs sm:text-sm font-semibold text-stone-500 hover:text-stone-900 flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer pt-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay về trang mua sắm</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 font-sans text-stone-800">
      <div className="sticky top-0 z-40 bg-[#faf8f5]/95 backdrop-blur-md pt-3 pb-3">
        <header className="bg-white p-4 sm:p-6 rounded-3xl border border-stone-200/90 shadow-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3.5">
            <div className="flex items-center gap-3.5">
              <button
                type="button"
                onClick={onNavigateHome}
                className="w-11 h-11 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                title="Về Trang Chủ"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-base sm:text-xl font-black text-stone-900 tracking-tight">Trang Quản Trị Vườn</h1>
                  {adminUser?.email && (
                    <span className="text-xs font-bold text-amber-950 bg-amber-100 px-3 py-0.5 rounded-full border border-amber-300 shadow-2xs">
                      {adminUser.email}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-stone-500 font-medium mt-0.5">Hệ thống quản lý thời gian thực Supabase PostgreSQL</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => setIsReconcileOpen(true)}
                className="h-11 flex items-center gap-2 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 text-xs sm:text-sm font-bold rounded-2xl active:scale-95 cursor-pointer shadow-2xs transition-colors"
                title="Đối Soát Sao Kê Ngân Hàng MB Bank"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span className="hidden sm:inline">Đối Soát Sao Kê</span>
                <span className="sm:hidden">Sao Kê</span>
              </button>

              {onNavigatePacking && (
                <button
                  type="button"
                  onClick={onNavigatePacking}
                  className="h-11 flex items-center gap-2 px-4 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300/80 text-xs sm:text-sm font-bold rounded-2xl active:scale-95 cursor-pointer shadow-2xs transition-colors"
                  title="Mở Bảng Gom & Đóng Thùng Xốp"
                >
                  <PackageCheck className="w-4 h-4 text-amber-800" />
                  <span>Kho Đóng Kiện</span>
                </button>
              )}
              
              <button
                type="button"
                disabled={isLoadingOrders}
                onClick={fetchOrdersFromDatabase}
                className="w-11 h-11 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center active:scale-95 cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
                title="Làm mới dữ liệu từ Supabase"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingOrders ? 'animate-spin text-amber-700' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="w-11 h-11 rounded-2xl bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-600 border border-stone-200/80 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                title="Đăng xuất khỏi trang quản trị"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="w-full bg-stone-100/90 p-1.5 rounded-2xl grid grid-cols-2 sm:grid-cols-6 gap-1.5 border border-stone-200/50">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`w-full h-11 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'dashboard' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Đơn Hàng ({dbOrders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`w-full h-11 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'products' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Sản Phẩm ({products.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('stories')}
              className={`w-full h-11 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'stories' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Feather className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Chuyện Vườn ({stories.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('posts')}
              className={`w-full h-11 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'posts' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Cẩm Nang ({posts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`w-full h-11 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'reviews' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Đánh Giá</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('config')}
              className={`w-full h-11 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'config' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Settings className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Cấu Hình & Mã</span>
            </button>
          </div>
        </header>
      </div>

      <div className="space-y-6 pt-3">
        {activeTab === 'dashboard' && (
          <DashboardTab
            orders={dbOrders}
            isLoading={isLoadingOrders}
            onRefresh={fetchOrdersFromDatabase}
            onUpdateStatus={handleUpdateStatus}
            onConfirmPayment={handleConfirmPaymentAndNotify}
            confirmingOrderCode={confirmingOrderCode}
            onDeleteOrder={handleDeleteOrder}
            depositAmount={shopConfig?.depositAmount || 50000}
            actionLoadingCode={actionLoadingCode}
            onShowAlert={(msg) => setModalConfig({ title: 'Thông Báo', message: msg, isAlert: true })}
          />
        )}

        {activeTab === 'products' && (
          <ProductsTab
            products={products}
            categories={categories} // 2. Truyền danh mục động xuống ProductsTab
            onAddProduct={(newProd) => {
              handleSaveProducts([newProd, ...products]);
            }}
            onEditProduct={(p) => setEditingProduct(p)}
            onToggleStock={handleToggleProductStock}
            onDeleteProduct={handleDeleteProduct}
            onResetProducts={() => {
              setModalConfig({
                title: 'Khôi Phục',
                message: 'Khôi phục danh sách sản phẩm mặc định ban đầu?',
                confirmLabel: 'Khôi phục',
                onConfirm: onResetProducts
              });
            }}
            onShowAlert={showSavedToast} // 3. Kích hoạt khung toast xanh góc phải
          />
        )}

        {activeTab === 'stories' && (
          <StoriesTab
            stories={stories}
            onAddStory={(newStory) => {
              handleSaveStories([newStory, ...stories]);
            }}
            onEditStory={(s) => setEditingStory(s)}
            onDeleteStory={handleDeleteStory}
            onResetStories={onResetStories ? () => {
              setModalConfig({
                title: 'Khôi Phục',
                message: 'Khôi phục danh sách câu chuyện mặc định?',
                confirmLabel: 'Khôi phục',
                onConfirm: onResetStories
              });
            } : null}
          />
        )}

        {activeTab === 'posts' && (
          <PostsTab
            posts={posts}
            onAddPost={(newPost) => {
              handleSavePosts([newPost, ...posts]);
            }}
            onEditPost={(p) => setEditingPost(p)}
            onDeletePost={handleDeletePost}
            onResetPosts={() => {
              setModalConfig({
                title: 'Khôi Phục',
                message: 'Khôi phục danh sách bài viết mặc định?',
                confirmLabel: 'Khôi phục',
                onConfirm: onResetPosts
              });
            }}
          />
        )}

        {activeTab === 'reviews' && (
          <ReviewManagementTab 
            shopConfig={shopConfig} 
            onSaveConfig={onSaveConfig} 
            onShowToast={showSavedToast} 
          />
        )}

        {activeTab === 'config' && (
          <ConfigVoucherTab
            config={shopConfig}
            onSaveConfig={(newCfg) => {
              if (onSaveConfig) onSaveConfig(newCfg);
              showSavedToast('Đã lưu cấu hình shop!');
            }}
            onShowAlert={(msg) => setModalConfig({ title: 'Thông Báo', message: msg, isAlert: true })}
          />
        )}
      </div>

      <BankReconciliationModal
        isOpen={isReconcileOpen}
        onClose={() => setIsReconcileOpen(false)}
        orders={dbOrders}
        onRefreshOrders={fetchOrdersFromDatabase}
      />

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          categories={categories} // 4. Truyền danh mục động vào modal chỉnh sửa
          onClose={() => setEditingProduct(null)}
          onSave={(updated) => {
            handleSaveProducts(products.map((p) => (p.id === updated.id ? updated : p)));
            setEditingProduct(null);
          }}
          onShowAlert={showSavedToast}
        />
      )}

      {editingStory && (
        <EditStoryModal
          story={editingStory}
          onClose={() => setEditingStory(null)}
          onSave={(updated) => {
            handleSaveStories(stories.map((s) => (s.id === updated.id ? updated : s)));
            setEditingStory(null);
          }}
          onShowAlert={showSavedToast}
        />
      )}

      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onSave={(updated) => {
            handleSavePosts(posts.map((p) => (p.id === updated.id ? updated : p)));
            setEditingPost(null);
          }}
          onShowAlert={showSavedToast}
        />
      )}

      <ConfirmModal
        modalConfig={modalConfig}
        onClose={() => setModalConfig(null)}
      />

      {savedNotice && (
        <div className="fixed bottom-6 right-6 z-50 py-3.5 px-5 bg-stone-900/95 text-white border border-emerald-500/40 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-3 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span>{savedNotice}</span>
        </div>
      )}
    </div>
  );
}