import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ClipboardCheck, 
  User, 
  Building, 
  Calendar, 
  Clock, 
  Info, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Save, 
  Send, 
  ChevronLeft,
  Plus,
  Trash2,
  MapPin,
  FileText,
  ShieldAlert
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import { mockUser, saveReport } from '../lib/mockData';
import { exportSavedReportToPDF } from '../lib/exportUtils';
import { DEFAULT_BRANDING } from '../lib/brandingContext';
import { getSession } from '../lib/auth';
import { useAutoSave, getAutoSavedData } from '../lib/useAutoSave';
import { usePhotoStore } from '../lib/usePhotoStore';
import PhotoUpload from '../components/PhotoUpload';
import { ConstructionSiteChecklistReport, ReportStatus, SiteInductionEntry, WorkerSignature } from '../types';
import StatusBadge from '../components/StatusBadge';
import SectionHeader from '../components/SectionHeader';

const INDUCTION_ITEMS = [
  "Describe the Project and works involved",
  "Name all key persons: Manager; Supervisor; Foreman; First-Aider etc.",
  "Identify Site boundaries; security; Notice Boards; parking etc.",
  "Discuss the major Site risks, rules, and dangers/hazards. Discuss the RAMs & CPP (Risk Assessments Method Statements & Construction Phase Plan)",
  "Discuss duty to work safely; report any hazards and not use faulty equipment",
  "Discuss Site materials affecting health i.e. asbestos; lead; chemicals; dust etc.",
  "If asbestos may be present, all workers must have had asbestos training in the last 12 months",
  "Identify any tasks needing special training/experience or specialist cards, e.g. CSCS; Gas Safe; JIB; IPAF etc.",
  "Discuss the WHAT, WHEN and WHERE of PPE (personal protective equipment) and that it must be worn correctly and be suitable",
  "Explain the fire emergency procedures, exit routes and location of fire extinguishers",
  "Discuss what and where the welfare facilities are, i.e. toilets; washing/changing/eating areas; water etc. Must be kept clean",
  "Discuss the first aid facilities and procedures including first aider; first-aid kit; accident book; telephones etc.",
  "Explain why any safety signs and fences/barriers are in place",
  "Discuss any environmental concerns on this Site i.e. pollution; noise; waste",
  "Discuss the works that will need a signed Permit to Work, i.e. hot works; roof works; confined space etc.",
  "Discuss safe work at height, i.e. work near edges; use of scaffold; ladders; steps; MEWPs; hop-ups etc.",
  "Discuss arrangements for safe electrical and gas work on Site",
  "Staff must report all accidents and write them in the book",
  "Discuss working safely with or around other contractors on the Site",
  "Discuss when safety briefings / ToolBox Talks will occur",
  "Have all workers undertaken the free online CITB Level 1 Course: Fire Safety Awareness in Construction and the Built Environment?",
  "Any other site-specific items"
];

const RequiredLabel = ({ children, required, htmlFor }: { children: React.ReactNode, required?: boolean, htmlFor?: string }) => (
  <Label htmlFor={htmlFor} className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
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

export default function ConstructionSiteChecklistForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const editId = (location.state as any)?.editId as string | undefined;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<ReportStatus>('Draft');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    carriedBy: (getSession()?.name ?? ''),
    signature: '',
    date: new Date().toISOString().split('T')[0],
    ref: '',
    fullSiteAddress: '',
    startDate: '',
    estimatedFinishDate: '',
    
    inductionEntries: INDUCTION_ITEMS.map((item, index) => ({
      id: `item-${index + 1}`,
      label: item,
      answer: undefined as 'Yes' | 'No' | 'N/A' | undefined,
      notes: ''
    })),
    
    workerSignatures: [
      { id: 'w1', printName: '', signature: '', date: new Date().toISOString().split('T')[0] },
      { id: 'w2', printName: '', signature: '', date: new Date().toISOString().split('T')[0] }
    ],
    executiveSummary: ''
  });

  const updateEntry = (id: string, field: 'answer' | 'notes', value: any) => {
    setFormData(prev => ({
      ...prev,
      inductionEntries: prev.inductionEntries.map(entry => 
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    }));
  };

  const updateWorker = (id: string, field: keyof WorkerSignature, value: string) => {
    setFormData(prev => ({
      ...prev,
      workerSignatures: prev.workerSignatures.map(worker => 
        worker.id === id ? { ...worker, [field]: value } : worker
      )
    }));
  };

  const addWorker = () => {
    const newId = `w${formData.workerSignatures.length + 1}`;
    setFormData(prev => ({
      ...prev,
      workerSignatures: [
        ...prev.workerSignatures,
        { id: newId, printName: '', signature: '', date: new Date().toISOString().split('T')[0] }
      ]
    }));
  };

  const removeWorker = (id: string) => {
    if (formData.workerSignatures.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      workerSignatures: prev.workerSignatures.filter(w => w.id !== id)
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.carriedBy) newErrors.carriedBy = 'Required';
    if (!formData.signature) newErrors.signature = 'Signature required';
    if (!formData.date) newErrors.date = 'Date required';
    if (!formData.fullSiteAddress) newErrors.fullSiteAddress = 'Site address is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    
    const unanswered = formData.inductionEntries.filter(e => !e.answer);
    if (unanswered.length > 0) {
      newErrors.induction = `Please complete all ${unanswered.length} checklist items`;
    }

    if (formData.workerSignatures.length === 0) {
      newErrors.workers = 'At least one worker signature is required';
    } else {
      const invalidWorkers = formData.workerSignatures.some(w => !w.printName || !w.signature);
      if (invalidWorkers) {
        newErrors.workers = 'Please ensure all added workers have a name and signature';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { photos, updatePhotos, clearPhotos } = usePhotoStore('construction_site');
  const { clearAutoSave } = useAutoSave('construction_site', formData);
  React.useEffect(() => {
    const saved = getAutoSavedData<any>('construction_site'); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (saved) setFormData(saved);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (status: ReportStatus) => {
    if (status === 'Submitted' && !validateForm()) {
      const firstError = document.querySelector('.text-red-500');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    clearAutoSave();
    setIsSubmitting(true);
    setCurrentStatus(status);

    try {
      const newReport: ConstructionSiteChecklistReport = {
        id: editId ?? `r${Date.now()}`,
        title: `Site Induction - ${formData.fullSiteAddress.split(',')[0] || 'New Site'}`,
        type: 'Construction Site Checklist',
        status: status,
        location: formData.fullSiteAddress,
        date: formData.date,
        authorId: mockUser.id,
        description: `Construction Site Induction Checklist carried out by ${formData.carriedBy}`,
        photos,
        ...formData
      };

      console.log('[ConstructionSiteChecklistForm] Saving report...');
      saveReport(newReport);
      clearPhotos();

      if (status === 'Submitted') {
        try {
          await exportSavedReportToPDF(newReport, DEFAULT_BRANDING);
        } catch (pdfErr) {
          console.error('[ConstructionSiteChecklistForm] PDF generation failed:', pdfErr);
        }
      }

      console.log('[ConstructionSiteChecklistForm] Saved, navigating.');
      navigate('/my-reports');
    } catch (err) {
      console.error('[ConstructionSiteChecklistForm] Save failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-7 md:space-y-8 pb-24 md:pb-12 px-1 sm:px-2">
      {/* Header Actions */}
      <div className="sticky top-2 md:top-3 z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 rounded-xl border border-slate-200/80 bg-white/95 backdrop-blur px-3 py-2 shadow-sm">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 h-9"
          >
            <ChevronLeft className="mr-2 h-3.5 w-3.5" />
            Back
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full animate-pulse",
              currentStatus === 'Draft' ? "bg-yellow-400" : 
              currentStatus === 'Submitted' ? "bg-blue-400" : "bg-green-400"
            )} />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
            <StatusBadge status={currentStatus} />
          </div>
        </div>
        <div className="flex gap-2.5">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleSave('Draft')}
            disabled={isSubmitting}
            className="font-black uppercase text-[10px] tracking-widest border-slate-200 hover:bg-slate-50 hover:border-slate-300 min-w-[110px] h-9 transition-all"
          >
            {isSubmitting && currentStatus === 'Draft' ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <Clock className="h-3.5 w-3.5" />
              </motion.div>
            ) : (
              <Save className="mr-2 h-3.5 w-3.5 text-slate-400" />
            )}
            {isSubmitting && currentStatus === 'Draft' ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button 
            size="sm" 
            onClick={() => handleSave('Submitted')}
            disabled={isSubmitting}
            className="bg-sitk-black text-white hover:bg-slate-800 font-black uppercase text-[10px] tracking-widest min-w-[130px] h-9 shadow-sm transition-all"
          >
            {isSubmitting && currentStatus === 'Submitted' ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <Clock className="h-3.5 w-3.5" />
              </motion.div>
            ) : (
              <Send className="mr-2 h-3.5 w-3.5" />
            )}
            {isSubmitting && currentStatus === 'Submitted' ? 'Submitting...' : 'Submit Checklist'}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 leading-none">Construction Site Checklist / Site Induction Checklist</h1>
        <div className="flex items-center gap-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Safety is the Key Ltd • Site Management</p>
          <div className="h-px w-12 bg-slate-200" />
          <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-200 text-[9px] font-black uppercase tracking-widest px-2 py-0">v1.0</Badge>
        </div>
      </div>

      {/* Note Panel */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex items-start gap-4">
        <div className="bg-sitk-yellow p-2 rounded-xl">
          <Info className="w-5 h-5 text-sitk-black" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest mb-1 text-sitk-yellow">Important Note</p>
          <p className="text-sm font-medium leading-relaxed opacity-90">
            Talk through this with all workers before they commence work on this Project.
          </p>
        </div>
      </div>

      {/* Section 1: Site Details */}
      <Card className="border-none shadow-md overflow-hidden bg-white rounded-3xl">
        <div className="p-6 sm:p-8 pb-0">
          <SectionHeader 
            title="Section 1: Site Details" 
            icon={MapPin} 
            description="Project and Location Information" 
            className="mb-0"
          />
        </div>
        <CardContent className="p-6 sm:p-8 pt-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <RequiredLabel required>Carried out by</RequiredLabel>
              <Input 
                value={formData.carriedBy}
                onChange={e => {
                  setFormData(prev => ({ ...prev, carriedBy: e.target.value }));
                  if (errors.carriedBy) setErrors(prev => ({ ...prev, carriedBy: '' }));
                }}
                placeholder="Full Name" 
                className={cn(
                  "bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow h-12 rounded-xl transition-all hover:bg-white",
                  errors.carriedBy && "border-red-500 focus-visible:ring-red-500 bg-red-50/30"
                )}
              />
              <ErrorMessage message={errors.carriedBy} />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel required>Signature</RequiredLabel>
              <Input 
                value={formData.signature}
                onChange={e => {
                  setFormData(prev => ({ ...prev, signature: e.target.value }));
                  if (errors.signature) setErrors(prev => ({ ...prev, signature: '' }));
                }}
                placeholder="Manager Signature" 
                className={cn(
                  "bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow h-12 rounded-xl transition-all hover:bg-white",
                  errors.signature && "border-red-500 focus-visible:ring-red-500 bg-red-50/30"
                )}
              />
              <ErrorMessage message={errors.signature} />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel required>Date</RequiredLabel>
              <Input 
                type="date"
                value={formData.date}
                onChange={e => {
                  setFormData(prev => ({ ...prev, date: e.target.value }));
                  if (errors.date) setErrors(prev => ({ ...prev, date: '' }));
                }}
                className={cn(
                  "bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow h-12 rounded-xl transition-all hover:bg-white",
                  errors.date && "border-red-500 focus-visible:ring-red-500 bg-red-50/30"
                )}
              />
              <ErrorMessage message={errors.date} />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel>Project Reference</RequiredLabel>
              <Input 
                value={formData.ref}
                onChange={e => setFormData(prev => ({ ...prev, ref: e.target.value }))}
                placeholder="e.g. PRJ-2024-001" 
                className="bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow h-12 rounded-xl transition-all hover:bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel required>Start Date</RequiredLabel>
              <Input 
                type="date"
                value={formData.startDate}
                onChange={e => {
                  setFormData(prev => ({ ...prev, startDate: e.target.value }));
                  if (errors.startDate) setErrors(prev => ({ ...prev, startDate: '' }));
                }}
                className={cn(
                  "bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow h-12 rounded-xl transition-all hover:bg-white",
                  errors.startDate && "border-red-500 focus-visible:ring-red-500 bg-red-50/30"
                )}
              />
              <ErrorMessage message={errors.startDate} />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel>Estimated Finish Date</RequiredLabel>
              <Input 
                type="date"
                value={formData.estimatedFinishDate}
                onChange={e => setFormData(prev => ({ ...prev, estimatedFinishDate: e.target.value }))}
                className="bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow h-12 rounded-xl transition-all hover:bg-white"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <RequiredLabel required>Full Site Address</RequiredLabel>
              <Textarea 
                value={formData.fullSiteAddress}
                onChange={e => {
                  setFormData(prev => ({ ...prev, fullSiteAddress: e.target.value }));
                  if (errors.fullSiteAddress) setErrors(prev => ({ ...prev, fullSiteAddress: '' }));
                }}
                placeholder="Enter the complete address of the construction site..."
                className={cn(
                  "bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow min-h-[80px] resize-none rounded-xl transition-all hover:bg-white p-4",
                  errors.fullSiteAddress && "border-red-500 focus-visible:ring-red-500 bg-red-50/30"
                )}
              />
              <ErrorMessage message={errors.fullSiteAddress} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Site Induction Checklist */}
      <Card className="border-none shadow-md overflow-hidden bg-white rounded-3xl">
        <div className="p-6 sm:p-8 pb-0">
          <SectionHeader 
            title="Section 2: Site Induction Checklist" 
            icon={ClipboardCheck} 
            description="Safety briefing and induction items" 
            className="mb-0"
          />
        </div>
        <CardContent className="p-0 pt-8">
          <div className="divide-y divide-slate-100">
            {formData.inductionEntries.map((entry) => (
              <div key={entry.id} className="p-6 sm:p-8 space-y-6 hover:bg-slate-50/30 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-4">
                      <span className="text-[10px] font-black text-sitk-yellow bg-sitk-black w-6 h-6 flex items-center justify-center rounded-lg shadow-sm shrink-0">
                        {entry.id.split('-')[1]}
                      </span>
                      <p className="text-[15px] font-bold text-slate-800 leading-snug">{entry.label}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 lg:w-[520px] shrink-0">
                    <div className="grid grid-cols-3 gap-2 w-full sm:w-[240px]">
                      {['Yes', 'No', 'N/A'].map((opt) => (
                        <button 
                          key={opt}
                          onClick={() => updateEntry(entry.id, 'answer', opt)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all active:scale-95 shadow-sm",
                            entry.answer === opt 
                              ? opt === 'Yes' ? "bg-green-500 border-green-500 text-white shadow-green-200" :
                                opt === 'No' ? "bg-red-500 border-red-500 text-white shadow-red-200" :
                                "bg-slate-700 border-slate-700 text-white shadow-slate-200"
                              : "border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200 hover:bg-white"
                          )}
                        >
                          {opt === 'Yes' ? <CheckCircle2 className="w-4 h-4" /> : 
                           opt === 'No' ? <XCircle className="w-4 h-4" /> : 
                           <Info className="w-4 h-4" />}
                          <span className="text-[9px] font-black uppercase tracking-widest">{opt}</span>
                        </button>
                      ))}
                    </div>
                    <div className="flex-1">
                      <Textarea 
                        value={entry.notes}
                        onChange={e => updateEntry(entry.id, 'notes', e.target.value)}
                        placeholder="Add notes or details..."
                        className="bg-slate-50/50 border-slate-200 min-h-[48px] h-12 text-xs rounded-2xl focus-visible:ring-sitk-yellow transition-all hover:bg-white py-3 resize-none shadow-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {errors.induction && (
            <div className="p-4 bg-red-50 border-t border-red-100 flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{errors.induction}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Worker Declaration */}
      <Card className="border-none shadow-md overflow-hidden bg-white rounded-3xl">
        <div className="p-6 sm:p-8 pb-0">
          <SectionHeader 
            title="Section 3: Worker Declaration" 
            icon={ShieldAlert} 
            description="Induction acknowledgement and sign-off" 
            className="mb-0"
          />
        </div>
        <CardContent className="p-6 sm:p-8 space-y-10 pt-8">
          <div className="bg-slate-900 p-8 rounded-[2rem] border-l-8 border-l-sitk-yellow shadow-xl">
            <p className="text-base font-black text-white leading-relaxed italic opacity-90">
              "I have read or been briefed in the above and understand it. I will use safe systems of work and wear all PPE correctly."
            </p>
          </div>

          <div className="space-y-8">
            {formData.workerSignatures.map((worker, index) => (
              <div key={worker.id} className="p-6 sm:p-8 rounded-[2rem] border border-slate-100 bg-slate-50/30 space-y-6 relative group hover:border-sitk-yellow/50 hover:bg-white transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-sitk-black text-sitk-yellow flex items-center justify-center text-xs font-black shadow-lg shadow-sitk-black/10">
                      {index + 1}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-sitk-black">Worker Signature</span>
                      <span className="text-[9px] font-bold uppercase tracking-tighter text-slate-400">Row {index + 1}</span>
                    </div>
                  </div>
                  {formData.workerSignatures.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeWorker(worker.id)}
                      className="text-red-400 hover:text-red-500 hover:bg-red-50 h-10 w-10 p-0 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1.5">
                    <RequiredLabel required>Print Name</RequiredLabel>
                    <Input 
                      value={worker.printName}
                      onChange={e => updateWorker(worker.id, 'printName', e.target.value)}
                      placeholder="Full Name" 
                      className={cn(
                        "bg-white border-slate-200 h-12 rounded-xl focus-visible:ring-sitk-yellow transition-all shadow-sm",
                        errors.workers && !worker.printName && "border-red-500 focus-visible:ring-red-500 bg-red-50/30"
                      )}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <RequiredLabel required>Signature</RequiredLabel>
                    <Input 
                      value={worker.signature}
                      onChange={e => updateWorker(worker.id, 'signature', e.target.value)}
                      placeholder="Sign here" 
                      className={cn(
                        "bg-white border-slate-200 h-12 rounded-xl focus-visible:ring-sitk-yellow transition-all shadow-sm",
                        errors.workers && !worker.signature && "border-red-500 focus-visible:ring-red-500 bg-red-50/30"
                      )}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <RequiredLabel required>Date</RequiredLabel>
                    <Input 
                      type="date"
                      value={worker.date}
                      onChange={e => updateWorker(worker.id, 'date', e.target.value)}
                      className={cn(
                        "bg-white border-slate-200 h-12 rounded-xl focus-visible:ring-sitk-yellow transition-all shadow-sm",
                        errors.workers && !worker.date && "border-red-500 focus-visible:ring-red-500 bg-red-50/30"
                      )}
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <Button 
              variant="outline" 
              onClick={addWorker}
              className="w-full py-10 border-dashed border-2 border-slate-200 text-slate-400 hover:text-sitk-black hover:border-sitk-yellow hover:bg-sitk-yellow/5 rounded-3xl transition-all font-black uppercase text-[11px] tracking-widest group"
            >
              <Plus className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Add Another Worker Signature
            </Button>
            {errors.workers && <ErrorMessage message={errors.workers} />}
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Footer Note */}
      <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 text-center space-y-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Important Disclaimer</p>
        <p className="text-xs text-slate-500 leading-relaxed max-w-2xl mx-auto">
          This Checklist is designed to be a reminder of some of the health and safety checks required in the workplace - NOT a definitive or official list.
        </p>
      </div>

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
      <div className="flex flex-col sm:flex-row items-center justify-between p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl gap-8">
        <div className="flex items-center gap-5">
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner transition-all duration-500",
            currentStatus === 'Draft' ? "bg-yellow-50 border-yellow-100 rotate-[-2deg]" : 
            currentStatus === 'Submitted' ? "bg-blue-50 border-blue-100 rotate-[2deg]" : "bg-green-50 border-green-100"
          )}>
            <Clock className={cn(
              "w-7 h-7",
              currentStatus === 'Draft' ? "text-yellow-500" : 
              currentStatus === 'Submitted' ? "text-blue-500" : "text-green-500"
            )} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Current Status</p>
            <StatusBadge status={currentStatus} className="px-4 py-1.5" />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={() => handleSave('Draft')}
            disabled={isSubmitting}
            className="font-black uppercase text-[11px] tracking-widest border-slate-200 py-8 px-12 hover:bg-slate-50 hover:border-slate-300 rounded-2xl transition-all w-full sm:w-auto shadow-sm active:scale-95"
          >
            {isSubmitting && currentStatus === 'Draft' ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <Clock className="h-4 w-4" />
              </motion.div>
            ) : (
              <Save className="mr-3 h-4 w-4 text-slate-400" />
            )}
            {isSubmitting && currentStatus === 'Draft' ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button 
            onClick={() => handleSave('Submitted')}
            disabled={isSubmitting}
            className="bg-sitk-black text-white hover:bg-slate-800 font-black uppercase text-[11px] tracking-widest py-8 px-14 rounded-2xl shadow-2xl shadow-sitk-black/30 transition-all w-full sm:w-auto active:scale-95 group"
          >
            {isSubmitting && currentStatus === 'Submitted' ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <Clock className="h-4 w-4" />
              </motion.div>
            ) : (
              <Send className="mr-3 h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            )}
            {isSubmitting && currentStatus === 'Submitted' ? 'Submitting...' : 'Submit Induction'}
          </Button>
        </div>
      </div>
    </div>
  );
}
