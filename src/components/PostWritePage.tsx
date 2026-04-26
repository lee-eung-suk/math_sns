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

            const bgColors = [
                ['#F9FAFB', '#F3F4F6'], // Subtle gray (default)
                ['#EFF6FF', '#DBEAFE'], // Blue
                ['#ECFDF5', '#D1FAE5'], // Emerald
                ['#FDF4FF', '#FAE8FF'], // Fuchsia
                ['#FFFBEB', '#FEF3C7']  // Amber
            ];
            
            const domain = selectedDomains[0] || '기타';
            let gradients = bgColors[0]; 
            let emoji = '🔢';
            let accentColor = '#3B82F6';
            if (domain === '수와 연산') { gradients = bgColors[4]; emoji = '🔢'; accentColor = '#F59E0B'; }
            if (domain === '변화와 관계') { gradients = bgColors[2]; emoji = '📈'; accentColor = '#10B981'; }
            if (domain === '도형과 측정') { gradients = bgColors[3]; emoji = '📐'; accentColor = '#D946EF'; }
            if (domain === '자료와 가능성') { gradients = bgColors[1]; emoji = '📊'; accentColor = '#3B82F6'; }

            const grd = ctx.createLinearGradient(0, 0, 600, 400);
            grd.addColorStop(0, gradients[0]);
            grd.addColorStop(1, gradients[1]);
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, 600, 400);

            // Draw decorative element (soft colored circle behind emoji)
            ctx.beginPath();
            ctx.arc(300, 100, 60, 0, 2 * Math.PI);
            ctx.fillStyle = accentColor + '20'; // 20 hex opacity
            ctx.fill();

            // Emoji
            ctx.font = '64px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emoji, 300, 105);

            // Title
            ctx.font = 'bold 56px "Pretendard", "Noto Sans KR", sans-serif';
            ctx.fillStyle = '#111827';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.05)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetY = 4;
            
            const displayTitle = title.trim() || url.replace(/^https?:\/\//, '').split('/')[0] || '수업 도구';
            const words = displayTitle.split(' ');
            let line = '';
            let y = 240;
            const lines = [];
            
            // Calculate lines
            ctx.shadowColor = 'transparent'; // Turn off shadow just for measuring
            for(let n = 0; n < words.length; n++) {
                let testLine = line + words[n] + ' ';
                let testWidth = ctx.measureText(testLine).width;
                if (testWidth > 520 && n > 0) {
                    lines.push(line.trim());
                    line = words[n] + ' ';
                } else {
                    line = testLine;
                }
            }
            lines.push(line.trim());

            ctx.shadowColor = 'rgba(0, 0, 0, 0.08)'; // Turn on shadow for drawing
            
            // Limit to 2 lines
            const linesToDraw = lines.slice(0, 2);
            // If it was more than 2, add ellipsis
            if (lines.length > 2) {
                linesToDraw[1] = linesToDraw[1] + '...';
            }

            // Adjust starting Y to center text block
            const lineHeight = 70;
            const textBlockHeight = linesToDraw.length * lineHeight;
            let startY = 250 - (textBlockHeight / 4);

            linesToDraw.forEach((l, i) => {
                ctx.fillText(l, 300, startY + (i * lineHeight));
            });

            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            setThumbnailUrl(dataUrl);

            // Supabase object storage uploading is failing or not needed immediately 
            // since we can just use the Data URL directly for the DB in a real MVP,
            // but we'll keep the logic if supabase is defined and try to upload.
            // If it fails, we just keep the dataUrl.
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
        } catch(error) {
            console.error('Thumbnail generation failed', error);
            setThumbnailUrl('https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400');
        } finally {
            setIsGenerating(false);
        }
    };

    const fetchMetadata = async () => {
        if (!url || !url.startsWith('http')) return;
        
        let newTitle = title;
        if (url.includes('geogebra')) {
            newTitle = title || '지오지브라 수업 도구';
            setTitle(newTitle);
            if(!content) setContent('인터랙티브 기하/수학 학습 도구입니다.');
        } else if (url.includes('desmos')) {
            newTitle = title || '데스모스 공학용 계산기';
            setTitle(newTitle);
            if(!content) setContent('수식 입력과 그래프 생성이 편리한 웹 도구입니다.');
        } else if (!title) {
            newTitle = url.replace(/^https?:\/\//, '').split('/')[0];
            setTitle(newTitle);
        }
        
        if (!thumbnailUrl) {
            // Give it a tiny delay to ensure state updates
            setTimeout(generateThumbnail, 100);
        }
    };

    const handleSubmit = async () => {
        if (!url.trim()) return;
        setIsUploading(true);
        try {
            await createPost({
                title: title.trim() || url.replace(/^https?:\/\//, '').split('/')[0] || '유용한 수업 도구',
                content: content.trim() || '',
                url: url.trim(),
                domains: selectedDomains.length > 0 ? selectedDomains : ['기타'],
                grades: selectedGrades.length > 0 ? selectedGrades : ['공통'],
                thumbnail_url: thumbnailUrl || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400'
            });
            playUploadSound();
            onSuccess();
        } catch(error: any) {
            console.error(error);
            alert(`업로드에 실패했습니다. (원인: ${error.message})`);
        } finally {
            setIsUploading(false);
        }
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
                        disabled={isUploading || !url.trim()}
                        className={cn(
                            "w-full text-white font-bold text-lg py-5 rounded-2xl transition-all flex items-center justify-center gap-3",
                            (!url.trim() || isUploading) ? "bg-gray-300 cursor-not-allowed shadow-none text-white/80" : "bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/30"
                        )}
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
