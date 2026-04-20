import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  ShieldCheck, 
  AlertCircle, 
  Save, 
  Send, 
  ChevronLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Info,
  Briefcase,
  ClipboardCheck,
  Signature
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import { mockUser, mockReports, mockActivities, saveReport } from '../lib/mockData';
import { exportSavedReportToPDF } from '../lib/exportUtils';
import { DEFAULT_BRANDING } from '../lib/brandingContext';
import { useAutoSave, getAutoSavedData } from '../lib/useAutoSave';
import { usePhotoStore } from '../lib/usePhotoStore';
import PhotoUpload from '../components/PhotoUpload';
import { ContractorVettingReport, ReportStatus, VettingQuestion } from '../types';
import StatusBadge from '../components/StatusBadge';
import SectionHeader from '../components/SectionHeader';

const VETTING_QUESTIONS_SMALL = [
  { id: 'Q1', question: 'If you have 5 or more workers or are a Limited Company – do not use this form but request a copy of the 10-001 Ltd Contractors Vetting Form.', helper: 'This form is strictly for smaller or single-person contractors.' },
  { id: 'Q2', question: 'As you have under 5 employees, please sign here to agree that you will work safely according to our H&S Policy. A copy is available on request.', hasSignature: true, signatureLabel: 'Signature' },
  { id: 'Q3', question: 'Name who has overall responsibility for your organisation’s health and safety.', isText: true },
  { id: 'Q4', question: 'Confirm you have the correct PL (Public Liability) and EL (Employers Liability) Insurance Certificates.' },
  { id: 'Q5', question: 'Do you understand the concept of suitable Risk Assessments and Method Statements (RAMs) for the work that you will carry out?' },
  { id: 'Q6', question: 'Where specialist work is carried out, do you have the correct training and certification in place? e.g. asbestos / electrical / gas / scaffolding etc.' },
  { id: 'Q7', question: 'Please sign to agree NOT to sub-contract the work that we have asked you to do to others. If you do sub-contract some or all of the work, please ask for another copy of this form and pass it on to your sub-contractor to complete and return.', hasSignature: true, signatureLabel: 'Signature' }
];

const RequiredLabel = ({ children, required, htmlFor, className }: { children: React.ReactNode, required?: boolean, htmlFor?: string, className?: string }) => (
  <Label htmlFor={htmlFor} className={cn("text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block", className)}>
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

export default function ContractorVettingSmallForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const editId = (location.state as any)?.editId as string | undefined;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<ReportStatus>('Draft');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    address: '',
    contactName: '',
    tel: '',
    workTypes: '',
    
    questions: VETTING_QUESTIONS_SMALL.map(q => ({
      id: q.id,
      question: q.question,
      answer: undefined as 'Yes' | 'No' | 'N/A' | undefined,
      notes: '',
      signature: ''
    })),
    
    declarationName: '',
    declarationSignature: '',
    declarationPosition: '',
    declarationDate: new Date().toISOString().split('T')[0],
    
    officeUse: {
      status: undefined as 'APPROVED' | 'NOT APPROVED' | undefined,
      failureReason: '',
      assessor: '',
      date: '',
      reviewDate: '',
      insuranceExpiry: '',
      notes: ''
    },
    executiveSummary: ''
  });

  const updateQuestion = (id: string, field: keyof VettingQuestion, value: any) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === id ? { ...q, [field]: value } : q)
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.companyName) newErrors.companyName = 'Required';
    if (!formData.email) newErrors.email = 'Required';
    if (!formData.contactName) newErrors.contactName = 'Required';
    
    if (!formData.declarationName) newErrors.declarationName = 'Required';
    if (!formData.declarationSignature) newErrors.declarationSignature = 'Required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { photos, updatePhotos, clearPhotos } = usePhotoStore('contractor_vetting_small');
  const { clearAutoSave } = useAutoSave('contractor_vetting_small', formData);
  React.useEffect(() => {
    const saved = getAutoSavedData<any>('contractor_vetting_small'); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (saved) setFormData(saved);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (status: ReportStatus) => {
    if (status === 'Submitted' && !validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    clearAutoSave();
    setIsSubmitting(true);
    setCurrentStatus(status);

    try {
      const newReport: ContractorVettingReport = {
        id: editId ?? `r${Date.now()}`,
        title: `Contractor Vetting (Small) - ${formData.companyName || 'New Contractor'}`,
        type: 'Contractor Vetting 10-002',
        status: status,
        location: formData.address || 'Not Specified',
        date: new Date().toISOString().split('T')[0],
        authorId: mockUser.id,
        description: `Small contractor vetting form for ${formData.companyName}`,
        photos,
        ...formData,
        accidentRecords: [] // Not used in 10-002
      };

      console.log('[ContractorVettingSmallForm] Saving report...');
      saveReport(newReport);
      clearPhotos();

      if (status === 'Submitted') {
        try {
          await exportSavedReportToPDF(newReport, DEFAULT_BRANDING);
        } catch (pdfErr) {
          console.error('[ContractorVettingSmallForm] PDF generation failed:', pdfErr);
        }
      }

      console.log('[ContractorVettingSmallForm] Saved, navigating.');
      navigate('/my-reports');
    } catch (err) {
      console.error('[ContractorVettingSmallForm] Save failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-32 px-4 sm:px-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
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
            {isSubmitting && currentStatus === 'Submitted' ? 'Submitting...' : 'Submit Form'}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 leading-none">10-002 Smaller Contractors/Sub-Contractors Vetting Form</h1>
        <div className="flex items-center gap-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Safety is the Key Ltd • Contractor Management</p>
          <div className="h-px w-12 bg-slate-200" />
          <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-200 text-[9px] font-black uppercase tracking-widest px-2 py-0">v1.0</Badge>
        </div>
      </div>

      {/* Note Panel */}
      <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl flex items-start gap-6">
        <div className="bg-sitk-yellow p-3 rounded-xl">
          <Info className="w-6 h-6 text-sitk-black" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest mb-1 text-sitk-yellow">Notes</p>
          <p className="text-sm font-medium leading-relaxed opacity-90">
            Use this form for smaller or single-person Contractors or Sub-Contractors.
          </p>
        </div>
      </div>

      {/* Section 1: Contractor Details */}
      <Card className="border-none shadow-md overflow-hidden bg-white rounded-[2rem]">
        <div className="p-6 sm:p-8 pb-0">
          <SectionHeader 
            title="Section 1: Contractor Details" 
            icon={Building2} 
            description="Company information and contact details" 
            className="mb-0"
          />
        </div>
        <CardContent className="p-6 sm:p-8 pt-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5 lg:col-span-2">
              <RequiredLabel required>Contractor Company Name</RequiredLabel>
              <Input 
                value={formData.companyName}
                onChange={e => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="Enter company name..." 
                className={cn(
                  "bg-slate-50/50 border-slate-200 h-12 rounded-xl focus-visible:ring-sitk-yellow transition-all hover:bg-white",
                  errors.companyName && "border-red-500 bg-red-50/30"
                )}
              />
              <ErrorMessage message={errors.companyName} />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel required>Email</RequiredLabel>
              <Input 
                type="email"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@company.com" 
                className={cn(
                  "bg-slate-50/50 border-slate-200 h-12 rounded-xl focus-visible:ring-sitk-yellow transition-all hover:bg-white",
                  errors.email && "border-red-500 bg-red-50/30"
                )}
              />
              <ErrorMessage message={errors.email} />
            </div>
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <RequiredLabel>Address</RequiredLabel>
              <Textarea 
                value={formData.address}
                onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Full business address..."
                className="bg-slate-50/50 border-slate-200 min-h-[80px] resize-none rounded-xl focus-visible:ring-sitk-yellow transition-all hover:bg-white p-4"
              />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel required>Contact Name</RequiredLabel>
              <Input 
                value={formData.contactName}
                onChange={e => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                placeholder="Lead contact person" 
                className={cn(
                  "bg-slate-50/50 border-slate-200 h-12 rounded-xl focus-visible:ring-sitk-yellow transition-all hover:bg-white",
                  errors.contactName && "border-red-500 bg-red-50/30"
                )}
              />
              <ErrorMessage message={errors.contactName} />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel>Tel</RequiredLabel>
              <Input 
                value={formData.tel}
                onChange={e => setFormData(prev => ({ ...prev, tel: e.target.value }))}
                placeholder="Phone number" 
                className="bg-slate-50/50 border-slate-200 h-12 rounded-xl focus-visible:ring-sitk-yellow transition-all hover:bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel>Type(s) of work</RequiredLabel>
              <Input 
                value={formData.workTypes}
                onChange={e => setFormData(prev => ({ ...prev, workTypes: e.target.value }))}
                placeholder="e.g. Electrical, Plumbing, etc." 
                className="bg-slate-50/50 border-slate-200 h-12 rounded-xl focus-visible:ring-sitk-yellow transition-all hover:bg-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Vetting Questions */}
      <div className="space-y-8">
        <SectionHeader 
          title="Section 2: Vetting Questions" 
          icon={ClipboardCheck} 
          description="Compliance and safety questionnaire. Please answer all questions accurately." 
        />
        
        <div className="grid gap-6">
          {VETTING_QUESTIONS_SMALL.map((q, index) => {
            const entry = formData.questions.find(item => item.id === q.id);
            return (
              <motion.div 
                key={q.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden group"
              >
                <div className="p-8 sm:p-10 space-y-8">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-10">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start gap-5">
                        <span className="text-[11px] font-black text-sitk-yellow bg-sitk-black w-10 h-10 flex items-center justify-center rounded-2xl shadow-lg shrink-0 group-hover:scale-110 transition-transform">
                          {q.id}
                        </span>
                        <div className="space-y-3 pt-1">
                          <p className="text-lg font-black text-slate-900 leading-tight tracking-tight">{q.question}</p>
                          {q.helper && (
                            <p className="text-xs text-slate-400 font-medium italic border-l-2 border-slate-100 pl-4 py-1">
                              {q.helper}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 lg:w-[580px] shrink-0">
                      {!q.isText && (
                        <div className="flex p-1.5 bg-slate-50 rounded-[1.5rem] border border-slate-100 w-full sm:w-[280px] h-fit">
                          {['Yes', 'No', 'N/A'].map((opt) => (
                            <button 
                              key={opt}
                              type="button"
                              onClick={() => updateQuestion(q.id, 'answer', opt)}
                              className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl transition-all active:scale-95 font-black text-[10px] uppercase tracking-widest",
                                entry?.answer === opt 
                                  ? opt === 'Yes' ? "bg-green-600 text-white shadow-xl shadow-green-200" :
                                    opt === 'No' ? "bg-red-600 text-white shadow-xl shadow-red-200" :
                                    "bg-slate-800 text-white shadow-xl shadow-slate-300"
                                  : "text-slate-400 hover:text-slate-600 hover:bg-white"
                              )}
                            >
                              {entry?.answer === opt && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                  {opt === 'Yes' ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                                   opt === 'No' ? <XCircle className="w-3.5 h-3.5" /> : 
                                   <Info className="w-3.5 h-3.5" />}
                                </motion.div>
                              )}
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex-1 space-y-4">
                        {q.isText ? (
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Responsible Person</Label>
                            <Input 
                              value={(entry?.answer as string) ?? ''}
                              onChange={e => updateQuestion(q.id, 'answer', e.target.value)}
                              placeholder="Enter full name..."
                              className="bg-slate-50/50 border-slate-200 h-14 rounded-2xl focus-visible:ring-sitk-yellow transition-all hover:bg-white px-5 font-bold"
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Notes / Actions</Label>
                            <Textarea 
                              value={entry?.notes}
                              onChange={e => updateQuestion(q.id, 'notes', e.target.value)}
                              placeholder="Add any relevant notes..."
                              className="bg-slate-50/50 border-slate-200 min-h-[56px] h-14 text-sm rounded-2xl focus-visible:ring-sitk-yellow transition-all hover:bg-white p-4 resize-none shadow-none"
                            />
                          </div>
                        )}
                        
                        {q.hasSignature && (
                          <div className="space-y-3 p-6 bg-sitk-yellow/5 rounded-[2rem] border border-sitk-yellow/20 shadow-inner group/sig">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-sitk-yellow ml-1 flex items-center gap-2">
                              <Signature className="w-4 h-4 text-sitk-yellow" />
                              {q.signatureLabel || 'Signature Confirmation'}
                            </Label>
                            <div className="relative">
                              <Input 
                                value={entry?.signature}
                                onChange={e => updateQuestion(q.id, 'signature', e.target.value)}
                                placeholder="Type name to sign..."
                                className="bg-white border-sitk-yellow/30 h-14 rounded-2xl focus-visible:ring-sitk-yellow transition-all px-6 font-signature text-xl text-slate-700 shadow-sm group-hover/sig:border-sitk-yellow/50"
                              />
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-sitk-yellow/40 uppercase tracking-widest pointer-events-none">Digital Signature</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Note */}
      <Card className="border-none shadow-md overflow-hidden bg-white rounded-[2rem]">
        <div className="p-6 sm:p-8 pb-0">
          <SectionHeader 
            title="Section 3: Note" 
            icon={FileText} 
            description="Additional information regarding the vetting process" 
            className="mb-0"
          />
        </div>
        <CardContent className="p-6 sm:p-8 pt-8 space-y-4">
          <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-6 h-6 rounded-lg bg-sitk-black text-sitk-yellow flex items-center justify-center text-[10px] font-black shrink-0">1</div>
            <p className="text-sm font-medium text-slate-600 leading-relaxed">
              We may ask for references from previous clients so may contact you again to ask for client contact details.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Declaration */}
      <div className="space-y-8">
        <SectionHeader 
          title="Section 4: Declaration" 
          icon={ShieldCheck} 
          description="Contractor acknowledgement and sign-off" 
        />
        
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 sm:p-12 space-y-10">
            <div className="bg-slate-900 p-10 rounded-[2.5rem] border-l-[12px] border-l-sitk-yellow shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-sitk-yellow/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-sitk-yellow/10 transition-colors duration-700" />
              <p className="text-xl font-black text-white leading-relaxed italic opacity-90 relative z-10">
                "I hereby declare that the information provided in this vetting form is accurate and complete to the best of my knowledge."
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-3">
                <RequiredLabel required className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">PRINT Name</RequiredLabel>
                <Input 
                  value={formData.declarationName}
                  onChange={e => setFormData(prev => ({ ...prev, declarationName: e.target.value }))}
                  placeholder="Full Name" 
                  className={cn(
                    "bg-slate-50/50 border-slate-200 h-16 rounded-2xl focus-visible:ring-sitk-yellow transition-all hover:bg-white px-6 font-bold text-lg",
                    errors.declarationName && "border-red-500 bg-red-50/30"
                  )}
                />
                <ErrorMessage message={errors.declarationName} />
              </div>
              <div className="space-y-3">
                <RequiredLabel required className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Digital Signature</RequiredLabel>
                <div className="relative group/sig">
                  <Input 
                    value={formData.declarationSignature}
                    onChange={e => setFormData(prev => ({ ...prev, declarationSignature: e.target.value }))}
                    placeholder="Type name to sign..." 
                    className={cn(
                      "bg-slate-50/50 border-slate-200 h-16 rounded-2xl focus-visible:ring-sitk-yellow transition-all hover:bg-white px-6 font-signature text-2xl text-slate-700",
                      errors.declarationSignature && "border-red-500 bg-red-50/30"
                    )}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-sitk-yellow/40 uppercase tracking-widest pointer-events-none opacity-0 group-hover/sig:opacity-100 transition-opacity">Sign Here</div>
                </div>
                <ErrorMessage message={errors.declarationSignature} />
              </div>
              <div className="space-y-3">
                <RequiredLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Position</RequiredLabel>
                <Input 
                  value={formData.declarationPosition}
                  onChange={e => setFormData(prev => ({ ...prev, declarationPosition: e.target.value }))}
                  placeholder="Job Title" 
                  className="bg-slate-50/50 border-slate-200 h-16 rounded-2xl focus-visible:ring-sitk-yellow transition-all hover:bg-white px-6 font-bold"
                />
              </div>
              <div className="space-y-3">
                <RequiredLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Date</RequiredLabel>
                <Input 
                  type="date"
                  value={formData.declarationDate}
                  onChange={e => setFormData(prev => ({ ...prev, declarationDate: e.target.value }))}
                  className="bg-slate-50/50 border-slate-200 h-16 rounded-2xl focus-visible:ring-sitk-yellow transition-all hover:bg-white px-6 font-bold"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: Office Use Only */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 rounded-[3rem] border-4 border-dashed border-slate-800 p-2 overflow-hidden shadow-2xl"
      >
        <div className="bg-slate-900 rounded-[2.5rem] p-8 sm:p-12 space-y-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <SectionHeader 
              title="Section 5: Office Use Only" 
              icon={Briefcase} 
              description="Internal assessment and approval" 
              className="mb-0 text-white"
            />
            <div className="flex items-center gap-3 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full">
              <ShieldCheck className="w-4 h-4 text-red-500" />
              <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">Restricted Access</span>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-3">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1 block">Final Status</Label>
              <div className="flex gap-3 p-1.5 bg-slate-800 rounded-2xl border border-slate-700">
                <Button 
                  variant={formData.officeUse.status === 'APPROVED' ? 'default' : 'ghost'}
                  onClick={() => setFormData(prev => ({ ...prev, officeUse: { ...prev.officeUse, status: 'APPROVED' } }))}
                  className={cn(
                    "flex-1 h-14 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all",
                    formData.officeUse.status === 'APPROVED' ? "bg-green-600 hover:bg-green-700 text-white shadow-xl shadow-green-900" : "text-slate-500 hover:text-slate-300 hover:bg-slate-700"
                  )}
                >
                  APPROVED
                </Button>
                <Button 
                  variant={formData.officeUse.status === 'NOT APPROVED' ? 'destructive' : 'ghost'}
                  onClick={() => setFormData(prev => ({ ...prev, officeUse: { ...prev.officeUse, status: 'NOT APPROVED' } }))}
                  className={cn(
                    "flex-1 h-14 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all",
                    formData.officeUse.status === 'NOT APPROVED' ? "bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-900" : "text-slate-500 hover:text-slate-300 hover:bg-slate-700"
                  )}
                >
                  REJECTED
                </Button>
              </div>
            </div>
            <div className="space-y-3 lg:col-span-2">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1 block">Reason for failure</Label>
              <Input 
                value={formData.officeUse.failureReason}
                onChange={e => setFormData(prev => ({ ...prev, officeUse: { ...prev.officeUse, failureReason: e.target.value } }))}
                placeholder="State reason if not approved..." 
                className="bg-slate-800 border-slate-700 text-white h-14 rounded-2xl focus-visible:ring-sitk-yellow transition-all px-6"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1 block">Assessor Name</Label>
              <Input 
                value={formData.officeUse.assessor}
                onChange={e => setFormData(prev => ({ ...prev, officeUse: { ...prev.officeUse, assessor: e.target.value } }))}
                placeholder="Internal assessor" 
                className="bg-slate-800 border-slate-700 text-white h-14 rounded-2xl focus-visible:ring-sitk-yellow transition-all px-6"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1 block">Assessment Date</Label>
              <Input 
                type="date"
                value={formData.officeUse.date}
                onChange={e => setFormData(prev => ({ ...prev, officeUse: { ...prev.officeUse, date: e.target.value } }))}
                className="bg-slate-800 border-slate-700 text-white h-14 rounded-2xl focus-visible:ring-sitk-yellow transition-all px-6 [color-scheme:dark]"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1 block">Insurance Expiry</Label>
              <Input 
                type="date"
                value={formData.officeUse.insuranceExpiry}
                onChange={e => setFormData(prev => ({ ...prev, officeUse: { ...prev.officeUse, insuranceExpiry: e.target.value } }))}
                className="bg-slate-800 border-slate-700 text-white h-14 rounded-2xl focus-visible:ring-sitk-yellow transition-all px-6 [color-scheme:dark]"
              />
            </div>
            <div className="space-y-3 lg:col-span-3">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1 block">Internal Review Notes</Label>
              <Textarea 
                value={formData.officeUse.notes}
                onChange={e => setFormData(prev => ({ ...prev, officeUse: { ...prev.officeUse, notes: e.target.value } }))}
                placeholder="Additional internal notes regarding this contractor..."
                className="bg-slate-800 border-slate-700 text-white min-h-[120px] rounded-2xl focus-visible:ring-sitk-yellow transition-all p-6 resize-none"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Executive Summary */}
      <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-8 space-y-6">
          <SectionHeader title="Executive Summary" icon={FileText} description="Assessor's professional summary — key findings, actions required, and overall compliance judgement" className="mb-0" />
          <Textarea 
            placeholder="Enter the executive summary — key findings, compliance level rationale, recommendations, and actions required..."
            className="min-h-[160px] bg-slate-50 border-none focus-visible:ring-sitk-yellow p-4 resize-none font-medium text-sm"
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
        className="flex flex-col lg:flex-row items-center justify-between p-10 bg-white rounded-[3rem] border border-slate-100 shadow-2xl gap-10 relative overflow-hidden group mb-12"
      >
        <div className="absolute inset-0 bg-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className={cn(
            "w-20 h-20 rounded-[2rem] flex items-center justify-center border shadow-2xl transition-all duration-700",
            currentStatus === 'Draft' ? "bg-yellow-50 border-yellow-100 rotate-[-4deg] shadow-yellow-100" : 
            currentStatus === 'Submitted' ? "bg-blue-50 border-blue-100 rotate-[4deg] shadow-blue-100" : "bg-green-50 border-green-100 shadow-green-100"
          )}>
            <Clock className={cn(
              "w-10 h-10",
              currentStatus === 'Draft' ? "text-yellow-500" : 
              currentStatus === 'Submitted' ? "text-blue-500" : "text-green-500"
            )} />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none ml-1">Current Form Status</p>
            <StatusBadge status={currentStatus} className="px-6 py-2.5 text-xs font-black shadow-lg" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto relative z-10">
          <Button 
            variant="outline" 
            onClick={() => handleSave('Draft')}
            disabled={isSubmitting}
            className="w-full sm:w-auto h-16 px-10 rounded-2xl border-2 border-slate-200 font-black uppercase tracking-widest text-[11px] hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all active:scale-95 shadow-sm"
          >
            {isSubmitting && currentStatus === 'Draft' ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <Clock className="h-4 w-4" />
              </motion.div>
            ) : (
              <Save className="w-4 h-4 mr-3 text-slate-400" />
            )}
            {isSubmitting && currentStatus === 'Draft' ? 'Saving...' : 'Save Progress'}
          </Button>
          <Button 
            onClick={() => handleSave('Submitted')}
            disabled={isSubmitting}
            className="w-full sm:w-auto h-16 px-12 rounded-2xl bg-sitk-yellow text-sitk-black font-black uppercase tracking-widest text-[11px] hover:bg-sitk-black hover:text-sitk-yellow shadow-xl shadow-sitk-yellow/20 transition-all active:scale-95 group"
          >
            {isSubmitting && currentStatus === 'Submitted' ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <Clock className="h-4 w-4" />
              </motion.div>
            ) : (
              <Send className="w-4 h-4 mr-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            )}
            {isSubmitting && currentStatus === 'Submitted' ? 'Submitting...' : 'Submit Vetting Form'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
