import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, LayoutDashboard, ShoppingBag, 
  Settings, BookOpen, Check 
} from 'lucide-react';

import DashboardTab from '../components/admin/DashboardTab';
import ProductsTab from '../components/admin/ProductsTab';
import ConfigVoucherTab from '../components/admin/ConfigVoucherTab';
import PostsTab from '../components/admin/PostsTab';
import EditProductModal from '../components/admin/EditProductModal';
import EditPostModal from '../components/admin/EditPostModal';
import ConfirmModal from '../components/admin/ConfirmModal';

const GSHEET_URL = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbx4uOPteTl5vmfBU5vH5cFjfNdBMAptKMal58Vh9lHofoTYIZeQqfxrICrNxLTGWlKy/exec';

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
  const [modalConfig, setModalConfig] = useState(null);

  // State quản lý Edit Modal
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingPost, setEditingPost] = useState(null);

  // Dữ liệu đơn hàng đồng bộ Google Sheet
  const [sheetOrders, setSheetOrders] = useState([]);
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);

  const fetchOrdersFromSheet = useCallback(async () => {
    setIsLoadingSheet(true);
    try {
      const res = await fetch(GSHEET_URL, { method: 'GET', redirect: 'follow' });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSheetOrders(json.data);
      } else if (Array.isArray(json)) {
        setSheetOrders(json);
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
    setTimeout(() => setSavedNotice(false), 2000);
  };

  // Cập nhật trạng thái đơn hàng
  const handleUpdateStatus = async (orderCode, newStatus) => {
    setActionLoadingCode(orderCode);
    try {
      await fetch(GSHEET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'update_status', code: orderCode, status: newStatus })
      });

      setSheetOrders(prev => prev.map(ord => ord.code === orderCode ? { ...ord, status: newStatus } : ord));
      try {
        const local = JSON.parse(localStorage.getItem('shop_orders') || '[]');
        localStorage.setItem('shop_orders', JSON.stringify(local.map(ord => ord.code === orderCode ? { ...ord, status: newStatus } : ord)));
      } catch {}
    } catch (err) {
      setModalConfig({ title: 'Lỗi Cập Nhật', message: err.message, isAlert: true });
    } finally {
      setActionLoadingCode(null);
    }
  };

  // Xóa đơn hàng
  const handleDeleteOrder = (orderCode) => {
    setModalConfig({
      title: 'Xác Nhận Xóa Đơn',
      message: `Tâm có chắc muốn xóa đơn ${orderCode} khỏi Google Sheet?`,
      confirmLabel: 'Đồng ý xóa',
      onConfirm: async () => {
        setActionLoadingCode(orderCode);
        try {
          await fetch(GSHEET_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'delete_order', code: orderCode })
          });
          setSheetOrders(prev => prev.filter(ord => ord.code !== orderCode));
          try {
            const local = JSON.parse(localStorage.getItem('shop_orders') || '[]');
            localStorage.setItem('shop_orders', JSON.stringify(local.filter(ord => ord.code !== orderCode)));
          } catch {}
        } catch (err) {
          setModalConfig({ title: 'Lỗi', message: err.message, isAlert: true });
        } finally {
          setActionLoadingCode(null);
        }
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header điều hướng Tab */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateHome}
            className="p-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black text-stone-900">Trang Quản Trị Vườn</h1>
            <p className="text-xs text-stone-500">Đồng bộ Google Sheet • Chỉnh sửa sản phẩm, bài viết & voucher</p>
          </div>
        </div>

        <div className="w-full bg-stone-100 p-1.5 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'dashboard' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'products' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Sản Phẩm ({products.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'config' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Settings className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Cấu Hình & Voucher</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('posts')}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'posts' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Chuyện Vườn ({posts.length})</span>
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Đã lưu thành công thay đổi vào hệ thống!</span>
        </div>
      )}

      {/* Hiển thị Tab tương ứng */}
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
            if (onSaveProducts) onSaveProducts([item, ...products]);
            showSavedToast();
          }}
          onEditProduct={(p) => setEditingProduct(p)}
          onToggleStock={(id) => {
            if (onSaveProducts) onSaveProducts(products.map(p => p.id === id ? { ...p, inStock: !p.inStock } : p));
          }}
          onDeleteProduct={(id, name) => {
            setModalConfig({
              title: 'Gỡ Khỏi Kệ Bán',
              message: `Xóa "${name}" khỏi kệ hàng?`,
              confirmLabel: 'Đồng ý xóa',
              onConfirm: () => {
                if (onSaveProducts) onSaveProducts(products.filter(p => p.id !== id));
                showSavedToast();
              }
            });
          }}
          onResetProducts={() => {
            setModalConfig({
              title: 'Khôi Phục',
              message: 'Khôi phục danh sách sản phẩm mặc định?',
              confirmLabel: 'Khôi phục',
              onConfirm: onResetProducts
            });
          }}
        />
      )}

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

      {activeTab === 'posts' && (
        <PostsTab
          posts={posts}
          onAddPost={(newPost) => {
            const item = {
              id: 'post-' + Date.now(),
              ...newPost,
              date: new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
            };
            if (onSavePosts) onSavePosts([item, ...posts]);
            showSavedToast();
          }}
          onEditPost={(p) => setEditingPost(p)}
          onDeletePost={(id, title) => {
            setModalConfig({
              title: 'Xóa Bài Viết',
              message: `Xóa bài "${title}" khỏi Blog?`,
              confirmLabel: 'Xóa',
              onConfirm: () => {
                if (onSavePosts) onSavePosts(posts.filter(p => p.id !== id));
                showSavedToast();
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

      {/* Modal Sửa Sản Phẩm */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={(updated) => {
            if (onSaveProducts) {
              onSaveProducts(products.map(p => p.id === updated.id ? updated : p));
            }
            setEditingProduct(null);
            showSavedToast();
          }}
        />
      )}

      {/* Modal Sửa Bài Viết */}
      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onSave={(updated) => {
            if (onSavePosts) {
              onSavePosts(posts.map(p => p.id === updated.id ? updated : p));
            }
            setEditingPost(null);
            showSavedToast();
          }}
        />
      )}

      {/* Modal Xác Nhận Chung */}
      <ConfirmModal
        modalConfig={modalConfig}
        onClose={() => setModalConfig(null)}
      />
    </div>
  );
}