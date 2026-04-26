import React, { useEffect } from 'react';
import { Home, Search, Edit3, User, BookOpen, ShieldCheck, LogOut, Lock } from 'lucide-react';
import { cn, initAudio, playTabSwitchSound } from '@/lib/utils';

export function Layout({ children, currentTab, isAdmin, onLoginClick, onLogoutClick, onChangeTab }: { 
    children: React.ReactNode, 
    currentTab: string, 
    isAdmin?: boolean,
    onLoginClick?: () => void,
    onLogoutClick?: () => void,
    onChangeTab: (tab: string) => void 
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
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight leading-none text-gray-900">수다방</h1>
                        <p className="text-[11px] font-bold text-gray-500 mt-1">수학 수업 도구 모음</p>
                    </div>
                </div>
                <nav className="flex-1 space-y-1">
                    {navItems.map(item => (
                        <button 
                            key={item.id}
                            onClick={() => handleTabClick(item.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-semibold text-left",
                                currentTab === item.id ? "bg-gray-50 text-[#1C1C1E]" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                            )}>
                            <item.icon className="w-6 h-6" />
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* Admin Status Section */}
                <div className="pt-6 border-t border-gray-100">
                    {isAdmin ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-xl">
                                <ShieldCheck className="w-4 h-4" />
                                <span className="text-xs font-bold">관리자 모드</span>
                            </div>
                            <button 
                                onClick={onLogoutClick}
                                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-semibold text-left"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="text-sm">로그아웃</span>
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={onLoginClick}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-all font-semibold text-left"
                        >
                            <Lock className="w-5 h-5" />
                            <span className="text-sm">관리자 로그인</span>
                        </button>
                    )}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 lg:ml-64 pb-24 lg:pb-0 min-h-screen border-r border-transparent lg:border-[#E5E5EA] w-full min-w-0 bg-[#FBFBFD] relative flex justify-center">
                {children}
            </main>

            {/* Right empty space for desktop */}
            <div className="hidden xl:block flex-1 p-6 bg-white shrink-0">
                 {/* Empty space or future widgets */}
            </div>

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
