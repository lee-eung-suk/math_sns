import React, { useState } from 'react';
import { Domain, Grade, createPost, supabase } from '@/api';
import { cn, playUploadSound } from '@/lib/utils';
import { Link as LinkIcon, Sparkles, X, Check } from 'lucide-react';

export function PostWritePage({ onSuccess, onCancel }: { onSuccess: () => void; onCancel?: () => void }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [url, setUrl] = useState('');
    const [selectedDomains, setSelectedDomains] = useState<Domain[]>([]);
    const [selectedGrades, setSelectedGrades] = useState<Grade[]>([]);
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    
    const DOMAINS: Domain[] = ['수와 연산', '변화와 관계', '도형과 측정', '자료와 가능성', '기타'];
    const GRADES: Grade[] = ['1학년', '2학년', '3학년', '4학년', '5학년', '6학년', '공통'];

    const toggleDomain = (d: Domain) => {
        setSelectedDomains(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
    };

    const toggleGrade = (g: Grade) => {
        setSelectedGrades(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
    };

    const generateThumbnail = async () => {
        if (!title.trim() && !url.trim()) return;
        setIsGenerating(true);
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 600;
            canvas.height = 400;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const domain = selectedDomains[0] || '기타';
            let gradients = ['#3b82f6', '#1d4ed8']; 
            let emoji = '🔢';
            if (domain === '수와 연산') { gradients = ['#f97316', '#c2410c']; emoji = '🔢'; }
            if (domain === '변화와 관계') { gradients = ['#10b981', '#047857']; emoji = '📈'; }
            if (domain === '도형과 측정') { gradients = ['#a855f7', '#7e22ce']; emoji = '📐'; }
            if (domain === '자료와 가능성') { gradients = ['#3b82f6', '#1d4ed8']; emoji = '📊'; }

            const grd = ctx.createLinearGradient(0, 0, 600, 400);
            grd.addColorStop(0, gradients[0]);
            grd.addColorStop(1, gradients[1]);
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, 600, 400);

            ctx.font = '80px Noto Sans KR';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emoji, 300, 120);

            ctx.font = 'bold 42px "Noto Sans KR", sans-serif';
            ctx.fillStyle = '#FFFFFF';
            
            const words = (title || url).split(' ');
            let line = '';
            let y = 240;
            for(let n = 0; n < words.length; n++) {
                let testLine = line + words[n] + ' ';
                let testWidth = ctx.measureText(testLine).width;
                if (testWidth > 500 && n > 0) {
                    ctx.fillText(line, 300, y);
                    line = words[n] + ' ';
                    y += 60;
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line, 300, y);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setThumbnailUrl(dataUrl);

            if (supabase) {
                const res = await fetch(dataUrl);
                const blob = await res.blob();
                const fileName = `thumb_${Date.now()}.jpg`;
                const { error } = await supabase.storage.from('thumbnails').upload(fileName, blob);
                if (!error) {
                    const { data } = supabase.storage.from('thumbnails').getPublicUrl(fileName);
                    setThumbnailUrl(data.publicUrl);
                }
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const fetchMetadata = async () => {
        if (!url || !url.startsWith('http')) return;
        // In a real app, you'd use a server proxy. Here we mock it based on common URLs for demo.
        if (url.includes('geogebra')) {
            setTitle('지오지브라 수업 도구');
            setContent('인터랙티브 기하/수학 학습 도구입니다.');
        } else if (url.includes('desmos')) {
            setTitle('데스모스 공학용 계산기');
            setContent('수식 입력과 그래프 생성이 편리한 웹 도구입니다.');
        }
    };

    const handleSubmit = async () => {
        if (!title.trim() || !url.trim() || selectedDomains.length === 0 || selectedGrades.length === 0) return;
        setIsUploading(true);
        await createPost({
            title,
            content,
            url,
            domains: selectedDomains,
            grades: selectedGrades,
            thumbnail_url: thumbnailUrl || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400'
        });
        playUploadSound();
        setIsUploading(false);
        onSuccess();
    };

    return (
        <div className="flex flex-col h-full bg-[#FBFBFD] overflow-y-auto">
            <div className="max-w-2xl mx-auto w-full p-6 md:p-10">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-[#1C1C1E]">수업 도구 공유하기</h1>
                    {onCancel && (
                        <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    )}
                </div>
            
                <div className="space-y-8 bg-white p-8 rounded-3xl card-border shadow-sm">
                    {/* URL Input */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-500 ml-1 flex items-center gap-2">
                            <LinkIcon className="w-4 h-4" /> 도구 링크
                        </label>
                        <div className="flex gap-2">
                            <input 
                                type="url" 
                                placeholder="https://..."
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                onBlur={fetchMetadata}
                                className="flex-1 bg-gray-50 border border-[#E5E5EA] rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm"
                            />
                        </div>
                    </div>

                    {/* Title & Content */}
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-500 ml-1">도구 제목</label>
                            <input 
                                type="text" 
                                placeholder="매력적인 제목을 입력하세요"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-transparent border-b border-[#E5E5EA] px-2 py-3 text-xl font-bold focus:border-black focus:outline-none transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-500 ml-1">간단 설명</label>
                            <textarea 
                                placeholder="선생님들께 이 도구의 활용팁을 알려주세요 (최대 280자)"
                                value={content}
                                maxLength={280}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full bg-gray-50 border border-[#E5E5EA] rounded-2xl p-4 text-lg resize-none min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-gray-500 ml-1">수학 영역 (다중 선택)</label>
                            <div className="flex flex-wrap gap-2">
                                {DOMAINS.map(d => (
                                    <button
                                        key={d}
                                        onClick={() => toggleDomain(d)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border",
                                            selectedDomains.includes(d) ? "bg-black text-white border-black" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                                        )}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-gray-500 ml-1">대상 학년 (다중 선택)</label>
                            <div className="flex flex-wrap gap-2">
                                {GRADES.map(g => (
                                    <button
                                        key={g}
                                        onClick={() => toggleGrade(g)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border",
                                            selectedGrades.includes(g) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                                        )}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Thumbnail */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-500 ml-1">썸네일 이미지</label>
                        {thumbnailUrl ? (
                            <div className="relative rounded-2xl overflow-hidden border border-[#E5E5EA] shadow-inner group">
                                <img src={thumbnailUrl} alt="Thumbnail Prep" className="w-full aspect-video object-cover" />
                                <button 
                                    onClick={generateThumbnail}
                                    className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Sparkles className="w-4 h-4" /> 다시 생성
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={generateThumbnail}
                                disabled={isGenerating || (!title.trim() && !url.trim())}
                                className="w-full aspect-video flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#E5E5EA] rounded-2xl text-gray-400 hover:bg-gray-50 hover:text-blue-500 hover:border-blue-200 transition-all disabled:opacity-50"
                            >
                                <Sparkles className="w-8 h-8" />
                                <span className="font-bold">{isGenerating ? "생성 중..." : "AI 썸네일 자동 생성"}</span>
                                <span className="text-xs text-gray-300">제목/url 기반으로 디자인됩니다</span>
                            </button>
                        )}
                    </div>

                    {/* Submit */}
                    <button 
                        onClick={handleSubmit}
                        disabled={isUploading || !title.trim() || !url.trim() || selectedDomains.length === 0}
                        className="w-full bg-[#1C1C1E] text-white font-bold text-lg py-5 rounded-2xl hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-xl shadow-black/10 flex items-center justify-center gap-3"
                    >
                        {isUploading ? "업로드 중..." : (
                            <>
                                <Check className="w-5 h-5" />
                                수학 도구 공유하기
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
