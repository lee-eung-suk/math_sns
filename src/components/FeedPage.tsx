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
                                    "whitespace-nowrap px-3 py-1 rounded-lg text-xs font-bold transition-all",
                                    gradeFilter === g 
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                )}>
                                {g}
                            </button>
                        ))}
                    </div>

                    {/* Domain Filter */}
                    <div className="flex overflow-x-auto hide-scrollbar gap-5 text-sm font-semibold border-t border-gray-50 pt-2">
                        {DOMAINS.map(d => (
                            <button
                                key={d}
                                onClick={() => setDomainFilter(d)}
                                className={cn(
                                    "whitespace-nowrap py-2 transition-all border-b-2",
                                    domainFilter === d 
                                        ? "text-[#1C1C1E] border-[#1C1C1E]" 
                                        : "border-transparent text-gray-300 hover:text-gray-500"
                                )}>
                                {d}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Feed List */}
            <div className="flex-1 overflow-y-auto p-5 md:p-8">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 opacity-30">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white rounded-3xl h-80 animate-pulse border border-gray-100" />
                        ))}
                    </div>
                ) : posts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                        {posts.map(post => (
                            <PostCard key={post.id} post={post} onClick={onPostClick} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
                        <p className="font-semibold">해당하는 수업 도구가 아직 없습니다.</p>
                        <p className="text-sm">가장 먼저 공유해보시는 건 어떨까요?</p>
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
