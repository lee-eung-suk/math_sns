import React from 'react';
import { Post, toggleLike } from '@/api';
import { TagBadge } from './SubjectBadge';
import { Eye, Heart, ExternalLink, Calculator, Triangle, Activity, BarChart3, Puzzle, Ruler, TrendingUp, Hash, Box } from 'lucide-react';
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
    if (mainCat.includes('도형') || mainCat.includes('측정')) return { 
        bg: 'from-purple-50 to-purple-100', 
        iconBg: 'bg-purple-500', 
        text: 'text-purple-600', 
        icon: Triangle,
        accent: 'bg-purple-200'
    };
    if (mainCat.includes('수와')) return { 
        bg: 'from-blue-50 to-blue-100', 
        iconBg: 'bg-blue-500', 
        text: 'text-blue-600', 
        icon: Calculator,
        accent: 'bg-blue-200'
    };
    if (mainCat.includes('자료')) return { 
        bg: 'from-yellow-50 to-yellow-100', 
        iconBg: 'bg-yellow-500', 
        text: 'text-yellow-600', 
        icon: BarChart3,
        accent: 'bg-yellow-200'
    };
    if (mainCat.includes('변화')) return { 
        bg: 'from-green-50 to-green-100', 
        iconBg: 'bg-green-500', 
        text: 'text-green-600', 
        icon: Activity,
        accent: 'bg-green-200'
    };
    return { 
        bg: 'from-gray-50 to-gray-100', 
        iconBg: 'bg-gray-400', 
        text: 'text-gray-500', 
        icon: Puzzle,
        accent: 'bg-gray-200'
    };
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
            className="group bg-white rounded-[24px] overflow-hidden transition-all duration-500 cursor-pointer flex flex-col w-full border border-gray-100 hover:border-gray-200 hover:shadow-xl relative"
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

            {/* Infographic Thumbnail */}
            <div className={cn(
                "relative flex flex-row h-auto overflow-hidden bg-gradient-to-br transition-all duration-500",
                "aspect-[16/9] sm:aspect-[4/3]",
                styles.bg
            )}>
                {/* Background Decor Layer */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                    <div className="absolute top-0 right-0 w-48 h-48 border-[12px] border-current rounded-full translate-x-12 -translate-y-12" />
                    <div className="absolute bottom-4 left-4 w-12 h-12 rotate-12 border-4 border-current" />
                </div>

                {/* Left Area (60%): Title & Label */}
                <div className="w-[60%] h-full p-6 sm:p-8 flex flex-col justify-center gap-2 z-10">
                    <div className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black tracking-[0.1em]",
                        styles.accent,
                        styles.text
                    )}>
                        {post.categories[0] || 'GENERAL'}
                    </div>
                    <h3 className={cn(
                        "font-black tracking-tight leading-[1.2] break-keep transition-all duration-300",
                        getFontSize(post.title || '수학 도구')
                    )}>
                        {post.title || '수학 도구'}
                    </h3>
                </div>

                {/* Right Area (40%): Icon Area */}
                <div className="w-[40%] h-full flex items-center justify-center p-4 relative">
                    <motion.div 
                        whileHover={{ scale: 1.15, rotate: 5 }}
                        className={cn(
                            "w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-[0_15px_40px_-5px_rgba(0,0,0,0.1)] transition-shadow",
                            styles.iconBg
                        )}
                    >
                        <styles.icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={2.5} />
                    </motion.div>
                    
                    {/* Infographic Graphic Detail */}
                    <div className="absolute bottom-4 right-6 flex gap-1 opacity-20">
                        <div className="w-1 h-3 bg-black rounded-full" />
                        <div className="w-1 h-5 bg-black rounded-full" />
                        <div className="w-1 h-2 bg-black rounded-full" />
                    </div>
                </div>
            </div>

            {/* Bottom Info Bar */}
            <div className="px-6 py-5 flex flex-col gap-3 bg-white border-t border-gray-50">
                <p className="text-xs text-gray-500 font-medium line-clamp-2 min-h-[32px] leading-relaxed">
                    {post.description || '선생님과 학생이 함께 사용하는 수학 학습 도구입니다.'}
                </p>
                
                <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                        {post.grades.slice(0, 2).map((grade) => (
                            <span key={grade} className="px-2 py-0.5 bg-gray-50 text-[10px] font-bold text-gray-400 rounded-md border border-gray-100">
                                {grade}
                            </span>
                        ))}
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-gray-400">
                            <Eye className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-bold">{post.view_count.toLocaleString()}</span>
                        </div>
                        <button 
                            onClick={handleLike}
                            className={cn(
                                "flex items-center gap-1.5 transition-all active:scale-75",
                                liked ? "text-pink-500" : "text-gray-400"
                            )}
                        >
                            <Heart className={cn("w-3.5 h-3.5", liked && "fill-current")} />
                            <span className="text-[11px] font-bold">{likeCount}</span>
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
