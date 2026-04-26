import React from 'react';
import { Post, toggleLike } from '@/api';
import { TagBadge } from './SubjectBadge';
import { Eye, Heart, ExternalLink } from 'lucide-react';
import { playLikeSound, cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface PostCardProps {
    post: Post;
    onClick: (id: string) => void;
    onLike?: (id: string, newLiked: boolean) => void;
    isAdmin?: boolean;
    onEdit?: (post: Post) => void;
    onDelete?: (id: string) => void;
}

const getCategoryStyles = (categories: string[]) => {
    const mainCat = categories[0] || '기타';
    if (mainCat.includes('도형')) return { bg: 'from-violet-500/10 to-purple-500/10', iconBg: 'bg-violet-500', text: 'text-violet-600', dot: 'bg-violet-400' };
    if (mainCat.includes('수와')) return { bg: 'from-blue-500/10 to-cyan-500/10', iconBg: 'bg-blue-500', text: 'text-blue-600', dot: 'bg-blue-400' };
    if (mainCat.includes('자료')) return { bg: 'from-emerald-500/10 to-teal-500/10', iconBg: 'bg-emerald-500', text: 'text-emerald-600', dot: 'bg-emerald-400' };
    if (mainCat.includes('변화')) return { bg: 'from-orange-500/10 to-amber-500/10', iconBg: 'bg-orange-500', text: 'text-orange-600', dot: 'bg-orange-400' };
    return { bg: 'from-gray-500/10 to-slate-500/10', iconBg: 'bg-gray-500', text: 'text-gray-600', dot: 'bg-gray-400' };
};

export function PostCard({ post, onClick, onLike, isAdmin, onEdit, onDelete }: PostCardProps) {
    const [liked, setLiked] = React.useState(false);
    const [likeCount, setLikeCount] = React.useState(post.like_count);

    const styles = getCategoryStyles(post.categories);

    // Font size logic based on title length
    const getFontSize = (title: string) => {
        if (title.length > 20) return 'text-base sm:text-lg';
        if (title.length > 12) return 'text-lg sm:text-xl';
        return 'text-xl sm:text-2xl';
    };

    React.useEffect(() => {
        setLikeCount(post.like_count);
    }, [post.like_count]);

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newLiked = !liked;
        setLiked(newLiked);
        setLikeCount(prev => prev + (newLiked ? 1 : -1));
        if (newLiked) playLikeSound();
        toggleLike(post.id, newLiked);
        if (onLike) onLike(post.id, newLiked);
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onEdit) onEdit(post);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onDelete) onDelete(post.id);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onClick(post.id)}
            className="group bg-white rounded-[32px] overflow-hidden transition-all duration-500 cursor-pointer flex flex-col w-full border border-gray-100 hover:border-gray-200 hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)] relative"
        >
            {/* Admin Controls */}
            {isAdmin && (
                <div className="absolute top-4 right-4 z-20 flex gap-2">
                    <button 
                        onClick={handleEdit}
                        className="p-2 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-gray-100 hover:bg-white text-gray-600 transition-all hover:scale-110 active:scale-95"
                    >
                        <span className="text-xs">✏️</span>
                    </button>
                    <button 
                        onClick={handleDelete}
                        className="p-2 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-gray-100 hover:bg-red-50 text-red-500 transition-all hover:scale-110 active:scale-95"
                    >
                        <span className="text-xs">🗑️</span>
                    </button>
                </div>
            )}

            {/* Infographic Thumbnail (Horizontal on Desktop) */}
            <div className={cn(
                "relative flex flex-col sm:flex-row h-auto sm:h-[180px] overflow-hidden bg-gradient-to-br",
                styles.bg
            )}>
                {/* Visual Elements Decor */}
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <div className="w-24 h-24 border-4 border-current rounded-full translate-x-12 -translate-y-12" />
                    <div className="w-12 h-12 bg-current rotate-45 translate-x-4 translate-y-4" />
                </div>

                {/* Left: Content Area (60%) */}
                <div className="flex-1 p-6 sm:p-8 flex flex-col justify-center gap-2 z-10 sm:w-[60%]">
                    <div className="flex items-center gap-2 mb-1">
                        <div className={cn("w-2 h-2 rounded-full", styles.dot)} />
                        <span className={cn("text-[10px] font-bold uppercase tracking-widest opacity-60", styles.text)}>
                            {post.categories[0] || 'MATHEMATICS'}
                        </span>
                    </div>
                    <h3 className={cn(
                        "font-black tracking-tight leading-[1.2] break-keep transition-all duration-300",
                        getFontSize(post.title || '수학 도구')
                    )}>
                        {post.title || '수학 도구'}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium line-clamp-1 mt-1 opacity-70">
                        {post.description || '선생님께 추천하는 도구'}
                    </p>
                </div>

                {/* Right: Icon Area (40%) */}
                <div className="w-full sm:w-[40%] bg-white/30 backdrop-blur-sm flex items-center justify-center p-6 relative">
                    <motion.div 
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        className={cn(
                            "w-16 h-16 sm:w-20 sm:h-20 rounded-[24px] shadow-2xl flex items-center justify-center text-4xl sm:text-5xl transition-transform",
                            styles.iconBg
                        )}
                    >
                        {post.thumbnail && post.thumbnail.length < 10 ? (
                            <span>{post.thumbnail}</span>
                        ) : (
                            <span className="text-white drop-shadow-lg">
                                {post.categories[0]?.includes('도형') ? '📐' : 
                                 post.categories[0]?.includes('수와') ? '📊' : 
                                 post.categories[0]?.includes('자료') ? '📈' : '🧩'}
                            </span>
                        )}
                    </motion.div>
                    
                    {/* Infographic Detail */}
                    <div className="absolute bottom-2 right-4 flex gap-1 opacity-20">
                        <div className="w-1 h-3 bg-black rounded-full" />
                        <div className="w-1 h-5 bg-black rounded-full" />
                        <div className="w-1 h-2 bg-black rounded-full" />
                    </div>
                </div>
            </div>

            {/* Bottom Info Bar */}
            <div className="px-6 py-4 flex items-center justify-between bg-white">
                <div className="flex gap-1">
                    {post.grades.slice(0, 2).map((grade) => (
                        <span key={grade} className="px-2 py-0.5 bg-gray-50 text-[10px] font-bold text-gray-400 rounded-md border border-gray-100">
                            {grade}
                        </span>
                    ))}
                    {post.grades.length > 2 && <span className="text-[10px] text-gray-300 self-center">...</span>}
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-gray-400">
                        <div className="w-1 h-1 rounded-full bg-gray-300" />
                        <span className="text-[11px] font-bold">{post.view_count.toLocaleString()}</span>
                    </div>
                    <button 
                        onClick={handleLike}
                        className={cn(
                            "flex items-center gap-1.5 transition-all active:scale-75",
                            liked ? "text-pink-500" : "text-gray-400"
                        )}
                    >
                        <Heart className={cn("w-4 h-4", liked && "fill-current")} />
                        <span className="text-[11px] font-bold">{likeCount}</span>
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
