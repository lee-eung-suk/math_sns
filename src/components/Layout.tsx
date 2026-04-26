import React, { useEffect } from 'react';
import { Home, Search, Edit3, User, BookOpen, ShieldCheck, LogOut, Lock } from 'lucide-react';
import { cn, initAudio, playTabSwitchSound } from '@/lib/utils';

export function Layout({ children, currentTab, isAdmin, onLoginClick, onLogoutClick, onChangeTab, rightPanel }: { 
    children: React.ReactNode, 
    currentTab: string, 
    isAdmin?: boolean,
    onLoginClick?: () => void,
    onLogoutClick?: () => void,
    onChangeTab: (tab: string) => void,
    rightPanel?: React.ReactNode
}) {
    
    // Initialize audio on first user click
    useEffect(() => {
        const handleFirstClick = () => {
            initAudio();
            document.removeEventListener('click', handleFirstClick);
        };
        document.addEventListener('click', handleFirstClick);
        return () => document.removeEventListener('click', handleFirstClick);
    }, []);

    const handleTabClick = (tab: string) => {
        if (tab !== currentTab) {
            playTabSwitchSound();
            onChangeTab(tab);
        }
    };

    const navItems = [
        { id: 'home', label: '홈', icon: Home },
        { id: 'search', label: '검색', icon: Search },
        { id: 'write', label: '작성', icon: Edit3 },
    ];

    return (
        <div className="min-h-screen bg-white text-[#1C1C1E] font-sans flex flex-col lg:flex-row">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-64 border-r border-[#E5E5EA] p-6 fixed h-full bg-white z-10 space-y-8">
                <div onClick={() => handleTabClick('home')} className="flex items-center gap-2 cursor-pointer group">
                    <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105">
                        <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight leading-none text-gray-900">수다방</h1>
                        <p className="text-[11px] font-bold text-gray-500 mt-1">수학 도구 모음</p>
                    </div>
                </div>
                <nav className="flex-1 space-y-2">
                    {navItems.map(item => (
                        <button 
                            key={item.id}
                            onClick={() => handleTabClick(item.id)}
                            className={cn(
                                "w-full flex items-center gap-4 px-4 py-3.5 rounded-full transition-all font-black text-left group",
                                currentTab === item.id ? "text-gray-900 bg-gray-50" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                            )}>
                            <item.icon className={cn("w-7 h-7", currentTab === item.id ? "text-blue-600" : "text-gray-500 group-hover:text-gray-900")} strokeWidth={currentTab === item.id ? 2.5 : 2} />
                            <span className="text-lg">{item.label}</span>
                        </button>
                    ))}
                    
                    {isAdmin ? (
                        <button 
                            onClick={onLogoutClick}
                            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-full text-red-500 hover:bg-red-50 transition-all font-black text-left group"
                        >
                            <LogOut className="w-7 h-7" />
                            <span className="text-lg">로그아웃</span>
                        </button>
                    ) : (
                        <button 
                            onClick={onLoginClick}
                            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-full text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-all font-black text-left group"
                        >
                            <Lock className="w-7 h-7" />
                            <span className="text-lg">관리자</span>
                        </button>
                    )}
                </nav>

                {/* Profile Snapshot Style (Admin only for now) */}
                {isAdmin && (
                    <div className="p-3 bg-blue-50 rounded-2xl flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black">A</div>
                         <div className="flex flex-col min-w-0">
                            <span className="text-sm font-black truncate">관리자</span>
                            <span className="text-[10px] font-bold text-blue-600">관리자 인증됨</span>
                         </div>
                    </div>
                )}
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 lg:ml-64 pb-24 lg:pb-0 min-h-screen border-r border-[#E5E5EA] w-full min-w-0 bg-white relative flex justify-center">
                <div className="w-full lg:max-w-[700px] flex flex-col border-r border-[#E5E5EA]">
                    {children}
                </div>
                
                {/* Right Panel (Desktop) */}
                <aside className="hidden xl:flex flex-col w-[350px] p-4 bg-white sticky top-0 h-screen overflow-y-auto space-y-4">
                    {rightPanel ? rightPanel : (
                        <>
                            <div className="bg-gray-50 rounded-2xl p-4">
                                <h2 className="text-lg font-black mb-4">현재 인기 도구</h2>
                                <div className="space-y-4 text-xs text-gray-400 font-bold">
                                    도구를 탐색해보세요!
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-2xl p-4">
                                <h2 className="text-lg font-black mb-4">추천 키워드</h2>
                                <div className="flex flex-wrap gap-2">
                                    {['도형', '연산', '6학년', '측정', '게임'].map(tag => (
                                        <span key={tag} className="px-3 py-1 bg-white border border-gray-100 rounded-full text-xs font-bold text-blue-600">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                    
                    <footer className="px-4 text-[11px] text-gray-400 font-bold leading-relaxed">
                        © 2026 수다방 (Sudabang)
                    </footer>
                </aside>
            </main>

            {/* Mobile Bottom Tab Bar */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-[#E5E5EA] flex justify-around p-2 pb-[env(safe-area-inset-bottom)] z-50 h-[64px] sm:h-[72px]">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => handleTabClick(item.id)}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 flex-1 transition-colors min-h-[44px]",
                            currentTab === item.id ? "text-blue-600" : "text-gray-400"
                        )}
                    >
                        <item.icon className="w-6 h-6" strokeWidth={currentTab === item.id ? 2.5 : 2} />
                        <span className="text-[10px] font-black tracking-tight">{item.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
}
