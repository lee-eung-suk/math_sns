import React from 'react';
import { Domain, Grade } from '@/api';
import { cn } from '@/lib/utils';

type TagType = Domain | Grade;

export function TagBadge({ tag, className }: { tag: TagType; className?: string }) {
    const domainColors: Record<string, string> = {
        '수와 연산': 'bg-orange-50 text-orange-600 border-orange-100',
        '변화와 관계': 'bg-green-50 text-green-600 border-green-100',
        '도형과 측정': 'bg-purple-50 text-purple-600 border-purple-100',
        '자료와 가능성': 'bg-blue-50 text-blue-600 border-blue-100',
        '기타': 'bg-gray-50 text-gray-500 border-gray-100',
    };

    const isGrade = tag.includes('학년') || tag === '공통';
    const colorClass = isGrade 
        ? 'bg-gray-100 text-gray-600 border-transparent' 
        : (domainColors[tag] || 'bg-gray-50 text-gray-500');

    return (
        <span className={cn(
            "px-2 py-0.5 text-[11px] font-semibold rounded-md border transition-all",
            colorClass, 
            className
        )}>
            {tag}
        </span>
    );
}
