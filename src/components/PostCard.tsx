import React from 'react';
import { Post, toggleLike } from '@/api';
import { Eye, Heart, Calculator, Triangle, Activity, BarChart3, Puzzle, ArrowRight } from 'lucide-react';
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
        iconBg: 'bg-purple-100', 
        text: 'text-purple-600', 
        icon: Triangle,
        symbol: '📐'
    };
    if (mainCat.includes('수와')) return { 
        iconBg: 'bg-blue-100', 
        text: 'text-blue-600', 
        icon: Calculator,
        symbol: '📊'
    };
    if (mainCat.includes('자료')) return { 
        iconBg: 'bg-yellow-100', 
        text: 'text-yellow-600', 
        icon: BarChart3,
        symbol: '🎲'
    };
    if (mainCat.includes('변화')) return { 
        iconBg: 'bg-green-100', 
        text: 'text-green-600', 
        icon: Activity,
        symbol: '📈'
    };
    return { 
        iconBg: 'bg-gray-100', 
        text: 'text-gray-500', 
        icon: Puzzle,
        symbol: '🧩'
    };
};

export const PostCard: React.FC<PostCardProps> = ({ post, onClick, onLike, isAdmin, onEdit, onDelete }) => {
    const [liked, setLiked] = React.useState(false);
    const [likeCount, setLikeCount] = React.useState(post.like_count);

    const styles = getCategoryStyles(post.categories);

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
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ x: 4, backgroundColor: '#F9FAFB' }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onClick(post.id)}
            className="group bg-white rounded-2xl border border-gray-100 p-4 transition-all duration-300 cursor-pointer flex items-center gap-4 h-[88px] relative w-full mb-1 shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
        >
            {/* Left Area: Icon */}
            <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                styles.iconBg
            )}>
                <styles.icon className={cn("w-6 h-6", styles.text)} strokeWidth={2.5} />
            </div>

            {/* Middle Area: Title & Info */}
            <div className="flex-1 min-w-0 overflow-hidden flex flex-col justify-center">
                <h3 className="font-bold text-gray-900 truncate tracking-tight text-[17px] sm:text-lg group-hover:text-blue-600 transition-colors">
                    {post.title || '수학 도구'}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn("text-[9px] font-black tracking-widest uppercase opacity-70", styles.text)}>
                        {post.categories[0] || '기타'}
                    </span>
                    <div className="w-1 h-1 rounded-full bg-gray-200" />
                    <div className="flex gap-1">
                        {post.grades.slice(0, 1).map(g => (
                            <span key={g} className="text-[10px] font-bold text-gray-400">
                                {gradeMapping[g as keyof typeof gradeMapping] || g}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Area: Symbols & Arrow */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0 pl-1">
                <span className="text-lg opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all hidden sm:inline">
                    {styles.symbol}
                </span>

                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 opacity-60 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
                    <ArrowRight className="w-4 h-4" />
                </div>
            </div>

            {/* Admin Controls (Floating) */}
            {isAdmin && (
                <div className="absolute top-0 right-0 p-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-all -translate-y-1/2">
                    <button 
                        onClick={handleEdit}
                        className="p-1.5 bg-white rounded-full shadow-md border border-gray-100 hover:bg-gray-50 transition-all"
                    >
                        <span className="text-[10px]">✏️</span>
                    </button>
                    <button 
                        onClick={handleDelete}
                        className="p-1.5 bg-white rounded-full shadow-md border border-gray-100 hover:bg-red-50 text-red-500 transition-all font-bold"
                    >
                        <span className="text-[10px]">🗑️</span>
                    </button>
                </div>
            )}
            
            {/* Tiny stats bar at very bottom (Subtle) */}
            <div className="absolute bottom-2 left-20 right-20 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
                 <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                    <Eye className="w-3 h-3" />
                    {post.view_count}
                 </div>
                 <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                    <Heart className="w-3 h-3" />
                    {likeCount}
                 </div>
            </div>
        </motion.div>
    );
}

const gradeMapping = {
    '1학년': '1학년',
    '2학년': '2학년',
    '3학년': '3학년',
    '4학년': '4학년',
    '5학년': '5학년',
    '6학년': '6학년',
    '공통': '공통',
};

