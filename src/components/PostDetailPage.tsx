import React, { useEffect, useState } from 'react';
import { Post, getPosts, incrementView, toggleLike, supabase } from '@/api';
import { TagBadge } from './SubjectBadge';
import { ChevronLeft, Eye, Heart, Share, ExternalLink, Triangle, Calculator, BarChart3, Activity, Puzzle } from 'lucide-react';
import { playLikeSound, cn } from '@/lib/utils';
import { motion } from 'motion/react';

const getCategoryStyles = (categories: string[]) => {
    const mainCat = categories[0] || '기타';
    if (mainCat.includes('도형') || mainCat.includes('측정')) return { 
        bg: 'from-purple-50 to-purple-100', 
        iconBg: 'bg-purple-500', 
        text: 'text-purple-600', 
        icon: Triangle,
        symbol: '📐'
    };
    if (mainCat.includes('수와')) return { 
        bg: 'from-blue-50 to-blue-100', 
        iconBg: 'bg-blue-500', 
        text: 'text-blue-600', 
        icon: Calculator,
        symbol: '📊'
    };
    if (mainCat.includes('자료')) return { 
        bg: 'from-yellow-50 to-yellow-100', 
        iconBg: 'bg-yellow-500', 
        text: 'text-yellow-600', 
        icon: BarChart3,
        symbol: '🎲'
    };
    if (mainCat.includes('변화')) return { 
        bg: 'from-green-50 to-green-100', 
        iconBg: 'bg-green-500', 
        text: 'text-green-600', 
        icon: Activity,
        symbol: '📈'
    };
    return { 
        bg: 'from-gray-50 to-gray-100', 
        iconBg: 'bg-gray-400', 
        text: 'text-gray-500', 
        icon: Puzzle,
        symbol: '🧩'
    };
};

interface PostDetailPageProps {
    postId: string;
    onBack: () => void;
}

export const PostDetailPage: React.FC<PostDetailPageProps> = ({ postId, onBack }) => {
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

    if (!post) return <div className="p-8 text-center text-gray-400 font-bold animate-pulse">도구 정보를 불러오는 중...</div>;

    const styles = getCategoryStyles(post.categories);

    return (
        <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 32, stiffness: 350 }}
            className="flex flex-col h-full bg-[#FBFBFD] z-[60] fixed top-0 left-0 lg:left-64 w-full lg:w-[calc(100%-16rem)] min-h-screen overflow-hidden"
        >
            <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-[#E5E5EA] flex items-center justify-between p-4 pt-safe z-30">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                    <ChevronLeft className="w-7 h-7" />
                </button>
                <div className="font-black text-lg tracking-tight">수업 도구 탐색</div>
                <button 
                    onClick={() => {
                        if (navigator.share) {
                            navigator.share({ title: post.title, url: post.url });
                        }
                    }}
                    className="p-2 -mr-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <Share className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-40 bg-[#FBFBFD] flex justify-center">
                <div className="max-w-[640px] px-0 md:px-4 w-full md:pt-8">
                    <div className="bg-white md:rounded-[32px] overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-gray-100 min-h-full">
                        {/* Mandatory Thumbnail / Fallback Area */}
                        <div className={cn(
                            "w-full h-[220px] sm:h-[280px] relative flex items-center justify-center overflow-hidden bg-gradient-to-br",
                            styles.bg
                        )}>
                            {post.thumbnail && post.thumbnail.startsWith('http') ? (
                                <>
                                    <img src={post.thumbnail} alt="thumbnail" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/5" />
                                </>
                            ) : (
                                <div className="flex flex-col items-center gap-4">
                                    <div className={cn("w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center shadow-2xl", styles.iconBg)}>
                                        <styles.icon className="w-10 h-10 sm:w-12 h-12 text-white" strokeWidth={2.5} />
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                                        <span className="text-[140px] font-black tracking-tighter transform -rotate-12 translate-y-10">
                                            {styles.symbol}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-8 sm:p-12 space-y-10">
                            <div className="space-y-6">
                                <div className="flex flex-wrap gap-2">
                                    {post.categories.map(d => (
                                        <span key={d} className={cn("px-3 py-1 rounded-full text-[11px] font-black tracking-widest uppercase", styles.iconBg.replace('bg-', 'bg-opacity-10 text-'))}>
                                            {d}
                                        </span>
                                    ))}
                                    {post.grades.map(g => (
                                        <span key={g} className="px-3 py-1 bg-gray-50 text-gray-400 border border-gray-100 rounded-full text-[11px] font-bold">
                                            {g}
                                        </span>
                                    ))}
                                </div>
                                
                                <div className="flex items-start justify-between gap-4">
                                    <h1 className="text-3xl sm:text-4xl font-black text-[#1C1C1E] leading-[1.1] tracking-tighter break-keep">
                                        {post.title}
                                    </h1>
                                    <div className="shrink-0 w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl grayscale opacity-50 group-hover:grayscale-0">
                                        {styles.symbol}
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleLink}
                                className="group w-full py-5 flex items-center justify-center gap-3 bg-[#1C1C1E] text-white rounded-[24px] font-black text-xl shadow-2xl shadow-gray-200 hover:bg-black transition-all active:scale-[0.98]"
                            >
                                <ExternalLink className="w-6 h-6 transition-transform group-hover:scale-110" />
                                도구 바로가기
                            </button>

                            <div className="space-y-6 pt-10 border-t border-gray-50">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-4 bg-blue-600 rounded-full" />
                                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">도구 상세 설명</h3>
                                </div>
                                <div className="text-lg leading-relaxed text-gray-700 whitespace-pre-wrap font-medium tracking-tight">
                                    {post.description}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Interaction Bar */}
            <div className="fixed bottom-0 w-full bg-white/80 backdrop-blur-xl border-t border-[#E5E5EA] flex items-center justify-between p-4 pb-safe-offset-4 z-40 px-10">
                <div className="flex items-center gap-10">
                    <div className="flex items-center gap-2.5 text-gray-400">
                        <Eye className="w-6 h-6" />
                        <span className="text-lg font-black">{post.view_count.toLocaleString()}</span>
                    </div>
                    <button 
                        onClick={handleLike}
                        className={cn("flex items-center gap-2.5 transition-all active:scale-75", liked ? "text-pink-500" : "hover:text-pink-500 text-gray-400")}>
                        <Heart className={cn("w-6 h-6", liked && "fill-current")} />
                        <span className="text-lg font-black">{likeCount}</span>
                    </button>
                </div>
                
                <div className="hidden sm:flex flex-col items-end">
                    <span className="text-[11px] text-gray-300 font-black tracking-widest uppercase">Registered On</span>
                    <span className="text-sm text-gray-500 font-bold">
                        {new Date(post.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{__html:`
                .pb-safe-offset-4 { padding-bottom: calc(env(safe-area-inset-bottom) + 1rem); }
            `}} />
        </motion.div>
    );
}
