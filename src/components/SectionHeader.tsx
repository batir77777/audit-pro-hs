import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  icon: LucideIcon;
  description?: string;
  className?: string;
}

function normalizeSectionTitle(title: string): string {
  const withoutPrefix = title
    .replace(/^Section\s+\d+\s*:\s*/i, '')
    .replace(/^\d+\s*[.)-:]\s*/, '')
    .trim();

  if (/^tick controls? measures in place$/i.test(withoutPrefix)) {
    return 'Select Control Measures in Place';
  }

  return withoutPrefix;
}

export default function SectionHeader({ title, icon: Icon, description, className }: SectionHeaderProps) {
  const normalizedTitle = normalizeSectionTitle(title);

  return (
    <div data-slot="section-header" className={cn("flex items-start sm:items-center gap-3 sm:gap-4 mb-5 sm:mb-6 rounded-2xl border border-slate-200/80 bg-white/95 px-3 py-3 sm:px-4", className)}>
      <div className="bg-sitk-yellow p-2 rounded-xl text-sitk-black shadow-sm ring-1 ring-sitk-black/10 shrink-0">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      <div className="flex min-w-0 flex-col">
        <h3 data-slot="section-header-title" className="text-[1.1rem] sm:text-[1.28rem] font-black tracking-tight leading-tight text-slate-900 mb-1">{normalizedTitle}</h3>
        {description && <p data-slot="section-header-description" className="text-[12px] sm:text-[13px] text-slate-600 font-medium leading-relaxed">{description}</p>}
      </div>
    </div>
  );
}
