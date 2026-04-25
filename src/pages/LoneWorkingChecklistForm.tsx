import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ClipboardCheck, 
  Calendar, 
  User, 
  FileText, 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Info,
  Hash,
  PenTool,
  MapPin,
  Clock,
  ShieldCheck,
  Mail,
  Phone,
  Briefcase,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { mockUser, saveReport } from '@/lib/mockData';
import { exportSavedReportToPDF } from '@/lib/exportUtils';
import { DEFAULT_BRANDING } from '@/lib/brandingContext';
import { getSession } from '@/lib/auth';
import { useAutoSave, getAutoSavedData } from '@/lib/useAutoSave';
import { usePhotoStore } from '@/lib/usePhotoStore';
import PhotoUpload from '@/components/PhotoUpload';
import { motion } from 'motion/react';
import { LoneWorkingChecklistReport, ReportStatus } from '@/types';
import SectionHeader from '@/components/SectionHeader';
import StatusBadge from '@/components/StatusBadge';

const EVALUATION_ITEMS = [
  { ref: '1', item: 'Can the lone work be avoided? (If yes, then stop lone working).' },
  { ref: '2', item: 'Are there any particular risks to the lone worker? (if yes, explain then evaluate)' },
  { ref: '3', item: 'Is there safe access and egress to the workplace?' },
  { ref: '4', item: 'Is special access equipment required?' },
  { ref: '5', item: 'Is rescue equipment required?' },
  { ref: '6', item: 'Does any plant, substances or activity present a special risk?' },
  { ref: '7', item: 'Is there a risk of violence or aggression to the worker?' },
  { ref: '8', item: 'Are there any undue risks to females?' },
  { ref: '9', item: 'Are there any undue risks to young persons?' },
  { ref: '10', item: 'Does the lone worker have a medical condition that increases risks?' },
  { ref: '11', item: 'Has the lone worker been trained to complete the work safely?' },
  { ref: '12', item: 'Is there adequate supervision of lone work in place?' },
  { ref: '13', item: 'Are emergency procedures in place i.e. illness, fire etc.?' },
  { ref: '14', item: 'Has the worker been trained in the emergency procedures?' },
  { ref: '15', item: 'Are rescue equipment / alarm equipment maintained?' },
  { ref: '16', item: 'Can communication be maintained constantly?' },
  { ref: '17', item: 'Where mobiles are used, is there a potential for loss of signal?' },
  { ref: '18', item: 'Are batteries maintained and charged?' },
  { ref: '19', item: 'Are remote monitoring stations in use and a test call made?' },
  { ref: '20', item: 'Is someone responsible for ensuring procedures are followed?' },
  { ref: '21', item: 'Are routine audits undertaken?' }
];

export default function LoneWorkingChecklistForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const editId = (location.state as any)?.editId as string | undefined;
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [currentStatus, setCurrentStatus] = React.useState<ReportStatus>('Draft');
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [formData, setFormData] = React.useState<Omit<LoneWorkingChecklistReport, 'id' | 'authorId' | 'status' | 'title' | 'type' | 'location' | 'date'>>({
    assessorName: (getSession()?.name ?? ''),
    assessorSignature: '',
    assessmentDate: new Date().toISOString().split('T')[0],
    assessmentTitle: '',
    assessmentReview: '',
    
    loneWorkerName: '',
    loneWorkerSignature: '',
    loneWorkerMobile: '',
    loneWorkerEmail: '',
    loneWorkerArea: '',
    loneWorkerTask: '',
    loneWorkerDate: new Date().toISOString().split('T')[0],
    loneWorkerTime: '',
    
    evaluationItems: EVALUATION_ITEMS.map(item => ({
      id: crypto.randomUUID(),
      ref: item.ref,
      item: item.item,
      answer: undefined,
      comments: ''
    })),
    
    actionLog: [
      { id: crypto.randomUUID(), actionTaken: '', followUp: '', signOff: '', dateCompleted: '' }
    ],
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

  const updateEvaluationItem = (id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      evaluationItems: prev.evaluationItems.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const addActionRow = () => {
    setFormData(prev => ({
      ...prev,
      actionLog: [...prev.actionLog, { id: crypto.randomUUID(), actionTaken: '', followUp: '', signOff: '', dateCompleted: '' }]
    }));
  };

  const removeActionRow = (id: string) => {
    setFormData(prev => ({
      ...prev,
      actionLog: prev.actionLog.filter(row => row.id !== id)
    }));
  };

  const updateActionRow = (id: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      actionLog: prev.actionLog.map(row => row.id === id ? { ...row, [field]: value } : row)
    }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.assessorName.trim()) newErrors.assessorName = 'Assessor Name is required';
    if (!formData.loneWorkerName.trim()) newErrors.loneWorkerName = 'Lone Worker Name is required';
    if (!formData.loneWorkerArea.trim()) newErrors.loneWorkerArea = 'Area of work is required';
    if (!formData.loneWorkerMobile.trim()) newErrors.loneWorkerMobile = 'Mobile number is required for safety';
    if (!formData.loneWorkerTask.trim()) newErrors.loneWorkerTask = 'Task description is required';
    
    const unansweredItems = formData.evaluationItems.filter(item => !item.answer);
    if (unansweredItems.length > 0) {
      newErrors.evaluationItems = `Please answer all ${unansweredItems.length} evaluation items.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { photos, updatePhotos, clearPhotos } = usePhotoStore('lone_working');
  const { clearAutoSave } = useAutoSave('lone_working', formData);
  React.useEffect(() => {
    const saved = getAutoSavedData<any>('lone_working'); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (saved) setFormData(prev => ({ ...prev, ...saved }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (status: ReportStatus) => {
    if (status === 'Submitted' && !validate()) {
      const firstError = document.querySelector('.text-red-500');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    clearAutoSave();
    setIsSubmitting(true);

    try {
      const newId = editId ?? crypto.randomUUID();
      const report: LoneWorkingChecklistReport = {
        ...formData,
        id: newId,
        authorId: mockUser.id,
        status,
        title: `Lone Working Checklist - ${formData.loneWorkerName || 'Unnamed'} - ${formData.assessmentDate}`,
        type: 'Lone Working Checklist',
        location: formData.loneWorkerArea || 'Not Specified',
        date: formData.assessmentDate,
        photos,
      };

      saveReport(report);
      clearPhotos();
      setCurrentStatus(status);

      if (status === 'Submitted') {
        try {
          await exportSavedReportToPDF(report, DEFAULT_BRANDING);
        } catch (pdfErr) {
          console.error('[LoneWorkingChecklistForm] PDF generation failed:', pdfErr);
        }
      }

      navigate('/my-reports');
    } catch (err) {
      console.error('[LoneWorkingChecklistForm] Save failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 md:space-y-9 pb-24 md:pb-12 px-2 sm:px-3 lg:px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/risk-assessments')}
          className="text-slate-500 hover:text-sitk-black font-black uppercase text-[10px] tracking-widest"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Risk Assessments
        </Button>
        <div className="flex items-center gap-3">
          <StatusBadge status={currentStatus} />
        </div>
      </div>

      <SectionHeader 
        title="Lone Working Risk Evaluation Checklist" 
        icon={ShieldCheck}
        description="Comprehensive risk assessment for personnel working alone or in isolation."
      />

      {/* Validation Summary */}
      {Object.keys(errors).length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-6 bg-red-50 border-2 border-red-100 rounded-[2rem] flex items-start gap-4 shadow-sm"
        >
          <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-red-900 mb-1">Submission Blocked</h3>
            <p className="text-xs font-bold text-red-600 leading-relaxed">
              Please complete all required fields marked with an asterisk (*). 
              {errors.evaluationItems && <span className="block mt-1">• {errors.evaluationItems}</span>}
              {errors.loneWorkerMobile && <span className="block mt-1">• Mobile number is essential for lone worker safety.</span>}
            </p>
          </div>
        </motion.div>
      )}

      {/* Progress Tracker */}
      <div className="mt-8 grid grid-cols-4 gap-2">
        {[
          { label: 'Assessor', done: !!formData.assessorName },
          { label: 'Worker', done: !!formData.loneWorkerName },
          { label: 'Evaluation', done: formData.evaluationItems.every(item => item.answer) },
          { label: 'Actions', done: formData.actionLog.length > 0 && !!formData.actionLog[0].actionTaken }
        ].map((step, i) => (
          <div key={step.label} className="space-y-2">
            <div className={cn(
              "h-1 rounded-full transition-all duration-500",
              step.done ? "bg-sitk-yellow shadow-[0_0_8px_rgba(255,214,0,0.4)]" : "bg-slate-100"
            )} />
            <p className={cn(
              "text-[8px] font-black uppercase tracking-[0.2em] text-center",
              step.done ? "text-sitk-black" : "text-slate-400"
            )}>
              {step.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 space-y-16">
        {/* Section 1: Assessment Details */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-sitk-black text-white rounded-lg flex items-center justify-center font-black text-sm">1</div>
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Assessment Details</h2>
          </div>

          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardContent className="p-6 sm:p-10">
              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="assessorName" className="text-slate-400 font-black uppercase text-[9px] tracking-widest ml-1">
                    Assessors Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative group/input">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                    <Input 
                      id="assessorName"
                      value={formData.assessorName}
                      onChange={e => updateField('assessorName', e.target.value)}
                      placeholder="Enter assessor's full name"
                      className={cn(
                        "pl-12 bg-slate-50/50 border-slate-100 h-14 rounded-xl focus:bg-white focus:border-sitk-yellow transition-all font-bold text-sm",
                        errors.assessorName && "border-red-500 bg-red-50/30"
                      )}
                    />
                  </div>
                  {errors.assessorName && <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest ml-1">{errors.assessorName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assessorSignature" className="text-slate-400 font-black uppercase text-[9px] tracking-widest ml-1">
                    Signature
                  </Label>
                  <div className="relative group/input">
                    <PenTool className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                    <Input 
                      id="assessorSignature"
                      value={formData.assessorSignature}
                      onChange={e => updateField('assessorSignature', e.target.value)}
                      placeholder="Type name to sign..."
                      className="pl-12 bg-slate-50/50 border-slate-100 h-14 rounded-xl focus:bg-white focus:border-sitk-yellow transition-all font-bold text-sm italic"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assessmentDate" className="text-slate-400 font-black uppercase text-[9px] tracking-widest ml-1">
                    Date
                  </Label>
                  <div className="relative group/input">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                    <Input 
                      id="assessmentDate"
                      type="date"
                      value={formData.assessmentDate}
                      onChange={e => updateField('assessmentDate', e.target.value)}
                      className="pl-12 bg-slate-50/50 border-slate-100 h-14 rounded-xl focus:bg-white focus:border-sitk-yellow transition-all font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assessmentTitle" className="text-slate-400 font-black uppercase text-[9px] tracking-widest ml-1">
                    Title
                  </Label>
                  <div className="relative group/input">
                    <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                    <Input 
                      id="assessmentTitle"
                      value={formData.assessmentTitle}
                      onChange={e => updateField('assessmentTitle', e.target.value)}
                      placeholder="e.g. Senior Safety Officer"
                      className="pl-12 bg-slate-50/50 border-slate-100 h-14 rounded-xl focus:bg-white focus:border-sitk-yellow transition-all font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="assessmentReview" className="text-slate-400 font-black uppercase text-[9px] tracking-widest ml-1">
                    Review
                  </Label>
                  <div className="relative group/input">
                    <Search className="absolute left-5 top-5 w-4 h-4 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                    <Textarea 
                      id="assessmentReview"
                      value={formData.assessmentReview}
                      onChange={e => updateField('assessmentReview', e.target.value)}
                      placeholder="Add review notes or next steps..."
                      className="pl-12 bg-slate-50/50 border-slate-100 min-h-[100px] rounded-2xl focus:bg-white focus:border-sitk-yellow transition-all font-bold text-sm pt-4"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 2: Lone Worker Details */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-sitk-black text-white rounded-lg flex items-center justify-center font-black text-sm">2</div>
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Lone Worker Details</h2>
          </div>

          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardContent className="p-6 sm:p-10">
              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="loneWorkerName" className="text-slate-400 font-black uppercase text-[9px] tracking-widest ml-1">
                    Name of lone worker <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative group/input">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                    <Input 
                      id="loneWorkerName"
                      value={formData.loneWorkerName}
                      onChange={e => updateField('loneWorkerName', e.target.value)}
                      placeholder="Enter lone worker's name"
                      className={cn(
                        "pl-12 bg-slate-50/50 border-slate-200 h-14 rounded-xl focus:bg-white focus:border-sitk-yellow transition-all font-bold text-sm",
                        errors.loneWorkerName && "border-red-500 bg-red-50/30"
                      )}
                    />
                  </div>
                  {errors.loneWorkerName && <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest ml-1">{errors.loneWorkerName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loneWorkerSignature" className="text-slate-400 font-black uppercase text-[9px] tracking-widest ml-1">
                    Signature
                  </Label>
                  <div className="relative group/input">
                    <PenTool className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                    <Input 
                      id="loneWorkerSignature"
                      value={formData.loneWorkerSignature}
                      onChange={e => updateField('loneWorkerSignature', e.target.value)}
                      placeholder="Type name to sign..."
                      className="pl-12 bg-slate-50/50 border-slate-200 h-14 rounded-xl focus:bg-white focus:border-sitk-yellow transition-all font-bold text-sm italic"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loneWorkerMobile" className="text-slate-400 font-black uppercase text-[9px] tracking-widest ml-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative group/input">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                    <Input 
                      id="loneWorkerMobile"
                      value={formData.loneWorkerMobile}
                      onChange={e => updateField('loneWorkerMobile', e.target.value)}
                      placeholder="e.g. 07123 456789"
                      className={cn(
                        "pl-12 bg-slate-50/50 border-slate-200 h-14 rounded-xl focus:bg-white focus:border-sitk-yellow transition-all font-bold text-sm",
                        errors.loneWorkerMobile && "border-red-500 bg-red-50/30"
                      )}
                    />
                  </div>
                  {errors.loneWorkerMobile && <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest ml-1">{errors.loneWorkerMobile}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loneWorkerEmail" className="text-slate-400 font-black uppercase text-[9px] tracking-widest ml-1">
                    Email address
                  </Label>
                  <div className="relative group/input">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                    <Input 
                      id="loneWorkerEmail"
                      type="email"
                      value={formData.loneWorkerEmail}
                      onChange={e => updateField('loneWorkerEmail', e.target.value)}
                      placeholder="e.g. worker@example.co.uk"
                      className="pl-12 bg-slate-50/50 border-slate-200 h-14 rounded-xl focus:bg-white focus:border-sitk-yellow transition-all font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="loneWorkerArea" className="text-slate-400 font-black uppercase text-[9px] tracking-widest ml-1">
                    Area lone working will be carried out in <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative group/input">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                    <Input 
                      id="loneWorkerArea"
                      value={formData.loneWorkerArea}
                      onChange={e => updateField('loneWorkerArea', e.target.value)}
                      placeholder="e.g. Warehouse Section B, Remote Site 4..."
                      className={cn(
                        "pl-12 bg-slate-50/50 border-slate-200 h-14 rounded-xl focus:bg-white focus:border-sitk-yellow transition-all font-bold text-sm",
                        errors.loneWorkerArea && "border-red-500 bg-red-50/30"
                      )}
                    />
                  </div>
                  {errors.loneWorkerArea && <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest ml-1">{errors.loneWorkerArea}</p>}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="loneWorkerTask" className="text-slate-400 font-black uppercase text-[9px] tracking-widest ml-1">
                    Task being carried out by the lone worker <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative group/input">
                    <FileText className="absolute left-5 top-5 w-4 h-4 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                    <Textarea 
                      id="loneWorkerTask"
                      value={formData.loneWorkerTask}
                      onChange={e => updateField('loneWorkerTask', e.target.value)}
                      placeholder="Describe the specific work activity..."
                      className={cn(
                        "pl-12 bg-slate-50/50 border-slate-200 min-h-[100px] rounded-2xl focus:bg-white focus:border-sitk-yellow transition-all font-bold text-sm pt-4",
                        errors.loneWorkerTask && "border-red-500 bg-red-50/30"
                      )}
                    />
                  </div>
                  {errors.loneWorkerTask && <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest ml-1">{errors.loneWorkerTask}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loneWorkerDate" className="text-slate-400 font-black uppercase text-[9px] tracking-widest ml-1">
                    Date
                  </Label>
                  <div className="relative group/input">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                    <Input 
                      id="loneWorkerDate"
                      type="date"
                      value={formData.loneWorkerDate}
                      onChange={e => updateField('loneWorkerDate', e.target.value)}
                      className="pl-12 bg-slate-50/50 border-slate-200 h-14 rounded-xl focus:bg-white focus:border-sitk-yellow transition-all font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loneWorkerTime" className="text-slate-400 font-black uppercase text-[9px] tracking-widest ml-1">
                    Time
                  </Label>
                  <div className="relative group/input">
                    <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                    <Input 
                      id="loneWorkerTime"
                      type="time"
                      value={formData.loneWorkerTime}
                      onChange={e => updateField('loneWorkerTime', e.target.value)}
                      className="pl-12 bg-slate-50/50 border-slate-200 h-14 rounded-xl focus:bg-white focus:border-sitk-yellow transition-all font-bold text-sm"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 3: Lone Working Evaluation */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-sitk-black text-white rounded-lg flex items-center justify-center font-black text-sm">3</div>
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Lone Working Evaluation <span className="text-red-500">*</span></h2>
          </div>

          <div className="space-y-4">
            {formData.evaluationItems.map((item, index) => (
              <Card key={item.id} className={cn(
                "border-none shadow-sm bg-white rounded-2xl overflow-hidden group hover:shadow-md transition-all duration-300",
                !item.answer && errors.evaluationItems ? "ring-1 ring-red-200 bg-red-50/10" : ""
              )}>
                <CardContent className="p-6 sm:p-8">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-6">
                      <div className="flex gap-4">
                        <div className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center shrink-0 border border-slate-100">
                          <span className="text-slate-400 font-black text-xs">{item.ref}</span>
                        </div>
                        <p className="text-base font-bold text-slate-900 leading-tight pt-1.5">{item.item}</p>
                      </div>
                      
                      {item.ref === '1' && item.answer === 'Yes' && (
                        <motion.div 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-red-600 text-white rounded-xl flex items-center gap-3 shadow-lg shadow-red-100"
                        >
                          <AlertCircle className="w-5 h-5 shrink-0" />
                          <p className="text-xs font-bold leading-relaxed">Lone working should not proceed if it can be avoided. Please review and consider alternatives.</p>
                        </motion.div>
                      )}

                      <div className="flex gap-2">
                        {['Yes', 'No'].map((option) => (
                          <Button
                            key={option}
                            type="button"
                            variant={item.answer === option ? 'default' : 'outline'}
                            onClick={() => updateEvaluationItem(item.id, 'answer', option as any)}
                            className={cn(
                              "flex-1 sm:flex-none min-w-[80px] h-11 rounded-lg font-black uppercase text-[10px] tracking-widest transition-all border-2",
                              item.answer === option 
                                ? (option === 'Yes' ? "bg-green-600 border-green-600 hover:bg-green-700 text-white" : 
                                   "bg-red-600 border-red-600 hover:bg-red-700 text-white")
                                : "border-slate-50 text-slate-400 hover:bg-slate-50 hover:border-slate-100"
                            )}
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="md:w-1/3 space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">
                        Comments
                      </Label>
                      <Textarea 
                        value={item.comments}
                        onChange={e => updateEvaluationItem(item.id, 'comments', e.target.value)}
                        placeholder="Add details..."
                        className="bg-slate-50/50 border-slate-100 rounded-xl text-sm font-bold min-h-[80px] focus:bg-white transition-all p-4"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Section 4: Actions */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-sitk-black text-white rounded-lg flex items-center justify-center font-black text-sm">4</div>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Action Log</h2>
            </div>
            <Button 
              onClick={addActionRow}
              className="bg-sitk-yellow text-sitk-black hover:bg-sitk-yellow/90 font-black uppercase text-[9px] tracking-widest px-4 h-10 rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Action
            </Button>
          </div>

          <div className="space-y-4">
            {formData.actionLog.map((row, index) => (
              <Card key={row.id} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group hover:shadow-md transition-all duration-300">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                        <span className="text-slate-400 font-black text-[10px]">{index + 1}</span>
                      </div>
                      <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-900">Action Entry</h3>
                    </div>
                    {formData.actionLog.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeActionRow(row.id)}
                        className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-slate-900 ml-1">
                        Action taken
                      </Label>
                      <Textarea 
                        value={row.actionTaken}
                        onChange={e => updateActionRow(row.id, 'actionTaken', e.target.value)}
                        placeholder="What needs to be done?"
                        className="bg-slate-50/50 border-slate-100 rounded-xl text-sm font-bold min-h-[80px] focus:bg-white transition-all p-4"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-slate-900 ml-1">
                        Follow up
                      </Label>
                      <Textarea 
                        value={row.followUp}
                        onChange={e => updateActionRow(row.id, 'followUp', e.target.value)}
                        placeholder="Who needs to verify this?"
                        className="bg-slate-50/50 border-slate-100 rounded-xl text-sm font-bold min-h-[80px] focus:bg-white transition-all p-4"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-slate-900 ml-1">
                        Sign off
                      </Label>
                      <Input 
                        value={row.signOff}
                        onChange={e => updateActionRow(row.id, 'signOff', e.target.value)}
                        placeholder="Name of person signing off"
                        className="bg-slate-50/50 border-slate-100 rounded-lg font-bold h-12 focus:bg-white transition-all px-4"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-slate-900 ml-1">
                        Date completed
                      </Label>
                      <Input 
                        type="date"
                        value={row.dateCompleted}
                        onChange={e => updateActionRow(row.id, 'dateCompleted', e.target.value)}
                        className="bg-slate-50/50 border-slate-100 rounded-lg font-bold h-12 focus:bg-white transition-all px-4"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>

      {/* Executive Summary */}
      <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-5 md:p-7 space-y-5 md:space-y-6">
          <SectionHeader title="Executive Summary" icon={FileText} description="Assessor's professional summary — key findings, actions required, and overall compliance judgement" className="mb-0" />
          <Textarea 
            placeholder="Enter the executive summary — key findings, compliance level rationale, recommendations, and actions required..."
            className="min-h-[160px] bg-white border-slate-300 shadow-sm focus-visible:border-sitk-yellow focus-visible:ring-sitk-yellow/35 p-4 resize-none font-medium text-sm"
            value={formData.executiveSummary}
            onChange={e => setFormData(prev => ({ ...prev, executiveSummary: e.target.value }))}
          />
        </CardContent>
      </Card>

      {/* Footer Actions */}
      {/* Photos Section */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
        <PhotoUpload photos={photos} onPhotosChange={updatePhotos} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 p-4 z-50 lg:left-64">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-3">
            <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">Report Status</p>
              <p className="text-sm font-black uppercase tracking-tight text-slate-900">{currentStatus}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-1 sm:flex-none">
            <Button 
              variant="outline" 
              onClick={() => handleSave('Draft')}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none border-slate-200 hover:bg-slate-50 font-black uppercase text-[10px] tracking-widest h-12 px-8 rounded-xl transition-all"
            >
              <Save className="w-4 h-4 mr-2" /> Save Draft
            </Button>
            <Button 
              onClick={() => handleSave('Submitted')}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none bg-sitk-black text-white hover:bg-slate-800 font-black uppercase text-[10px] tracking-widest h-12 px-10 rounded-xl shadow-xl shadow-sitk-black/10 transition-all"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" /> Submit Checklist
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Success Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 bg-sitk-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white rounded-[3rem] p-12 flex flex-col items-center text-center max-w-sm w-full shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-2 bg-sitk-yellow" />
            <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mb-8 shadow-inner">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-2">
              {currentStatus === 'Draft' ? 'Draft Saved' : 'Checklist Submitted'}
            </h3>
            <p className="text-slate-500 font-medium mb-8 leading-relaxed">
              {currentStatus === 'Draft' 
                ? 'Your progress has been saved. You can complete this checklist later from your dashboard.' 
                : 'The Lone Working Risk Evaluation has been successfully recorded.'}
            </p>
            <div className="pt-2 flex flex-col items-center gap-6 w-full">
              <div className={cn(
                "w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg border-2",
                currentStatus === 'Draft' ? "bg-yellow-50 text-yellow-600 border-yellow-200" : "bg-sitk-black text-white border-sitk-black"
              )}>
                {currentStatus}
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div 
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      className="w-1.5 h-1.5 bg-sitk-yellow rounded-full"
                    />
                  ))}
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
                  Redirecting
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
