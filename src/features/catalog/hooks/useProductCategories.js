import { useState, useEffect } from 'react';
import { categoryRepo } from '../../../infrastructure/supabase/repositories/index';

export function useProductCategories(propCategories) {
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    if (Array.isArray(propCategories) && propCategories.length > 0) {
      setCategories(propCategories.filter(c => c.id !== 'all').map(c => ({ ...c, id: c.id, label: c.name || c.label, name: c.name || c.label })));
      return;
    }
    let active = true;
    async function load() {
      try {
        const data = await categoryRepo.getAll();
        if (active && Array.isArray(data) && data.length > 0) {
          setCategories([...data].sort((a,b) => (a.order ?? 0) - (b.order ?? 0)).filter(c => c.id !== 'all').map(c => ({ ...c, id: c.id, label: c.name, name: c.name })));
        }
      } catch (err) {
        if (active) console.error('Lỗi tải categories:', err);
      }
    }
    load();
    return () => { active = false; };
  }, [propCategories]);
  return categories;
}
