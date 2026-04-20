import React from 'react';
import { FileText, FileDown, Printer, Save, Send, Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportToPDF, exportToWord, printReport, makeReportFileName } from '@/lib/exportUtils';
import { useBranding } from '@/lib/brandingContext';
import { cn } from '@/lib/utils';
import type { PhotoAttachment } from '@/types';

interface ExportButtonsProps {
  elementId: string;
  reportTitle: string;
  formData: any;
  photos?: PhotoAttachment[];
  reportId?: string;
  reportType?: string;
  reportLocation?: string;
  reportDate?: string;
  onSave?: (status: 'Draft' | 'Submitted') => void;
  isSubmitting?: boolean;
  className?: string;
  showSaveActions?: boolean;
}

export default function ExportButtons({ 
  elementId, 
  reportTitle, 
  formData,
  photos,
  reportId,
  reportType,
  reportLocation,
  reportDate,
  onSave, 
  isSubmitting = false,
  className,
  showSaveActions = true
}: ExportButtonsProps) {
  const [isShared, setIsShared] = React.useState(false);
  const { branding } = useBranding();
  const fileName = makeReportFileName({
    type: reportType || reportTitle,
    location: reportLocation || formData?.location || formData?.exactLocation || '',
    date: reportDate || formData?.date || new Date().toISOString().split('T')[0],
  });

  const handleShare = () => {
    if (!reportId) return;
    const shareUrl = `${window.location.origin}/share/${reportId}`;
    navigator.clipboard.writeText(shareUrl);
    setIsShared(true);
    setTimeout(() => setIsShared(false), 2000);
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-4 export-hide", className)}>
      {showSaveActions && onSave && (
        <>
          <Button 
            variant="outline"
            onClick={() => onSave('Draft')}
            disabled={isSubmitting}
            className="h-12 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest border-2 border-slate-100 hover:bg-slate-50 transition-all"
          >
            <Save className="w-4 h-4 mr-2" /> Save Draft
          </Button>
          <Button 
            onClick={() => onSave('Submitted')}
            disabled={isSubmitting}
            className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest bg-sitk-black text-white hover:bg-slate-800 shadow-lg shadow-sitk-black/10 transition-all"
          >
            {isSubmitting ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Send className="w-4 h-4 mr-2" /> Submit</>
            )}
          </Button>
        </>
      )}

      <div className="h-8 w-px bg-slate-100 mx-2 hidden sm:block" />

      <Button 
        variant="outline"
        onClick={() => exportToPDF(elementId, fileName, branding)}
        className="h-12 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest border-2 border-slate-100 hover:bg-sitk-yellow hover:border-sitk-yellow transition-all"
      >
        <FileText className="w-4 h-4 mr-2" /> PDF
      </Button>

      <Button 
        variant="outline"
        onClick={() => exportToWord(reportTitle, { ...formData, photos: photos ?? [] }, fileName, branding)}
        className="h-12 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest border-2 border-slate-100 hover:bg-sitk-yellow hover:border-sitk-yellow transition-all"
      >
        <FileDown className="w-4 h-4 mr-2" /> Word
      </Button>

      <Button 
        variant="outline"
        onClick={printReport}
        className="h-12 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest border-2 border-slate-100 hover:bg-sitk-yellow hover:border-sitk-yellow transition-all"
      >
        <Printer className="w-4 h-4 mr-2" /> Print
      </Button>

      {reportId && (
        <Button 
          variant="outline"
          onClick={handleShare}
          className={cn(
            "h-12 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest border-2 transition-all",
            isShared 
              ? "bg-green-500 border-green-500 text-white hover:bg-green-600 hover:border-green-600" 
              : "border-slate-100 hover:bg-sitk-yellow hover:border-sitk-yellow"
          )}
        >
          {isShared ? (
            <><Check className="w-4 h-4 mr-2" /> Copied</>
          ) : (
            <><Share2 className="w-4 h-4 mr-2" /> Share</>
          )}
        </Button>
      )}
    </div>
  );
}
