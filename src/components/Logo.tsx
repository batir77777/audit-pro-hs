import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showFullText?: boolean;
}

export default function Logo({ className, size = 'md', showFullText = true }: LogoProps) {
  const sizes = {
    sm: { container: 'px-2 py-1 rounded-sm', sitk: 'text-lg', text: 'text-[6px]' },
    md: { container: 'px-3 py-1.5 rounded-sm', sitk: 'text-2xl', text: 'text-[8px]' },
    lg: { container: 'px-5 py-3 rounded-sm', sitk: 'text-4xl', text: 'text-[12px]' },
  };

  const currentSize = sizes[size];

  return (
    <div className={cn(
      "flex flex-col items-center justify-center bg-sitk-yellow text-sitk-black font-black select-none ring-1 ring-sitk-black/10 shadow-sm", 
      currentSize.container, 
      className
    )}>
      <div className={cn("leading-none tracking-tighter uppercase italic", currentSize.sitk)}>
        SITK
      </div>
      {showFullText && (
        <div className={cn("mt-0.5 font-black uppercase tracking-[0.2em] border-t border-sitk-black/10 pt-0.5", currentSize.text)}>
          Safety is the Key
        </div>
      )}
    </div>
  );
}
