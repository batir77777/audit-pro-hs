import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  to: string;
  className?: string;
}

export default function ActionCard({ title, description, icon: Icon, to, className }: ActionCardProps) {
  return (
    <Link to={to} className="block group">
      <Card className={cn(
        "relative overflow-hidden border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06),0_0_0_0_transparent] transition-[transform,box-shadow,border-color] duration-250 ease-out",
        "hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-[0_6px_18px_rgba(15,23,42,0.09),0_0_0_1px_rgba(251,191,36,0.14)] active:translate-y-0",
        className
      )}>
        <div className="absolute top-0 right-0 h-28 w-28 rounded-full -mr-12 -mt-12 bg-gradient-to-br from-amber-100/50 via-amber-50/20 to-transparent transition-transform duration-400 ease-out group-hover:scale-110 pointer-events-none" />
        <CardContent className="relative p-5 md:p-6 flex flex-col h-full gap-0">
          {/* Icon + title row */}
          <div className="flex items-start gap-3.5 mb-3.5">
            <div className="bg-amber-50 ring-1 ring-amber-300/80 p-2.5 rounded-xl shrink-0 group-hover:bg-amber-100 transition-colors duration-250 ease-out mt-0.5">
              <Icon className="w-[18px] h-[18px] text-amber-800" strokeWidth={2.2} />
            </div>
            <h3 className="text-base md:text-[17px] font-black tracking-tight text-slate-900 leading-snug pt-1">
              {title}
            </h3>
          </div>
          {/* Description */}
          <p className="text-[13px] text-slate-400 font-normal leading-relaxed mb-5 flex-grow pl-[calc(2.5rem+0.875rem)]">
            {description}
          </p>
          {/* CTA button */}
          <div className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 ring-1 ring-amber-300/30 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.12em] text-white shadow-sm transition-[background-color,box-shadow,color,transform] duration-250 ease-out group-hover:bg-amber-500 group-hover:text-slate-950 group-hover:shadow-[0_3px_10px_rgba(245,158,11,0.26)] group-hover:-translate-y-px active:scale-[0.98]">
            Start Now <ArrowRight className="ml-2 w-3.5 h-3.5 transition-transform duration-250 ease-out group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
