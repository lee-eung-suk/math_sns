import React, { useEffect, useState } from 'react';
import { Post, getPosts } from '@/api';
import { Eye, Heart, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RightPanel({ onPostClick }: { onPostClick: (id: string) => void }) {
    const [trending, setTrending] = useState<Post[]>([]);
    const [recommended, setRecommended] = useState<Post[]>([]);
    const [recent, setRecent] = useState<Post[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const allPosts = await getPosts({});
            
            // Trending: Most views
            setTrending([...allPosts].sort((a, b) => b.view_count - a.view_count).slice(0, 3));
            
            // Recommended: Most likes
            setRecommended([...allPosts].sort((a, b) => b.like_count - a.like_count).slice(0, 3));
            
            // Recent: Latest created_at
            setRecent([...allPosts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 3));
        };
        fetchData();
    }, []);

    const SmallPostItem = ({ post, icon }: { post: Post, icon: string }) => (
        <div 
            onClick={() => onPostClick(post.id)}
            className="group cursor-pointer p-3 hover:bg-gray-100 rounded-xl transition-all flex flex-col gap-1 border border-transparent hover:border-gray-200"
        >
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-blue-600 tracking-widest uppercase">#{post.categories[0]}</span>
                <span className="text-xs">{icon}</span>
            </div>
            <h4 className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors truncate">{post.title}</h4>
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                    <Eye className="w-3 h-3" /> {post.view_count}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                    <Heart className="w-3 h-3" /> {post.like_count}
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-6">
            <div className="bg-gray-50 rounded-2xl p-4">
                <h3 className="text-lg font-black mb-4 flex items-center gap-2">🔥 인기 도구</h3>
                <div className="flex flex-col gap-2">
                    {trending.map(p => <SmallPostItem key={p.id} post={p} icon="📈" />)}
                </div>
                <button className="w-full text-left mt-3 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                    더보기
                </button>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4">
                <h3 className="text-lg font-black mb-4 flex items-center gap-2">⭐ 추천 도구</h3>
                <div className="flex flex-col gap-2">
                    {recommended.map(p => <SmallPostItem key={p.id} post={p} icon="✨" />)}
                </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4">
                <h3 className="text-lg font-black mb-4 flex items-center gap-2">🆕 최근 등록</h3>
                <div className="flex flex-col gap-2">
                    {recent.map(p => <SmallPostItem key={p.id} post={p} icon="🌱" />)}
                </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4">
                <h3 className="text-lg font-black mb-4">추천 키워드</h3>
                <div className="flex flex-wrap gap-2">
                    {['도형', '연산', '6학년', '측정', '게임', '분수', '소수', '비율'].map(tag => (
                        <span key={tag} className="px-3 py-1 bg-white border border-gray-100 rounded-full text-xs font-bold text-blue-600 hover:bg-blue-600 hover:text-white cursor-pointer transition-all">
                            #{tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
