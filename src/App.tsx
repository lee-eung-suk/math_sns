/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { FeedPage } from './components/FeedPage';
import { PostWritePage } from './components/PostWritePage';
import { PostDetailPage } from './components/PostDetailPage';
import { AnimatePresence, motion } from 'motion/react';
import { Plus } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handlePostClick = (id: string) => {
    setCurrentPostId(id);
  };

  const handleBack = () => {
    setCurrentPostId(null);
  };

  const handleWriteSuccess = () => {
    setIsUploadModalOpen(false);
    setCurrentTab('home');
  };

  return (
    <div className="bg-white flex justify-center min-h-screen relative">
      <div className="w-full max-w-7xl mx-auto flex">
        <Layout currentTab={currentTab} onChangeTab={(tab) => { 
          if(tab === 'write') {
            setIsUploadModalOpen(true);
          } else {
            setCurrentTab(tab); 
            setCurrentPostId(null); 
          }
        }}>
          <div className="h-full relative overflow-x-hidden flex-1 flex flex-col w-full">
            {currentTab === 'home' && <FeedPage onPostClick={handlePostClick} />}
            
            {(currentTab === 'search' || currentTab === 'profile') && (
               <div className="flex flex-col items-center justify-center p-20 text-gray-400 font-medium bg-[#FBFBFD] h-full flex-1 gap-2">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                    {currentTab === 'search' ? '🔍' : '👤'}
                  </div>
                  {currentTab === 'search' ? '도구 검색 기능 준비 중입니다.' : '프로필 기능 준비 중입니다.'}
               </div>
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
                        onSuccess={handleWriteSuccess} 
                        onCancel={() => setIsUploadModalOpen(false)} 
                      />
                    </div>
                  </motion.div>
                )}
            </AnimatePresence>
          </div>
        </Layout>
      </div>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsUploadModalOpen(true)}
        className="fixed bottom-24 right-6 md:bottom-10 md:right-12 z-50 w-14 h-14 md:w-16 md:h-16 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-blue-400/40 hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-8 h-8" />
      </motion.button>
    </div>
  );
}
