import React, { useEffect, useState } from 'react';
import { Post, getPosts, incrementView, toggleLike, supabase } from '@/api';
import { ChevronLeft, Eye, Heart, Share, ExternalLink, Triangle, Calculator, BarChart3, Activity, Puzzle, Calendar } from 'lucide-react';
import { playLikeSound, cn, formatDate } from '@/lib/utils';
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
                    <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>
                <div className="flex-1 px-4 text-center flex justify-center items-center">
                    <h1 className="text-[clamp(20px,6vw,24px)] font-black text-[#2563EB] tracking-[-0.03em] leading-none font-rounded drop-shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        수다방 SNS
                    </h1>
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
                <div className="max-w-[700px] w-full sm:border-x border-gray-100 min-h-full">
                    {/* Content Section */}
                    <div className="p-5 sm:p-8 space-y-6">
                        
                        {/* Header / Author */}
                        <div className="flex items-center gap-3">
                            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br shadow-sm", styles.bg)}>
                                <styles.icon className={cn("w-6 h-6", styles.text.replace('text-', 'text-'))} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-[20px] sm:text-[24px] font-black text-[#1C1C1E] tracking-tight leading-tight">
                                    {post.title}
                                </h2>
                                <div className="flex gap-2 mt-1 flex-wrap">
                                    <span className="text-[13px] font-bold text-gray-400">
                                        #{post.categories[0] || '기타'} · {post.grades[0] || '공통'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Description Text */}
                        <p className="text-[15px] sm:text-[17px] leading-relaxed text-[#333333] whitespace-pre-wrap font-medium tracking-tight px-1">
                            {post.description}
                        </p>

                        {/* Main Image */}
                        {post.image_url && (
                            <div className="w-full rounded-[16px] overflow-hidden border border-gray-100 shadow-sm relative bg-gray-50 flex items-center justify-center my-4">
                                <img 
                                    src={post.image_url} 
                                    alt={post.title} 
                                    className="w-full h-auto max-h-[220px] object-cover" 
                                    referrerPolicy="no-referrer"
                                />
                            </div>
                        )}

                        {/* Action Button */}
                        <button 
                            onClick={handleLink}
                            className="w-full py-4 flex items-center justify-center gap-2 bg-[#2563EB] text-white rounded-[16px] font-bold text-[16px] shadow-sm hover:bg-blue-700 transition-colors active:scale-[0.98]"
                        >
                            도구 바로가기
                        </button>

                        {/* Timestamp & Stats */}
                        <div className="flex items-center justify-between py-4 border-b border-gray-100 flex-wrap px-1">
                            <span className="text-[13px] font-medium text-gray-400">{formatDate(post.created_at)}</span>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-1.5">
                                    <Eye className="w-4 h-4 text-gray-400" />
                                    <span className="text-[13px] font-bold text-gray-500">{post.view_count.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Heart className={cn("w-4 h-4", liked ? "text-pink-500 fill-pink-500" : "text-gray-400")} />
                                    <span className="text-[13px] font-bold text-gray-500">{likeCount}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer Owner */}
                        <div className="pt-2 px-1">
                            <p className="text-[12px] sm:text-[13px] font-medium text-[#94A3B8]">
                                경상북도교육청 창의융합 교사연구회 수(數)다방
                            </p>
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
