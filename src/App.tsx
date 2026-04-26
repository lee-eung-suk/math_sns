/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { FeedPage } from './components/FeedPage';
import { PostWritePage } from './components/PostWritePage';
import { PostDetailPage } from './components/PostDetailPage';
import { Post, deletePost } from './api';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, Check, ShieldCheck, LogOut, Key } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('도구가 등록되었습니다!');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  useEffect(() => {
    const adminStatus = localStorage.getItem('isAdmin') === 'true';
    setIsAdmin(adminStatus);
  }, []);

  const handlePostClick = (id: string) => {
    setCurrentPostId(id);
  };

  const handleBack = () => {
    setCurrentPostId(null);
  };

  const handleWriteSuccess = () => {
    setIsUploadModalOpen(false);
    setEditingPost(null);
    setCurrentTab('home');
    setToastMessage(editingPost ? '수정되었습니다' : '도구가 등록되었습니다!');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleLogin = () => {
    if (passwordInput === 'suda8089') {
      localStorage.setItem('isAdmin', 'true');
      setIsAdmin(true);
      setIsLoginModalOpen(false);
      setPasswordInput('');
    } else {
      alert('비밀번호가 틀렸습니다');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    setIsAdmin(false);
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deletePost(id);
      setToastMessage('삭제되었습니다');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      // We might need to trigger a refresh in FeedPage, but Supabase Realtime usually handles it.
      // If mock data, we manually trigger update by changing a state if needed.
    } catch(e: any) {
      alert('삭제 실패: ' + e.message);
    }
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setIsUploadModalOpen(true);
  };

  return (
    <div className="bg-white flex justify-center min-h-screen relative">
      <div className="w-full max-w-7xl mx-auto flex">
        <Layout 
          currentTab={currentTab} 
          isAdmin={isAdmin}
          onLoginClick={() => setIsLoginModalOpen(true)}
          onLogoutClick={handleLogout}
          onChangeTab={(tab) => { 
            if(tab === 'write') {
              setEditingPost(null);
              setIsUploadModalOpen(true);
            } else {
              setCurrentTab(tab); 
              setCurrentPostId(null); 
            }
          }}>
          <div className="h-full relative overflow-x-hidden flex-1 flex flex-col w-full">
            {(currentTab === 'home' || currentTab === 'search') && (
              <FeedPage 
                onPostClick={handlePostClick} 
                isSearchMode={currentTab === 'search'} 
                isAdmin={isAdmin}
                onEdit={handleEditPost}
                onDelete={handleDeletePost}
              />
            )}

            {/* Post Detail Overlay */}
            <AnimatePresence>
                {currentPostId && (
                  <PostDetailPage key="detail" postId={currentPostId} onBack={handleBack} />
                )}
            </AnimatePresence>

            {/* Upload Modal Overlay */}
            <AnimatePresence>
                {isUploadModalOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-0 md:p-6"
                  >
                    <div className="w-full max-w-2xl h-full md:h-auto md:max-h-[85vh] bg-white md:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                      <PostWritePage 
                        initialData={editingPost || undefined}
                        onSuccess={handleWriteSuccess} 
                        onCancel={() => {
                            setIsUploadModalOpen(false);
                            setEditingPost(null);
                        }} 
                      />
                    </div>
                  </motion.div>
                )}
            </AnimatePresence>
          </div>
        </Layout>
      </div>

      <AnimatePresence>
        {isLoginModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 rounded-2xl">
                  <Key className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">관리자 로그인</h3>
                  <p className="text-sm text-gray-500 font-medium tracking-tight">수다방 관리 권한 인증</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <input 
                  type="password"
                  placeholder="관리자 비밀번호 입력"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full bg-gray-100 border border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-2xl p-4 text-center text-lg font-bold placeholder:text-gray-300 outline-none transition-all"
                  autoFocus
                />
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsLoginModalOpen(false)}
                    className="flex-1 py-4 font-bold text-gray-500 hover:bg-gray-100 rounded-2xl transition-colors"
                  >
                    취소
                  </button>
                  <button 
                    onClick={handleLogin}
                    className="flex-1 py-4 bg-black text-white font-bold rounded-2xl transition-all hover:bg-gray-900 shadow-lg"
                  >
                    확인
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        animate={{ scale: [1, 1.1, 1], boxShadow: ["0px 0px 0px rgba(37,99,235,0)", "0px 0px 30px rgba(37,99,235,0.6)", "0px 0px 0px rgba(37,99,235,0)"] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", repeatDelay: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setEditingPost(null);
          setIsUploadModalOpen(true);
        }}
        className="fixed bottom-24 right-6 md:bottom-10 md:right-12 z-50 w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/50 hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-8 h-8" />
      </motion.button>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-[110] bg-gray-800 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-bold"
          >
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
