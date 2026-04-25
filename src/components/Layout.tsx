import React, { useEffect } from 'react';
import { Home, Search, Edit3, User, BookOpen } from 'lucide-react';
import { cn, initAudio, playTabSwitchSound } from '@/lib/utils';

export function Layout({ children, currentTab, onChangeTab }: { children: React.ReactNode, currentTab: string, onChangeTab: (tab: string) => void }) {
    
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
        { id: 'profile', label: '프로필', icon: User },
    ];

    return (
        <div className="min-h-screen bg-white text-[#1C1C1E] font-sans flex flex-col md:flex-row">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 border-r border-[#E5E5EA] p-6 fixed h-full bg-white z-10 space-y-8">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight leading-none italic">응석쌤</h1>
                        <p className="text-[10px] font-bold text-gray-400 mt-0.5">초등 수학 수업 도구</p>
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
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 md:ml-64 pb-20 md:pb-0 min-h-screen border-r border-transparent lg:border-[#E5E5EA] max-w-[800px] w-full bg-[#FBFBFD]">
                {children}
            </main>

            {/* Right empty space for ultra-wide, to keep 2-column look balanced */}
            <div className="hidden lg:block flex-1 max-w-[350px] p-6 bg-white">
                 {/* Can put trending subjects here in the future */}
            </div>

            {/* Mobile Bottom Tab Bar */}
            <nav className="md:hidden fixed bottom-0 w-full bg-white/80 backdrop-blur-md border-t border-[#E5E5EA] flex justify-around p-2 pb-safe z-50">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => handleTabClick(item.id)}
                        className={cn(
                            "flex flex-col items-center gap-1 p-2 w-16 transition-colors",
                            currentTab === item.id ? "text-black" : "text-gray-400"
                        )}
                    >
                        <item.icon className="w-6 h-6" strokeWidth={currentTab === item.id ? 2.5 : 2} />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
}
