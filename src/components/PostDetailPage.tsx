import React, { useEffect, useState, useRef } from 'react';
import { Post, Comment, getPosts, getComments, createComment, incrementView, toggleLike, supabase } from '@/api';
import { ChevronLeft, Eye, Heart, Share, ExternalLink, Triangle, Calculator, BarChart3, Activity, Puzzle, Calendar, MessageCircle, Send } from 'lucide-react';
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

    const [comments, setComments] = useState<Comment[]>([]);
    const [authorName, setAuthorName] = useState('');
    const [commentContent, setCommentContent] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    useEffect(() => {
        const fetchPostAndComments = async () => {
            const allPosts = await getPosts();
            const found = allPosts.find(p => p.id === postId);
            if (found) {
                setPost(found);
                setLikeCount(found.like_count);
                await incrementView(postId);
            }

            const postComments = await getComments(postId);
            setComments(postComments);
        };
        fetchPostAndComments();

        if (supabase) {
            const postChannel = supabase
              .channel(`post-${postId}`)
              .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tools', filter: `id=eq.${postId}` }, 
                (payload) => {
                    setPost(payload.new as Post);
                    setLikeCount((payload.new as Post).like_count);
                })
              .subscribe();
              
            const commentsChannel = supabase
              .channel(`comments-${postId}`)
              .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` }, 
                (payload) => {
                    setComments((prev) => {
                        const newComment = payload.new as Comment;
                        // Avoid duplicate if we just created it optimistically
                        if (prev.some(c => c.id === newComment.id)) return prev;
                        return [newComment, ...prev];
                    });
                })
              .subscribe();

            return () => {
                supabase.removeChannel(postChannel);
                supabase.removeChannel(commentsChannel);
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

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentContent.trim() || !post) return;

        setIsSubmittingComment(true);
        try {
            const newComment = await createComment(post.id, commentContent, authorName);
            if (newComment) {
                setComments(prev => [newComment, ...prev]);
                setCommentContent('');
            }
        } catch (err) {
            alert('댓글 작성에 실패했습니다.');
        } finally {
            setIsSubmittingComment(false);
        }
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
                    <div className="p-5 sm:p-8 space-y-6 border-b border-gray-100">
                        
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
                                <div className="flex items-center gap-1.5">
                                    <MessageCircle className="w-4 h-4 text-gray-400" />
                                    <span className="text-[13px] font-bold text-gray-500">{comments.length}</span>
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

                    {/* Comments Section */}
                    <div className="bg-gray-50 min-h-[300px] p-5 sm:p-8 space-y-6">
                        <h3 className="font-bold gap-2 flex items-center text-gray-800">
                            <MessageCircle className="w-5 h-5 text-gray-400" />
                            댓글 {comments.length}개
                        </h3>

                        {/* Comment Input */}
                        <form onSubmit={handleCommentSubmit} className="bg-white border text-sm border-gray-200 rounded-[16px] p-4 shadow-sm space-y-3">
                            <input 
                                type="text" 
                                placeholder="이름 (선택)" 
                                value={authorName}
                                onChange={(e) => setAuthorName(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-[13px] font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <textarea 
                                placeholder="답글 게시하기" 
                                value={commentContent}
                                onChange={(e) => setCommentContent(e.target.value)}
                                className="w-full bg-transparent resize-none h-20 text-[14px] leading-relaxed focus:outline-none"
                                required
                            />
                            <div className="flex justify-end pt-2 border-t border-gray-100">
                                <button 
                                    type="submit"
                                    disabled={!commentContent.trim() || isSubmittingComment}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:bg-blue-600 text-white font-bold text-[13px] px-5 py-2 rounded-full transition-colors flex items-center gap-1.5"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                    작성
                                </button>
                            </div>
                        </form>

                        {/* Comment List */}
                        <div className="space-y-0 relative border-t border-gray-100 mt-4 pt-2">
                            {comments.map((comment) => (
                                <div key={comment.id} className="py-4 border-b border-gray-100 flex gap-3 px-1">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                        <span className="text-blue-600 font-bold text-sm">
                                            {(comment.author_name || '익명').charAt(0)}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-[14px] text-gray-900 truncate">
                                                {comment.author_name || '익명'}
                                            </span>
                                            <span className="text-[13px] text-gray-400 shrink-0">
                                                {formatDate(comment.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-[14px] text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                                            {comment.content}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2">
                                            <button className="flex items-center gap-1 text-gray-400 hover:text-blue-500 transition-colors">
                                                <Heart className="w-3.5 h-3.5" />
                                            </button>
                                            <button className="flex items-center gap-1 text-gray-400 hover:text-blue-500 transition-colors text-[12px] font-bold">
                                                답글
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {comments.length === 0 && (
                                <div className="text-center py-10 text-gray-400 font-medium text-[14px]">
                                    아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
                                </div>
                            )}
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
