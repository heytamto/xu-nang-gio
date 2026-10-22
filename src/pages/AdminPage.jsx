// src/pages/AdminPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ArrowLeft, LayoutDashboard, ShoppingBag, 
  Settings, BookOpen, Check, Feather, PackageCheck,
  Lock, KeyRound, LogOut, ShieldAlert, MessageSquare,
  Search, Star, EyeOff, CheckCircle2, Trash2, Loader2
} from 'lucide-react';

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

import { supabase } from '../supabaseClient';
import { formatDate } from '../utils/dateUtils';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'tam2026';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '808208978769-7h3ognen0s4ecvr8259kadnl8tkmg6il.apps.googleusercontent.com';
const ALLOWED_ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || 'xunanggio@gmail.com')
  .split(',')
  .map(e => e.trim().toLowerCase());

// Giải mã JWT Google Credential
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export default function AdminPage({ 
  products = [], 
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
  // 1. Kiểm tra session admin
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
  const googleBtnRef = useRef(null);

  const isAuthenticated = Boolean(adminUser);

  // Xử lý khi đăng nhập Google thành công
  const handleGoogleCredentialResponse = useCallback((response) => {
    const profile = parseJwt(response.credential);
    if (!profile || !profile.email) {
      setLoginError('Không thể xác minh tài khoản Google. Vui lòng thử lại!');
      return;
    }

    const email = profile.email.toLowerCase();
    if (ALLOWED_ADMIN_EMAILS.includes(email)) {
      const userObj = { email, name: profile.name, picture: profile.picture };
      sessionStorage.setItem('xng_admin_user', JSON.stringify(userObj));
      localStorage.setItem('xng_admin_user', JSON.stringify(userObj));
      setAdminUser(userObj);
      setLoginError('');
    } else {
      setLoginError(`Email ${email} không có quyền quản trị vườn.`);
    }
  }, []);

  // Khởi tạo nút Google Sign-In
  useEffect(() => {
    if (isAuthenticated) return;

    const interval = setInterval(() => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        clearInterval(interval);
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
        });

        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'signin_with',
          shape: 'pill'
        });
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isAuthenticated, handleGoogleCredentialResponse]);

  // Đăng nhập bằng mật khẩu quản trị
  const handlePasswordLogin = (e) => {
    e.preventDefault();
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

  // State quản lý tab & dữ liệu
  const [activeTab, setActiveTab] = useState('dashboard');
  const [savedNotice, setSavedNotice] = useState(false);
  const [actionLoadingCode, setActionLoadingCode] = useState(null);
  const [modalConfig, setModalConfig] = useState(null);

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

  // 2. Tải danh sách đơn hàng an toàn (Khắc phục lỗi PGRST201)
  const fetchOrdersFromDatabase = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingOrders(true);
    try {
      // Bóc tách orders trước
      const { data: ordersData, error: ordersErr } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersErr) throw ordersErr;

      if (!Array.isArray(ordersData) || ordersData.length === 0) {
        setDbOrders([]);
        return;
      }

      // Lấy order_items độc lập để không phụ thuộc vào tên constraint foreign key
      const orderCodes = ordersData.map(o => o.code).filter(Boolean);
      let itemsMap = {};

      if (orderCodes.length > 0) {
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('*')
          .in('order_code', orderCodes);

        if (Array.isArray(itemsData)) {
          itemsData.forEach(item => {
            const key = item.order_code;
            if (!itemsMap[key]) itemsMap[key] = [];
            itemsMap[key].push(item);
          });
        }
      }

      const mergedOrders = ordersData.map(ord => ({
        ...ord,
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

  // 3. Cập nhật trạng thái đơn hàng trên Supabase
  const handleUpdateStatus = async (orderCode, newStatus) => {
    setActionLoadingCode(orderCode);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('code', orderCode);

      if (error) throw error;

      setDbOrders((prev) => {
        const nextOrders = prev.map((ord) => 
          (ord.code === orderCode ? { ...ord, status: newStatus } : ord)
        );
        try {
          localStorage.setItem('shop_orders', JSON.stringify(nextOrders));
        } catch (e) {
          console.error(e);
        }
        return nextOrders;
      });
      
      if (onUpdateOrderStatus) {
        onUpdateOrderStatus(orderCode, newStatus);
      }

      showSavedToast(`Đã chuyển đơn ${orderCode} sang "${newStatus}"`);
    } catch (err) {
      setModalConfig({ title: 'Lỗi Cập Nhật', message: err.message, isAlert: true });
    } finally {
      setActionLoadingCode(null);
    }
  };

  // 4. Xóa đơn hàng trên Supabase
  const handleDeleteOrder = (orderCode) => {
    setModalConfig({
      title: 'Xác Nhận Xóa Đơn',
      message: `Tâm có chắc muốn xóa vĩnh viễn đơn ${orderCode} khỏi cơ sở dữ liệu?`,
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

  // 5. Đồng bộ Sản phẩm sang Supabase
  const handleSaveProducts = async (newProducts) => {
    if (onSaveProducts) onSaveProducts(newProducts);
    showSavedToast('Đã lưu danh mục sản phẩm!');
  };

  // 6. Đồng bộ Chuyện vườn sang Supabase
  const handleSaveStories = async (newStories) => {
    if (onSaveStories) onSaveStories(newStories);
    showSavedToast('Đã lưu danh sách chuyện vườn!');
  };

  // 7. Đồng bộ Bài viết sang Supabase
  const handleSavePosts = async (newPosts) => {
    if (onSavePosts) onSavePosts(newPosts);
    showSavedToast('Đã lưu bài viết cẩm nang!');
  };

  // GIAO DIỆN KHÓA NẾU CHƯA ĐĂNG NHẬP
  if (!isAuthenticated) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 font-sans animate-fadeIn">
        <div className="w-full max-w-sm bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-xl text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100/80 text-amber-900 flex items-center justify-center border border-amber-200 shadow-2xs">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-black text-stone-900">Khu Vực Quản Trị Vườn</h2>
            <p className="text-xs text-stone-500 leading-relaxed">
              Dành riêng cho chủ vườn Xứ Nắng Gió ({ALLOWED_ADMIN_EMAILS.join(', ')})
            </p>
          </div>

          <div className="space-y-3">
            <div ref={googleBtnRef} className="w-full flex justify-center min-h-[44px]"></div>
            
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-stone-200"></div>
              <span className="shrink mx-3 text-stone-400 text-[11px] font-bold uppercase tracking-wider">Hoặc dùng mật khẩu</span>
              <div className="flex-grow border-t border-stone-200"></div>
            </div>

            <form onSubmit={handlePasswordLogin} className="space-y-3 text-left">
              <div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu quản trị..."
                    value={passInput}
                    onChange={(e) => {
                      setPassInput(e.target.value);
                      setLoginError('');
                    }}
                    className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-2xl border border-stone-200 bg-stone-50/80 focus:bg-white focus:outline-none focus:border-amber-700 font-medium text-stone-800 transition-all shadow-2xs"
                  />
                </div>

                {loginError && (
                  <div className="flex items-center gap-1.5 text-rose-600 text-[11px] font-semibold mt-2 px-1">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-2xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs tracking-wide transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                Đăng Nhập Mật Khẩu
              </button>
            </form>
          </div>

          {onNavigateHome && (
            <button
              type="button"
              onClick={onNavigateHome}
              className="text-xs font-semibold text-stone-500 hover:text-stone-800 flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay về trang mua sắm</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // GIAO DIỆN QUẢN TRỊ KHI ĐÃ ĐĂNG NHẬP
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans animate-fadeIn">
      {/* Header điều hướng 6 Tab: ĐÃ BỎ LÀM MỚI DỮ LIỆU */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-4">
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
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-stone-900">Trang Quản Trị Vườn</h1>
                {adminUser?.email && (
                  <span className="text-[10.5px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                    {adminUser.email}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500">Hệ thống quản lý thời gian thực Supabase PostgreSQL</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigatePacking && (
              <button
                type="button"
                onClick={onNavigatePacking}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer shadow-2xs"
                title="Mở Bảng Gom & Đóng Thùng Xốp"
              >
                <PackageCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>Kho Đóng Kiện</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-600 border border-stone-200/80 transition-colors cursor-pointer"
              title="Đăng xuất khỏi trang quản trị"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 6 Tab chuyển đổi mượt mà */}
        <div className="w-full bg-stone-100 p-1.5 rounded-2xl grid grid-cols-2 sm:grid-cols-6 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`w-full py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'dashboard' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Đơn Hàng ({dbOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`w-full py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'products' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Sản Phẩm ({products.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stories')}
            className={`w-full py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'stories' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Feather className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Chuyện Vườn ({stories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('posts')}
            className={`w-full py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'posts' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Cẩm Nang ({posts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`w-full py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'reviews' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Đánh Giá</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`w-full py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'config' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Settings className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Cấu Hình & Mã</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DASHBOARD ĐƠN HÀNG */}
      {activeTab === 'dashboard' && (
        <DashboardTab
          orders={dbOrders}
          isLoading={isLoadingOrders}
          onRefresh={fetchOrdersFromDatabase}
          onUpdateStatus={handleUpdateStatus}
          onDeleteOrder={handleDeleteOrder}
          depositAmount={shopConfig?.depositAmount || 50000}
          actionLoadingCode={actionLoadingCode}
          onShowAlert={(msg) => setModalConfig({ title: 'Thông Báo', message: msg, isAlert: true })}
        />
      )}

      {/* TAB 2: SẢN PHẨM */}
      {activeTab === 'products' && (
        <ProductsTab
          products={products}
          onAddProduct={(newProd) => {
            const item = {
              id: 'sp-' + Date.now(),
              ...newProd,
              basePrice: Number(newProd.basePrice) || 0,
            };
            handleSaveProducts([item, ...products]);
          }}
          onEditProduct={(p) => setEditingProduct(p)}
          onToggleStock={(id) => {
            const updated = products.map((p) => (p.id === id ? { ...p, inStock: !p.inStock } : p));
            handleSaveProducts(updated);
          }}
          onDeleteProduct={(id, name) => {
            setModalConfig({
              title: 'Gỡ Khỏi Kệ Bán',
              message: `Xóa "${name}" khỏi kệ hàng?`,
              confirmLabel: 'Đồng ý xóa',
              onConfirm: () => {
                handleSaveProducts(products.filter((p) => p.id !== id));
              }
            });
          }}
          onResetProducts={() => {
            setModalConfig({
              title: 'Khôi Phục',
              message: 'Khôi phục danh sách sản phẩm mặc định ban đầu?',
              confirmLabel: 'Khôi phục',
              onConfirm: onResetProducts
            });
          }}
        />
      )}

      {/* TAB 3: CHUYỆN VƯỜN */}
      {activeTab === 'stories' && (
        <StoriesTab
          stories={stories}
          onAddStory={(newStory) => {
            const item = {
              id: 'story-' + Date.now(),
              ...newStory,
              date: formatDate(new Date())
            };
            handleSaveStories([item, ...stories]);
          }}
          onEditStory={(s) => setEditingStory(s)}
          onDeleteStory={(id, title) => {
            setModalConfig({
              title: 'Xóa Chuyện Vườn',
              message: `Xóa mẩu chuyện "${title}" khỏi hệ thống?`,
              confirmLabel: 'Xóa chuyện',
              onConfirm: () => {
                handleSaveStories(stories.filter((s) => s.id !== id));
              }
            });
          }}
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

      {/* TAB 4: CẨM NANG & BÀI VIẾT */}
      {activeTab === 'posts' && (
        <PostsTab
          posts={posts}
          onAddPost={(newPost) => {
            const item = {
              id: 'post-' + Date.now(),
              ...newPost,
              date: formatDate(new Date())
            };
            handleSavePosts([item, ...posts]);
          }}
          onEditPost={(p) => setEditingPost(p)}
          onDeletePost={(id, title) => {
            setModalConfig({
              title: 'Xóa Bài Viết',
              message: `Xóa bài "${title}" khỏi cẩm nang?`,
              confirmLabel: 'Xóa bài',
              onConfirm: () => {
                handleSavePosts(posts.filter((p) => p.id !== id));
              }
            });
          }}
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

      {/* TAB 5: KIỂM DUYỆT ĐÁNH GIÁ (MỚI) */}
      {activeTab === 'reviews' && (
        <ReviewManagementTab onShowToast={showSavedToast} />
      )}

      {/* TAB 6: CẤU HÌNH & VOUCHER */}
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

      {/* Modal Sửa Sản Phẩm */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={(updated) => {
            handleSaveProducts(products.map((p) => (p.id === updated.id ? updated : p)));
            setEditingProduct(null);
          }}
        />
      )}

      {/* Modal Sửa Chuyện Vườn */}
      {editingStory && (
        <EditStoryModal
          story={editingStory}
          onClose={() => setEditingStory(null)}
          onSave={(updated) => {
            handleSaveStories(stories.map((s) => (s.id === updated.id ? updated : s)));
            setEditingStory(null);
          }}
        />
      )}

      {/* Modal Sửa Bài Viết */}
      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onSave={(updated) => {
            handleSavePosts(posts.map((p) => (p.id === updated.id ? updated : p)));
            setEditingPost(null);
          }}
        />
      )}

      {/* Modal Xác Nhận Chung */}
      <ConfirmModal
        modalConfig={modalConfig}
        onClose={() => setModalConfig(null)}
      />

      {/* Toast thông báo lưu thành công */}
      {savedNotice && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-stone-900/95 text-white border border-emerald-500/40 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-2xl backdrop-blur-md animate-fadeIn">
          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span>{savedNotice}</span>
        </div>
      )}
    </div>
  );
}