import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

type ActionCardVariant = 'amber' | 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'teal';

const variantStyles: Record<ActionCardVariant, { blob: string; iconBg: string; iconRing: string; iconText: string; iconHover: string; borderHover: string }> = {
  amber:  { blob: 'from-amber-100/50 via-amber-50/20',   iconBg: 'bg-amber-50',  iconRing: 'ring-amber-300/80',  iconText: 'text-amber-800',  iconHover: 'group-hover:bg-amber-100',  borderHover: 'hover:border-amber-300'  },
  blue:   { blob: 'from-blue-100/50 via-blue-50/20',     iconBg: 'bg-blue-50',   iconRing: 'ring-blue-300/80',   iconText: 'text-blue-800',   iconHover: 'group-hover:bg-blue-100',   borderHover: 'hover:border-blue-300'   },
  green:  { blob: 'from-green-100/50 via-green-50/20',   iconBg: 'bg-green-50',  iconRing: 'ring-green-300/80',  iconText: 'text-green-800',  iconHover: 'group-hover:bg-green-100',  borderHover: 'hover:border-green-300'  },
  orange: { blob: 'from-orange-100/50 via-orange-50/20', iconBg: 'bg-orange-50', iconRing: 'ring-orange-300/80', iconText: 'text-orange-800', iconHover: 'group-hover:bg-orange-100', borderHover: 'hover:border-orange-300' },
  red:    { blob: 'from-red-100/50 via-red-50/20',       iconBg: 'bg-red-50',    iconRing: 'ring-red-300/80',    iconText: 'text-red-800',    iconHover: 'group-hover:bg-red-100',    borderHover: 'hover:border-red-300'    },
  purple: { blob: 'from-purple-100/50 via-purple-50/20', iconBg: 'bg-purple-50', iconRing: 'ring-purple-300/80', iconText: 'text-purple-800', iconHover: 'group-hover:bg-purple-100', borderHover: 'hover:border-purple-300' },
  teal:   { blob: 'from-teal-100/50 via-teal-50/20',     iconBg: 'bg-teal-50',   iconRing: 'ring-teal-300/80',   iconText: 'text-teal-800',   iconHover: 'group-hover:bg-teal-100',   borderHover: 'hover:border-teal-300'   },
};

interface ActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  to: string;
  className?: string;
  variant?: ActionCardVariant;
}

export default function ActionCard({ title, description, icon: Icon, to, className, variant = 'amber' }: ActionCardProps) {
  const v = variantStyles[variant];
  return (
    <Link to={to} className="block group">
      <Card className={cn(
        "relative overflow-hidden border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06),0_0_0_0_transparent] transition-[transform,box-shadow,border-color] duration-250 ease-out",
        "hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(15,23,42,0.09)] active:translate-y-0",
        v.borderHover,
        className
      )}>
        <div className={cn("absolute top-0 right-0 h-28 w-28 rounded-full -mr-12 -mt-12 bg-gradient-to-br to-transparent transition-transform duration-400 ease-out group-hover:scale-110 pointer-events-none", v.blob)} />
        <CardContent className="relative p-5 md:p-6 flex flex-col h-full gap-0">
          {/* Icon + title row */}
          <div className="flex items-start gap-3.5 mb-3.5">
            <div className={cn("ring-1 p-2.5 rounded-xl shrink-0 transition-colors duration-250 ease-out mt-0.5", v.iconBg, v.iconRing, v.iconHover)}>
              <Icon className={cn("w-[18px] h-[18px]", v.iconText)} strokeWidth={2.2} />
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
