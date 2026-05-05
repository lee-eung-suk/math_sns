import React, { useEffect } from 'react';
import { Home, Search, Edit3, User, BookOpen, ShieldCheck, LogOut, Lock, Sun, Moon } from 'lucide-react';
import { cn, initAudio, playTabSwitchSound } from '@/lib/utils';

export function Layout({ children, currentTab, isAdmin, isDarkMode, onToggleDarkMode, onLoginClick, onLogoutClick, onChangeTab, rightPanel }: { 
    children: React.ReactNode, 
    currentTab: string, 
    isAdmin?: boolean,
    isDarkMode?: boolean,
    onToggleDarkMode?: () => void,
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
        <div className="min-h-screen bg-white dark:bg-black text-[#1C1C1E] dark:text-gray-100 font-sans flex flex-col lg:flex-row transition-colors duration-300">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-64 border-r border-[#E5E5EA] dark:border-gray-800 p-6 fixed h-full bg-white dark:bg-black z-10 space-y-8">
                <div className="flex flex-col gap-1 py-2">
                    <div onClick={() => handleTabClick('home')} className="cursor-pointer group flex w-max items-center gap-1.5 sm:gap-2 transition-transform hover:scale-[1.02]">
                        <span className="font-black font-serif text-[38px] text-[#111] dark:text-white leading-none">
                            M
                        </span>
                        <div className="flex flex-col justify-center text-[14px] font-semibold tracking-[0.08em] leading-[1.1] text-gray-600 dark:text-gray-400">
                            <span>ATH</span>
                            <span>CAFE</span>
                        </div>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-[#9ca3af] font-normal leading-[1.4] mt-0.5 break-keep break-words whitespace-normal max-w-[160px] cursor-default" style={{ wordBreak: 'keep-all', overflowWrap: 'break-word' }}>
                        ©경상북도교육청 창의융합 교사연구회 수(數)다방
                    </p>
                </div>
                <nav className="flex-1 space-y-2">
                    {navItems.map(item => (
                        <button 
                            key={item.id}
                            onClick={() => handleTabClick(item.id)}
                            className={cn(
                                "w-full flex items-center gap-4 px-4 py-3.5 rounded-full transition-all font-black text-left group",
                                currentTab === item.id 
                                    ? "text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900" 
                                    : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white"
                            )}>
                            <item.icon className={cn("w-7 h-7", currentTab === item.id ? "text-blue-600" : "text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white")} strokeWidth={currentTab === item.id ? 2.5 : 2} />
                            <span className="text-lg">{item.label}</span>
                        </button>
                    ))}
                    
                    {isAdmin ? (
                        <button 
                            onClick={onLogoutClick}
                            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all font-black text-left group"
                        >
                            <LogOut className="w-7 h-7" />
                            <span className="text-lg">로그아웃</span>
                        </button>
                    ) : (
                        <button 
                            onClick={onLoginClick}
                            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white transition-all font-black text-left group"
                        >
                            <Lock className="w-7 h-7" />
                            <span className="text-lg">관리자</span>
                        </button>
                    )}

                    {/* Dark Mode Toggle Desktop */}
                    <button 
                        onClick={onToggleDarkMode}
                        className="w-full flex items-center gap-4 px-4 py-3.5 rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white transition-all font-black text-left group"
                    >
                        {isDarkMode ? <Sun className="w-7 h-7 text-yellow-500" /> : <Moon className="w-7 h-7" />}
                        <span className="text-lg">{isDarkMode ? '라이트 모드' : '다크 모드'}</span>
                    </button>
                </nav>

                {/* Profile Snapshot Style (Admin only for now) */}
                {isAdmin && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black">A</div>
                         <div className="flex flex-col min-w-0">
                            <span className="text-sm font-black truncate dark:text-white">관리자</span>
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">관리자 인증됨</span>
                         </div>
                    </div>
                )}
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 lg:ml-64 pb-24 lg:pb-0 min-h-screen border-r border-[#E5E5EA] dark:border-gray-800 w-full min-w-0 bg-white dark:bg-black relative flex justify-center transition-colors duration-300">
                <div className="w-full lg:max-w-[700px] flex flex-col border-r border-[#E5E5EA] dark:border-gray-800">
                    {/* Mobile Brand Area */}
                    <div className="lg:hidden w-full flex flex-col py-6 px-4 border-b border-[#E5E5EA] dark:border-gray-800">
                        <div className="flex flex-col items-start gap-1">
                            <div onClick={() => handleTabClick('home')} className="flex w-max items-center gap-1.5 cursor-pointer transition-transform hover:scale-[1.02]">
                                <span className="font-black font-serif text-[28px] text-[#111] dark:text-white leading-none">
                                    M
                                </span>
                                <div className="flex flex-col justify-center text-[11px] font-semibold tracking-[0.08em] leading-[1.1] text-gray-600 dark:text-gray-400">
                                    <span>ATH</span>
                                    <span>CAFE</span>
                                </div>
                            </div>
                            <p className="text-[9.5px] text-[#9ca3af] font-normal leading-[1.4] break-keep break-words whitespace-normal cursor-default" style={{ wordBreak: 'keep-all', overflowWrap: 'break-word' }}>
                                ©경상북도교육청 창의융합 교사연구회 수(數)다방
                            </p>
                        </div>
                    </div>
                    {children}
                </div>
                
                {/* Right Panel (Desktop) */}
                <aside className="hidden xl:flex flex-col w-[350px] p-4 bg-white dark:bg-black sticky top-0 h-screen overflow-y-auto space-y-4">
                    {rightPanel ? rightPanel : (
                        <>
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4">
                                <h2 className="text-lg font-black mb-4 dark:text-white">현재 인기 도구</h2>
                                <div className="space-y-4 text-xs text-gray-400 font-bold">
                                    도구를 탐색해보세요!
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4">
                                <h2 className="text-lg font-black mb-4 dark:text-white">추천 키워드</h2>
                                <div className="flex flex-wrap gap-2">
                                    {['도형', '연산', '6학년', '측정', '게임'].map(tag => (
                                        <span key={tag} className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full text-xs font-bold text-blue-600 dark:text-blue-400">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                    
                    <footer className="px-4 text-[11px] text-gray-400 font-bold leading-relaxed">
                        ©경상북도교육청 창의융합 교사연구회 수(數)다방
                    </footer>
                </aside>
            </main>

            {/* Mobile Bottom Tab Bar */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-t border-[#E5E5EA] dark:border-gray-800 flex justify-around p-2 pb-[env(safe-area-inset-bottom)] z-50 h-[64px] sm:h-[72px] transition-colors duration-300">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => handleTabClick(item.id)}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 flex-1 transition-colors min-h-[44px]",
                            currentTab === item.id ? "text-blue-600" : "text-gray-400 dark:text-gray-500"
                        )}
                    >
                        <item.icon className="w-6 h-6" strokeWidth={currentTab === item.id ? 2.5 : 2} />
                        <span className="text-[10px] font-black tracking-tight">{item.label}</span>
                    </button>
                ))}
                <button
                    onClick={onToggleDarkMode}
                    className="flex flex-col items-center justify-center gap-1 flex-1 transition-colors min-h-[44px] text-gray-400 dark:text-gray-500"
                >
                    {isDarkMode ? <Sun className="w-6 h-6 text-yellow-500" /> : <Moon className="w-6 h-6" />}
                    <span className="text-[10px] font-black tracking-tight">테마</span>
                </button>
            </nav>
        </div>
    );
}
