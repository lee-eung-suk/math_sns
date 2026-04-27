import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Domain, Grade, Post, getPosts, supabase } from '@/api';
import { PostCard } from './PostCard';
import { cn } from '@/lib/utils';
import { Search as SearchIcon, X } from 'lucide-react';
import { motion } from 'motion/react';

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

    const [sortTab, setSortTab] = useState<'전체' | '인기' | '추천' | '최신'>('전체');

    const filteredPosts = useMemo(() => {
        let basePosts = [...posts];

        // Apply Tab Sort
        if (sortTab === '인기') basePosts.sort((a, b) => b.view_count - a.view_count);
        if (sortTab === '추천') basePosts.sort((a, b) => b.like_count - a.like_count);
        if (sortTab === '최신') basePosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        // Apply Domain/Grade Filters
        if (domainFilter !== '전체') basePosts = basePosts.filter(p => p.categories.includes(domainFilter));
        if (gradeFilter !== '전체') basePosts = basePosts.filter(p => p.grades.includes(gradeFilter));

        // Apply Search
        if (!debouncedQuery.trim()) return basePosts;
        const q = debouncedQuery.toLowerCase();
        return basePosts.filter(p => 
            p.title.toLowerCase().includes(q) || 
            (p.description && p.description.toLowerCase().includes(q)) ||
            p.categories.some(d => d.toLowerCase().includes(q)) ||
            p.grades.some(g => g.toLowerCase().includes(q))
        );
    }, [posts, debouncedQuery, domainFilter, gradeFilter, sortTab]);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-black overflow-hidden transition-colors duration-300">
            {/* Sticky Header with Title & Tabs */}
            <div className="sticky top-0 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 z-20 transition-colors duration-300">
                <div className="pt-safe px-4 py-3 flex items-center justify-between border-b border-gray-50 dark:border-gray-900">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                        {isSearchMode ? '검색' : (sortTab === '전체' ? '홈' : sortTab)}
                    </h2>
                    {isSearchMode && (
                         <div className="flex-1 max-w-[200px] ml-4">
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="검색..."
                                    className="w-full bg-gray-100 dark:bg-gray-900 border-none rounded-full py-1.5 pl-9 pr-4 text-xs font-medium dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Primary Tabs */}
                {!isSearchMode && (
                    <div className="flex w-full">
                        {['전체', '인기', '추천', '최신'].map((t: any) => (
                            <button
                                key={t}
                                onClick={() => setSortTab(t)}
                                className="flex-1 py-4 text-sm font-bold relative transition-colors hover:bg-gray-50 dark:hover:bg-gray-900"
                            >
                                <span className={cn(
                                    "relative z-10",
                                    sortTab === t ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white"
                                )}>
                                    {t}
                                </span>
                                {sortTab === t && (
                                    <motion.div 
                                        layoutId="tab-underline"
                                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-500 rounded-full"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Secondary Filters (Collapsible or Small) */}
            <div className="px-4 py-2 border-b border-gray-50 dark:border-gray-900 bg-white dark:bg-black overflow-x-auto no-scrollbar flex gap-2 transition-colors duration-300">
                 <select 
                    value={gradeFilter} 
                    onChange={(e) => setGradeFilter(e.target.value as any)}
                    className="p-1 px-2 text-[11px] font-bold bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg border-none focus:ring-1 focus:ring-blue-500 outline-none"
                 >
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                 </select>
                 <select 
                    value={domainFilter} 
                    onChange={(e) => setDomainFilter(e.target.value as any)}
                    className="p-1 px-2 text-[11px] font-bold bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg border-none focus:ring-1 focus:ring-blue-500 outline-none"
                 >
                    {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                 </select>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-black transition-colors duration-300" onClick={() => setShowRecent(false)}>
                <div className="w-full box-border">
                    {isLoading ? (
                        <div className="divide-y divide-gray-50 dark:divide-gray-900">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="p-4 flex gap-3 animate-pulse">
                                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-900 shrink-0" />
                                    <div className="flex-1 space-y-2 py-1">
                                        <div className="h-4 bg-gray-100 dark:bg-gray-900 rounded w-1/4" />
                                        <div className="h-3 bg-gray-100 dark:bg-gray-900 rounded w-3/4" />
                                        <div className="h-3 bg-gray-100 dark:bg-gray-900 rounded w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredPosts.length > 0 ? (
                        <div className="flex flex-col w-full divide-y divide-gray-50 dark:divide-gray-900">
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
                            <div className="h-28" /> {/* Spacer for FAB/Nav */}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-280px)] text-center px-6">
                            <div className="w-24 h-24 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6 transition-colors">
                                <span className="text-4xl text-gray-400">🔍</span>
                            </div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">도구를 찾지 못했어요</h3>
                            <p className="text-gray-400 dark:text-gray-500 text-sm mb-8 max-w-[240px] leading-relaxed mx-auto font-medium">
                                검색어나 필터를 변경해보거나,<br/>직접 새로운 도구를 첫 번째로 등록해보세요!
                            </p>
                            <div className="flex flex-col gap-3 w-full max-w-[200px]">
                                <button 
                                    onClick={() => { setDomainFilter('전체'); setGradeFilter('전체'); setSearchQuery(''); setSortTab('전체'); }}
                                    className="px-6 py-3 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white rounded-full text-sm font-bold active:scale-95 transition-all"
                                >
                                    필터 초기화
                                </button>
                                <button 
                                    onClick={() => window.dispatchEvent(new CustomEvent('open-upload-modal'))}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-full text-sm font-bold shadow-lg shadow-blue-100 dark:shadow-none active:scale-95 transition-all"
                                >
                                    첫 도구 등록하기 +
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{__html:`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </div>
    );
}
