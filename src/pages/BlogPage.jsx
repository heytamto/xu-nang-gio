// src/pages/BlogPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import BlogListView from '../components/blog/BlogListView';
import BlogDetailView from '../components/blog/BlogDetailView';

const CATEGORY_LABELS = {
  'all': 'Tất cả bài viết',
  'handbook': 'Cẩm nang chọn quả',
  'health': 'Dinh dưỡng & Sức khỏe',
  'cuisine': 'Góc bếp & Món ngon',
  'tips': 'Mẹo vặt bảo quản'
};

function normalizePostItem(raw) {
  if (!raw) return null;
  return {
    ...raw,
    id: raw.id || raw._id || `post-${Date.now()}-${Math.random()}`,
    title: raw.title || 'Bài viết xứ nắng',
    category: raw.category || raw.tag || 'handbook',
    author: raw.author || raw.author_name || 'Tâm (Vườn Xứ Nắng Gió)',
    image: raw.image || raw.image_url || "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1400&q=80",
    image_url: raw.image_url || raw.image || "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1400&q=80",
    excerpt: raw.excerpt || raw.summary || raw.desc || '',
    content: raw.content || raw.desc || '',
    read_time: raw.read_time || raw.readTime || '3 phút đọc',
    created_at: raw.created_at || raw.date || new Date().toISOString()
  };
}

function formatDate(dateVal) {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) {
    return String(dateVal).split('T')[0];
  }
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function BlogPage({ posts: initialPosts = [] }) {
  const [activePost, setActivePost] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [postsList, setPostsList] = useState(() => {
    try {
      const local = JSON.parse(localStorage.getItem('shop_posts') || '[]');
      const source = Array.isArray(initialPosts) && initialPosts.length > 0 ? initialPosts : local;
      return source.map(normalizePostItem).filter(Boolean);
    } catch {
      return Array.isArray(initialPosts) ? initialPosts.map(normalizePostItem).filter(Boolean) : [];
    }
  });

  // Đồng bộ khi prop initialPosts thay đổi
  useEffect(() => {
    if (Array.isArray(initialPosts) && initialPosts.length > 0) {
      setPostsList(initialPosts.map(normalizePostItem).filter(Boolean));
    }
  }, [initialPosts]);

  // LẮNG NGHE SUPABASE REALTIME: ĐĂNG/SỬA/XÓA BÀI LÀ NHẢY LIỀN KHÔNG CẦN F5
  useEffect(() => {
    const channel = supabase
      .channel('blog-page-realtime-sub')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const freshPost = normalizePostItem(payload.new);
            setPostsList((prev) => {
              const next = [freshPost, ...prev.filter((p) => p.id !== freshPost.id)];
              try { localStorage.setItem('shop_posts', JSON.stringify(next)); } catch (e) {}
              return next;
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedPost = normalizePostItem(payload.new);
            setPostsList((prev) => {
              const next = prev.map((p) => (p.id === updatedPost.id ? updatedPost : p));
              try { localStorage.setItem('shop_posts', JSON.stringify(next)); } catch (e) {}
              return next;
            });
            // Cập nhật luôn activePost nếu người dùng đang xem bài này
            setActivePost((currentActive) => 
              currentActive && currentActive.id === updatedPost.id ? updatedPost : currentActive
            );
          } else if (payload.eventType === 'DELETE') {
            const targetId = payload.old?.id;
            setPostsList((prev) => {
              const next = prev.filter((p) => p.id !== targetId);
              try { localStorage.setItem('shop_posts', JSON.stringify(next)); } catch (e) {}
              return next;
            });
            setActivePost((currentActive) => 
              currentActive && currentActive.id === targetId ? null : currentActive
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const normalizeCategory = (cat) => {
    const map = {
      'cam-nang': 'handbook',
      'suc-khoe': 'health',
      'mon-ngon': 'cuisine',
      'meo-vat': 'tips'
    };
    return map[cat] || cat;
  };

  const filteredPosts = useMemo(() => {
    const sorted = [...postsList].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    if (selectedCategory === 'all') return sorted;
    return sorted.filter(p => normalizeCategory(p.category || p.tag) === selectedCategory);
  }, [postsList, selectedCategory]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 animate-fadeIn font-sans selection:bg-amber-100 selection:text-amber-900 text-stone-800">
      {activePost ? (
        <BlogDetailView
          post={activePost}
          categoryLabel={CATEGORY_LABELS[normalizeCategory(activePost.category || activePost.tag)] || 'Cẩm nang'}
          formatDate={formatDate}
          onBack={() => {
            setActivePost(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      ) : (
        <BlogListView
          posts={filteredPosts}
          categoryLabels={CATEGORY_LABELS}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          normalizeCategory={normalizeCategory}
          formatDate={formatDate}
          onSelectPost={(post) => {
            setActivePost(post);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}
    </div>
  );
}