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
    <div className={cn("flex items-center gap-3 mb-6", className)}>
      <Icon className="w-5 h-5 text-sitk-yellow shrink-0" />
      <div className="flex flex-col">
        <h3 className="text-lg font-black uppercase tracking-tight leading-none mb-1">{title}</h3>
        {description && <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{description}</p>}
      </div>
    </div>
  );
}
