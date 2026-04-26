import React, { useEffect, useState } from 'react';
import { Post, getPosts, incrementView, toggleLike, supabase } from '@/api';
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
            className="flex flex-col h-full bg-white z-[60] fixed top-0 left-0 lg:left-64 w-full lg:w-[calc(100%-16rem)] min-h-screen overflow-hidden"
        >
            {/* Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between p-4 pt-safe z-30">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex-1 px-4 text-center">
                    <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">도구 상세 정보</span>
                    <h2 className="text-sm font-black text-gray-900 truncate tracking-tight">{post.title}</h2>
                </div>
                <button 
                    onClick={() => navigator.share && navigator.share({ title: post.title, url: post.url })}
                    className="p-2 -mr-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <Share className="w-5 h-5 text-gray-700" />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pb-40 bg-white flex justify-center">
                <div className="max-w-[700px] w-full border-x border-gray-100 min-h-full">
                    {/* Hero Area */}
                    <div className={cn(
                        "w-full h-[240px] sm:h-[340px] relative flex items-center justify-center overflow-hidden bg-gradient-to-br",
                        styles.bg
                    )}>
                        <div className={cn("w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-105 bg-white")}>
                            <styles.icon className={cn("w-12 h-12 sm:w-16 h-16", styles.text.replace('text-', 'text-'))} strokeWidth={2.5} />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05]">
                            <span className="text-[180px] font-black tracking-tighter transform -rotate-12 translate-y-10">
                                {styles.symbol}
                            </span>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-8 sm:p-12 space-y-10">
                        <div className="space-y-6">
                            <div className="flex flex-wrap gap-2">
                                {post.categories.map(d => (
                                    <span key={d} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[11px] font-black tracking-widest uppercase">
                                        #{d}
                                    </span>
                                ))}
                                {post.grades.map(g => (
                                    <span key={g} className="px-3 py-1 bg-gray-50 text-gray-400 border border-gray-100 rounded-full text-[11px] font-bold">
                                        {g}
                                    </span>
                                ))}
                            </div>
                            
                            <h1 className="text-3xl sm:text-4xl font-black text-[#1C1C1E] leading-[1.1] tracking-tighter">
                                {post.title}
                            </h1>
                            <p className="text-lg leading-relaxed text-gray-700 whitespace-pre-wrap font-medium tracking-tight">
                                {post.description}
                            </p>
                        </div>

                        <button 
                            onClick={handleLink}
                            className="group w-full py-5 flex items-center justify-center gap-3 bg-[#1C1C1E] text-white rounded-full font-black text-xl shadow-2xl shadow-blue-100 hover:bg-black transition-all active:scale-[0.98]"
                        >
                            <ExternalLink className="w-6 h-6 transition-transform group-hover:scale-110" />
                            도구 바로가기
                        </button>

                        <div className="flex items-center gap-10 py-6 border-y border-gray-100">
                            <div className="flex items-center gap-2.5">
                                <Eye className="w-5 h-5 text-gray-400" />
                                <span className="text-sm font-black text-gray-900">{post.view_count.toLocaleString()} <span className="text-gray-400 font-bold">조회</span></span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <Heart className="w-5 h-5 text-gray-400" />
                                <span className="text-sm font-black text-gray-900">{likeCount} <span className="text-gray-400 font-bold">저장</span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Floating Interaction Bar */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:translate-x-32 w-auto flex bg-white/90 backdrop-blur-xl border border-gray-200 rounded-full shadow-2xl p-2 px-6 items-center gap-4 z-40">
                <button 
                    onClick={handleLike}
                    className={cn("flex items-center gap-2 transition-all active:scale-75", liked ? "text-pink-500" : "hover:text-pink-500 text-gray-400 font-black")}>
                    <Heart className={cn("w-5 h-5", liked && "fill-current")} />
                    <span className="text-sm font-black">{liked ? '저장됨' : '저장하기'}</span>
                </button>
                <div className="w-px h-4 bg-gray-200" />
                <button 
                    onClick={() => navigator.share && navigator.share({ title: post.title, url: post.url })}
                    className="text-gray-400 hover:text-blue-500 font-black flex items-center gap-2"
                >
                    <Share className="w-5 h-5" />
                    <span className="text-sm">공유</span>
                </button>
            </div>
        </motion.div>
    );
};
