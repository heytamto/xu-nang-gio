import React, { useState, useEffect, useCallback } from "react";
import { FolderTree, Plus, Pencil, Trash2, Loader2, X } from "lucide-react";
import { categoryRepo } from "../../../repositories";

export default function CategoryConfigSection({ onShowAlert, setConfirmModalConfig }) {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newCategory, setNewCategory] = useState({ id: "", name: "", order: 0 });
  const [editingCategory, setEditingCategory] = useState(null);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await categoryRepo.getAll();
      const sorted = (data || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setCategories(sorted);
    } catch (err) {
      console.error("Lỗi tải categories:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;

    const catId = (newCategory.id.trim() || `cat_${Date.now()}`).toLowerCase();
    const payload = {
      id: catId,
      name: newCategory.name.trim(),
      order: Number(newCategory.order) || 0,
    };

    try {
      const data = await categoryRepo.create(payload);
      setCategories((prev) => [...prev, data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      setNewCategory({ id: "", name: "", order: 0 });
      onShowAlert?.(`Đã thêm danh mục "${data.name}"!`);
    } catch (err) {
      onShowAlert?.("Không thể thêm danh mục: " + err.message);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingCategory?.name.trim()) return;

    try {
      await categoryRepo.update(editingCategory.id, {
        name: editingCategory.name.trim(),
        order: Number(editingCategory.order) || 0,
      });

      setCategories((prev) =>
        prev
          .map((c) => (c.id === editingCategory.id ? { ...c, ...editingCategory } : c))
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      );
      setEditingCategory(null);
      onShowAlert?.(`Đã cập nhật danh mục #${editingCategory.id}!`);
    } catch (err) {
      onShowAlert?.("Lỗi cập nhật: " + err.message);
    }
  };

  const handleDelete = (catId, catName) => {
    setConfirmModalConfig({
      isAlert: false,
      title: "Xóa Danh Mục",
      message: `Bạn có chắc chắn muốn xóa danh mục "${catName}" (#${catId})?`,
      confirmLabel: "Xác nhận xóa",
      onConfirm: async () => {
        try {
          await categoryRepo.remove(catId);
          setCategories((prev) => prev.filter((c) => c.id !== catId));
          onShowAlert?.(`Đã xóa danh mục "${catName}"!`);
        } catch (err) {
          onShowAlert?.("Lỗi xóa danh mục: " + err.message);
        }
      },
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-7 space-y-5 shadow-xs font-sans">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
        <div className="flex items-center gap-2.5 text-stone-900 font-black text-sm sm:text-base">
          <FolderTree className="w-5 h-5 text-amber-700" />
          <span>Quản Lý Danh Mục Sản Phẩm ({categories.length} nhóm)</span>
        </div>
      </div>

      {isLoading ? (
        <div className="p-6 text-center text-xs text-stone-500 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
          <span>Đang tải danh mục...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 hover:bg-white flex items-center justify-between gap-3 shadow-2xs"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-900 text-xs sm:text-sm truncate">{cat.name}</span>
                  <span className="text-[11px] font-bold text-amber-950 bg-amber-100 px-2 py-0.5 rounded-md">#{cat.id}</span>
                </div>
                <span className="text-xs text-stone-500 block">Thứ tự: <strong className="text-stone-800">{cat.order ?? 0}</strong></span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => setEditingCategory({ ...cat })} className="p-2 text-stone-400 hover:text-amber-700">
                  <Pencil className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => handleDelete(cat.id, cat.name)} className="p-2 text-stone-400 hover:text-rose-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAddCategory} className="bg-stone-50 p-4 sm:p-5 rounded-2xl border border-stone-200/90 flex flex-wrap items-end gap-3.5 text-xs sm:text-sm">
        <div className="flex-1 min-w-[140px]">
          <label className="font-bold text-stone-700 block mb-1">Mã (ID)</label>
          <input
            type="text"
            placeholder="cat_01"
            value={newCategory.id}
            onChange={(e) => setNewCategory({ ...newCategory, id: e.target.value })}
            className="w-full h-11 px-3.5 rounded-2xl border border-stone-200 bg-white"
          />
        </div>
        <div className="flex-2 min-w-[200px]">
          <label className="font-bold text-stone-700 block mb-1">Tên danh mục *</label>
          <input
            type="text"
            required
            placeholder="Nho & Táo Ninh Thuận"
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            className="w-full h-11 px-3.5 rounded-2xl border border-stone-200 bg-white font-bold"
          />
        </div>
        <div className="w-28 shrink-0">
          <label className="font-bold text-stone-700 block mb-1">Thứ tự</label>
          <input
            type="number"
            value={newCategory.order}
            onChange={(e) => setNewCategory({ ...newCategory, order: e.target.value })}
            className="w-full h-11 px-3.5 rounded-2xl border border-stone-200 bg-white text-center font-bold"
          />
        </div>
        <button type="submit" className="h-11 px-6 bg-amber-800 hover:bg-amber-900 text-white rounded-2xl font-bold flex items-center gap-1.5 shrink-0">
          <Plus className="w-4 h-4" />
          <span>Thêm Danh Mục</span>
        </button>
      </form>

      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-stone-900">Sửa Danh Mục: #{editingCategory.id}</h3>
              <button onClick={() => setEditingCategory(null)}><X className="w-5 h-5 text-stone-400" /></button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="font-bold block mb-1 text-xs">Tên danh mục</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full h-11 px-3 border rounded-xl font-bold text-sm"
                />
              </div>
              <div>
                <label className="font-bold block mb-1 text-xs">Thứ tự</label>
                <input
                  type="number"
                  value={editingCategory.order ?? 0}
                  onChange={(e) => setEditingCategory({ ...editingCategory, order: e.target.value })}
                  className="w-full h-11 px-3 border rounded-xl text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingCategory(null)} className="h-10 px-4 rounded-xl text-xs font-bold text-stone-600">Hủy</button>
                <button type="submit" className="h-10 px-5 rounded-xl bg-amber-800 text-white text-xs font-bold">Lưu Thay Đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}