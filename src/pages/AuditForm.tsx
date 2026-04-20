import React from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Save, 
  Send, 
  ChevronLeft,
  MapPin,
  Calendar,
  User,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Percent,
  Info,
  FileText,
  ShieldCheck
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
import { AUDIT_TEMPLATES } from '@/lib/auditTemplates';
import { ChecklistAnswer, AuditSection, AuditItem } from '@/types';
import { motion, AnimatePresence } from 'motion/react';
import SectionHeader from '@/components/SectionHeader';

export default function AuditForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const editId = (location.state as any)?.editId as string | undefined;
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('templateId') || 'audit-monthly-safety';
  const template = AUDIT_TEMPLATES.find(t => t.id === templateId) || AUDIT_TEMPLATES[0];

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>(
    template.sections.reduce((acc, sec) => ({ ...acc, [sec.id]: true }), {})
  );

  const [formData, setFormData] = React.useState({
    location: '',
    date: new Date().toISOString().split('T')[0],
    auditor: (getSession()?.name ?? ''),
    sections: template.sections.map(sec => ({
      id: sec.id,
      title: sec.title,
      items: sec.questions.map(q => ({
        id: q.id,
        question: q.question,
        answer: undefined as ChecklistAnswer | undefined,
        comment: ''
      })) as AuditItem[]
    })) as AuditSection[],
    executiveSummary: ''
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const handleAnswerChange = (sectionId: string, itemId: string, answer: ChecklistAnswer) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(sec => 
        sec.id === sectionId 
          ? { 
              ...sec, 
              items: sec.items.map(item => item.id === itemId ? { ...item, answer } : item) 
            } 
          : sec
      )
    }));
  };

  const handleCommentChange = (sectionId: string, itemId: string, comment: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(sec => 
        sec.id === sectionId 
          ? { 
              ...sec, 
              items: sec.items.map(item => item.id === itemId ? { ...item, comment } : item) 
            } 
          : sec
      )
    }));
  };

  const calculateSectionScore = (section: AuditSection) => {
    const answeredItems = section.items.filter(item => item.answer && item.answer !== 'N/A');
    if (answeredItems.length === 0) return 0;
    const yesCount = answeredItems.filter(item => item.answer === 'Yes').length;
    return Math.round((yesCount / answeredItems.length) * 100);
  };

  const calculateOverallScore = () => {
    const allItems = formData.sections.flatMap(sec => sec.items);
    const answeredItems = allItems.filter(item => item.answer && item.answer !== 'N/A');
    if (answeredItems.length === 0) return 0;
    const yesCount = answeredItems.filter(item => item.answer === 'Yes').length;
    return Math.round((yesCount / answeredItems.length) * 100);
  };

  const { photos, updatePhotos, clearPhotos } = usePhotoStore('audit');
  const { clearAutoSave } = useAutoSave('audit', formData);
  React.useEffect(() => {
    const saved = getAutoSavedData<any>('audit'); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (saved) setFormData(saved);
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
        overallScore: calculateOverallScore(),
        photos,
      };

      saveReport(report as any);
      clearPhotos();

      if (status === 'Submitted') {
        try {
          await exportSavedReportToPDF(report, DEFAULT_BRANDING);
        } catch (pdfErr) {
          console.error('[AuditForm] PDF generation failed:', pdfErr);
        }
      }

      navigate('/my-reports');
    } catch (err) {
      console.error('[AuditForm] Save failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const allAnswered = formData.sections.every(sec => 
    sec.items.every(item => item.answer !== undefined)
  );

  const overallScore = calculateOverallScore();

  return (
    <div className="space-y-8 pb-24 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="font-black uppercase text-[10px] tracking-widest hover:bg-slate-100"
        >
          <ChevronLeft className="mr-2 h-3 w-3" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleSave('Draft')} 
            disabled={isSubmitting}
            className="font-black uppercase text-[10px] tracking-widest bg-white border-none shadow-sm"
          >
            <Save className="mr-2 h-3 w-3" />
            Save Draft
          </Button>
          <Button 
            size="sm" 
            className="bg-sitk-black text-white hover:bg-slate-800 font-black uppercase text-[10px] tracking-widest shadow-md" 
            onClick={() => handleSave('Submitted')} 
            disabled={isSubmitting || !allAnswered}
          >
            <Send className="mr-2 h-3 w-3" />
            Submit Audit
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sitk-black/40 font-black uppercase text-[10px] tracking-[0.2em]">
            <BarChart3 className="w-3 h-3" /> Audit Module
          </div>
          <h2 className="text-3xl font-black tracking-tighter uppercase text-slate-900 leading-none">
            {template.title}
          </h2>
          <p className="text-muted-foreground font-medium text-[10px] uppercase tracking-widest">Safety is the Key Ltd | {template.category}</p>
        </div>
        <div className="bg-sitk-black text-sitk-yellow px-8 py-4 rounded-2xl flex flex-col items-center shadow-xl border-2 border-sitk-yellow/20">
          <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Overall Score</span>
          <span className="text-4xl font-black">{overallScore}%</span>
        </div>
      </div>

      {/* Audit Meta */}
      <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-8 space-y-8">
          <SectionHeader title="Audit Information" icon={Info} description="Site and auditor details" className="mb-0" />
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Audit Site</Label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  className="pl-12 py-6 bg-slate-50 border-none focus-visible:ring-sitk-yellow" 
                  value={formData.location} 
                  onChange={e => setFormData({...formData, location: e.target.value})} 
                  placeholder="e.g. Birmingham Hub"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Audit Date</Label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  type="date" 
                  className="pl-12 py-6 bg-slate-50 border-none focus-visible:ring-sitk-yellow font-mono"
                  value={formData.date} 
                  onChange={e => setFormData({...formData, date: e.target.value})} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Auditor</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input className="pl-12 py-6 bg-slate-100 border-none font-bold" value={formData.auditor} disabled />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Sections */}
      <div className="space-y-6">
        {formData.sections.map((section) => {
          const sectionScore = calculateSectionScore(section);
          const isExpanded = expandedSections[section.id];
          
          return (
            <div key={section.id} className="space-y-4">
              <div 
                className="flex items-center justify-between bg-white p-6 rounded-2xl cursor-pointer hover:bg-slate-50 transition-all shadow-sm group border border-slate-100"
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shadow-sm transition-colors",
                    sectionScore >= 90 ? "bg-green-100 text-green-700" : 
                    sectionScore >= 75 ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                  )}>
                    {sectionScore}%
                  </div>
                  <div>
                    <h3 className="font-black uppercase tracking-tight text-slate-900 group-hover:text-sitk-black transition-colors">{section.title}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{section.items.length} Questions</p>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-300" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-4 px-2"
                  >
                    {section.items.map((item, idx) => (
                      <Card key={item.id} className={cn(
                        "border-none shadow-sm transition-all rounded-2xl overflow-hidden",
                        item.answer === 'No' ? "ring-1 ring-red-200 bg-red-50/30" : "bg-white"
                      )}>
                        <CardContent className="p-6 space-y-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex gap-4 flex-1">
                              <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400 shrink-0">
                                {idx + 1}
                              </span>
                              <p className="font-bold text-slate-900 leading-tight pt-1">{item.question}</p>
                            </div>
                            
                            <RadioGroup 
                              value={item.answer} 
                              onValueChange={(val) => handleAnswerChange(section.id, item.id, val as ChecklistAnswer)}
                              className="flex items-center gap-2 bg-slate-100/50 p-1 rounded-xl w-fit"
                            >
                              {['Yes', 'No', 'N/A'].map((opt) => (
                                <div key={opt} className="flex items-center">
                                  <RadioGroupItem value={opt} id={`${section.id}-${item.id}-${opt}`} className="sr-only" />
                                  <Label 
                                    htmlFor={`${section.id}-${item.id}-${opt}`}
                                    className={cn(
                                      "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all",
                                      item.answer === opt 
                                        ? (opt === 'Yes' ? "bg-green-600 text-white shadow-md" : opt === 'No' ? "bg-red-600 text-white shadow-md" : "bg-slate-400 text-white shadow-md")
                                        : "text-slate-500 hover:bg-slate-200"
                                    )}
                                  >
                                    {opt}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>

                          <div className="relative">
                            <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                              className="pl-12 py-6 bg-slate-50 border-none focus-visible:ring-sitk-yellow text-sm" 
                              placeholder="Auditor comments..." 
                              value={item.comment}
                              onChange={e => handleCommentChange(section.id, item.id, e.target.value)}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Overall Comments */}
      <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-8 space-y-6">
          <SectionHeader title="Executive Summary" icon={FileText} description="Overall audit findings and professional assessment — completed by the assessor" className="mb-0" />
          <Textarea 
            placeholder="Enter the executive summary — key findings, compliance level rationale, recommendations, and actions required..." 
            className="min-h-[160px] bg-slate-50 border-none focus-visible:ring-sitk-yellow p-4"
            value={formData.executiveSummary}
            onChange={e => setFormData({...formData, executiveSummary: e.target.value})}
          />
        </CardContent>
      </Card>

      {/* Score Summary Card */}
      <Card className="bg-sitk-black text-white border-none shadow-xl overflow-hidden rounded-3xl">
        <div className="bg-sitk-yellow h-2 w-full" />
        <CardContent className="p-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <ShieldCheck className="w-8 h-8 text-sitk-yellow" />
              <h4 className="text-3xl font-black uppercase tracking-tighter">Audit Completion</h4>
            </div>
            <p className="text-sitk-yellow/80 font-medium text-sm max-w-md">
              {allAnswered ? "All sections complete. Your compliance score has been calculated based on your responses." : "Please complete all sections to calculate final score and compliance level."}
            </p>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-black uppercase tracking-widest text-sitk-yellow mb-1">Compliance Level</p>
              <p className="text-2xl font-black">{overallScore >= 90 ? "EXCELLENT" : overallScore >= 75 ? "GOOD" : "ACTION REQUIRED"}</p>
            </div>
            <div className="w-32 h-32 rounded-full border-8 border-sitk-yellow/20 flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full border-8 border-sitk-yellow border-t-transparent -rotate-45" />
              <span className="text-4xl font-black">{overallScore}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photos Section */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
        <PhotoUpload photos={photos} onPhotosChange={updatePhotos} />
      </div>

      <div className="pt-8">
        <Button 
          className="w-full bg-sitk-black text-white hover:bg-slate-800 font-black uppercase text-[10px] tracking-[0.2em] py-8 rounded-2xl shadow-xl transition-all hover:-translate-y-1 active:translate-y-0"
          onClick={() => handleSave('Submitted')}
          disabled={isSubmitting || !allAnswered}
        >
          {isSubmitting ? "Submitting Audit..." : "Finalise Audit Report"}
        </Button>
      </div>
    </div>
  );
}
