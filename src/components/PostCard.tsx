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
}

export function PostCard({ post, onClick, onLike }: PostCardProps) {
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

    const handleLink = (e: React.MouseEvent) => {
        e.stopPropagation();
        window.open(post.url, '_blank', 'noopener,noreferrer');
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileHover={{ y: -4, scale: 1.03 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onClick(post.id)}
            className="bg-white rounded-[24px] card-border overflow-hidden transition-all duration-300 cursor-pointer flex flex-col shadow-sm hover:shadow-xl hover:shadow-black/5 h-full w-full max-w-sm mx-auto"
        >
            {/* Thumbnail */}
            <div className="h-[200px] sm:h-[240px] relative overflow-hidden bg-gray-100 flex-shrink-0 group">
                {post.thumbnail_url ? (
                    <img src={post.thumbnail_url} alt="thumbnail" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                        <ExternalLink className="w-10 h-10 text-blue-200" />
                    </div>
                )}
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            
            {/* Content */}
            <div className="p-5 flex flex-col justify-between flex-1 gap-4">
                <div className="space-y-1.5 flex-1">
                    <h4 className="text-[20px] font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors tracking-tight">
                        {post.title}
                    </h4>
                    <p className="text-[15px] text-gray-500 line-clamp-1">
                        {post.content || "요약 설명이 없습니다."}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-3">
                        {post.grades.map(g => <TagBadge key={g} tag={g} />)}
                        {post.domains.map(d => <TagBadge key={d} tag={d} />)}
                    </div>
                </div>

                <div className="pt-2 flex flex-col gap-4">
                    <button 
                        onClick={handleLink}
                        className="w-full h-[48px] flex items-center justify-center gap-2 bg-blue-600 text-white rounded-[16px] text-[15px] font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all active:scale-95"
                    >
                        <ExternalLink className="w-4 h-4" />
                        도구 바로가기
                    </button>

                    <div className="flex items-center justify-between text-xs text-gray-400 font-medium px-1">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                                <Eye className="w-3.5 h-3.5" />
                                <span>{post.view_count.toLocaleString()}</span>
                            </div>
                            <button 
                                onClick={handleLike}
                                className={cn(
                                    "flex items-center gap-1.5 transition-colors", 
                                    liked ? "text-pink-500" : "hover:text-pink-500"
                                )}>
                                <Heart className={cn("w-3.5 h-3.5", liked && "fill-current")} />
                                <span>{likeCount}</span>
                            </button>
                        </div>
                        <span className="text-gray-300">
                             {new Date(post.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric'})}
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
