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
            whileHover={{ y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onClick(post.id)}
            className="bg-white rounded-2xl card-border overflow-hidden transition-all duration-300 cursor-pointer flex flex-col shadow-sm hover:shadow-md h-full"
        >
            {/* Thumbnail */}
            <div className="h-44 relative overflow-hidden bg-gray-100 flex-shrink-0 group">
                {post.thumbnail_url ? (
                    <img src={post.thumbnail_url} alt="thumbnail" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                        <ExternalLink className="w-10 h-10 text-blue-200" />
                    </div>
                )}
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            
            {/* Content */}
            <div className="p-5 flex flex-col justify-between flex-1 space-y-3">
                <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                        {post.grades.map(g => <TagBadge key={g} tag={g} />)}
                        {post.domains.map(d => <TagBadge key={d} tag={d} />)}
                    </div>
                    <h4 className="text-lg font-bold text-[#1C1C1E] line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {post.title}
                    </h4>
                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed h-10">
                        {post.content}
                    </p>
                </div>

                <div className="pt-2 flex flex-col gap-3">
                    <button 
                        onClick={handleLink}
                        className="w-full h-10 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                    >
                        <ExternalLink className="w-4 h-4" />
                        도구 바로가기
                    </button>

                    <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
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
