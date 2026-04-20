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
        "border-none shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative",
        "hover:-translate-y-1 active:translate-y-0",
        className
      )}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-sitk-yellow/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500" />
        <CardContent className="p-6 flex flex-col h-full">
          <div className="bg-sitk-yellow/10 p-3 rounded-2xl w-fit mb-4 group-hover:bg-sitk-yellow transition-colors duration-300">
            <Icon className="w-6 h-6 text-sitk-black" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tighter mb-2 group-hover:text-sitk-black transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed mb-6 flex-grow">
            {description}
          </p>
          <div className="flex items-center text-xs font-black uppercase tracking-widest text-sitk-black/40 group-hover:text-sitk-black transition-colors">
            Start Now <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
