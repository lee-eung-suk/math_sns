import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Domain, Grade, Post, getPosts, supabase } from '@/api';
import { PostCard } from './PostCard';
import { cn } from '@/lib/utils';
import { Search as SearchIcon, X } from 'lucide-react';

const DOMAINS: (Domain | '전체')[] = ['전체', '수와 연산', '도형과 측정', '변화와 관계', '자료와 가능성', '기타'];
const GRADES: (Grade | '전체')[] = ['전체', '1학년', '2학년', '3학년', '4학년', '5학년', '6학년', '공통'];

export function FeedPage({ 
    onPostClick, 
    isSearchMode, 
    isAdmin, 
    onEdit, 
    onDelete 
}: { 
    onPostClick: (id: string) => void, 
    isSearchMode?: boolean,
    isAdmin?: boolean,
    onEdit?: (post: Post) => void,
    onDelete?: (id: string) => void
}) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [domainFilter, setDomainFilter] = useState<Domain | '전체'>('전체');
    const [gradeFilter, setGradeFilter] = useState<Grade | '전체'>('전체');
    const [isLoading, setIsLoading] = useState(true);
    
    // Search states
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [showRecent, setShowRecent] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Focus if search mode
    useEffect(() => {
        if (isSearchMode && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchMode]);

    // Load recent searches
    useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            try { setRecentSearches(JSON.parse(saved)); } catch(e){}
        }
    }, []);

    const fetchPosts = async () => {
        setIsLoading(true);
        // We fetch all and filter client side for MVP to allow multi-tag + text search easily
        // But the previous implementation used API params. To allow text search easily over title/desc,
        // we'll fetch all matching domain/grade, then locally filter text.
        const data = await getPosts({ domain: domainFilter, grade: gradeFilter });
        setPosts(data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchPosts();

        if (supabase) {
            const channel = supabase
              .channel('schema-db-changes')
              .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tools' }, () => fetchPosts())
              .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tools' }, () => fetchPosts())
              .subscribe();
            
            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [domainFilter, gradeFilter]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const q = searchQuery.trim();
        if (q && !recentSearches.includes(q)) {
            const newRecent = [q, ...recentSearches].slice(0, 5);
            setRecentSearches(newRecent);
            localStorage.setItem('recentSearches', JSON.stringify(newRecent));
        }
        setShowRecent(false);
        if (searchInputRef.current) searchInputRef.current.blur();
    };

    const handleRecentClick = (q: string) => {
        setSearchQuery(q);
        setShowRecent(false);
    };

    const removeRecent = (e: React.MouseEvent, q: string) => {
        e.stopPropagation();
        const newRecent = recentSearches.filter(s => s !== q);
        setRecentSearches(newRecent);
        localStorage.setItem('recentSearches', JSON.stringify(newRecent));
    };

    const filteredPosts = useMemo(() => {
        if (!debouncedQuery.trim()) return posts;
        const q = debouncedQuery.toLowerCase();
        return posts.filter(p => 
            p.title.toLowerCase().includes(q) || 
            (p.description && p.description.toLowerCase().includes(q)) ||
            p.categories.some(d => d.toLowerCase().includes(q)) ||
            p.grades.some(g => g.toLowerCase().includes(q))
        );
    }, [posts, debouncedQuery]);

    return (
        <div className="flex flex-col h-full bg-[#FBFBFD]">
            {/* Nav & Filters */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-[#E5E5EA] z-20 pt-safe shadow-sm">
                <div className="px-5 py-4 flex flex-col gap-4">
                    <div className="md:hidden flex items-center justify-center">
                        <span className="text-xl font-black text-gray-900 tracking-tight">초등 수(數)다방</span>
                    </div>

                    {/* Search Bar */}
                    {(isSearchMode || debouncedQuery || searchQuery) && (
                        <div className="relative z-30">
                            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                                <SearchIcon className="absolute left-4 w-5 h-5 text-gray-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setShowRecent(true)}
                                    placeholder="수업 도구 검색 (예: 분수, 각도, 그래프)"
                                    className="w-full bg-gray-100 rounded-2xl py-3 pl-11 pr-10 text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-transparent focus:bg-white"
                                />
                                {searchQuery && (
                                    <button 
                                        type="button" 
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 rounded-full"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </form>
                            
                            {/* Recent Searches Dropdown */}
                            {showRecent && recentSearches.length > 0 && (
                                <>
                                    <div className="fixed inset-0 top-[180px] z-20 bg-black/5" onClick={() => setShowRecent(false)} />
                                    <div className="absolute top-14 left-0 w-full bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-30">
                                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500">
                                            최근 검색어
                                        </div>
                                        <ul className="max-h-60 overflow-y-auto">
                                            {recentSearches.map(q => (
                                                <li key={q} className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0" onClick={() => handleRecentClick(q)}>
                                                    <span className="text-[15px] text-gray-700 font-medium">{q}</span>
                                                    <button onClick={(e) => removeRecent(e, q)} className="p-2 text-gray-300 hover:text-gray-500">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

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
                                )}
                            >
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
                                )}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Feed List */}
            <div className="flex-1 overflow-y-auto p-6 md:p-12" onClick={() => setShowRecent(false)}>
                {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-12 opacity-30 max-w-[1400px] mx-auto">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="aspect-[4/5] bg-white rounded-[32px] animate-pulse border border-gray-50" />
                        ))}
                    </div>
                ) : filteredPosts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-12 max-w-[1400px] mx-auto">
                        {filteredPosts.map(post => (
                            <PostCard 
                                key={post.id} 
                                post={post} 
                                onClick={onPostClick} 
                                isAdmin={isAdmin}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <span className="text-3xl">{debouncedQuery ? '🔍' : '📭'}</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">
                            {debouncedQuery ? "검색 결과가 없습니다" : "아직 등록된 수업 도구가 없습니다"}
                        </h3>
                        <p className="text-gray-500 mb-8 max-w-sm">
                            {debouncedQuery 
                                ? "다른 키워드로 검색하거나 필터를 변경해보세요."
                                : "오른쪽 아래 + 버튼을 눌러 첫 번째 도구를 공유해보세요!"}
                        </p>
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
