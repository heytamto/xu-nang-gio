// src/utils/categoryIcons.js
import { 
  Sparkles, Apple, Flame, Fish, Wine, Leaf, 
  Carrot, Cherry, Citrus, Coffee, Cookie, 
  Package, ShoppingBag, Sun, Award, ShieldCheck 
} from 'lucide-react';

// Bảng tra cứu toàn bộ icon có thể được admin chọn từ Database
const ICON_REGISTRY = {
  Sparkles,
  Apple,
  Flame,
  Fish,
  Wine,
  Leaf,
  Carrot,
  Cherry,
  Citrus,
  Coffee,
  Cookie,
  Package,
  ShoppingBag,
  Sun,
  Award,
  ShieldCheck
};

/**
 * Lấy Icon component chuẩn động từ dữ liệu Category trong Database
 * @param {Object} category Dữ liệu danh mục lấy từ Supabase
 * @returns {React.Component} Component Lucide Icon
 */
export function resolveCategoryIcon(category) {
  if (!category) return Sparkles;

  // 1. Ưu tiên lấy từ trường `icon` được lưu trong DB (Ví dụ: "Flame", "Fish", "Apple")
  const iconName = category.icon || category.icon_name || category.iconName;
  if (iconName && ICON_REGISTRY[iconName]) {
    return ICON_REGISTRY[iconName];
  }

  // 2. Dự phòng thông minh theo từ khóa tên danh mục nếu DB để trống
  const nameLower = (category.name || category.label || '').toLowerCase();
  if (nameLower.includes('combo') || nameLower.includes('ưu đãi')) return Sparkles;
  if (nameLower.includes('trái cây') || nameLower.includes('táo') || nameLower.includes('nho')) return Apple;
  if (nameLower.includes('nem') || nameLower.includes('chả') || nameLower.includes('cay')) return Flame;
  if (nameLower.includes('hải sản') || nameLower.includes('cá') || nameLower.includes('mực')) return Fish;
  if (nameLower.includes('rượu') || nameLower.includes('mật') || nameLower.includes('mắm')) return Wine;
  if (nameLower.includes('sấy') || nameLower.includes('rau') || nameLower.includes('lá')) return Leaf;
  if (nameLower.includes('hạt') || nameLower.includes('điều')) return Cookie;

  return Package;
}