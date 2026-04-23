import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
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
  FileText,
  Info,
  Hash,
  Users,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2
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
import { HSMiniAuditReport, ReportStatus, HSMiniAuditSection } from '../types';
import StatusBadge from '../components/StatusBadge';
import SectionHeader from '../components/SectionHeader';

const AUDIT_SECTIONS = [
  {
    id: '1',
    title: '1 ASBESTOS (Maximum 1 point)',
    questions: [
      { id: '1.1', question: 'Is there an asbestos register/survey for the building? (If built before 1999). Strict requirement.', note: 'STRICT FAILURE ITEM: 1 point for YES or N/A; -2 points for NO.' }
    ]
  },
  {
    id: '2',
    title: '2 COMPUTERS (Maximum 1 point)',
    questions: [
      { id: '2.1', question: 'All staff who use computers for more than 1 hour a day have completed a computer (DSE) self-assessment form?' }
    ]
  },
  {
    id: '3',
    title: '3 DOCUMENTATION (Maximum 8 points)',
    questions: [
      { id: '3.1', question: 'Is the H&S Policy dated within the last 12 months, up to date, signed and accessible to all staff?' },
      { id: '3.2', question: 'Correct H&S at Work poster on display?' },
      { id: '3.3', question: 'Employers Liability Insurance Certificate in date?' },
      { id: '3.4', question: 'Official Accident book on site?' },
      { id: '3.5', question: 'Lifting equipment inspections (LOLER) in place? (If applicable).' },
      { id: '3.6', question: 'Legionella records and checks in place? (If applicable).' },
      { id: '3.7', question: 'Gas safety records in place? (If applicable).' },
      { id: '3.8', question: 'Contractor (and sub-contractors) controls in place, i.e. vetted/checked?' }
    ]
  },
  {
    id: '4',
    title: '4 ELECTRICAL SAFETY (Maximum 3 points)',
    questions: [
      { id: '4.1', question: 'Area free from wiring or electrical hazards?' },
      { id: '4.2', question: 'Portable electrical equipment PAT tested (or otherwise checked for safety)? (The frequency of checks depends on the hazards.)' },
      { id: '4.3', question: 'The premises fixed electrical installations have a valid EICR? (Electrical Installation Condition Report – at least every 5 years.)' }
    ]
  },
  {
    id: '5',
    title: '5 FIRE SAFETY (Maximum 6 points)',
    questions: [
      { id: '5.1', question: 'Fire alarm and associated systems (smoke detectors, call points, assembly point etc.) inspected and maintained under contract?' },
      { id: '5.2', question: 'Emergency exits and routes clearly marked and unobstructed?' },
      { id: '5.3', question: 'Correct type/number of fire extinguishers and blankets on each floor and dated within the last year?' },
      { id: '5.4', question: 'Staff have been instructed in fire safety at least annually, i.e. the evacuation procedures in the event of an emergency?' },
      { id: '5.5', question: 'Fire drills have been conducted at least twice a year and the fire alarm tested and recorded weekly?' },
      { id: '5.6', question: 'Is a valid Fire Risk Assessment (FRA) in place and dated in the last 12 months? Strict requirement.', note: 'STRICT FAILURE ITEM: 1 if YES; -2 if NO.' }
    ]
  },
  {
    id: '6',
    title: '6 FIRST AID & WELFARE FACILITIES (Maximum 3 points)',
    questions: [
      { id: '6.1', question: 'First aid boxes suitable, stocked and accessible?' },
      { id: '6.2', question: 'Sufficient numbers of first aiders (or appointed persons) and names displayed? (Minimum of at least 2 persons required.)' },
      { id: '6.3', question: 'Sufficient and suitable toilets and welfare facilities?' }
    ]
  },
  {
    id: '7',
    title: '7 HAZARDOUS SUBSTANCES (Maximum 2 points)',
    questions: [
      { id: '7.1', question: 'COSHH assessments available for all hazardous substances and processes on site?' },
      { id: '7.2', question: 'Staff know how to use the chemicals safely and use the correct PPE?' }
    ]
  },
  {
    id: '8',
    title: '8 HOUSEKEEPING (Maximum 2 points)',
    questions: [
      { id: '8.1', question: 'Workplace clean, tidy and free of significant slip or trip hazards?' },
      { id: '8.2', question: 'Shelving and storage safe to use?' }
    ]
  },
  {
    id: '9',
    title: '9 LIGHTING (Maximum 2 points)',
    questions: [
      { id: '9.1', question: 'All work areas adequately lit?' },
      { id: '9.2', question: 'Emergency lighting provided and tested?' }
    ]
  },
  {
    id: '10',
    title: '10 NOISE & VIBRATION (Maximum 2 points)',
    questions: [
      { id: '10.1', question: 'Noise levels acceptable (below 85dB) or else controlled?' },
      { id: '10.2', question: 'Vibration levels acceptable or else controlled?' }
    ]
  },
  {
    id: '11',
    title: '11 PERSONAL PROTECTIVE EQUIPMENT (PPE) (Maximum 1 point)',
    questions: [
      { id: '11.1', question: 'PPE suitable for the task, in good condition, readily available, used correctly and free?' }
    ]
  },
  {
    id: '12',
    title: '12 RISK ASSESSMENTS (Maximum 2 points)',
    questions: [
      { id: '12.1', question: 'Suitable task risk assessments in place (dated within 12 months) for all workers? (Pregnant/new mothers must have separate assessments.)' },
      { id: '12.2', question: 'Suitable work premises risk assessments in place dated within the last 12 months?' }
    ]
  },
  {
    id: '13',
    title: '13 TEMPERATURE (Maximum 1 point)',
    questions: [
      { id: '13.1', question: 'Working temperature levels suitable?' }
    ]
  },
  {
    id: '14',
    title: '14 TRAINING RECORDS (Maximum 1 point)',
    questions: [
      { id: '14.1', question: 'Suitable H&S training records and certificates in place?' }
    ]
  },
  {
    id: '15',
    title: '15 VENTILATION AND EXTRACTION (Maximum 2 points)',
    questions: [
      { id: '15.1', question: 'Sufficient natural ventilation in place? If mechanical ventilation, is it serviced/checked at least every 14 months?' },
      { id: '15.2', question: 'Windows have suitable restrictors in place? (If applicable).' }
    ]
  },
  {
    id: '16',
    title: '16 WORK AT HEIGHT (Maximum 2 points)',
    questions: [
      { id: '16.1', question: 'All work at height planned and equipment safe? (Steps, MEWPs etc.)' },
      { id: '16.2', question: 'All relevant staff trained in work at height safety?' }
    ]
  },
  {
    id: '17',
    title: '17 WORKPLACE VEHICLES/TRANSPORT (Maximum 3 points)',
    questions: [
      { id: '17.1', question: 'Drivers adequately trained, insured, licensed, rules in place etc.? ' },
      { id: '17.2', question: 'All work vehicles maintained? (i.e. cars, vans, fork lift trucks etc.)' },
      { id: '17.3', question: 'Workplace Transport Assessment in place? (If applicable).' }
    ]
  }
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

export default function HSMiniAuditForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const editId = (location.state as any)?.editId as string | undefined;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [reportId, setReportId] = useState<string | null>(editId ?? null);
  const [currentStatus, setCurrentStatus] = useState<ReportStatus>('Draft');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    AUDIT_SECTIONS.reduce((acc, section) => ({ ...acc, [section.id]: true }), {})
  );

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    auditFrequency: 'Monthly',
    auditRef: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
    companyNameAddress: '',
    assessors: (getSession()?.name ?? ''),
    siteContacts: '',
    sections: AUDIT_SECTIONS.map(section => ({
      ...section,
      questions: section.questions.map(q => ({
        ...q,
        score: undefined as 1 | 0.5 | 0 | 'N/A' | undefined,
        comments: ''
      }))
    })),
    otherComments: {
      workEquipment: '',
      workTasks: '',
      workerTraining: '',
      otherTopics: ''
    },
    executiveSummary: ''
  });

  const [scoreSummary, setScoreSummary] = useState({
    maxPoints: 42,
    actualPoints: 0,
    rating: 'FAIL',
    hasStrictFailure: false
  });

  useEffect(() => {
    calculateScore();
  }, [formData.sections]);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    setExpandedSections(AUDIT_SECTIONS.reduce((acc, section) => ({ ...acc, [section.id]: true }), {}));
  };

  const collapseAll = () => {
    setExpandedSections(AUDIT_SECTIONS.reduce((acc, section) => ({ ...acc, [section.id]: false }), {}));
  };

  const calculateScore = () => {
    let total = 0;
    let hasStrictFailure = false;
    
    formData.sections.forEach(section => {
      section.questions.forEach(q => {
        if (q.score === 'N/A') {
          total += 1;
        } else if (q.score !== undefined) {
          if ((q.id === '1.1' || q.id === '5.6') && q.score === 0) {
            total -= 2;
            hasStrictFailure = true;
          } else {
            total += Number(q.score);
          }
        }
      });
    });

    let rating = 'FAIL';
    if (hasStrictFailure) {
      rating = 'FAIL';
    } else {
      if (total >= 38) rating = 'EXCELLENT';
      else if (total >= 32) rating = 'GOOD';
      else if (total >= 24) rating = 'FAIR';
      else if (total >= 16) rating = 'POOR';
    }

    setScoreSummary(prev => ({ 
      ...prev, 
      actualPoints: Math.round(total * 2) / 2, 
      rating,
      hasStrictFailure
    }));
  };

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

  const updateQuestion = (sectionId: string, questionId: string, field: 'score' | 'comments', value: any) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId 
          ? {
              ...section,
              questions: section.questions.map(q => 
                q.id === questionId ? { ...q, [field]: value } : q
              )
            }
          : section
      )
    }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.date) newErrors.date = 'Date of Audit is required';
    if (!formData.companyNameAddress.trim()) newErrors.companyNameAddress = 'Company Name & Address is required';
    if (!formData.assessors.trim()) newErrors.assessors = 'Assessor name is required';
    
    // Check if all questions are answered
    let unansweredCount = 0;
    formData.sections.forEach(section => {
      section.questions.forEach(q => {
        if (q.score === undefined) unansweredCount++;
      });
    });

    if (unansweredCount > 0) {
      newErrors.audit = `Please answer all ${unansweredCount} audit questions before submitting.`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { photos, updatePhotos, clearPhotos } = usePhotoStore('hs_mini_audit');
  const { clearAutoSave } = useAutoSave('hs_mini_audit', formData);
  React.useEffect(() => {
    const saved = getAutoSavedData<any>('hs_mini_audit'); // eslint-disable-line @typescript-eslint/no-explicit-any
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

    const newId = reportId || `AUD-MINI-${Date.now()}`;
    if (!reportId) setReportId(newId);

    const report: HSMiniAuditReport = {
      id: newId,
      title: `H&S Mini Audit - ${formData.companyNameAddress.split('\n')[0] || 'New Audit'} (${formData.date})`,
      type: 'H&S Mini Audit',
      status,
      location: formData.companyNameAddress.split('\n')[0] || 'Not Specified',
      date: formData.date,
      authorId: mockUser.id,
      description: `H&S Mini Audit - ${formData.date}`,
      photos,
      ...formData,
      maxPoints: scoreSummary.maxPoints,
      actualPoints: scoreSummary.actualPoints,
      rating: scoreSummary.rating
    };

    try {
      saveReport(report);
      clearPhotos();

      if (status === 'Submitted') {
        try {
          await exportSavedReportToPDF(report, DEFAULT_BRANDING);
        } catch (pdfErr) {
          console.error('[HSMiniAuditForm] PDF generation failed:', pdfErr);
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
            onClick={() => navigate('/audits')}
            className="group -ml-2 text-slate-400 hover:text-sitk-black transition-colors font-black uppercase text-[10px] tracking-[0.3em]"
          >
            <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Audits
          </Button>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-1 w-12 bg-sitk-yellow rounded-full" />
              <p className="text-[10px] font-black text-sitk-yellow uppercase tracking-[0.5em]">Compliance Audit</p>
            </div>
            <h1 className="text-6xl sm:text-7xl font-black text-slate-900 tracking-tight leading-[0.85] uppercase">
              H&S Mini <br />
              <span className="text-sitk-yellow">Audit Inspection</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-6 bg-white p-6 rounded-[2.5rem] shadow-2xl border border-slate-100 h-fit self-start md:self-center group hover:border-sitk-yellow/30 transition-all duration-700">
          <div className="bg-sitk-yellow/10 p-5 rounded-2xl shadow-inner group-hover:bg-sitk-yellow/20 transition-colors">
            <BarChart3 className="w-10 h-10 text-sitk-black" />
          </div>
          <div className="pr-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] leading-none mb-3">Module</p>
            <p className="text-lg font-black text-sitk-black uppercase tracking-tight">Audits</p>
          </div>
        </div>
      </div>

      {/* Section 1: Audit Details */}
      <Card className="border-none shadow-2xl overflow-hidden bg-white rounded-[3rem] border border-slate-100 group">
        <div className="p-8 sm:p-12 pb-0">
          <SectionHeader 
            title="Audit Details" 
            icon={ClipboardCheck} 
            description="General information about the audit and site" 
            className="mb-0"
          />
        </div>
        <CardContent className="p-8 sm:p-12 pt-10 sm:pt-14">
          <div className="grid gap-8 sm:gap-12 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-3">
              <RequiredLabel required htmlFor="date" className="text-slate-500 font-black">Date of Audit</RequiredLabel>
              <div className="relative group/input">
                <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                <Input 
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={e => updateField('date', e.target.value)}
                  className={cn(
                    "pl-14 bg-slate-50/50 border-slate-200 h-16 rounded-2xl focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-base font-bold",
                    errors.date && "border-red-500 bg-red-50/30"
                  )}
                />
              </div>
              <ErrorMessage message={errors.date} />
            </div>
            <div className="space-y-3">
              <RequiredLabel required htmlFor="auditFrequency" className="text-slate-500 font-black">Audit Frequency</RequiredLabel>
              <div className="relative group/input">
                <Clock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                <Input 
                  id="auditFrequency"
                  value={formData.auditFrequency}
                  onChange={e => updateField('auditFrequency', e.target.value)}
                  placeholder="e.g. Monthly" 
                  className="pl-14 bg-slate-50/50 border-slate-200 h-16 rounded-2xl focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-base font-bold"
                />
              </div>
            </div>
            <div className="space-y-3">
              <RequiredLabel required htmlFor="auditRef" className="text-slate-500 font-black">Audit Ref</RequiredLabel>
              <div className="relative group/input">
                <Hash className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                <Input 
                  id="auditRef"
                  value={formData.auditRef}
                  onChange={e => updateField('auditRef', e.target.value)}
                  placeholder="Reference number" 
                  className="pl-14 bg-slate-50/50 border-slate-200 h-16 rounded-2xl focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-base font-bold"
                />
              </div>
            </div>
            <div className="space-y-3 md:col-span-2 lg:col-span-3">
              <RequiredLabel required htmlFor="companyNameAddress" className="text-slate-500 font-black">Co. Name & Address</RequiredLabel>
              <div className="relative group/input">
                <Building2 className="absolute left-6 top-8 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                <Textarea 
                  id="companyNameAddress"
                  value={formData.companyNameAddress}
                  onChange={e => updateField('companyNameAddress', e.target.value)}
                  placeholder="Enter company name and full site address" 
                  className={cn(
                    "pl-14 bg-slate-50/50 border-slate-200 min-h-[100px] rounded-2xl focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-base font-bold pt-6",
                    errors.companyNameAddress && "border-red-500 bg-red-50/30"
                  )}
                />
              </div>
              <ErrorMessage message={errors.companyNameAddress} />
            </div>
            <div className="space-y-3">
              <RequiredLabel required htmlFor="assessors" className="text-slate-500 font-black">Assessor(s)</RequiredLabel>
              <div className="relative group/input">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                <Input 
                  id="assessors"
                  value={formData.assessors}
                  onChange={e => updateField('assessors', e.target.value)}
                  placeholder="Name of assessor" 
                  className={cn(
                    "pl-14 bg-slate-50/50 border-slate-200 h-16 rounded-2xl focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-base font-bold",
                    errors.assessors && "border-red-500 bg-red-50/30"
                  )}
                />
              </div>
              <ErrorMessage message={errors.assessors} />
            </div>
            <div className="space-y-3">
              <RequiredLabel required htmlFor="siteContacts" className="text-slate-500 font-black">Site Contact(s)</RequiredLabel>
              <div className="relative group/input">
                <Users className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                <Input 
                  id="siteContacts"
                  value={formData.siteContacts}
                  onChange={e => updateField('siteContacts', e.target.value)}
                  placeholder="Name of site contact" 
                  className="pl-14 bg-slate-50/50 border-slate-200 h-16 rounded-2xl focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-base font-bold"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Score Summary & Rating Bands */}
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        <div className="lg:col-span-5 lg:sticky lg:top-8 space-y-8">
          <Card className="border-none shadow-2xl overflow-hidden bg-slate-900 rounded-[3rem] text-white">
            <CardContent className="p-8 sm:p-10 space-y-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-sitk-yellow uppercase tracking-[0.4em]">Audit Performance</p>
                  <h3 className="text-2xl font-black uppercase tracking-tight">Score Summary</h3>
                </div>
                <div className={cn(
                  "px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl",
                  scoreSummary.rating === 'EXCELLENT' ? "bg-green-500 text-white" :
                  scoreSummary.rating === 'GOOD' ? "bg-blue-500 text-white" :
                  scoreSummary.rating === 'FAIR' ? "bg-yellow-500 text-sitk-black" :
                  scoreSummary.rating === 'POOR' ? "bg-orange-500 text-white" :
                  "bg-red-500 text-white"
                )}>
                  {scoreSummary.rating}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1 p-6 bg-white/5 rounded-[2rem] border border-white/10">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Max Points</p>
                  <p className="text-4xl font-black text-white">{scoreSummary.maxPoints}</p>
                </div>
                <div className="space-y-1 p-6 bg-white/10 rounded-[2rem] border border-white/20 shadow-inner">
                  <p className="text-[10px] font-black text-sitk-yellow uppercase tracking-widest">Actual Points</p>
                  <p className="text-4xl font-black text-sitk-yellow">{scoreSummary.actualPoints}</p>
                </div>
              </div>

              {scoreSummary.hasStrictFailure && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-500/20 border border-red-500/50 p-5 rounded-[2rem] flex items-start gap-4 animate-pulse"
                >
                  <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">Strict Failure Detected</p>
                    <p className="text-[11px] font-bold text-red-100 leading-relaxed">A critical compliance item (1.1 or 5.6) has been marked as "At Risk". This audit is a FAIL regardless of total points.</p>
                  </div>
                </motion.div>
              )}

              <div className="space-y-3 pt-2">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Score Key</p>
                <div className="grid gap-2">
                  {[
                    { label: '1 = Safe / Yes / Good or N/A', color: 'bg-green-500' },
                    { label: '0.5 = Some controls in place', color: 'bg-yellow-500' },
                    { label: '0 = At Risk / No / Very Poor', color: 'bg-red-500' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                      <div className={cn("w-2 h-2 rounded-full", item.color)} />
                      <span className="text-[10px] font-bold text-white/80">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl overflow-hidden bg-white rounded-[3rem] border border-slate-100 hidden lg:block">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Compliance Levels</p>
                <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">Rating Bands</h3>
              </div>

              <div className="space-y-3">
                {[
                  { range: '38–43', label: 'EXCELLENT', color: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50' },
                  { range: '32–37', label: 'GOOD', color: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50' },
                  { range: '24–31', label: 'FAIR', color: 'bg-yellow-500', text: 'text-yellow-600', bg: 'bg-yellow-50' },
                  { range: '16–23', label: 'POOR', color: 'bg-orange-500', text: 'text-orange-600', bg: 'bg-orange-50' },
                  { range: '0–15', label: 'FAIL', color: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50' }
                ].map((band, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-xl border transition-all duration-300",
                      scoreSummary.rating === band.label ? `${band.bg} border-${band.text.split('-')[1]}-200 shadow-md scale-[1.02]` : "bg-slate-50 border-slate-100 opacity-60"
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0 text-white", band.color)}>
                      <span className="text-[8px] font-black leading-none mb-0.5">PTS</span>
                      <span className="text-xs font-black leading-none">{band.range.split('–')[0]}</span>
                    </div>
                    <h4 className={cn("text-[10px] font-black uppercase tracking-widest", band.text)}>{band.label}</h4>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7 space-y-12">
          {/* Section 3: Audit Questions */}
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-4 sm:px-0">
              <div className="space-y-2">
                <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">Audit Questions</h2>
                <p className="text-slate-500 text-sm font-medium">Evaluate each area thoroughly.</p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={expandAll}
                  className="h-10 rounded-xl px-4 font-black text-[10px] uppercase tracking-widest border-slate-200 hover:bg-slate-50"
                >
                  <Maximize2 className="w-3 h-3 mr-2" />
                  Expand All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={collapseAll}
                  className="h-10 rounded-xl px-4 font-black text-[10px] uppercase tracking-widest border-slate-200 hover:bg-slate-50"
                >
                  <Minimize2 className="w-3 h-3 mr-2" />
                  Collapse All
                </Button>
              </div>
            </div>

            {errors.audit && (
              <div className="bg-red-50 text-red-600 px-6 py-3 rounded-2xl border border-red-100 flex items-center gap-3 animate-bounce mx-4 sm:mx-0">
                <AlertCircle className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">{errors.audit}</span>
              </div>
            )}

            <div className="space-y-6">
              {formData.sections.map((section, sIndex) => (
                <div key={section.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden transition-all duration-500 hover:shadow-md">
                  <button 
                    onClick={() => toggleSection(section.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-6 sm:p-8 hover:bg-slate-50/50 transition-colors text-left group",
                      errors.audit && section.questions.some(q => q.score === undefined) && "bg-red-50/30"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-10 w-10 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg group-hover:scale-110 transition-transform",
                        errors.audit && section.questions.some(q => q.score === undefined) ? "bg-red-600" : "bg-sitk-black"
                      )}>
                        {section.id}
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">{section.title}</h3>
                        {errors.audit && section.questions.some(q => q.score === undefined) && (
                          <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                            {section.questions.filter(q => q.score === undefined).length} questions remaining
                          </p>
                        )}
                      </div>
                    </div>
                    {expandedSections[section.id] ? (
                      <ChevronUp className="w-6 h-6 text-slate-300 group-hover:text-sitk-yellow transition-colors" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-slate-300 group-hover:text-sitk-yellow transition-colors" />
                    )}
                  </button>

                  <AnimatePresence>
                    {expandedSections[section.id] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                      >
                        <div className="p-6 sm:p-8 pt-0 space-y-6 border-t border-slate-50">
                          {section.questions.map((q, qIndex) => (
                            <div 
                              key={q.id}
                              className={cn(
                                "p-6 sm:p-8 rounded-3xl border transition-all duration-500 relative overflow-hidden",
                                q.score !== undefined ? "border-slate-200 bg-slate-50/30" : "border-slate-100 bg-white"
                              )}
                            >
                              <div className="space-y-6">
                                <div className="space-y-4">
                                  <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Question {q.id}</span>
                                    {q.note && (
                                      <div className={cn(
                                        "flex items-center gap-1.5 px-3 py-1 rounded-full",
                                        q.note.includes('STRICT FAILURE') ? "bg-red-500/10 border border-red-500/20" : "bg-sitk-yellow/10"
                                      )}>
                                        <ShieldAlert className={cn("w-3 h-3", q.note.includes('STRICT FAILURE') ? "text-red-500" : "text-sitk-black")} />
                                        <span className={cn(
                                          "text-[9px] font-black uppercase tracking-widest",
                                          q.note.includes('STRICT FAILURE') ? "text-red-500" : "text-sitk-black"
                                        )}>{q.note}</span>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-lg font-black leading-tight text-slate-800 uppercase tracking-tight">
                                    {q.question}
                                  </p>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                  {[
                                    { label: '1', value: 1, color: 'bg-green-600' },
                                    { label: '0.5', value: 0.5, color: 'bg-yellow-500' },
                                    { label: '0', value: 0, color: 'bg-red-600' },
                                    { label: 'N/A', value: 'N/A', color: 'bg-slate-400' }
                                  ].map((opt) => (
                                    <button
                                      key={opt.label}
                                      onClick={() => updateQuestion(section.id, q.id, 'score', opt.value)}
                                      className={cn(
                                        "h-14 rounded-2xl text-xs font-black transition-all active:scale-95 flex items-center justify-center border-2",
                                        q.score === opt.value 
                                          ? `${opt.color} text-white border-transparent shadow-lg scale-[1.02]` 
                                          : "bg-white text-slate-400 border-slate-100 hover:border-slate-200 hover:text-slate-600"
                                      )}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>

                                <div className="space-y-2">
                                  <RequiredLabel className="text-slate-400 ml-1 mb-1">Comments</RequiredLabel>
                                  <div className="relative group/input">
                                    <FileText className="absolute left-5 top-5 w-4 h-4 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                                    <Textarea 
                                      value={q.comments}
                                      onChange={e => updateQuestion(section.id, q.id, 'comments', e.target.value)}
                                      placeholder="Add details or actions..."
                                      className="pl-12 bg-white border-slate-100 min-h-[80px] rounded-2xl focus-visible:ring-sitk-yellow transition-all hover:border-slate-200 p-4 resize-none font-bold text-sm shadow-inner"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Other Comments */}
          <Card className="border-none shadow-2xl overflow-hidden bg-white rounded-[3rem] border border-slate-100">
            <div className="p-8 sm:p-10 pb-0">
              <SectionHeader 
                title="Other Comments" 
                icon={Plus} 
                description="Additional site-specific topics" 
                className="mb-0"
              />
            </div>
            <CardContent className="p-8 sm:p-10 pt-8 space-y-8">
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-start gap-4">
                <Info className="w-5 h-5 text-sitk-yellow mt-0.5 shrink-0" />
                <p className="text-xs font-bold text-slate-600 leading-relaxed">
                  This is NOT a comprehensive Audit that covers all workplaces so please add any site specific fire or H&S topics not covered above.
                </p>
              </div>

              <div className="grid gap-8">
                {[
                  { id: 'workEquipment', label: 'Work equipment' },
                  { id: 'workTasks', label: 'Work tasks' },
                  { id: 'workerTraining', label: 'Worker training' },
                  { id: 'otherTopics', label: 'Other topics' }
                ].map((field) => (
                  <div key={field.id} className="space-y-3">
                    <RequiredLabel className="text-slate-500 font-black ml-2">{field.label}</RequiredLabel>
                    <Textarea 
                      value={(formData.otherComments as any)[field.id]}
                      onChange={e => setFormData(prev => ({ 
                        ...prev, 
                        otherComments: { ...prev.otherComments, [field.id]: e.target.value } 
                      }))}
                      placeholder={`Enter details about ${field.label.toLowerCase()}...`}
                      className="bg-slate-50/50 border-slate-200 min-h-[120px] rounded-3xl focus-visible:ring-sitk-yellow transition-all hover:bg-white p-6 resize-none text-sm font-bold shadow-inner"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
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
                    Audit {currentStatus === 'Draft' ? 'Saved' : 'Submitted'}!
                  </h3>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    Your H&S Mini Audit has been successfully {currentStatus === 'Draft' ? 'saved as a draft' : 'submitted'}.
                  </p>
                </div>
                <div className="pt-2 flex flex-col items-center gap-6">
                  <div className={cn(
                    "px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl border-2",
                    currentStatus === 'Draft' ? "bg-yellow-50 text-yellow-600 border-yellow-200" : "bg-blue-50 text-blue-600 border-blue-200"
                  )}>
                    {currentStatus}
                  </div>
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
            <div className={cn(
              "px-12 py-5 rounded-2xl font-black text-base uppercase tracking-widest shadow-2xl border-2 transition-all duration-500",
              currentStatus === 'Draft' ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-500" : 
              "bg-blue-500/20 border-blue-500/50 text-blue-400"
            )}>
              {currentStatus}
            </div>
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
            {isSubmitting && currentStatus === 'Submitted' ? 'Submitting...' : 'Submit Audit'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
