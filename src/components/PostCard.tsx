import React from 'react';
import { Post, toggleLike } from '@/api';
import { Eye, Heart, Calculator, Triangle, Activity, BarChart3, Puzzle, ArrowRight, Bookmark } from 'lucide-react';
import { playLikeSound, cn, formatDate } from '@/lib/utils';
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
        iconBg: 'bg-purple-100 dark:bg-purple-900/30', 
        text: 'text-purple-600 dark:text-purple-400', 
        icon: Triangle,
        symbol: '📐'
    };
    if (mainCat.includes('수와')) return { 
        iconBg: 'bg-blue-100 dark:bg-blue-900/30', 
        text: 'text-blue-600 dark:text-blue-400', 
        icon: Calculator,
        symbol: '📊'
    };
    if (mainCat.includes('자료')) return { 
        iconBg: 'bg-yellow-100 dark:bg-yellow-900/30', 
        text: 'text-yellow-600 dark:text-yellow-400', 
        icon: BarChart3,
        symbol: '🎲'
    };
    if (mainCat.includes('변화')) return { 
        iconBg: 'bg-green-100 dark:bg-green-900/30', 
        text: 'text-green-600 dark:text-green-400', 
        icon: Activity,
        symbol: '📈'
    };
    return { 
        iconBg: 'bg-gray-100 dark:bg-gray-800', 
        text: 'text-gray-500 dark:text-gray-400', 
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => onClick(post.id)}
            className="group px-4 py-4 transition-all duration-200 cursor-pointer flex gap-3 border-b border-gray-100 dark:border-gray-900 hover:bg-gray-50 dark:hover:bg-gray-900/50 relative w-full"
        >
            {/* Left Area: Icon (Avatar Style) */}
            <div className="shrink-0 pt-1">
                <div className={cn(
                    "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-transform",
                    styles.iconBg
                )}>
                    <styles.icon className={cn("w-5 h-5 sm:w-6 sm:h-6", styles.text)} strokeWidth={2} />
                </div>
            </div>

            {/* Middle Area: Content */}
            <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-gray-900 dark:text-white tracking-tight text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {post.title || '수학 도구'}
                        </span>
                        <div className="flex gap-1 items-center">
                            {post.grades.map(g => (
                                <span key={g} className="text-[11px] font-bold text-gray-400 dark:text-gray-600">
                                    · {gradeMapping[g as keyof typeof gradeMapping] || g}
                                </span>
                            ))}
                        </div>
                    </div>
                    {isAdmin && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={handleEdit} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">✏️</button>
                            <button onClick={handleDelete} className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">🗑️</button>
                        </div>
                    )}
                </div>

                {/* Tags Inline */}
                <div className="flex gap-2 items-center mb-1">
                     <span className={cn("text-[10px] font-black tracking-widest uppercase", styles.text)}>
                        #{post.categories[0] || '기타'}
                    </span>
                    <span className="text-[11px] font-bold text-gray-400 dark:text-gray-600">
                        · {formatDate(post.created_at)}
                    </span>
                </div>

                {/* Description - 1 line */}
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2 line-clamp-1 break-all">
                    {post.description || '이 도구에 대한 설명이 아직 없습니다.'}
                </p>

                {/* CTA - Inline Link Style */}
                <div className="flex items-center text-blue-600 dark:text-blue-400 font-bold text-xs gap-1 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all mb-3">
                    도구 바로가기 <ArrowRight className="w-3 h-3" strokeWidth={3} />
                </div>

                {/* Stats Bar (Twitter Style) */}
                <div className="flex items-center justify-between max-w-sm">
                    <div className="flex items-center gap-1 text-gray-400 dark:text-gray-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors group/stat">
                        <div className="p-2 rounded-full group-hover/stat:bg-blue-50 dark:group-hover/stat:bg-blue-900/20 transition-colors flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span className="text-[12px] font-medium">{post.view_count}</span>
                        </div>
                    </div>
                    <div 
                        onClick={handleLike}
                        className={cn(
                            "flex items-center gap-1 transition-colors group/stat",
                            liked ? "text-red-500" : "text-gray-400 dark:text-gray-600 hover:text-red-500"
                        )}
                    >
                        <div className={cn(
                            "p-2 rounded-full transition-colors flex items-center gap-1",
                            liked ? "bg-red-50 dark:bg-red-900/20" : "group-hover/stat:bg-red-50 dark:group-hover/stat:bg-red-900/20"
                        )}>
                            <Heart className={cn("w-4 h-4", liked && "fill-current")} />
                            <span className="text-[12px] font-medium">{likeCount}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400 dark:text-gray-600 hover:text-green-500 dark:hover:text-green-400 transition-colors group/stat">
                        <div className="p-2 rounded-full group-hover/stat:bg-green-50 dark:group-hover/stat:bg-green-900/20 transition-colors flex items-center gap-1">
                             <Bookmark className="w-4 h-4" />
                             <span className="text-[12px] font-medium">저장</span>
                        </div>
                    </div>
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

