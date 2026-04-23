import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  icon: LucideIcon;
  description?: string;
  className?: string;
}

export default function SectionHeader({ title, icon: Icon, description, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start sm:items-center gap-3 sm:gap-4 mb-5 sm:mb-6", className)}>
      <div className="bg-sitk-yellow p-2 rounded-xl text-sitk-black shadow-sm ring-1 ring-sitk-black/5 shrink-0">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      <div className="flex flex-col">
        <h3 className="text-[1.1rem] sm:text-[1.28rem] font-black tracking-tight leading-tight text-slate-900 mb-1">{title}</h3>
        {description && <p className="text-[12px] sm:text-[13px] text-slate-400 font-normal leading-relaxed">{description}</p>}
      </div>
    </div>
  );
}
