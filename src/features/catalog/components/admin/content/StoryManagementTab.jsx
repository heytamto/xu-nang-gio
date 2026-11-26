// src/components/admin/content/StoryManagementTab.jsx
import React, { useState } from 'react';
import { Feather, BookOpen, RotateCcw } from 'lucide-react';
import StoriesTab from '../story/StoriesTab'; // Hoặc đường dẫn tương ứng trong project
import PostsTab from '../post/PostsTab';     // Hoặc đường dẫn tương ứng trong project
import EditStoryModal from '../story/EditStoryModal';
import EditPostModal from '../post/EditPostModal';

export default function StoryManagementTab({
  stories = [],
  onSaveStories,
  onResetStories,
  posts = [],
  onSavePosts,
  onResetPosts,
  onShowAlert,
  setConfirmModalConfig
}) {
  const [activeSubTab, setActiveSubTab] = useState('stories'); // 'stories' | 'posts'
  const [editingStory, setEditingStory] = useState(null);
  const [editingPost, setEditingPost] = useState(null);

  // Xử lý cập nhật bài viết cẩm nang sau khi sửa trong Modal
  const handleSavePostFromModal = (updatedPost) => {
    const nextList = posts.map((p) => (p.id === updatedPost.id ? updatedPost : p));
    if (onSavePosts) onSavePosts(nextList);
    setEditingPost(null);
  };

  // Xử lý cập nhật chuyện vườn sau khi sửa trong Modal
  const handleSaveStoryFromModal = (updatedStory) => {
    const nextList = stories.map((s) => (s.id === updatedStory.id ? updatedStory : s));
    if (onSaveStories) onSaveStories(nextList);
    setEditingStory(null);
  };

  return (
    <div className="space-y-6 sm:space-y-7 font-sans animate-fadeIn text-stone-800">
      {/* 1. THANH CHUYỂN SUB-TAB ĐỒNG BỘ 100% VỚI TAB SẢN PHẨM */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-3xl border border-stone-200/90 shadow-xs">
        <div className="inline-flex p-1 bg-stone-100 rounded-2xl border border-stone-200/60">
          <button
            type="button"
            onClick={() => setActiveSubTab('stories')}
            className={`h-10 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'stories'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Feather className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Chuyện Vườn ({stories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('posts')}
            className={`h-10 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'posts'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Cẩm Nang ({posts.length})</span>
          </button>
        </div>

        {/* Nút khôi phục mặc định riêng cho từng sub-tab */}
        {activeSubTab === 'stories' && onResetStories && (
          <button
            type="button"
            onClick={onResetStories}
            className="px-4 py-2 rounded-2xl border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Khôi phục chuyện vườn</span>
          </button>
        )}

        {activeSubTab === 'posts' && onResetPosts && (
          <button
            type="button"
            onClick={onResetPosts}
            className="px-4 py-2 rounded-2xl border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Khôi phục cẩm nang</span>
          </button>
        )}
      </div>

      {/* 2. NỘI DUNG TƯƠNG ỨNG TỪNG SUB-TAB */}
      {activeSubTab === 'stories' ? (
        <StoriesTab
          stories={stories}
          onAddStory={(newStory) => onSaveStories?.([newStory, ...stories])}
          onEditStory={(storyItem) => setEditingStory(storyItem)}
          onDeleteStory={(id) => onSaveStories?.(stories.filter((s) => s.id !== id))}
          onResetStories={onResetStories}
          onShowAlert={onShowAlert}
          setConfirmModalConfig={setConfirmModalConfig}
        />
      ) : (
        <PostsTab
          posts={posts}
          onAddPost={(newPost) => onSavePosts?.([newPost, ...posts])}
          onEditPost={(postItem) => setEditingPost(postItem)}
          onDeletePost={(id) => onSavePosts?.(posts.filter((p) => p.id !== id))}
          onResetPosts={onResetPosts}
          onShowAlert={onShowAlert}
          setConfirmModalConfig={setConfirmModalConfig}
        />
      )}

      {/* 3. MODAL CHỈNH SỬA CHUYỆN VƯỜN */}
      {editingStory && (
        <EditStoryModal
          story={editingStory}
          onClose={() => setEditingStory(null)}
          onSave={handleSaveStoryFromModal}
          onShowAlert={onShowAlert}
        />
      )}

      {/* 4. MODAL CHỈNH SỬA CẨM NANG */}
      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onSave={handleSavePostFromModal}
          onShowAlert={onShowAlert}
        />
      )}
    </div>
  );
}