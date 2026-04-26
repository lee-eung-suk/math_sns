import React, { useEffect, useState } from 'react';
import { Post, getPosts, incrementView, toggleLike, supabase } from '@/api';
import { TagBadge } from './SubjectBadge';
import { ChevronLeft, Eye, Heart, Share, ExternalLink } from 'lucide-react';
import { playLikeSound, cn } from '@/lib/utils';
import { motion } from 'motion/react';

export function PostDetailPage({ postId, onBack }: { postId: string; onBack: () => void }) {
    const [post, setPost] = useState<Post | null>(null);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);

    useEffect(() => {
        const fetchPost = async () => {
            const allPosts = await getPosts();
            const found = allPosts.find(p => p.id === postId);
            if (found) {
                setPost(found);
                setLikeCount(found.like_count);
                await incrementView(postId);
            }
        };
        fetchPost();

        if (supabase) {
            const channel = supabase
              .channel(`post-${postId}`)
              .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tools', filter: `id=eq.${postId}` }, 
                (payload) => setPost(payload.new as Post))
              .subscribe();
            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [postId]);

    const handleLike = () => {
        if (!post) return;
        const newLiked = !liked;
        setLiked(newLiked);
        setLikeCount(prev => prev + (newLiked ? 1 : -1));
        if (newLiked) playLikeSound();
        toggleLike(post.id, newLiked);
    };

    const handleLink = () => {
        if (post) window.open(post.url, '_blank', 'noopener,noreferrer');
    };

    if (!post) return <div className="p-8 text-center text-gray-400">도구 정보를 불러오는 중...</div>;

    return (
        <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="flex flex-col h-full bg-[#FBFBFD] z-20 absolute top-0 left-0 w-full min-h-screen overflow-hidden"
        >
            <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-[#E5E5EA] flex items-center justify-between p-4 pt-safe z-10">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                    <ChevronLeft className="w-7 h-7" />
                </button>
                <div className="font-bold text-lg">도구 상세</div>
                <button className="p-2 -mr-2 rounded-full hover:bg-gray-100 transition-colors">
                    <Share className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-32 bg-[#FBFBFD]">
                <div className="max-w-3xl mx-auto w-full md:pt-8 md:px-8">
                    <div className="bg-white md:rounded-3xl card-border overflow-hidden shadow-sm">
                        {post.thumbnail && (
                            <div className="w-full aspect-video min-h-[250px] bg-gray-100 border-b border-[#E5E5EA]">
                                <img src={post.thumbnail} alt="thumbnail" className="w-full h-full object-cover" />
                            </div>
                        )}

                        <div className="p-6 md:p-10 space-y-8">
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {post.grades.map(g => <TagBadge key={g} tag={g} className="text-[12px] py-1 px-3" />)}
                                    {post.categories.map(d => <TagBadge key={d} tag={d} className="text-[12px] py-1 px-3" />)}
                                </div>
                                <h1 className="text-3xl font-bold text-[#1C1C1E] leading-tight tracking-tight">
                                    {post.title}
                                </h1>
                            </div>

                            <button 
                                onClick={handleLink}
                                className="w-full py-4 flex items-center justify-center gap-3 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-[0.98]"
                            >
                                <ExternalLink className="w-6 h-6" />
                                도구 바로가기
                            </button>

                            <div className="space-y-4 pt-4 border-t border-gray-50">
                                <h3 className="text-sm font-bold text-gray-400">도구 설명</h3>
                                <div className="text-lg leading-relaxed text-gray-700 whitespace-pre-wrap font-medium">
                                    {post.description}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Floating Bar */}
            <div className="fixed bottom-0 w-full md:w-[800px] left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md border-t border-[#E5E5EA] flex items-center justify-between p-4 pb-safe-offset-4 z-40 px-8">
                <div className="flex items-center gap-8 text-gray-400 font-bold">
                    <div className="flex items-center gap-2">
                        <Eye className="w-6 h-6" />
                        <span className="text-lg">{post.view_count.toLocaleString()}</span>
                    </div>
                    <button 
                        onClick={handleLike}
                        className={cn("flex items-center gap-2 transition-all", liked ? "text-pink-500 scale-110" : "hover:text-pink-500")}>
                        <Heart className={cn("w-6 h-6", liked && "fill-current")} />
                        <span className="text-lg">{likeCount}</span>
                    </button>
                </div>
                
                <span className="text-sm text-gray-300 font-medium">
                    등록일: {new Date(post.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
            </div>
            
            <style dangerouslySetInnerHTML={{__html:`
                .pb-safe-offset-4 { padding-bottom: calc(env(safe-area-inset-bottom) + 1rem); }
            `}} />
        </motion.div>
    );
}
