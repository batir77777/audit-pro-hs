import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  Signature,
  Timer,
  MapPin,
  ThumbsUp,
  ThumbsDown,
  MinusCircle,
  Briefcase,
  FileText
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
import { FireDrillReport, ReportStatus, FireDrillChecklistItem } from '../types';
import StatusBadge from '../components/StatusBadge';
import SectionHeader from '../components/SectionHeader';

const DRILL_CHECKLIST_ITEMS = [
  'Fire bells heard everywhere?',
  'Occupants evacuated in an orderly manner?',
  'Lifts not used by anyone?',
  'Fire Warden checked remote areas?',
  'Occupants went to correct Fire Assembly Point?',
  'Fire Wardens confirmed that they knew the correct fire safety procedures and were confident in evacuating visitors or the disabled?',
  'All persons reported to a Fire Warden or the drill Co-ordinator?',
  'The escape routes were all clear?',
  'The Fire Log Book on site was completed?',
  'A Fire Warden de-brief was undertaken after the Drill?'
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

export default function FireDrillReportForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const editId = (location.state as any)?.editId as string | undefined;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [reportId, setReportId] = useState<string | null>(editId ?? null);
  const [currentStatus, setCurrentStatus] = useState<ReportStatus>('Draft');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    carriedBy: (getSession()?.name ?? ''),
    title_pos: '',
    signature: '',
    premiseAddress: '',
    drillDate: new Date().toISOString().split('T')[0],
    drillTime: '',
    evacuationTime: '',
    assemblyPoint: '',
    checklist: DRILL_CHECKLIST_ITEMS.map((item, index) => ({
      id: `item-${index}`,
      question: item,
      answer: undefined as 'Yes' | 'No' | 'N/A' | undefined,
      notes: ''
    })),
    overallResult: '' as 'Good' | 'OK' | 'Poor' | '',
    notes: '',
    problems: '',
    recommendations: '',
    executiveSummary: ''
  });

  const updateChecklist = (id: string, field: keyof FireDrillChecklistItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.carriedBy.trim()) newErrors.carriedBy = 'Name is required';
    if (!formData.signature.trim()) newErrors.signature = 'Signature is required';
    if (!formData.premiseAddress.trim()) newErrors.premiseAddress = 'Premise address is required';
    if (!formData.drillDate) newErrors.drillDate = 'Date is required';
    if (!formData.drillTime) newErrors.drillTime = 'Time is required';
    if (!formData.evacuationTime.trim()) newErrors.evacuationTime = 'Evacuation time is required';
    if (!formData.assemblyPoint.trim()) newErrors.assemblyPoint = 'Assembly point is required';
    if (!formData.overallResult) newErrors.overallResult = 'Overall result is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { photos, updatePhotos, clearPhotos } = usePhotoStore('fire_drill');
  const { clearAutoSave } = useAutoSave('fire_drill', formData);
  React.useEffect(() => {
    const saved = getAutoSavedData<any>('fire_drill'); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (saved) setFormData(prev => ({ ...prev, ...saved }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (status: ReportStatus) => {
    if (status === 'Submitted' && !validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    clearAutoSave();
    setIsSubmitting(true);
    setCurrentStatus(status);

    const newId = reportId || `FD-${Date.now()}`;
    if (!reportId) setReportId(newId);

    const report: FireDrillReport = {
      id: newId,
      title: `Fire Drill - ${formData.premiseAddress || 'New'}`,
      type: 'Fire Drill Report',
      status,
      location: formData.premiseAddress,
      date: formData.drillDate,
      authorId: mockUser.id,
      description: `Overall Result: ${formData.overallResult || 'N/A'}. Evacuation time: ${formData.evacuationTime || 'N/A'}.`,
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
          console.error('[FireDrillReportForm] PDF generation failed:', pdfErr);
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
    <div className="max-w-[1200px] mx-auto space-y-7 md:space-y-8 pb-24 md:pb-12 px-1 sm:px-2">
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
              Fire Evacuation <br />
              <span className="text-sitk-yellow">Drill Report</span>
            </h1>
            <p className="text-slate-500 font-medium text-lg sm:text-xl max-w-2xl leading-relaxed pt-2">
              Record and evaluate fire evacuation drills to ensure site safety and compliance.
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

      {/* Section 1: Drill Details */}
      <Card className="border-none shadow-xl overflow-hidden bg-white rounded-[3rem] border border-slate-100 group">
        <div className="p-12 pb-0">
          <SectionHeader 
            title="Drill Details" 
            icon={User} 
            description="Details of the person conducting the drill" 
            className="mb-0"
          />
        </div>
        <CardContent className="p-12 pt-14">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-1">
              <RequiredLabel required className="text-slate-400 ml-2">Carried out by</RequiredLabel>
              <div className="relative group/input">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                <Input 
                  value={formData.carriedBy}
                  onChange={e => updateField('carriedBy', e.target.value)}
                  placeholder="Enter name" 
                  className={cn(
                    "pl-16 bg-slate-50/50 border-slate-200 h-20 rounded-[1.5rem] focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-lg font-bold",
                    errors.carriedBy && "border-red-500 bg-red-50/30 ring-1 ring-red-500/20"
                  )}
                />
              </div>
              <ErrorMessage message={errors.carriedBy} />
            </div>
            <div className="space-y-4 lg:col-span-1">
              <RequiredLabel className="text-slate-400 ml-2">Title</RequiredLabel>
              <div className="relative group/input">
                <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                <Input 
                  value={formData.title_pos}
                  onChange={e => updateField('title_pos', e.target.value)}
                  placeholder="Job Title" 
                  className="pl-16 bg-slate-50/50 border-slate-200 h-20 rounded-[1.5rem] focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-lg font-bold"
                />
              </div>
            </div>
            <div className="space-y-4 lg:col-span-1">
              <RequiredLabel required className="text-slate-400 ml-2">Signature</RequiredLabel>
              <div className="relative group/input">
                <Signature className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                <Input 
                  value={formData.signature}
                  onChange={e => updateField('signature', e.target.value)}
                  placeholder="Type to sign" 
                  className={cn(
                    "pl-16 bg-slate-50/50 border-slate-200 h-20 rounded-[1.5rem] focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 font-signature text-3xl",
                    errors.signature && "border-red-500 bg-red-50/30 ring-1 ring-red-500/20"
                  )}
                />
              </div>
              <ErrorMessage message={errors.signature} />
            </div>
            <div className="space-y-4 lg:col-span-1">
              <RequiredLabel required className="text-slate-400 ml-2">Premise Address</RequiredLabel>
              <div className="relative group/input">
                <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                <Input 
                  value={formData.premiseAddress}
                  onChange={e => updateField('premiseAddress', e.target.value)}
                  placeholder="Site address" 
                  className={cn(
                    "pl-16 bg-slate-50/50 border-slate-200 h-20 rounded-[1.5rem] focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-lg font-bold",
                    errors.premiseAddress && "border-red-500 bg-red-50/30 ring-1 ring-red-500/20"
                  )}
                />
              </div>
              <ErrorMessage message={errors.premiseAddress} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Drill Information */}
      <Card className="border-none shadow-xl overflow-hidden bg-white rounded-[3rem] border border-slate-100 group">
        <div className="p-12 pb-0">
          <SectionHeader 
            title="Drill Information" 
            icon={ClipboardCheck} 
            description="Specifics of the evacuation drill" 
            className="mb-0"
          />
        </div>
        <CardContent className="p-12 pt-14">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-1">
              <RequiredLabel required className="text-slate-400 ml-2">Date of Drill</RequiredLabel>
              <div className="relative group/input">
                <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                <Input 
                  type="date"
                  value={formData.drillDate}
                  onChange={e => updateField('drillDate', e.target.value)}
                  className={cn(
                    "pl-16 bg-slate-50/50 border-slate-200 h-20 rounded-[1.5rem] focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-lg font-bold",
                    errors.drillDate && "border-red-500 bg-red-50/30 ring-1 ring-red-500/20"
                  )}
                />
              </div>
              <ErrorMessage message={errors.drillDate} />
            </div>
            <div className="space-y-4 lg:col-span-1">
              <RequiredLabel required className="text-slate-400 ml-2">Time</RequiredLabel>
              <div className="relative group/input">
                <Clock className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                <Input 
                  type="time"
                  value={formData.drillTime}
                  onChange={e => updateField('drillTime', e.target.value)}
                  className={cn(
                    "pl-16 bg-slate-50/50 border-slate-200 h-20 rounded-[1.5rem] focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-lg font-bold",
                    errors.drillTime && "border-red-500 bg-red-50/30 ring-1 ring-red-500/20"
                  )}
                />
              </div>
              <ErrorMessage message={errors.drillTime} />
            </div>
            <div className="space-y-4 lg:col-span-1">
              <RequiredLabel required className="text-slate-400 ml-2">Total time for evacuation</RequiredLabel>
              <div className="relative group/input">
                <Timer className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                <Input 
                  value={formData.evacuationTime}
                  onChange={e => updateField('evacuationTime', e.target.value)}
                  placeholder="e.g. 3 mins 20 secs" 
                  className={cn(
                    "pl-16 bg-slate-50/50 border-slate-200 h-20 rounded-[1.5rem] focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-lg font-bold",
                    errors.evacuationTime && "border-red-500 bg-red-50/30 ring-1 ring-red-500/20"
                  )}
                />
              </div>
              <ErrorMessage message={errors.evacuationTime} />
            </div>
            <div className="space-y-4 lg:col-span-1">
              <RequiredLabel required className="text-slate-400 ml-2">Fire Assembly Point</RequiredLabel>
              <div className="relative group/input">
                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                <Input 
                  value={formData.assemblyPoint}
                  onChange={e => updateField('assemblyPoint', e.target.value)}
                  placeholder="Location" 
                  className={cn(
                    "pl-16 bg-slate-50/50 border-slate-200 h-20 rounded-[1.5rem] focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-lg font-bold",
                    errors.assemblyPoint && "border-red-500 bg-red-50/30 ring-1 ring-red-500/20"
                  )}
                />
              </div>
              <ErrorMessage message={errors.assemblyPoint} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Drill Checklist */}
      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <SectionHeader 
            title="Drill Checklist" 
            icon={ClipboardCheck} 
            description="Evaluate the effectiveness of the evacuation" 
            className="mb-0"
          />
          <div className="hidden sm:flex items-center gap-3 bg-slate-50 px-6 py-3 rounded-full border border-slate-100">
            <div className="w-2 h-2 rounded-full bg-sitk-yellow" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">10 Items to check</span>
          </div>
        </div>
        
        <div className="grid gap-8">
          {formData.checklist.map((item, index) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "bg-white p-10 sm:p-12 rounded-[3.5rem] border transition-all duration-700 group relative overflow-hidden",
                item.answer === 'Yes' ? "border-green-100 bg-green-50/10 shadow-sm" : 
                item.answer === 'No' ? "border-red-100 bg-red-50/10 shadow-sm" :
                "border-slate-100 hover:border-sitk-yellow/30 shadow-2xl hover:shadow-sitk-yellow/5"
              )}
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-slate-100 group-hover:bg-sitk-yellow transition-colors duration-700" />
              
              <div className="flex flex-col lg:grid lg:grid-cols-[1fr,450px] gap-10 lg:items-center">
                <div className="space-y-8">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Question {index + 1}</p>
                    <p className="text-2xl font-black leading-tight text-slate-800 uppercase tracking-tight group-hover:text-sitk-black transition-colors">
                      {item.question}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { label: 'YES (Good)', value: 'Yes', color: 'bg-green-600', hover: 'hover:bg-green-700' },
                      { label: 'NO (Bad)', value: 'No', color: 'bg-red-600', hover: 'hover:bg-red-700' },
                      { label: 'N/A', value: 'N/A', color: 'bg-slate-500', hover: 'hover:bg-slate-600' }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateChecklist(item.id, 'answer', opt.value)}
                        className={cn(
                          "px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 min-w-[140px] shadow-sm",
                          item.answer === opt.value 
                            ? `${opt.color} text-white shadow-xl scale-105 ring-4 ring-offset-2 ring-slate-50` 
                            : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative group/input space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Item Notes</Label>
                    {item.notes && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                  </div>
                  <Input 
                    value={item.notes}
                    onChange={e => updateChecklist(item.id, 'notes', e.target.value)}
                    placeholder="Add specific notes..."
                    className="bg-slate-50/50 border-slate-100 h-20 text-lg rounded-[1.5rem] focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-200 font-bold px-8"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Section 4: Overall Result */}
      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <SectionHeader 
            title="Overall Result" 
            icon={ThumbsUp} 
            description="Final evaluation of the drill performance" 
            className="mb-0"
          />
          <div className="bg-red-50 px-6 py-3 rounded-full border border-red-100 flex items-center gap-3 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em]">Required Section</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {[
            { label: 'Good', value: 'Good', icon: ThumbsUp, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', active: 'bg-green-600 text-white border-green-600 shadow-green-200' },
            { label: 'OK', value: 'OK', icon: MinusCircle, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100', active: 'bg-yellow-600 text-white border-yellow-600 shadow-yellow-200' },
            { label: 'Poor', value: 'Poor', icon: ThumbsDown, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', active: 'bg-red-600 text-white border-red-600 shadow-red-200' }
          ].map((res) => (
            <button
              key={res.value}
              onClick={() => updateField('overallResult', res.value)}
              className={cn(
                "flex flex-col items-center justify-center p-16 rounded-[4rem] border-4 transition-all duration-700 group active:scale-95 relative overflow-hidden",
                formData.overallResult === res.value 
                  ? `${res.active} shadow-2xl scale-105 ring-8 ring-offset-4 ring-slate-50` 
                  : cn(
                      res.bg, 
                      res.border, 
                      res.color, 
                      "hover:border-sitk-yellow/50 hover:shadow-xl",
                      errors.overallResult && "border-red-300 bg-red-50/50"
                    )
              )}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <res.icon className={cn(
                "w-20 h-20 mb-8 transition-transform group-hover:scale-110 duration-700",
                formData.overallResult === res.value ? "text-white" : res.color
              )} />
              <span className="text-3xl font-black uppercase tracking-[0.4em]">{res.label}</span>
            </button>
          ))}
        </div>
        <ErrorMessage message={errors.overallResult} />
      </div>

      {/* Section 5: Notes / Problems / Recommendations */}
      <Card className="border-none shadow-2xl overflow-hidden bg-white rounded-[4rem] border border-slate-100 group">
        <div className="p-12 pb-0">
          <SectionHeader 
            title="Notes / Problems / Recommendations" 
            icon={Plus} 
            description="Detailed feedback and identified issues" 
            className="mb-0"
          />
        </div>
        <CardContent className="p-12 pt-16 space-y-12">
          <div className="space-y-6">
            <RequiredLabel className="text-slate-400 ml-4">General Notes</RequiredLabel>
            <Textarea 
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="General observations about the drill performance..."
              className="bg-slate-50/50 border-slate-200 min-h-[200px] rounded-[3rem] focus-visible:ring-sitk-yellow transition-all hover:bg-white p-10 resize-none text-lg leading-relaxed font-bold shadow-inner"
            />
          </div>
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <RequiredLabel className="text-slate-400 ml-4">Problems Identified</RequiredLabel>
              <Textarea 
                value={formData.problems}
                onChange={e => setFormData(prev => ({ ...prev, problems: e.target.value }))}
                placeholder="List any issues encountered during the evacuation..."
                className="bg-slate-50/50 border-slate-200 min-h-[200px] rounded-[3rem] focus-visible:ring-sitk-yellow transition-all hover:bg-white p-10 resize-none text-lg leading-relaxed font-bold shadow-inner"
              />
            </div>
            <div className="space-y-6">
              <RequiredLabel className="text-slate-400 ml-4">Recommendations</RequiredLabel>
              <Textarea 
                value={formData.recommendations}
                onChange={e => setFormData(prev => ({ ...prev, recommendations: e.target.value }))}
                placeholder="Suggested improvements for future drills..."
                className="bg-slate-50/50 border-slate-200 min-h-[200px] rounded-[3rem] focus-visible:ring-sitk-yellow transition-all hover:bg-white p-10 resize-none text-lg leading-relaxed font-bold shadow-inner"
              />
            </div>
          </div>
        </CardContent>
      </Card>

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
                    Report {currentStatus === 'Draft' ? 'Saved' : 'Submitted'}!
                  </h3>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    Your fire drill report has been successfully {currentStatus === 'Draft' ? 'saved as a draft' : 'submitted'}.
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
            {isSubmitting && currentStatus === 'Submitted' ? 'Submitting...' : 'Submit Drill Report'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
