import React, { useEffect, useState, useRef } from 'react';
import { Post, Comment, getPosts, getComments, createComment, deleteComment, incrementView, toggleLike, supabase } from '@/api';
import { ChevronLeft, Eye, Heart, Share, ExternalLink, Triangle, Calculator, BarChart3, Activity, Puzzle, Calendar, MessageCircle, Send, Trash2 } from 'lucide-react';
import { playLikeSound, cn, formatDate } from '@/lib/utils';
import { motion } from 'motion/react';

const getCategoryStyles = (categories: string[]) => {
    const mainCat = categories[0] || '기타';
    if (mainCat.includes('도형') || mainCat.includes('측정')) return { 
        bg: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20', 
        iconBg: 'bg-purple-500', 
        text: 'text-purple-600 dark:text-purple-400', 
        icon: Triangle,
        symbol: '📐'
    };
    if (mainCat.includes('수와')) return { 
        bg: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20', 
        iconBg: 'bg-blue-500', 
        text: 'text-blue-600 dark:text-blue-400', 
        icon: Calculator,
        symbol: '📊'
    };
    if (mainCat.includes('자료')) return { 
        bg: 'from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20', 
        iconBg: 'bg-yellow-500', 
        text: 'text-yellow-600 dark:text-yellow-400', 
        icon: BarChart3,
        symbol: '🎲'
    };
    if (mainCat.includes('변화')) return { 
        bg: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20', 
        iconBg: 'bg-green-500', 
        text: 'text-green-600 dark:text-green-400', 
        icon: Activity,
        symbol: '📈'
    };
    return { 
        bg: 'from-gray-50 to-gray-100 dark:from-gray-800 to-gray-900', 
        iconBg: 'bg-gray-400', 
        text: 'text-gray-500 dark:text-gray-400', 
        icon: Puzzle,
        symbol: '🧩'
    };
};

// URL을 찾아서 a 태그로 변환하는 헬퍼 함수
const renderTextWithLinks = (text: string) => {
    if (!text) return text;
    
    // http://, https:// 또는 www. 로 시작하는 패턴 (공백 등장 전까지)
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
        if (part.match(urlRegex)) {
            const href = part.startsWith('www.') ? `http://${part}` : part;
            return (
                <a 
                    key={index} 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                    onClick={(e) => e.stopPropagation()}
                >
                    {part}
                </a>
            );
        }
        return part;
    });
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

    const [replyToId, setReplyToId] = useState<string | null>(null);
    const [replyAuthorName, setReplyAuthorName] = useState('');
    const [replyContent, setReplyContent] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        setIsAdmin(localStorage.getItem('isAdmin') === 'true');
    }, []);

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
              .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` }, 
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setComments((prev) => {
                            const newComment = payload.new as Comment;
                            if (prev.some(c => c.id === newComment.id)) return prev;
                            return [newComment, ...prev].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                        });
                    } else if (payload.eventType === 'DELETE') {
                        setComments((prev) => prev.filter(c => c.id !== payload.old.id && c.parent_id !== payload.old.id));
                    }
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
                setComments(prev => [newComment, ...prev].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
                setCommentContent('');
            }
        } catch (err) {
            alert('댓글 작성에 실패했습니다.');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleReplySubmit = async (e: React.FormEvent, parentId: string) => {
        e.preventDefault();
        if (!replyContent.trim() || !post) return;

        setIsSubmittingComment(true);
        try {
            const newComment = await createComment(post.id, replyContent, replyAuthorName, parentId);
            if (newComment) {
                setComments(prev => [newComment, ...prev].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
                setReplyContent('');
                setReplyToId(null);
            }
        } catch (err) {
            alert('답글 작성에 실패했습니다.');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleDeleteComment = async (id: string) => {
        if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
        try {
            await deleteComment(id);
            setComments(prev => prev.filter(c => c.id !== id && c.parent_id !== id));
        } catch (e: any) {
            alert('삭제 실패: ' + e.message);
        }
    };

    if (!post) return <div className="p-8 text-center text-gray-400 font-bold animate-pulse">도구 정보를 불러오는 중...</div>;

    const styles = getCategoryStyles(post.categories);

    const parentComments = comments.filter(c => !c.parent_id);

    return (
        <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 32, stiffness: 350 }}
            className="flex flex-col h-full bg-white dark:bg-black z-[60] fixed top-0 left-0 lg:left-64 w-full lg:w-[calc(100%-16rem)] min-h-screen overflow-hidden transition-colors duration-300"
        >
            {/* Header */}
            <div className="sticky top-0 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 flex items-center justify-between p-4 pt-safe z-30 transition-colors duration-300">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
                    <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                </button>
                <div className="flex-1 px-4 text-center flex justify-center items-center">
                    <h1 className="text-[clamp(20px,6vw,24px)] font-black text-[#2563EB] dark:text-blue-500 tracking-[-0.03em] leading-none font-rounded drop-shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        수다방 SNS
                    </h1>
                </div>
                <button 
                    onClick={() => navigator.share && navigator.share({ title: post.title, url: post.url })}
                    className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                >
                    <Share className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pb-40 bg-white dark:bg-black flex justify-center transition-colors duration-300">
                <div className="max-w-[700px] w-full sm:border-x border-gray-100 dark:border-gray-800 min-h-full">
                    {/* Content Section */}
                    <div className="p-5 sm:p-8 space-y-6 border-b border-gray-100 dark:border-gray-800">
                        
                        {/* Header / Author */}
                        <div className="flex items-center gap-3">
                            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br shadow-sm", styles.bg)}>
                                <styles.icon className={cn("w-6 h-6", styles.text)} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-[20px] sm:text-[24px] font-black text-[#1C1C1E] dark:text-white tracking-tight leading-tight transition-colors">
                                    {post.title}
                                </h2>
                                <div className="flex gap-2 mt-1 flex-wrap">
                                    <span className="text-[13px] font-bold text-gray-400 dark:text-gray-600">
                                        #{post.categories[0] || '기타'} · {post.grades[0] || '공통'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Description Text */}
                        <p className="text-[15px] sm:text-[17px] leading-relaxed text-[#333333] dark:text-gray-300 whitespace-pre-wrap font-medium tracking-tight px-1 transition-colors">
                            {renderTextWithLinks(post.description)}
                        </p>

                        {/* Main Image */}
                        {post.image_url && (
                            <div className="w-full rounded-[16px] overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm relative bg-gray-50 dark:bg-gray-900 flex items-center justify-center my-4 transition-colors">
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
                            className="w-full py-4 flex items-center justify-center gap-2 bg-[#2563EB] dark:bg-blue-600 text-white rounded-[16px] font-bold text-[16px] shadow-sm hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors active:scale-[0.98]"
                        >
                            도구 바로가기
                        </button>

                        {/* Timestamp & Stats */}
                        <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800 flex-wrap px-1 transition-colors">
                            <span className="text-[13px] font-medium text-gray-400 dark:text-gray-600">{formatDate(post.created_at)}</span>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-1.5">
                                    <Eye className="w-4 h-4 text-gray-400 dark:text-gray-600" />
                                    <span className="text-[13px] font-bold text-gray-500 dark:text-gray-400">{post.view_count.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Heart className={cn("w-4 h-4", liked ? "text-pink-500 fill-pink-500" : "text-gray-400 dark:text-gray-600")} />
                                    <span className="text-[13px] font-bold text-gray-500 dark:text-gray-400">{likeCount}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <MessageCircle className="w-4 h-4 text-gray-400 dark:text-gray-600" />
                                    <span className="text-[13px] font-bold text-gray-500 dark:text-gray-400">{comments.length}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer Owner */}
                        <div className="pt-2 px-1">
                            <p className="text-[12px] sm:text-[13px] font-medium text-[#94A3B8] dark:text-gray-600">
                                경상북도교육청 창의융합 교사연구회 수(數)다방
                            </p>
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="bg-gray-50 dark:bg-gray-900/30 min-h-[300px] p-5 sm:p-8 space-y-6 transition-colors duration-300">
                        <h3 className="font-bold gap-2 flex items-center text-gray-800 dark:text-gray-200 transition-colors">
                            <MessageCircle className="w-5 h-5 text-gray-400 dark:text-gray-600" />
                            댓글 {comments.length}개
                        </h3>

                        {/* Comment Input */}
                        <form onSubmit={handleCommentSubmit} className="bg-white dark:bg-gray-900 border text-sm border-gray-200 dark:border-gray-800 rounded-[16px] p-4 shadow-sm space-y-3 transition-colors duration-300">
                            <input 
                                type="text" 
                                placeholder="이름 (선택)" 
                                value={authorName}
                                onChange={(e) => setAuthorName(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-2 text-[13px] dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                            />
                            <textarea 
                                placeholder="답글 게시하기" 
                                value={commentContent}
                                onChange={(e) => setCommentContent(e.target.value)}
                                className="w-full bg-transparent dark:text-white resize-none h-20 text-[14px] leading-relaxed focus:outline-none"
                                required
                            />
                            <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
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
                        <div className="space-y-0 relative border-t border-gray-100 dark:border-gray-800 mt-4 pt-2 transition-colors duration-300">
                            {parentComments.map((comment) => {
                                const replies = comments.filter(c => c.parent_id === comment.id);
                                return (
                                <div key={comment.id} className="py-4 border-b border-gray-100 dark:border-gray-900 flex gap-3 px-1">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                                        <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                                            {(comment.author_name || '익명').charAt(0)}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-[14px] text-gray-900 dark:text-white truncate">
                                                    {comment.author_name || '익명'}
                                                </span>
                                                <span className="text-[13px] text-gray-400 dark:text-gray-600 shrink-0">
                                                    {formatDate(comment.created_at)}
                                                </span>
                                            </div>
                                            {isAdmin && (
                                                <button onClick={() => handleDeleteComment(comment.id)} className="text-gray-300 dark:text-gray-700 hover:text-red-500 transition-colors p-1">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words transition-colors">
                                            {comment.content}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2">
                                            <button className="flex items-center gap-1 text-gray-400 dark:text-gray-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                                                <Heart className="w-3.5 h-3.5" />
                                            </button>
                                            <button 
                                                onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
                                                className="flex items-center gap-1 text-gray-400 dark:text-gray-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors text-[12px] font-bold"
                                            >
                                                답글
                                            </button>
                                        </div>

                                        {/* Reply Input Box */}
                                        {replyToId === comment.id && (
                                            <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="bg-white dark:bg-gray-950 border text-sm border-gray-200 dark:border-gray-800 rounded-xl p-3 shadow-sm space-y-2 mt-3 mb-2 w-full transition-colors duration-300">
                                                <input 
                                                    type="text" 
                                                    placeholder="이름 (선택)" 
                                                    value={replyAuthorName}
                                                    onChange={(e) => setReplyAuthorName(e.target.value)}
                                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg px-3 py-2 text-[13px] dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                                                />
                                                <textarea 
                                                    placeholder="답글 내용을 입력하세요" 
                                                    value={replyContent}
                                                    onChange={(e) => setReplyContent(e.target.value)}
                                                    className="w-full bg-transparent dark:text-white resize-none h-14 text-[13px] leading-relaxed focus:outline-none"
                                                    required
                                                />
                                                <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
                                                    <button 
                                                        type="submit"
                                                        disabled={!replyContent.trim() || isSubmittingComment}
                                                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:bg-blue-600 text-white font-bold text-[12px] px-4 py-1.5 rounded-full transition-colors flex items-center gap-1"
                                                    >
                                                        <Send className="w-3 h-3" />
                                                        작성
                                                    </button>
                                                </div>
                                            </form>
                                        )}

                                        {/* Replies List */}
                                        {replies.length > 0 && (
                                            <div className="space-y-3 mt-4">
                                                {replies.map(reply => (
                                                    <div key={reply.id} className="flex gap-3 bg-[#f8f9fb] dark:bg-gray-900/50 p-3 rounded-2xl ml-2 sm:ml-6 transition-colors duration-300">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                                                            <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                                                                {(reply.author_name || '익명').charAt(0)}
                                                            </span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-0.5">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-[13px] text-gray-900 dark:text-white truncate">
                                                                        {reply.author_name || '익명'}
                                                                    </span>
                                                                    <span className="text-[12px] text-gray-400 dark:text-gray-600 shrink-0">
                                                                        {formatDate(reply.created_at)}
                                                                    </span>
                                                                </div>
                                                                {isAdmin && (
                                                                    <button onClick={() => handleDeleteComment(reply.id)} className="text-gray-300 dark:text-gray-700 hover:text-red-500 transition-colors p-1">
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words transition-colors">
                                                                {reply.content}
                                                            </p>
                                                            <div className="flex items-center gap-4 mt-1.5">
                                                                <button className="flex items-center gap-1 text-gray-400 dark:text-gray-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                                                                    <Heart className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                );
                            })}
                            {parentComments.length === 0 && (
                                <div className="text-center py-10 text-gray-400 dark:text-gray-600 font-medium text-[14px]">
                                    아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Floating Interaction Bar */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:translate-x-32 w-auto flex bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-full shadow-2xl p-2 px-6 items-center gap-4 z-40 transition-colors duration-300">
                <button 
                    onClick={handleLike}
                    className={cn("flex items-center gap-2 transition-all active:scale-75", liked ? "text-pink-500" : "hover:text-pink-500 text-gray-400 dark:text-gray-600 font-black")}>
                    <Heart className={cn("w-5 h-5", liked && "fill-current")} />
                    <span className="text-sm font-black">{liked ? '저장됨' : '저장하기'}</span>
                </button>
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-800" />
                <button 
                    onClick={() => navigator.share && navigator.share({ title: post.title, url: post.url })}
                    className="text-gray-400 dark:text-gray-600 hover:text-blue-500 dark:hover:text-blue-400 font-black flex items-center gap-2"
                >
                    <Share className="w-5 h-5" />
                    <span className="text-sm">공유</span>
                </button>
            </div>
        </motion.div>
    );
};
