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

export function PostCard({ post, onClick, onLike, isAdmin, onEdit, onDelete }: PostCardProps) {
    const [liked, setLiked] = React.useState(false);
    const [likeCount, setLikeCount] = React.useState(post.like_count);

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
            initial={{ opacity: 0, y: 10 }}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onClick(post.id)}
            className="group bg-white rounded-[40px] overflow-hidden transition-all duration-500 cursor-pointer flex flex-col h-full w-full max-w-sm mx-auto p-2 border border-transparent hover:border-gray-100 relative"
        >
            {/* Admin Controls */}
            {isAdmin && (
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                    <button 
                        onClick={handleEdit}
                        className="p-2 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-gray-100 hover:bg-white text-gray-600 transition-all hover:scale-110 active:scale-95"
                        title="수정하기"
                    >
                        <span className="text-sm">✏️</span>
                    </button>
                    <button 
                        onClick={handleDelete}
                        className="p-2 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-gray-100 hover:bg-red-50 text-red-500 transition-all hover:scale-110 active:scale-95"
                        title="삭제하기"
                    >
                        <span className="text-sm">🗑️</span>
                    </button>
                </div>
            )}
            {/* Iconic Thumbnail Container */}
            <div className="aspect-square relative overflow-hidden bg-[#FBFBFD] rounded-[32px] flex-shrink-0 flex items-center justify-center p-8 transition-all duration-500 group-hover:bg-gray-50/50">
                {post.thumbnail ? (
                    <img 
                        src={post.thumbnail} 
                        alt="thumbnail" 
                        className="w-full h-full object-cover rounded-[24px] transform transition-transform duration-[1.5s] group-hover:scale-110" 
                    />
                ) : (
                    <div className="w-full h-full rounded-[24px] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                        <ExternalLink className="w-12 h-12 text-gray-200" />
                    </div>
                )}
                {/* Subtle Hover Overlay */}
                <div className="absolute inset-0 bg-black/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </div>
            
            {/* Minimal Typography */}
            <div className="py-5 px-4 flex flex-col items-center text-center">
                <h4 className="text-[17px] font-bold text-gray-900 line-clamp-2 leading-relaxed tracking-tight group-hover:text-blue-600 transition-colors duration-300">
                    {post.title}
                </h4>
            </div>
        </motion.div>
    );
}
