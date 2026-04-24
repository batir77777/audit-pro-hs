import { Badge } from '@/components/ui/badge';
import { ReportStatus } from '@/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: ReportStatus;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants: Record<ReportStatus, string> = {
    'Draft': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'Submitted': 'bg-blue-50 text-blue-600 border-blue-100',
    'Completed': 'bg-green-50 text-green-600 border-green-100',
      'Deleted': 'bg-slate-50 text-slate-400 border-slate-200',
    };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-black uppercase text-[10px] tracking-widest px-2 py-0.5 rounded-sm", 
        variants[status], 
        className
      )}
    >
      {status}
    </Badge>
  );
}
