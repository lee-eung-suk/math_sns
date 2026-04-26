import React, { useState } from 'react';
import { Post, Domain, Grade, createPost, updatePost, supabase } from '@/api';
import { cn, playUploadSound } from '@/lib/utils';
import { Link as LinkIcon, Sparkles, X, Check } from 'lucide-react';

export function PostWritePage({ onSuccess, onCancel, initialData }: { 
    onSuccess: () => void; 
    onCancel?: () => void;
    initialData?: Post;
}) {
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [url, setUrl] = useState(initialData?.url || '');
    const [selectedCategories, setSelectedCategories] = useState<Domain[]>(initialData?.categories || []);
    const [selectedGrades, setSelectedGrades] = useState<Grade[]>(initialData?.grades || []);
    const [thumbnail, setThumbnail] = useState(initialData?.thumbnail || '');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    
    const DOMAINS: Domain[] = ['수와 연산', '변화와 관계', '도형과 측정', '자료와 가능성', '기타'];
    const GRADES: Grade[] = ['1학년', '2학년', '3학년', '4학년', '5학년', '6학년', '공통'];

    const toggleDomain = (d: Domain) => {
        setSelectedCategories(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
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
            
            const domain = selectedCategories[0] || '기타';
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

            // Draw decorative element (soft colored circle behind emoji to add depth)
            ctx.beginPath();
            ctx.arc(300, 200, 120, 0, 2 * Math.PI);
            ctx.fillStyle = accentColor + '10'; // Soft accent
            ctx.fill();

            // Large Iconic Emoji in center
            ctx.font = '160px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.04)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 10;
            ctx.fillText(emoji, 300, 200);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            setThumbnail(dataUrl);

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
                    setThumbnail(data.publicUrl);
                }
            }
        } catch(error) {
            console.error('Thumbnail generation failed', error);
            setThumbnail('https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400');
        } finally {
            setIsGenerating(false);
        }
    };

    const fetchMetadata = async () => {
        if (!url || !url.startsWith('http')) return;
        
        // Remove auto-title generation to force user input
        
        if (!thumbnail) {
            // Give it a tiny delay to ensure state updates
            setTimeout(generateThumbnail, 100);
        }
    };

    const handleSubmit = async () => {
        if (!url.trim()) return;
        if (!title.trim()) {
            alert('도구 제목을 반드시 입력해주세요');
            return;
        }
        setIsUploading(true);
        try {
            const postData = {
                title: title.trim(),
                description: description.trim() || '',
                url: url.trim(),
                categories: selectedCategories.length > 0 ? selectedCategories : ['기타'],
                grades: selectedGrades.length > 0 ? selectedGrades : ['공통'],
                thumbnail: thumbnail || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400'
            };

            if (initialData) {
                await updatePost(initialData.id, postData);
                alert('수정되었습니다');
            } else {
                await createPost(postData);
                playUploadSound();
                alert('도구가 성공적으로 저장되었습니다!');
            }
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
                    <h1 className="text-2xl font-bold text-[#1C1C1E]">
                        {initialData ? '수업 도구 수정하기' : '수업 도구 공유하기'}
                    </h1>
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
                            <label className="text-sm font-bold text-gray-500 ml-1">
                                도구 제목 <span className="text-red-500">*필수</span>
                            </label>
                            <input 
                                type="text" 
                                placeholder="도구 제목을 반드시 입력해주세요"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className={cn(
                                    "w-full bg-transparent border-b px-2 py-3 text-xl font-bold focus:outline-none transition-colors",
                                    title.trim().length === 0 ? "border-red-200 focus:border-red-500" : "border-[#E5E5EA] focus:border-black"
                                )}
                            />
                            {title.trim().length === 0 && (
                                <p className="text-xs text-red-500 font-medium ml-1">도구 제목은 무조건 입력자가 입력하도록 해야 합니다.</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-500 ml-1">간단 설명</label>
                            <textarea 
                                placeholder="선생님들께 이 도구의 활용팁을 알려주세요 (최대 280자)"
                                value={description}
                                maxLength={280}
                                onChange={(e) => setDescription(e.target.value)}
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
                                            selectedCategories.includes(d) ? "bg-black text-white border-black" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
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
                        {thumbnail ? (
                            <div className="relative rounded-2xl overflow-hidden border border-[#E5E5EA] shadow-inner group">
                                <img src={thumbnail} alt="Thumbnail Prep" className="w-full aspect-video object-cover" />
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
                        disabled={isUploading || !url.trim() || !title.trim()}
                        className={cn(
                            "w-full text-white font-bold text-lg py-5 rounded-2xl transition-all flex items-center justify-center gap-3",
                            (!url.trim() || !title.trim() || isUploading) ? "bg-gray-300 cursor-not-allowed shadow-none text-white/80" : "bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/30"
                        )}
                    >
                        {isUploading ? "처리 중..." : (
                            <>
                                <Check className="w-5 h-5" />
                                {initialData ? "수정 완료하기" : "수학 도구 공유하기"}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
