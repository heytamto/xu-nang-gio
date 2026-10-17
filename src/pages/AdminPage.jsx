import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, LayoutDashboard, ShoppingBag, 
  Settings, BookOpen, Check, RefreshCw, Feather, PackageCheck
} from 'lucide-react';

import DashboardTab from '../components/admin/DashboardTab';
import ProductsTab from '../components/admin/ProductsTab';
import StoriesTab from '../components/admin/StoriesTab';
import PostsTab from '../components/admin/PostsTab';
import ConfigVoucherTab from '../components/admin/ConfigVoucherTab';

import EditProductModal from '../components/admin/EditProductModal';
import EditPostModal from '../components/admin/EditPostModal';
import EditStoryModal from '../components/admin/EditStoryModal';
import ConfirmModal from '../components/admin/ConfirmModal';

import { formatDate } from '../utils/dateUtils';

const GSHEET_URL = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbx4uOPteTl5vmfBU5vH5cFjfNdBMAptKMal58Vh9lHofoTYIZeQqfxrICrNxLTGWlKy/exec';

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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [savedNotice, setSavedNotice] = useState(false);
  const [actionLoadingCode, setActionLoadingCode] = useState(null);
  const [modalConfig, setModalConfig] = useState(null);

  // State quản lý Edit Modal
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editingStory, setEditingStory] = useState(null);

  // Dữ liệu đơn hàng đồng bộ Google Sheet
  const [sheetOrders, setSheetOrders] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('shop_orders') || '[]');
    } catch {
      return [];
    }
  });
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);

  // Kéo danh sách đơn hàng thực tế từ Sheet
  const fetchOrdersFromSheet = useCallback(async () => {
    setIsLoadingSheet(true);
    try {
      const res = await fetch(`${GSHEET_URL}?action=get_orders&_t=${Date.now()}`);
      const json = await res.json();
      let ordersList = [];
      if (json.status === 'success' && Array.isArray(json.orders)) {
        ordersList = json.orders;
      } else if (Array.isArray(json.data)) {
        ordersList = json.data;
      } else if (Array.isArray(json)) {
        ordersList = json;
      }
      
      if (ordersList.length > 0) {
        setSheetOrders(ordersList);
        try {
          localStorage.setItem('shop_orders', JSON.stringify(ordersList));
        } catch (e) {
          console.error(e);
        }
      }
    } catch {
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

  const showSavedToast = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  // Helper gửi lệnh POST lên Apps Script (text/plain chống CORS)
  const postToSheet = async (payload) => {
    return fetch(GSHEET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
  };

  // Đồng bộ sản phẩm lên Google Sheet (tab SAN_PHAM)
  const syncProductsToSheet = async (newProducts) => {
    if (onSaveProducts) onSaveProducts(newProducts);
    showSavedToast();
    try {
      await postToSheet({
        action: 'save_products',
        products: newProducts
      });
    } catch (err) {
      console.error('Lỗi lưu sản phẩm lên Sheet:', err);
    }
  };

  // Đồng bộ chuyện vườn lên Google Sheet (tab CHUYEN_VUON)
  const syncStoriesToSheet = async (newStories) => {
    if (onSaveStories) onSaveStories(newStories);
    showSavedToast();
    try {
      await postToSheet({
        action: 'save_stories',
        stories: newStories
      });
    } catch (err) {
      console.error('Lỗi lưu chuyện vườn lên Sheet:', err);
    }
  };

  // Đồng bộ bài viết lên Google Sheet (tab BAI_VIET)
  const syncPostsToSheet = async (newPosts) => {
    if (onSavePosts) onSavePosts(newPosts);
    showSavedToast();
    try {
      await postToSheet({
        action: 'save_posts',
        posts: newPosts
      });
    } catch (err) {
      console.error('Lỗi lưu bài viết lên Sheet:', err);
    }
  };

  // Cập nhật trạng thái đơn hàng (Đã xác nhận / Đang giao / Hoàn thành...)
  const handleUpdateStatus = async (orderCode, newStatus) => {
    setActionLoadingCode(orderCode);
    try {
      await postToSheet({ action: 'update_status', code: orderCode, status: newStatus });

      // Cập nhật state nội bộ và ghi đè trực tiếp localStorage để Kho nhận ngay
      setSheetOrders((prev) => {
        const nextOrders = prev.map((ord) => (ord.code === orderCode ? { ...ord, status: newStatus } : ord));
        try {
          localStorage.setItem('shop_orders', JSON.stringify(nextOrders));
        } catch (e) {
          console.error(e);
        }
        return nextOrders;
      });
      
      // Đồng bộ state toàn cục lên component cha (nếu có truyền)
      if (onUpdateOrderStatus) {
        onUpdateOrderStatus(orderCode, newStatus);
      }

      showSavedToast();
    } catch (err) {
      setModalConfig({ title: 'Lỗi Cập Nhật', message: err.message, isAlert: true });
    } finally {
      setActionLoadingCode(null);
    }
  };

  // Xóa đơn hàng khỏi Sheet
  const handleDeleteOrder = (orderCode) => {
    setModalConfig({
      title: 'Xác Nhận Xóa Đơn',
      message: `Tâm có chắc muốn xóa đơn ${orderCode} khỏi Google Sheet?`,
      confirmLabel: 'Đồng ý xóa',
      onConfirm: async () => {
        setActionLoadingCode(orderCode);
        try {
          await postToSheet({ action: 'delete_order', code: orderCode });
          setSheetOrders((prev) => {
            const nextOrders = prev.filter((ord) => ord.code !== orderCode);
            try {
              localStorage.setItem('shop_orders', JSON.stringify(nextOrders));
            } catch (e) {
              console.error(e);
            }
            return nextOrders;
          });
          showSavedToast();
        } catch (err) {
          setModalConfig({ title: 'Lỗi', message: err.message, isAlert: true });
        } finally {
          setActionLoadingCode(null);
        }
      }
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans animate-fadeIn">
      {/* Header điều hướng 5 Tab & Lối tắt */}
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
              <h1 className="text-base sm:text-lg font-black text-stone-900">Trang Quản Trị Vườn</h1>
              <p className="text-xs text-stone-500">Đồng bộ 2 chiều Google Sheet • Kho, đơn, voucher & chuyện vườn</p>
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
              onClick={fetchOrdersFromSheet}
              disabled={isLoadingSheet}
              className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              title="Làm mới dữ liệu từ Google Sheet"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSheet ? 'animate-spin text-amber-600' : ''}`} />
              <span className="hidden sm:inline">Làm mới Sheet</span>
            </button>
          </div>
        </div>

        {/* 5 Tab chuyển đổi */}
        <div className="w-full bg-stone-100 p-1.5 rounded-2xl grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'dashboard' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Đơn Hàng ({sheetOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'products' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Sản Phẩm ({products.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stories')}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'stories' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Feather className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Chuyện Vườn ({stories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('posts')}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'posts' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Cẩm Nang ({posts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer col-span-2 sm:col-span-1 ${
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
          orders={sheetOrders}
          isLoading={isLoadingSheet}
          onRefresh={fetchOrdersFromSheet}
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
              weights: [
                { id: 'opt1', label: `1 ${newProd.unit || 'kg'}`, multiplier: 1 },
                { id: 'opt2', label: `Combo 2 ${newProd.unit || 'kg'}`, multiplier: 1.95 }
              ]
            };
            syncProductsToSheet([item, ...products]);
          }}
          onEditProduct={(p) => setEditingProduct(p)}
          onToggleStock={(id) => {
            const updated = products.map((p) => (p.id === id ? { ...p, inStock: !p.inStock } : p));
            syncProductsToSheet(updated);
          }}
          onDeleteProduct={(id, name) => {
            setModalConfig({
              title: 'Gỡ Khỏi Kệ Bán',
              message: `Xóa "${name}" khỏi kệ hàng và cập nhật lên Google Sheet?`,
              confirmLabel: 'Đồng ý xóa',
              onConfirm: () => {
                syncProductsToSheet(products.filter((p) => p.id !== id));
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
            syncStoriesToSheet([item, ...stories]);
          }}
          onEditStory={(s) => setEditingStory(s)}
          onDeleteStory={(id, title) => {
            setModalConfig({
              title: 'Xóa Chuyện Vườn',
              message: `Xóa mẩu chuyện "${title}" và đồng bộ lên Google Sheet?`,
              confirmLabel: 'Xóa chuyện',
              onConfirm: () => {
                syncStoriesToSheet(stories.filter((s) => s.id !== id));
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
            syncPostsToSheet([item, ...posts]);
          }}
          onEditPost={(p) => setEditingPost(p)}
          onDeletePost={(id, title) => {
            setModalConfig({
              title: 'Xóa Bài Viết',
              message: `Xóa bài "${title}" khỏi cẩm nang và cập nhật lên Google Sheet?`,
              confirmLabel: 'Xóa bài',
              onConfirm: () => {
                syncPostsToSheet(posts.filter((p) => p.id !== id));
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

      {/* TAB 5: CẤU HÌNH & VOUCHER */}
      {activeTab === 'config' && (
        <ConfigVoucherTab
          config={shopConfig}
          onSaveConfig={(newCfg) => {
            if (onSaveConfig) onSaveConfig(newCfg);
            showSavedToast();
          }}
          onShowAlert={(msg) => setModalConfig({ title: 'Thông Báo', message: msg, isAlert: true })}
        />
      )}

      {/* Modal Sửa Sản Phẩm */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          uploadUrl={GSHEET_URL}
          onClose={() => setEditingProduct(null)}
          onSave={(updated) => {
            syncProductsToSheet(products.map((p) => (p.id === updated.id ? updated : p)));
            setEditingProduct(null);
          }}
        />
      )}

      {/* Modal Sửa Chuyện Vườn */}
      {editingStory && (
        <EditStoryModal
          story={editingStory}
          uploadUrl={GSHEET_URL}
          onClose={() => setEditingStory(null)}
          onSave={(updated) => {
            syncStoriesToSheet(stories.map((s) => (s.id === updated.id ? updated : s)));
            setEditingStory(null);
          }}
        />
      )}

      {/* Modal Sửa Bài Viết */}
      {editingPost && (
        <EditPostModal
          post={editingPost}
          uploadUrl={GSHEET_URL}
          onClose={() => setEditingPost(null)}
          onSave={(updated) => {
            syncPostsToSheet(posts.map((p) => (p.id === updated.id ? updated : p)));
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
          <span>Đã đồng bộ thành công lên Google Sheet!</span>
        </div>
      )}
    </div>
  );
}