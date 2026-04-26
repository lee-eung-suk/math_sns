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
        <div className="flex flex-col h-full bg-[#FBFBFD] overflow-hidden">
            {/* Header & Sticky Filters */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-[#E5E5EA] z-20 pt-safe">
                <div className="px-4 py-4 flex flex-col gap-3">
                    <div className="md:hidden flex items-center justify-between">
                        <span className="text-xl font-black text-gray-900 tracking-tight">수다방</span>
                        {isSearchMode && (
                            <button onClick={() => setSearchQuery('')} className="p-2 text-gray-400">
                                <SearchIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Search Bar (Conditional) */}
                    {(isSearchMode || searchQuery) && (
                        <div className="relative">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setShowRecent(true)}
                                placeholder="도구 검색..."
                                className="w-full bg-gray-100 rounded-2xl py-3 pl-11 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-transparent focus:bg-white"
                            />
                        </div>
                    )}

                    {/* Filters (Wrap on Mobile) */}
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {GRADES.map(g => (
                                <button
                                    key={g}
                                    onClick={() => setGradeFilter(g)}
                                    className={cn(
                                        "whitespace-nowrap px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full font-black transition-all border shrink-0",
                                        "text-[11px] sm:text-xs", // clamp(11px, 3vw, 14px) style manual implementation via tailwind
                                        gradeFilter === g 
                                            ? "bg-gray-900 text-white border-gray-900 shadow-lg shadow-gray-200" 
                                            : "bg-white text-gray-500 border-gray-100 hover:border-gray-300"
                                    )}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {DOMAINS.map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDomainFilter(d)}
                                    className={cn(
                                        "whitespace-nowrap px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full font-black transition-all border shrink-0",
                                        "text-[11px] sm:text-xs",
                                        domainFilter === d 
                                            ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100" 
                                            : "bg-white text-gray-500 border-gray-100 hover:border-gray-300"
                                    )}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto" onClick={() => setShowRecent(false)}>
                <div className="px-4 py-6 w-full box-border">
                    {isLoading ? (
                        <div className="flex flex-col gap-3">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="h-[88px] bg-white rounded-2xl animate-pulse border border-gray-50" />
                            ))}
                        </div>
                    ) : filteredPosts.length > 0 ? (
                        <div className="flex flex-col gap-3 w-full">
                            <div className="flex items-center justify-between px-1 mb-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <span>{domainFilter} • {gradeFilter}</span>
                                <span>{filteredPosts.length}개 항목</span>
                            </div>
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
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                                <span className="text-3xl">📭</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">아직 등록된 도구 없음</h3>
                            <p className="text-gray-400 text-sm mb-6 max-w-[200px] leading-relaxed mx-auto">
                                새로운 도구를 첫 번째로 등록해보세요!
                            </p>
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
