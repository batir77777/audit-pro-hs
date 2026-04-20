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
    <div className={cn("flex items-center gap-4 mb-6", className)}>
      <div className="bg-sitk-yellow p-2.5 rounded-xl text-sitk-black shadow-sm ring-1 ring-sitk-black/5">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex flex-col">
        <h3 className="text-lg font-black uppercase tracking-tight leading-none mb-1">{title}</h3>
        {description && <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{description}</p>}
      </div>
    </div>
  );
}
