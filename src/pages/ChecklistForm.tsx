import React from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { 
  ClipboardCheck, 
  Save, 
  Send, 
  ChevronLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  MessageSquare,
  MapPin,
  Calendar,
  User,
  Info,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { mockUser, saveReport } from '@/lib/mockData';
import { exportSavedReportToPDF } from '@/lib/exportUtils';
import { DEFAULT_BRANDING } from '@/lib/brandingContext';
import { getSession } from '@/lib/auth';
import { useAutoSave, getAutoSavedData } from '@/lib/useAutoSave';
import { usePhotoStore } from '@/lib/usePhotoStore';
import PhotoUpload from '@/components/PhotoUpload';
import { CHECKLIST_TEMPLATES } from '@/lib/checklistTemplates';
import { ChecklistAnswer, ChecklistItem } from '@/types';
import { motion } from 'motion/react';
import SectionHeader from '@/components/SectionHeader';

export default function ChecklistForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const editId = (location.state as any)?.editId as string | undefined;
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('templateId') || 'temp-site-safety';
  const template = CHECKLIST_TEMPLATES.find(t => t.id === templateId) || CHECKLIST_TEMPLATES[0];

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    location: '',
    date: new Date().toISOString().split('T')[0],
    personCompleting: (getSession()?.name ?? ''),
    items: template.items.map(item => ({
      id: item.id,
      question: item.question,
      answer: undefined as ChecklistAnswer | undefined,
      comment: ''
    })) as ChecklistItem[],
    executiveSummary: ''
  });

  const handleAnswerChange = (itemId: string, answer: ChecklistAnswer) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId ? { ...item, answer } : item
      )
    }));
  };

  const handleCommentChange = (itemId: string, comment: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId ? { ...item, comment } : item
      )
    }));
  };

  const { photos, updatePhotos, clearPhotos } = usePhotoStore('checklist');
  const { clearAutoSave } = useAutoSave('checklist', formData);
  React.useEffect(() => {
    const saved = getAutoSavedData<any>('checklist'); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (saved) setFormData(prev => ({ ...prev, ...saved }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (status: 'Draft' | 'Submitted') => {
    clearAutoSave();
    setIsSubmitting(true);

    try {
      const report = {
        ...formData,
        id: editId ?? `r${Date.now()}`,
        title: `${template.title} - ${formData.date}`,
        type: template.title as any,
        templateId: template.id,
        status,
        date: formData.date,
        authorId: mockUser.id,
        description: formData.executiveSummary || template.title,
        photos,
      };

      saveReport(report as any);
      clearPhotos();

      if (status === 'Submitted') {
        try {
          await exportSavedReportToPDF(report, DEFAULT_BRANDING);
        } catch (pdfErr) {
          console.error('[ChecklistForm] PDF generation failed:', pdfErr);
        }
      }

      navigate('/my-reports');
    } catch (err) {
      console.error('[ChecklistForm] Save failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const allAnswered = formData.items.every(item => item.answer !== undefined);

  return (
    <div className="space-y-8 md:space-y-9 pb-24 md:pb-12 max-w-[1200px] mx-auto px-2 sm:px-3 lg:px-4 form-page">
      <div className="sticky top-2 md:top-3 z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 rounded-xl border border-slate-200/80 bg-white/95 backdrop-blur px-3 py-2 shadow-sm form-action-row">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 h-9"
        >
          <ChevronLeft className="mr-2 h-3 w-3" />
          Back
        </Button>
        <div className="flex w-full sm:w-auto gap-2 sm:justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleSave('Draft')} 
            disabled={isSubmitting}
            className="flex-1 sm:flex-none font-black uppercase text-[10px] tracking-widest bg-white border border-slate-200 shadow-sm h-9"
          >
            <Save className="mr-2 h-3 w-3" />
            Save Draft
          </Button>
          <Button 
            size="sm" 
            className="flex-1 sm:flex-none bg-sitk-black text-white hover:bg-slate-800 font-black uppercase text-[10px] tracking-widest shadow-sm h-9" 
            onClick={() => handleSave('Submitted')} 
            disabled={isSubmitting || !allAnswered}
          >
            <Send className="mr-2 h-3 w-3" />
            Submit
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-slate-500 font-black uppercase text-[10px] tracking-[0.16em]">
          <ClipboardCheck className="w-3 h-3" /> Checklist Module
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-tight">
          {template.title}
        </h2>
        <p className="text-slate-500 font-medium text-[10px] uppercase tracking-[0.12em]">Safety is the Key Ltd | {template.category}</p>
      </div>

      {/* Header Info */}
      <Card className="border border-slate-300/80 shadow-[0_6px_18px_rgba(15,23,42,0.06)] rounded-2xl overflow-hidden bg-white form-section-block">
        <CardContent className="p-5 md:p-7 space-y-6 md:space-y-7">
          <SectionHeader title="Basic Information" icon={Info} description="Site and completion details" className="mb-0" />
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Location / Site</Label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  className="pl-12 py-6 bg-white border-slate-300 shadow-sm focus-visible:border-sitk-yellow focus-visible:ring-sitk-yellow/35" 
                  value={formData.location} 
                  onChange={e => setFormData({...formData, location: e.target.value})} 
                  placeholder="e.g. Manchester Site A"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Date</Label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  type="date" 
                  className="pl-12 py-6 bg-white border-slate-300 shadow-sm focus-visible:border-sitk-yellow focus-visible:ring-sitk-yellow/35 font-mono"
                  value={formData.date} 
                  onChange={e => setFormData({...formData, date: e.target.value})} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Completed By</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  className="pl-12 py-6 bg-white border-slate-300 shadow-sm focus-visible:border-sitk-yellow focus-visible:ring-sitk-yellow/35 font-bold"
                  value={formData.personCompleting}
                  onChange={e => setFormData({...formData, personCompleting: e.target.value})}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist Items */}
      <div className="space-y-4 form-section-block">
        <SectionHeader title="Checklist Items" icon={ClipboardCheck} description="Complete all items below" className="px-2" />
        {formData.items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={cn(
              "check-item-card border border-slate-300/80 shadow-[0_4px_14px_rgba(15,23,42,0.06)] transition-all rounded-2xl overflow-hidden bg-white",
              item.answer === 'No' ? "ring-1 ring-red-200 bg-red-50/30" : "bg-white"
            )}>
              <CardContent className="p-4 md:p-6 space-y-4 md:space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                  <div className="flex gap-3 md:gap-4 flex-1">
                    <span className="check-item-index w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400 shrink-0">
                      {index + 1}
                    </span>
                    <p className="check-item-question font-bold text-slate-900 leading-tight pt-1">{item.question}</p>
                  </div>
                  
                  <RadioGroup 
                    value={item.answer} 
                    onValueChange={(val) => handleAnswerChange(item.id, val as ChecklistAnswer)}
                    className="check-answer-group flex items-center flex-wrap justify-between sm:justify-start gap-1.5 bg-slate-100/70 p-1.5 rounded-xl w-full sm:w-fit"
                  >
                    <div className="flex items-center">
                      <RadioGroupItem value="Yes" id={`yes-${item.id}`} className="sr-only" />
                      <Label 
                        htmlFor={`yes-${item.id}`}
                        className={cn(
                          "check-answer-chip px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all",
                          item.answer === 'Yes' ? "bg-green-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-200"
                        )}
                      >
                        Yes
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <RadioGroupItem value="No" id={`no-${item.id}`} className="sr-only" />
                      <Label 
                        htmlFor={`no-${item.id}`}
                        className={cn(
                          "check-answer-chip px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all",
                          item.answer === 'No' ? "bg-red-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-200"
                        )}
                      >
                        No
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <RadioGroupItem value="N/A" id={`na-${item.id}`} className="sr-only" />
                      <Label 
                        htmlFor={`na-${item.id}`}
                        className={cn(
                          "check-answer-chip px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all",
                          item.answer === 'N/A' ? "bg-slate-400 text-white shadow-md" : "text-slate-500 hover:bg-slate-200"
                        )}
                      >
                        N/A
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="relative">
                  <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    className="pl-12 py-6 bg-white border-slate-300 shadow-sm focus-visible:border-sitk-yellow focus-visible:ring-sitk-yellow/35 text-sm" 
                    placeholder="Add comments or details..." 
                    value={item.comment}
                    onChange={e => handleCommentChange(item.id, e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Overall Comments */}
      <Card className="border border-slate-300/80 shadow-[0_6px_18px_rgba(15,23,42,0.06)] rounded-2xl overflow-hidden bg-white form-section-block">
        <CardContent className="p-5 md:p-7 space-y-5 md:space-y-6">
          <SectionHeader title="Executive Summary" icon={FileText} description="Overall comments and professional assessment observations" className="mb-0" />
          <Textarea 
            placeholder="Enter the executive summary — key findings, actions required, and overall assessment..." 
            className="min-h-[120px] bg-white border-slate-300 shadow-sm focus-visible:border-sitk-yellow focus-visible:ring-sitk-yellow/35 p-4"
            value={formData.executiveSummary}
            onChange={e => setFormData({...formData, executiveSummary: e.target.value})}
          />
        </CardContent>
      </Card>

      {/* Photos Section */}
      <div className="rounded-2xl border border-slate-300/80 bg-white p-5 md:p-6 shadow-[0_4px_14px_rgba(15,23,42,0.06)] space-y-4 md:space-y-5">
        <PhotoUpload photos={photos} onPhotosChange={updatePhotos} />
      </div>

      {/* Final Action */}
      <div className="pt-8">
        {!allAnswered && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 mb-6 text-red-600"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Please answer all questions</span>
          </motion.div>
        )}
        <Button 
          className="w-full bg-sitk-black text-white hover:bg-slate-800 font-black uppercase text-[10px] tracking-[0.2em] py-8 rounded-2xl shadow-xl transition-all hover:-translate-y-1 active:translate-y-0"
          onClick={() => handleSave('Submitted')}
          disabled={isSubmitting || !allAnswered}
        >
          {isSubmitting ? "Submitting..." : "Complete Checklist"}
        </Button>
      </div>
    </div>
  );
}
