// src/pages/AdminPage.jsx
import React, { useState } from 'react';
import { Check } from 'lucide-react';

import AdminLoginView from '../components/admin/AdminLoginView';
import AdminHeaderBar from '../components/admin/AdminHeaderBar';
import DashboardTab from '../components/admin/DashboardTab';
import ProductsTab from '../components/admin/product/ProductsTab';
import StoriesTab from '../components/admin/story/StoriesTab';
import PostsTab from '../components/admin/post/PostsTab';
import ReviewManagementTab from '../components/admin/ReviewManagementTab';
import ConfigVoucherTab from '../components/admin/config/ConfigVoucherTab';

import EditProductModal from '../components/admin/product/EditProductModal';
import EditPostModal from '../components/admin/post/EditPostModal';
import EditStoryModal from '../components/admin/story/EditStoryModal';
import ConfirmModal from '../components/admin/ConfirmModal';
import BankReconciliationModal from '../components/admin/BankReconciliationModal';

import { productRepo, postRepo, storyRepo } from '../repositories';
import { supabase } from '../supabaseClient';
import { useAdminOrders } from '../hooks/useAdminOrders';

export default function AdminPage({ 
  products = [], 
  categories = [],
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

  const isAuthenticated = Boolean(adminUser);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [savedNotice, setSavedNotice] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);
  const [isReconcileOpen, setIsReconcileOpen] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editingStory, setEditingStory] = useState(null);

  const showSavedToast = (msg = 'Đã lưu thay đổi thành công!') => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  // Tách nghiệp vụ đơn hàng ra hook chuyên trách
  const {
    dbOrders,
    isLoadingOrders,
    actionLoadingCode,
    confirmingOrderCode,
    fetchOrdersFromDatabase,
    handleUpdateStatus,
    handleConfirmPaymentAndNotify,
    handleDeleteOrder
  } = useAdminOrders(isAuthenticated, shopConfig, onUpdateOrderStatus, showSavedToast, setModalConfig);

  const handleLogout = () => {
    sessionStorage.removeItem('xng_admin_user');
    localStorage.removeItem('xng_admin_user');
    setAdminUser(null);
    if (onNavigateHome) onNavigateHome();
  };

  const handleSaveProducts = (newProducts) => {
    if (onSaveProducts) onSaveProducts(newProducts);
    showSavedToast('Đã lưu danh mục sản phẩm!');
  };

  const handleSaveStories = (newStories) => {
    if (onSaveStories) onSaveStories(newStories);
    showSavedToast('Đã lưu danh sách chuyện vườn!');
  };

  const handleSavePosts = (newPosts) => {
    if (onSavePosts) onSavePosts(newPosts);
    showSavedToast('Đã lưu bài viết cẩm nang!');
  };

  // Cập nhật kho sản phẩm
  const handleToggleProductStock = async (productId) => {
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) return;
    const nextStock = !(targetProduct.inStock ?? targetProduct.in_stock ?? true);

    try {
      await productRepo.update(productId, { in_stock: nextStock });
      const updated = products.map((p) =>
        p.id === productId ? { ...p, inStock: nextStock, in_stock: nextStock } : p
      );
      handleSaveProducts(updated);
      showSavedToast(`Đã ${nextStock ? 'mở bán' : 'tắt bán'} sản phẩm #${productId}`);
    } catch (err) {
      setModalConfig({ title: 'Lỗi Cập Nhật Kho', message: err.message, isAlert: true });
    }
  };

  // Xóa sản phẩm an toàn
  const handleDeleteProduct = (productId, productName) => {
    setModalConfig({
      title: 'Gỡ Khỏi Kệ Bán',
      message: `Bạn có chắc muốn xóa vĩnh viễn "${productName}" (#${productId}) khỏi cơ sở dữ liệu?`,
      confirmLabel: 'Đồng ý xóa',
      onConfirm: async () => {
        try {
          const { data: orderedItems } = await supabase
            .from('order_items')
            .select('id')
            .eq('product_id', productId)
            .limit(1);

          if (orderedItems && orderedItems.length > 0) {
            throw new Error('Sản phẩm này đã có trong lịch sử đơn hàng, không thể xóa vĩnh viễn. Vui lòng bấm "Tạm hết lứa" để tắt bán.');
          }

          const { error: weightErr } = await supabase.from('product_weights').delete().eq('product_id', productId);
          if (weightErr) throw weightErr;

          const { error: prodErr } = await supabase.from('products').delete().eq('id', productId);
          if (prodErr) throw prodErr;

          handleSaveProducts(products.filter((p) => p.id !== productId));
          showSavedToast(`Đã xóa vĩnh viễn "${productName}"`);
        } catch (err) {
          setModalConfig({ title: 'Lỗi Xóa Sản Phẩm', message: err.message, isAlert: true });
        }
      }
    });
  };

  // Xóa chuyện vườn
  const handleDeleteStory = (storyId, storyTitle) => {
    setModalConfig({
      title: 'Xóa Chuyện Vườn',
      message: `Bạn có chắc muốn xóa mẩu chuyện "${storyTitle}" (#${storyId})?`,
      confirmLabel: 'Xóa chuyện',
      onConfirm: async () => {
        try {
          await storyRepo.remove(storyId);
          handleSaveStories(stories.filter((s) => s.id !== storyId));
          showSavedToast(`Đã xóa câu chuyện "${storyTitle}"`);
        } catch (err) {
          setModalConfig({ title: 'Lỗi Xóa Câu Chuyện', message: err.message, isAlert: true });
        }
      }
    });
  };

  // Xóa bài viết
  const handleDeletePost = (postId, postTitle) => {
    setModalConfig({
      title: 'Xóa Bài Viết',
      message: `Bạn có chắc muốn xóa bài "${postTitle}" (#${postId})?`,
      confirmLabel: 'Xóa bài',
      onConfirm: async () => {
        try {
          await postRepo.remove(postId);
          handleSavePosts(posts.filter((p) => p.id !== postId));
          showSavedToast(`Đã xóa bài viết "${postTitle}"`);
        } catch (err) {
          setModalConfig({ title: 'Lỗi Xóa Bài Viết', message: err.message, isAlert: true });
        }
      }
    });
  };

  if (!isAuthenticated) {
    return (
      <AdminLoginView
        onLoginSuccess={(userObj) => setAdminUser(userObj)}
        onNavigateHome={onNavigateHome}
      />
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 font-sans text-stone-800">
      <AdminHeaderBar
        adminUser={adminUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        ordersCount={dbOrders.length}
        productsCount={products.length}
        storiesCount={stories.length}
        postsCount={posts.length}
        isLoadingOrders={isLoadingOrders}
        onRefreshOrders={fetchOrdersFromDatabase}
        onOpenReconcile={() => setIsReconcileOpen(true)}
        onNavigateHome={onNavigateHome}
        onNavigatePacking={onNavigatePacking}
        onLogout={handleLogout}
      />

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
            categories={categories}
            onAddProduct={(newProd) => handleSaveProducts([newProd, ...products])}
            onEditProduct={(p) => setEditingProduct(p)}
            onToggleStock={handleToggleProductStock}
            onDeleteProduct={handleDeleteProduct}
            setConfirmModalConfig={setModalConfig}
            onResetProducts={() => {
              setModalConfig({
                title: 'Khôi Phục',
                message: 'Khôi phục danh sách sản phẩm mặc định ban đầu?',
                confirmLabel: 'Khôi phục',
                onConfirm: onResetProducts
              });
            }}
            onShowAlert={showSavedToast}
          />
        )}

        {activeTab === 'stories' && (
          <StoriesTab
            stories={stories}
            onAddStory={(newStory) => handleSaveStories([newStory, ...stories])}
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
            onAddPost={(newPost) => handleSavePosts([newPost, ...posts])}
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
            setConfirmModalConfig={setModalConfig}
          />
        )}

        {activeTab === 'config' && (
          <ConfigVoucherTab
            config={shopConfig}
            setConfirmModalConfig={setModalConfig}
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
          categories={categories}
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