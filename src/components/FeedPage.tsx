import React, { useEffect, useState } from 'react';
import { Domain, Grade, Post, getPosts, supabase } from '@/api';
import { PostCard } from './PostCard';
import { cn } from '@/lib/utils';

const DOMAINS: (Domain | '전체')[] = ['전체', '수와 연산', '도형과 측정', '변화와 관계', '자료와 가능성', '기타'];
const GRADES: (Grade | '전체')[] = ['전체', '1학년', '2학년', '3학년', '4학년', '5학년', '6학년', '공통'];

export function FeedPage({ onPostClick }: { onPostClick: (id: string) => void }) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [domainFilter, setDomainFilter] = useState<Domain | '전체'>('전체');
    const [gradeFilter, setGradeFilter] = useState<Grade | '전체'>('전체');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            setIsLoading(true);
            const data = await getPosts({ domain: domainFilter, grade: gradeFilter });
            setPosts(data);
            setIsLoading(false);
        };
        fetchPosts();

        if (supabase) {
            const channel = supabase
              .channel('schema-db-changes')
              .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' }, () => fetchPosts())
              .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => fetchPosts())
              .subscribe();
            
            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [domainFilter, gradeFilter]);

    return (
        <div className="flex flex-col h-full bg-[#FBFBFD]">
            {/* Nav & Filters */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-[#E5E5EA] z-10 pt-safe shadow-sm">
                <div className="px-5 py-4 flex flex-col gap-4">
                    <div className="md:hidden flex items-center justify-center">
                        <span className="text-lg font-bold italic">응석쌤 초등 수학 수업 도구</span>
                    </div>

                    {/* Grade Filter */}
                    <div className="flex overflow-x-auto hide-scrollbar gap-2">
                        {GRADES.map(g => (
                            <button
                                key={g}
                                onClick={() => setGradeFilter(g)}
                                className={cn(
                                    "whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all border",
                                    gradeFilter === g 
                                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200" 
                                        : g === '전체' && gradeFilter === '전체'
                                            ? "bg-gray-800 text-white border-gray-800"
                                            : "bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                                )}>
                                {g}
                            </button>
                        ))}
                    </div>

                    {/* Domain Filter */}
                    <div className="flex overflow-x-auto hide-scrollbar gap-2 pt-2">
                        {DOMAINS.map(d => (
                            <button
                                key={d}
                                onClick={() => setDomainFilter(d)}
                                className={cn(
                                    "whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all border",
                                    domainFilter === d 
                                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200" 
                                        : d === '전체' && domainFilter === '전체'
                                            ? "bg-gray-800 text-white border-gray-800"
                                            : "bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                                )}>
                                {d}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Feed List */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-30 max-w-7xl mx-auto">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white rounded-3xl h-[400px] animate-pulse border border-gray-100" />
                        ))}
                    </div>
                ) : posts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                        {posts.map(post => (
                            <PostCard key={post.id} post={post} onClick={onPostClick} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <span className="text-3xl">📭</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">아직 등록된 수업 도구가 없습니다</h3>
                        <p className="text-gray-500 mb-8">오른쪽 아래 + 버튼을 눌러 첫 번째 도구를 공유해보세요!</p>
                    </div>
                )}
            </div>
            
            <style dangerouslySetInnerHTML={{__html:`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </div>
    );
}
