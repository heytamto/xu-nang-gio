// src/components/admin/AdminHeaderBar.jsx
import React from 'react';
import { 
  ArrowLeft, FileSpreadsheet, PackageCheck, RefreshCw, LogOut,
  LayoutDashboard, ShoppingBag, Feather, BookOpen, MessageSquare, Settings
} from 'lucide-react';

export default function AdminHeaderBar({
  adminUser,
  activeTab,
  setActiveTab,
  ordersCount = 0,
  productsCount = 0,
  storiesCount = 0,
  postsCount = 0,
  isLoadingOrders,
  onRefreshOrders,
  onOpenReconcile,
  onNavigateHome,
  onNavigatePacking,
  onLogout
}) {
  return (
    <div className="sticky top-0 z-40 bg-[#faf8f5]/95 backdrop-blur-md pt-3 pb-3 font-sans">
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
              onClick={onOpenReconcile}
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
              onClick={onRefreshOrders}
              className="w-11 h-11 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center active:scale-95 cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
              title="Làm mới dữ liệu từ Supabase"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingOrders ? 'animate-spin text-amber-700' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onLogout}
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
            <span>Đơn Hàng ({ordersCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`w-full h-11 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'products' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Sản Phẩm ({productsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stories')}
            className={`w-full h-11 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'stories' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Feather className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Chuyện Vườn ({storiesCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('posts')}
            className={`w-full h-11 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'posts' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Cẩm Nang ({postsCount})</span>
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
  );
}