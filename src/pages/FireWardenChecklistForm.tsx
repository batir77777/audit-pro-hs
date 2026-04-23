import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, 
  User, 
  Building2, 
  Calendar, 
  ClipboardCheck, 
  Plus, 
  Save, 
  Send, 
  ChevronLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  FileText,
  Info
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { cn } from '../lib/utils';
import { mockUser, saveReport } from '../lib/mockData';
import { exportSavedReportToPDF } from '../lib/exportUtils';
import { DEFAULT_BRANDING } from '../lib/brandingContext';
import { getSession } from '../lib/auth';
import { useAutoSave, getAutoSavedData } from '../lib/useAutoSave';
import { usePhotoStore } from '../lib/usePhotoStore';
import PhotoUpload from '../components/PhotoUpload';
import { FireWardenChecklistReport, ReportStatus, FireWardenChecklistItem, CorrectiveAction } from '../types';
import StatusBadge from '../components/StatusBadge';
import SectionHeader from '../components/SectionHeader';

const SECTION_A_ITEMS = [
  'Are fire escape routes clear and well-signed?',
  'Are fire extinguishers in place and in date?',
  'Are all fire signs and Notices in good condition?',
  'Are all fire doors in good condition and working?',
  'Is rubbish removed regularly to prevent build-up?',
  'Do electrical equipment plugs look undamaged?',
  'Are all Fire Warden names displayed correctly?',
  'Is the Fire Logbook up to date with any changes?',
  'Are emergency lights, smoke alarms and the Fire Alarm professionally maintained under contract?',
  'Are there any new or obvious fire hazards?',
  'Ensure all staff receive a 6 monthly fire briefing.',
  'Can the fire alarm be heard in all work areas?',
  'Ensure a 6 monthly fire evacuation drill occurs.'
];

const RequiredLabel = ({ children, required, htmlFor, className }: { children: React.ReactNode, required?: boolean, htmlFor?: string, className?: string }) => (
  <Label 
    htmlFor={htmlFor} 
    className={cn(
      "text-[11px] font-black text-slate-500 uppercase tracking-[0.15em] ml-1 mb-2 block", 
      className
    )}
  >
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </Label>
);

const ErrorMessage = ({ message }: { message?: string }) => (
  message ? (
    <motion.p 
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-[10px] font-bold text-red-500 mt-1.5 ml-1 flex items-center gap-1.5"
    >
      <AlertCircle className="w-3 h-3" />
      {message}
    </motion.p>
  ) : null
);

export default function FireWardenChecklistForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const editId = (location.state as any)?.editId as string | undefined;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [reportId, setReportId] = useState<string | null>(editId ?? null);
  const [currentStatus, setCurrentStatus] = useState<ReportStatus>('Draft');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    premise: '',
    date: new Date().toISOString().split('T')[0],
    completedBy: (getSession()?.name ?? ''),
    sectionA: SECTION_A_ITEMS.map((item, index) => ({
      id: `item-${index}`,
      question: item,
      answer: undefined as 'Yes' | 'No' | undefined
    })),
    sectionB: {
      correctiveActionSatisfactory: undefined as 'Yes' | 'No' | undefined,
      notes: ''
    },
    correctiveActionLog: [] as CorrectiveAction[],
    executiveSummary: ''
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const updateChecklist = (id: string, answer: 'Yes' | 'No') => {
    setFormData(prev => ({
      ...prev,
      sectionA: prev.sectionA.map(item => 
        item.id === id ? { ...item, answer } : item
      )
    }));
    
    // Clear section A error when an item is answered
    if (errors.sectionA) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.sectionA;
        return newErrors;
      });
    }
  };

  const addAction = () => {
    const newAction: CorrectiveAction = {
      id: `action-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      actionRequired: '',
      dateCompleted: ''
    };
    setFormData(prev => ({
      ...prev,
      correctiveActionLog: [...prev.correctiveActionLog, newAction]
    }));
  };

  const removeAction = (id: string) => {
    setFormData(prev => ({
      ...prev,
      correctiveActionLog: prev.correctiveActionLog.filter(a => a.id !== id)
    }));
  };

  const updateAction = (id: string, field: keyof CorrectiveAction, value: string) => {
    setFormData(prev => ({
      ...prev,
      correctiveActionLog: prev.correctiveActionLog.map(a => 
        a.id === id ? { ...a, [field]: value } : a
      )
    }));

    // Clear specific action error
    const errorKey = `action-${id}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    // Section 1 Validation
    if (!formData.premise.trim()) newErrors.premise = 'Please enter the premise address';
    if (!formData.date) newErrors.date = 'Please select the inspection date';
    if (!formData.completedBy.trim()) newErrors.completedBy = 'Please enter who completed the check';
    
    // Section A Validation
    const unanswered = formData.sectionA.filter(item => !item.answer);
    if (unanswered.length > 0) {
      newErrors.sectionA = `Section A incomplete: ${unanswered.length} items remaining`;
    }

    // Section B Validation
    if (!formData.sectionB.correctiveActionSatisfactory) {
      newErrors.sectionB = 'Please confirm if previous actions were satisfactory';
    }

    // Corrective Action Log Validation
    formData.correctiveActionLog.forEach((action) => {
      if (!action.actionRequired.trim()) {
        newErrors[`action-${action.id}`] = 'Please describe the required action';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { photos, updatePhotos, clearPhotos } = usePhotoStore('fire_warden');
  const { clearAutoSave } = useAutoSave('fire_warden', formData);
  React.useEffect(() => {
    const saved = getAutoSavedData<any>('fire_warden'); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (saved) setFormData(saved);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (status: ReportStatus) => {
    if (status === 'Submitted' && !validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    clearAutoSave();
    setIsSubmitting(true);
    setCurrentStatus(status);

    const newId = reportId || `FWC-${Date.now()}`;
    if (!reportId) setReportId(newId);

    const report: FireWardenChecklistReport = {
      id: newId,
      title: `Fire Warden Checklist - ${formData.premise || 'New'} (${formData.date})`,
      type: 'Fire Warden Checklist',
      status,
      location: formData.premise || 'Not Specified',
      date: formData.date,
      authorId: mockUser.id,
      description: `Monthly fire warden check completed by ${formData.completedBy}.`,
      photos,
      ...formData
    };

    try {
      saveReport(report);
      clearPhotos();

      if (status === 'Submitted') {
        try {
          await exportSavedReportToPDF(report, DEFAULT_BRANDING);
        } catch (pdfErr) {
          console.error('[FireWardenChecklistForm] PDF generation failed:', pdfErr);
        }
      }

      navigate('/my-reports');
    } catch (error) {
      console.error('Error saving report:', error);
      setErrors({ submit: 'Failed to save report. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 md:space-y-10 pb-24 md:pb-12 px-1 sm:px-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div className="space-y-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/fire-safety')}
            className="group -ml-2 text-slate-400 hover:text-sitk-black transition-colors font-black uppercase text-[10px] tracking-[0.3em]"
          >
            <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Fire Safety
          </Button>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-1 w-12 bg-sitk-yellow rounded-full" />
              <p className="text-[10px] font-black text-sitk-yellow uppercase tracking-[0.5em]">Safety Protocol</p>
            </div>
            <h1 className="text-6xl sm:text-7xl font-black text-slate-900 tracking-tight leading-[0.85] uppercase">
              Fire Warden <br />
              <span className="text-sitk-yellow">Checklist</span>
            </h1>
            <p className="text-slate-500 font-medium text-lg sm:text-xl max-w-2xl leading-relaxed pt-2">
              Monthly recorded checks and responsibilities for designated fire wardens.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 bg-white p-6 rounded-[2.5rem] shadow-2xl border border-slate-100 h-fit self-start md:self-center group hover:border-sitk-yellow/30 transition-all duration-700">
          <div className="bg-sitk-yellow/10 p-5 rounded-2xl shadow-inner group-hover:bg-sitk-yellow/20 transition-colors">
            <Flame className="w-10 h-10 text-sitk-black" />
          </div>
          <div className="pr-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] leading-none mb-3">Module</p>
            <p className="text-lg font-black text-sitk-black uppercase tracking-tight">Fire Safety</p>
          </div>
        </div>
      </div>

      {/* Section 1: Premises and Check Details */}
      <Card className="border-none shadow-2xl overflow-hidden bg-white rounded-[3rem] border border-slate-100 group">
        <div className="p-8 sm:p-12 pb-0">
          <SectionHeader 
            title="Premises and Check Details" 
            icon={Building2} 
            description="General information about the site and inspection" 
            className="mb-0"
          />
        </div>
        <CardContent className="p-8 sm:p-12 pt-10 sm:pt-14">
          <div className="grid gap-8 sm:gap-12 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-3">
              <RequiredLabel required htmlFor="premise" className="text-slate-500 font-black">Premise Address</RequiredLabel>
              <div className="relative group/input">
                <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                <Input 
                  id="premise"
                  value={formData.premise}
                  onChange={e => updateField('premise', e.target.value)}
                  placeholder="Enter site address" 
                  className={cn(
                    "pl-14 bg-slate-50/50 border-slate-200 h-16 rounded-2xl focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-base font-bold",
                    errors.premise && "border-red-500 bg-red-50/30 ring-1 ring-red-500/20"
                  )}
                />
              </div>
              <ErrorMessage message={errors.premise} />
            </div>
            <div className="space-y-3">
              <RequiredLabel required htmlFor="date" className="text-slate-500 font-black">Date of Inspection</RequiredLabel>
              <div className="relative group/input">
                <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                <Input 
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={e => updateField('date', e.target.value)}
                  className={cn(
                    "pl-14 bg-slate-50/50 border-slate-200 h-16 rounded-2xl focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-base font-bold",
                    errors.date && "border-red-500 bg-red-50/30 ring-1 ring-red-500/20"
                  )}
                />
              </div>
              <ErrorMessage message={errors.date} />
            </div>
            <div className="space-y-3">
              <RequiredLabel required htmlFor="completedBy" className="text-slate-500 font-black">Completed By</RequiredLabel>
              <div className="relative group/input">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                <Input 
                  id="completedBy"
                  value={formData.completedBy}
                  onChange={e => updateField('completedBy', e.target.value)}
                  placeholder="Enter your name" 
                  className={cn(
                    "pl-14 bg-slate-50/50 border-slate-200 h-16 rounded-2xl focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-base font-bold",
                    errors.completedBy && "border-red-500 bg-red-50/30 ring-1 ring-red-500/20"
                  )}
                />
              </div>
              <ErrorMessage message={errors.completedBy} />
            </div>
          </div>
          <div className="mt-10 p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
            <Info className="w-5 h-5 text-sitk-yellow mt-0.5 shrink-0" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">
              Recommended MONTHLY Checks for designated Fire Wardens. Please ensure all areas are inspected thoroughly.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: SECTION A – Monthly Recorded Checks */}
      <div className="space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-4 sm:px-0">
          <SectionHeader 
            title="SECTION A – Monthly Recorded Checks" 
            icon={ClipboardCheck} 
            description="Standard fire safety verification items" 
            className="mb-0"
          />
          <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 w-fit">
            <div className="w-2 h-2 rounded-full bg-sitk-yellow animate-pulse" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{SECTION_A_ITEMS.length} Items to verify</span>
          </div>
        </div>

        <div className="px-4 sm:px-0">
          <ErrorMessage message={errors.sectionA} />
        </div>
        
        <div className="grid gap-4 sm:gap-6">
          {formData.sectionA.map((item, index) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.03 }}
              className={cn(
                "bg-white p-6 sm:p-10 rounded-[2.5rem] border transition-all duration-500 group relative overflow-hidden",
                item.answer === 'Yes' ? "border-green-100 bg-green-50/20" : 
                item.answer === 'No' ? "border-red-100 bg-red-50/20" :
                "border-slate-100 hover:border-sitk-yellow/30 shadow-sm hover:shadow-xl"
              )}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex gap-6 items-start flex-1">
                  <div className="bg-slate-50 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-slate-400 text-sm group-hover:bg-sitk-yellow group-hover:text-sitk-black transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                    {index + 1}
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] opacity-60">Monthly Verification</p>
                    <p className="text-lg sm:text-xl font-black leading-tight text-slate-800 uppercase tracking-tight max-w-2xl">
                      {item.question}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 sm:gap-4 shrink-0 ml-18 lg:ml-0">
                  {[
                    { label: 'YES', value: 'Yes', color: 'bg-green-600', hover: 'hover:bg-green-700', shadow: 'shadow-green-500/20' },
                    { label: 'NO', value: 'No', color: 'bg-red-600', hover: 'hover:bg-red-700', shadow: 'shadow-red-500/20' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateChecklist(item.id, opt.value as 'Yes' | 'No')}
                      className={cn(
                        "px-8 sm:px-12 py-4 sm:py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 min-w-[100px] sm:min-w-[130px] border-2",
                        item.answer === opt.value 
                          ? `${opt.color} text-white border-transparent shadow-2xl ${opt.shadow} scale-105` 
                          : "bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100 hover:text-slate-600"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Section 3: SECTION B – Previous Checks */}
      <Card className="border-none shadow-2xl overflow-hidden bg-white rounded-[3rem] border border-slate-100 group">
        <div className="p-8 sm:p-12 pb-0">
          <SectionHeader 
            title="SECTION B – Previous Checks" 
            icon={FileText} 
            description="Follow-up on previous corrective actions" 
            className="mb-0"
          />
        </div>
        <CardContent className="p-8 sm:p-12 pt-10 sm:pt-14 space-y-10">
          <div className="p-8 sm:p-10 bg-slate-900 rounded-[2.5rem] text-white space-y-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-1 w-8 bg-sitk-yellow rounded-full" />
                <p className="text-[9px] font-black text-sitk-yellow uppercase tracking-[0.4em]">Action Verification</p>
              </div>
              <p className="text-xl sm:text-2xl font-black leading-tight uppercase tracking-tight">
                Has any corrective action required from the previous Checklist been completed to a satisfactory standard?
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4">
              {[
                { label: 'YES', value: 'Yes', color: 'bg-green-600' },
                { label: 'NO', value: 'No', color: 'bg-red-600' }
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setFormData(prev => ({ ...prev, sectionB: { ...prev.sectionB, correctiveActionSatisfactory: opt.value as 'Yes' | 'No' } }));
                    if (errors.sectionB) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.sectionB;
                        return newErrors;
                      });
                    }
                  }}
                  className={cn(
                    "px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all active:scale-95 min-w-[140px]",
                    formData.sectionB.correctiveActionSatisfactory === opt.value 
                      ? `${opt.color} text-white shadow-xl scale-105 ring-4 ring-offset-2 ring-slate-900` 
                      : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <ErrorMessage message={errors.sectionB} />

          <div className="space-y-4">
            <RequiredLabel htmlFor="notes" className="text-slate-500 font-black ml-2">Notes & Observations</RequiredLabel>
            <Textarea 
              id="notes"
              value={formData.sectionB.notes}
              onChange={e => setFormData(prev => ({ ...prev, sectionB: { ...prev.sectionB, notes: e.target.value } }))}
              placeholder="Enter any relevant notes about previous checks or outstanding issues..."
              className="bg-slate-50/50 border-slate-200 min-h-[150px] rounded-3xl focus-visible:ring-sitk-yellow transition-all hover:bg-white p-8 resize-none text-base font-bold shadow-inner"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Corrective Action Log */}
      <div className="space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-4 sm:px-0">
          <SectionHeader 
            title="Corrective Action Log" 
            icon={Plus} 
            description="Record any actions required following this inspection" 
            className="mb-0"
          />
          <Button 
            onClick={addAction}
            className="bg-sitk-black text-white hover:bg-slate-800 rounded-2xl px-10 py-7 font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all w-full sm:w-fit"
          >
            <Plus className="w-4 h-4 mr-3" />
            Add New Action
          </Button>
        </div>

        <div className="space-y-6 px-4 sm:px-0">
          <AnimatePresence mode="popLayout">
            {formData.correctiveActionLog.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                className="bg-white p-8 sm:p-12 rounded-[3rem] border border-slate-100 shadow-xl group relative hover:border-sitk-yellow/20 transition-all duration-500"
              >
                <div className="grid gap-10 lg:grid-cols-[1.2fr,2fr,1.2fr,auto] items-start">
                  <div className="space-y-4">
                    <RequiredLabel className="text-slate-400 ml-1">Date Identified</RequiredLabel>
                    <div className="relative group/input">
                      <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                      <Input 
                        type="date"
                        value={action.date}
                        onChange={e => updateAction(action.id, 'date', e.target.value)}
                        className="pl-14 bg-slate-50/50 border-slate-200 h-16 rounded-2xl focus-visible:ring-sitk-yellow transition-all hover:bg-white font-bold text-base"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <RequiredLabel required className="text-slate-400 ml-1">Corrective Action(s) Required</RequiredLabel>
                    <div className="relative group/input">
                      <FileText className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                      <Input 
                        value={action.actionRequired}
                        onChange={e => updateAction(action.id, 'actionRequired', e.target.value)}
                        placeholder="What needs to be done?"
                        className={cn(
                          "pl-14 bg-slate-50/50 border-slate-200 h-16 rounded-2xl focus-visible:ring-sitk-yellow transition-all hover:bg-white font-bold text-base",
                          errors[`action-${action.id}`] && "border-red-500 bg-red-50/30 ring-1 ring-red-500/20"
                        )}
                      />
                    </div>
                    <ErrorMessage message={errors[`action-${action.id}`]} />
                  </div>
                  <div className="space-y-4">
                    <RequiredLabel className="text-slate-400 ml-1">Date Completed / Signed</RequiredLabel>
                    <div className="relative group/input">
                      <CheckCircle2 className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                      <Input 
                        type="date"
                        value={action.dateCompleted}
                        onChange={e => updateAction(action.id, 'dateCompleted', e.target.value)}
                        className="pl-14 bg-slate-50/50 border-slate-200 h-16 rounded-2xl focus-visible:ring-sitk-yellow transition-all hover:bg-white font-bold text-base"
                      />
                    </div>
                  </div>
                  <div className="pt-10 lg:pt-11 flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeAction(action.id)}
                      className="h-16 w-16 rounded-2xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all duration-300"
                    >
                      <Trash2 className="w-6 h-6" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {formData.correctiveActionLog.length === 0 && (
            <div className="p-16 border-4 border-dashed border-slate-100 rounded-[3rem] text-center space-y-4 group hover:border-sitk-yellow/30 transition-colors duration-500">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-sitk-yellow/10 transition-colors">
                <Plus className="w-8 h-8 text-slate-300 group-hover:text-sitk-yellow transition-colors" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-black text-slate-400 uppercase tracking-widest">No actions recorded</p>
                <p className="text-slate-400 font-medium text-sm">Click "Add New Action" to record a corrective requirement.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Note */}
      <div className="p-12 bg-slate-900 rounded-[4rem] text-white space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sitk-yellow/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-10 h-10 bg-sitk-yellow rounded-xl flex items-center justify-center">
            <Info className="w-6 h-6 text-sitk-black" />
          </div>
          <h4 className="text-xl font-black uppercase tracking-widest">Important Note</h4>
        </div>
        <p className="text-slate-400 font-medium leading-relaxed text-lg relative z-10">
          NOTE: This Checklist is designed to be a reminder of some of the health and safety checks required in the workplace. It is NOT a definitive or official list of actions and no liability can be accepted for errors or omissions.
        </p>
      </div>

      {/* Success Overlay */}
      {saveSuccess && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <Card className="w-full max-w-md bg-white rounded-[3.5rem] border-none shadow-2xl overflow-hidden">
              <CardContent className="p-12 text-center space-y-8">
                <div className="w-24 h-24 bg-green-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-black uppercase tracking-tight text-slate-900">
                    Checklist {currentStatus === 'Draft' ? 'Saved' : 'Submitted'}!
                  </h3>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    Your fire warden checklist has been successfully {currentStatus === 'Draft' ? 'saved as a draft' : 'submitted'}.
                  </p>
                </div>
                <div className="pt-2 flex flex-col items-center gap-6">
                  <StatusBadge status={currentStatus} className="px-10 py-4 text-sm font-black shadow-xl" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">
                    Redirecting to My Reports...
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Error Message */}
      {errors.submit && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-100 p-8 rounded-[2rem] flex items-center gap-5 text-red-600 font-black uppercase text-xs tracking-widest shadow-xl shadow-red-500/5"
        >
          <div className="bg-red-600 p-2 rounded-lg">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
          {errors.submit}
        </motion.div>
      )}

      {/* Executive Summary */}
      <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-8 space-y-6">
          <SectionHeader title="Executive Summary" icon={FileText} description="Assessor's professional summary — key findings, actions required, and overall compliance judgement" className="mb-0" />
          <Textarea 
            placeholder="Enter the executive summary — key findings, compliance level rationale, recommendations, and actions required..."
            className="min-h-[160px] bg-white border-slate-300 shadow-sm focus-visible:border-sitk-yellow focus-visible:ring-sitk-yellow/35 p-4 resize-none font-medium text-sm"
            value={formData.executiveSummary}
            onChange={e => setFormData(prev => ({ ...prev, executiveSummary: e.target.value }))}
          />
        </CardContent>
      </Card>

      {/* Photos Section */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
        <PhotoUpload photos={photos} onPhotosChange={updatePhotos} />
      </div>

      {/* Form Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row items-center justify-between p-16 sm:p-20 bg-slate-900 rounded-[5rem] shadow-2xl gap-16 relative overflow-hidden group/footer"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,214,0,0.1),transparent)]" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-sitk-yellow/5 rounded-full blur-3xl" />
        
        <div className="flex items-center gap-12 relative z-10">
          <div className={cn(
            "w-32 h-32 rounded-[3.5rem] flex items-center justify-center border-4 shadow-2xl transition-all duration-700",
            saveSuccess ? "bg-green-500 border-green-400 rotate-0 shadow-green-500/20" :
            currentStatus === 'Draft' ? "bg-yellow-500 border-yellow-400 rotate-[-6deg] shadow-yellow-500/20" : 
            currentStatus === 'Submitted' ? "bg-blue-500 border-blue-400 rotate-[6deg] shadow-blue-500/20" : "bg-green-500 border-green-400 shadow-green-500/20"
          )}>
            {saveSuccess ? (
              <CheckCircle2 className="w-16 h-16 text-white" />
            ) : (
              <Clock className="w-16 h-16 text-white" />
            )}
          </div>
          <div className="space-y-5">
            <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.6em] leading-none ml-2">Report Status</p>
            <StatusBadge status={currentStatus} className="px-12 py-5 text-base font-black shadow-2xl border-none bg-white/10 text-white" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-10 w-full lg:w-auto relative z-10">
          <Button 
            variant="outline" 
            onClick={() => handleSave('Draft')}
            disabled={isSubmitting}
            className="w-full sm:w-auto h-28 px-20 rounded-[2.5rem] border-2 border-white/10 bg-white/5 text-white font-black uppercase tracking-[0.4em] text-xs hover:bg-white hover:text-slate-900 hover:border-white transition-all active:scale-95 shadow-2xl group/draft"
          >
            {isSubmitting && currentStatus === 'Draft' ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <Clock className="h-7 w-7" />
              </motion.div>
            ) : (
              <Save className="w-7 h-7 mr-6 text-white/40 group-hover/draft:text-slate-900 transition-colors" />
            )}
            {isSubmitting && currentStatus === 'Draft' ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button 
            onClick={() => handleSave('Submitted')}
            disabled={isSubmitting}
            className="w-full sm:w-auto h-28 px-24 rounded-[2.5rem] bg-sitk-yellow text-sitk-black font-black uppercase tracking-[0.4em] text-xs hover:bg-white hover:text-sitk-black shadow-2xl shadow-sitk-yellow/20 transition-all active:scale-95 group/submit"
          >
            {isSubmitting && currentStatus === 'Submitted' ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <Clock className="h-7 w-7" />
              </motion.div>
            ) : (
              <Send className="w-7 h-7 mr-6 group-hover/submit:translate-x-1 group-hover/submit:-translate-y-1 transition-transform" />
            )}
            {isSubmitting && currentStatus === 'Submitted' ? 'Submitting...' : 'Submit Checklist'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
