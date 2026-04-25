import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  User, 
  PenTool, 
  Calendar, 
  Briefcase, 
  Search, 
  MapPin, 
  Clock, 
  FileText, 
  AlertCircle, 
  Info, 
  Save, 
  Send, 
  ArrowLeft, 
  CheckCircle2,
  Box,
  Accessibility,
  Activity,
  Wind,
  Trash2,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import SectionHeader from '@/components/SectionHeader';
import StatusBadge from '@/components/StatusBadge';
import { cn } from '@/lib/utils';
import { ManualHandlingAssessmentReport, ReportStatus } from '@/types';
import { mockUser, saveReport } from '@/lib/mockData';
import { exportSavedReportToPDF } from '@/lib/exportUtils';
import { DEFAULT_BRANDING } from '@/lib/brandingContext';
import { getSession } from '@/lib/auth';
import { useAutoSave, getAutoSavedData } from '@/lib/useAutoSave';
import { usePhotoStore } from '@/lib/usePhotoStore';
import PhotoUpload from '@/components/PhotoUpload';
import ExportButtons from '@/components/ExportButtons';

const LITE_ITEMS = [
  { section: 'Loads', item: 'Heavy' },
  { section: 'Loads', item: 'Bulky / unwieldy' },
  { section: 'Loads', item: 'Unstable / unpredictable' },
  { section: 'Loads', item: 'Intrinsically harmful i.e. hot' },
  { section: 'Individual Capacity', item: 'Require unusual capacity' },
  { section: 'Individual Capacity', item: 'Present a hazard to those with health issues' },
  { section: 'Individual Capacity', item: 'Present a hazard for pregnant or new mothers' },
  { section: 'Individual Capacity', item: 'Require any special training or information' },
  { section: 'Individual Capacity', item: 'Require Team Lifting (i.e. more than one person)' },
  { section: 'Tasks', item: 'Holding loads away from the trunk' },
  { section: 'Tasks', item: 'Twisting' },
  { section: 'Tasks', item: 'Stooping' },
  { section: 'Tasks', item: 'Reaching up' },
  { section: 'Tasks', item: 'Large vertical movements' },
  { section: 'Tasks', item: 'Long carrying distances' },
  { section: 'Tasks', item: 'Strenuous pushing or pulling' },
  { section: 'Tasks', item: 'Unpredictable movements of loads' },
  { section: 'Tasks', item: 'Insufficient rest or recovery' },
  { section: 'Tasks', item: 'An imposed work rate' },
  { section: 'Environment', item: 'Constraints on posture' },
  { section: 'Environment', item: 'Poor floors' },
  { section: 'Environment', item: 'Variations in levels' },
  { section: 'Environment', item: 'Hot / cold / humid conditions' },
  { section: 'Environment', item: 'Strong air movements' },
  { section: 'Environment', item: 'Poor lighting' },
] as const;

export default function ManualHandlingAssessmentForm() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const location = useLocation();
  const editId = (location.state as any)?.editId as string | undefined;
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [currentStatus, setCurrentStatus] = React.useState<ReportStatus>('Draft');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [reportId] = React.useState(() => editId ?? crypto.randomUUID());

  const [formData, setFormData] = React.useState<Omit<ManualHandlingAssessmentReport, 'id' | 'authorId' | 'status' | 'title' | 'type' | 'location' | 'date'>>({
    assessorName: (getSession()?.name ?? ''),
    assessorSignature: '',
    assessmentDate: new Date().toISOString().split('T')[0],
    ref: '',
    reviewDate: '',
    task: '',
    location: '',
    liteAssessment: LITE_ITEMS.map((item, idx) => ({
      id: `lite-${idx}`,
      section: item.section,
      item: item.item,
      risk: '',
      level: ''
    })),
    initialRisk: '',
    remedialAction: '',
    finalRisk: '',
    executiveSummary: ''
  });

  const highRiskLiteCount = React.useMemo(() => 
    formData.liteAssessment.filter(
      item => item.risk === 'YES' && (item.level === 'MEDIUM' || item.level === 'HIGH')
    ).length,
    [formData.liteAssessment]
  );

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

  const updateLiteItem = (id: string, field: 'risk' | 'level', value: string) => {
    setFormData(prev => ({
      ...prev,
      liteAssessment: prev.liteAssessment.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.assessorName.trim()) newErrors.assessorName = 'Name is required';
    if (!formData.task.trim()) newErrors.task = 'Task description is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    
    const incompleteLite = formData.liteAssessment.filter(item => !item.risk);
    if (incompleteLite.length > 0) {
      newErrors.liteAssessment = `Please complete all ${incompleteLite.length} L.I.T.E. assessment items.`;
    }

    if (!formData.initialRisk) newErrors.initialRisk = 'Initial risk assessment is required';
    if (!formData.finalRisk) newErrors.finalRisk = 'Final risk assessment is required';

    if ((formData.initialRisk === 'Medium' || formData.initialRisk === 'High') && !formData.remedialAction.trim()) {
      newErrors.remedialAction = 'Remedial action is required for Medium/High risk';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { photos, updatePhotos, clearPhotos } = usePhotoStore('manual_handling');
  const { clearAutoSave } = useAutoSave('manual_handling', formData);
  React.useEffect(() => {
    const saved = getAutoSavedData<any>('manual_handling'); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (saved) setFormData(prev => ({ ...prev, ...saved }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (status: ReportStatus) => {
    if (status === 'Submitted' && !validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    clearAutoSave();
    setIsSubmitting(true);

    try {
      const report: ManualHandlingAssessmentReport = {
        ...formData,
        id: reportId,
        authorId: mockUser.id,
        status,
        title: `Manual Handling Assessment - ${formData.task || 'Unnamed Task'} - ${formData.assessmentDate}`,
        type: 'Manual Handling Assessment',
        location: formData.location || 'Not Specified',
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
          console.error('[ManualHandlingAssessmentForm] PDF generation failed:', pdfErr);
        }
      }

      navigate('/my-reports');
    } catch (err) {
      console.error('[ManualHandlingAssessmentForm] Save failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sections = [
    { id: 'loads', title: 'A. Loads', icon: Box },
    { id: 'capacity', title: 'B. Individual Capacity', icon: Accessibility },
    { id: 'tasks', title: 'C. Tasks', icon: Activity },
    { id: 'environment', title: 'D. Environment', icon: Wind },
  ];

  const completedSections = React.useMemo(() => {
    const steps = [
      formData.assessorName && formData.task && formData.location,
      formData.liteAssessment.every(item => item.risk),
      formData.initialRisk,
      formData.remedialAction || (formData.initialRisk !== 'Medium' && formData.initialRisk !== 'High'),
      formData.finalRisk
    ];
    return steps.filter(Boolean).length;
  }, [formData]);

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 pb-24 md:pb-12 px-1 sm:px-2" id="manual-handling-report">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="rounded-xl hover:bg-white shadow-sm export-hide"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sitk-yellow mb-1">Risk Assessment Module</p>
            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Manual Handling Assessment</h1>
          </div>
          <StatusBadge status={currentStatus} className="export-hide" />
        </div>

        <ExportButtons 
          elementId="manual-handling-report"
          reportTitle={`Manual Handling Assessment: ${formData.task}`}
          formData={formData}
          photos={photos}
          reportId={reportId}
          onSave={handleSave}
          isSubmitting={isSubmitting}
          className="flex flex-wrap justify-end"
        />
      </div>

      <SectionHeader 
        title="Manual Handling Operations Assessment" 
        icon={ShieldCheck}
        description="L.I.T.E. based assessment to identify and control manual handling risks."
      />

      {/* Progress Tracker */}
      <div className="mt-8 mb-12">
        <div className="flex items-center justify-between mb-4 px-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assessment Progress</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-sitk-yellow">{Math.round((completedSections / 5) * 100)}% Complete</p>
        </div>
        <div className="flex gap-2 h-1.5 px-1">
          {[1, 2, 3, 4, 5].map((step) => (
            <div 
              key={step}
              className={cn(
                "flex-1 rounded-full transition-all duration-500",
                step <= completedSections ? "bg-sitk-yellow shadow-[0_0_10px_rgba(255,215,0,0.3)]" : "bg-slate-100"
              )}
            />
          ))}
        </div>
      </div>

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
              {errors.liteAssessment && <span className="block mt-1">• {errors.liteAssessment}</span>}
            </p>
          </div>
        </motion.div>
      )}

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
                    Date of Assessment
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
                  <Label htmlFor="ref" className="text-slate-400 font-black uppercase text-[9px] tracking-widest ml-1">
                    Reference Number
                  </Label>
                  <div className="relative group/input">
                    <FileText className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                    <Input 
                      id="ref"
                      value={formData.ref}
                      onChange={e => updateField('ref', e.target.value)}
                      placeholder="e.g. MH-2024-001"
                      className="pl-12 bg-slate-50/50 border-slate-100 h-14 rounded-xl focus:bg-white focus:border-sitk-yellow transition-all font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reviewDate" className="text-slate-400 font-black uppercase text-[9px] tracking-widest ml-1">
                    Review Date
                  </Label>
                  <div className="relative group/input">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                    <Input 
                      id="reviewDate"
                      type="date"
                      value={formData.reviewDate}
                      onChange={e => updateField('reviewDate', e.target.value)}
                      className="pl-12 bg-slate-50/50 border-slate-100 h-14 rounded-xl focus:bg-white focus:border-sitk-yellow transition-all font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-slate-400 font-black uppercase text-[9px] tracking-widest ml-1">
                    Location of Task <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative group/input">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                    <Input 
                      id="location"
                      value={formData.location}
                      onChange={e => updateField('location', e.target.value)}
                      placeholder="e.g. Main Warehouse"
                      className={cn(
                        "pl-12 bg-slate-50/50 border-slate-100 h-14 rounded-xl focus:bg-white focus:border-sitk-yellow transition-all font-bold text-sm",
                        errors.location && "border-red-500 bg-red-50/30"
                      )}
                    />
                  </div>
                  {errors.location && <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest ml-1">{errors.location}</p>}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="task" className="text-slate-400 font-black uppercase text-[9px] tracking-widest ml-1">
                    Description of Task <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative group/input">
                    <Activity className="absolute left-5 top-5 w-4 h-4 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                    <Textarea 
                      id="task"
                      value={formData.task}
                      onChange={e => updateField('task', e.target.value)}
                      placeholder="Describe the manual handling task..."
                      className={cn(
                        "pl-12 bg-slate-50/50 border-slate-100 min-h-[100px] rounded-2xl focus:bg-white focus:border-sitk-yellow transition-all font-bold text-sm pt-4",
                        errors.task && "border-red-500 bg-red-50/30"
                      )}
                    />
                  </div>
                  {errors.task && <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest ml-1">{errors.task}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 2: L.I.T.E. Assessment */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-sitk-black text-white rounded-lg flex items-center justify-center font-black text-sm">2</div>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">L.I.T.E. Assessment</h2>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-sitk-yellow/10 rounded-full">
              <Info className="w-3.5 h-3.5 text-sitk-yellow" />
              <p className="text-[10px] font-black uppercase tracking-widest text-sitk-black">Think: Load; Individual; Task; Environment</p>
            </div>
          </div>

          <div className="space-y-10">
            {highRiskLiteCount >= 2 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-orange-50 border-2 border-orange-100 rounded-[2rem] flex items-start gap-4 shadow-sm"
              >
                <AlertCircle className="w-6 h-6 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-orange-900 mb-1">Risk Support Logic</h4>
                  <p className="text-sm font-bold text-orange-600 leading-relaxed">
                    Multiple items have been identified as Medium or High risk. Please ensure comprehensive remedial actions are detailed in Section 4.
                  </p>
                </div>
              </motion.div>
            )}
            {sections.map((section) => (
              <div key={section.id} className="space-y-4">
                <div className="flex items-center gap-3 ml-2">
                  <div className="p-2.5 bg-sitk-yellow/10 rounded-xl">
                    <section.icon className="w-4 h-4 text-sitk-yellow" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-[0.15em] text-slate-900">{section.title}</h3>
                </div>

                <div className="space-y-3">
                  {formData.liteAssessment
                    .filter(item => item.section === section.title.split('. ')[1])
                    .map((item) => (
                      <Card key={item.id} className={cn(
                        "border-none shadow-sm bg-white rounded-2xl overflow-hidden group hover:shadow-md transition-all duration-300",
                        !item.risk && errors.liteAssessment ? "ring-1 ring-red-200 bg-red-50/10" : ""
                      )}>
                        <CardContent className="p-5 sm:p-6">
                          <div className="flex flex-col md:flex-row md:items-center gap-6">
                            <p className="flex-1 text-sm font-bold text-slate-900 leading-snug">{item.item}</p>
                            
                            <div className="flex flex-wrap items-center gap-8">
                              <div className="space-y-2">
                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-1">Risk Identified?</p>
                                <div className="flex gap-1 bg-slate-50 p-1 rounded-xl">
                                  {['YES', 'NO', 'N/A'].map((opt) => (
                                    <Button
                                      key={opt}
                                      type="button"
                                      variant={item.risk === opt ? 'default' : 'ghost'}
                                      onClick={() => updateLiteItem(item.id, 'risk', opt)}
                                      className={cn(
                                        "h-10 px-5 rounded-lg font-black text-[10px] tracking-widest transition-all",
                                        item.risk === opt 
                                          ? "bg-sitk-black text-white shadow-sm" 
                                          : "text-slate-400 hover:text-sitk-black hover:bg-white"
                                      )}
                                    >
                                      {opt}
                                    </Button>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-1">Level of Risk</p>
                                <div className="flex gap-1 bg-slate-50 p-1 rounded-xl">
                                  {['LOW', 'MEDIUM', 'HIGH'].map((opt) => (
                                    <Button
                                      key={opt}
                                      type="button"
                                      variant={item.level === opt ? 'default' : 'ghost'}
                                      disabled={item.risk !== 'YES'}
                                      onClick={() => updateLiteItem(item.id, 'level', opt)}
                                      className={cn(
                                        "h-10 px-5 rounded-lg font-black text-[10px] tracking-widest transition-all",
                                        item.level === opt 
                                          ? (opt === 'LOW' ? "bg-green-600 text-white" : 
                                             opt === 'MEDIUM' ? "bg-orange-500 text-white" : 
                                             "bg-red-600 text-white")
                                          : "text-slate-400 hover:text-sitk-black hover:bg-white",
                                        item.risk !== 'YES' && "opacity-20 cursor-not-allowed"
                                      )}
                                    >
                                      {opt}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Initial Risk Assessment */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-sitk-black text-white rounded-lg flex items-center justify-center font-black text-sm">3</div>
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Initial Risk Assessment <span className="text-red-500">*</span></h2>
          </div>

          <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
            <CardContent className="p-8 sm:p-10">
              <div className="space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['Low', 'Normal', 'Medium', 'High'].map((level) => (
                    <Button
                      key={level}
                      type="button"
                      variant={formData.initialRisk === level ? 'default' : 'outline'}
                      onClick={() => updateField('initialRisk', level)}
                      className={cn(
                        "h-20 rounded-[1.5rem] font-black uppercase text-[11px] tracking-widest transition-all border-2",
                        formData.initialRisk === level 
                          ? (level === 'Low' ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-100" :
                             level === 'Normal' ? "bg-sitk-black border-sitk-black text-white shadow-lg shadow-slate-200" :
                             level === 'Medium' ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-100" :
                             "bg-red-600 border-red-600 text-white shadow-lg shadow-red-100")
                          : "border-slate-100 text-slate-400 hover:bg-slate-50 hover:border-slate-200"
                      )}
                    >
                      {level}
                    </Button>
                  ))}
                </div>
                {errors.initialRisk && <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest ml-1">{errors.initialRisk}</p>}
                
                {(formData.initialRisk === 'Medium' || formData.initialRisk === 'High') && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 bg-red-50 border-2 border-red-100 rounded-[2rem] flex items-start gap-4"
                  >
                    <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-red-900 mb-1">Action Required</h4>
                      <p className="text-sm font-bold text-red-600 leading-relaxed">
                        Risk level is {formData.initialRisk.toUpperCase()}. You must arrange for remedial action to be taken to reduce the risk to acceptable or lower levels before work continues.
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 4: Remedial Action */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-sitk-black text-white rounded-lg flex items-center justify-center font-black text-sm">4</div>
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Remedial Action {(formData.initialRisk === 'Medium' || formData.initialRisk === 'High') && <span className="text-red-500">*</span>}</h2>
          </div>

          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardContent className="p-8">
              <div className="space-y-4">
                <Label htmlFor="remedialAction" className="text-slate-400 font-black uppercase text-[9px] tracking-widest ml-1">
                  State any remedial action required and date due
                </Label>
                <Textarea 
                  id="remedialAction"
                  value={formData.remedialAction}
                  onChange={e => updateField('remedialAction', e.target.value)}
                  placeholder="Detail the actions needed to mitigate identified risks..."
                  className="bg-slate-50/50 border-slate-100 min-h-[150px] rounded-2xl focus:bg-white transition-all font-bold text-sm p-6"
                />
                {errors.remedialAction && <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest ml-1">{errors.remedialAction}</p>}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 5: Final Risk Assessment */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-sitk-black text-white rounded-lg flex items-center justify-center font-black text-sm">5</div>
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Final Risk Assessment <span className="text-red-500">*</span></h2>
          </div>

          <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
            <CardContent className="p-8 sm:p-10">
              <div className="space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['Low', 'Normal', 'Medium', 'High'].map((level) => (
                    <Button
                      key={level}
                      type="button"
                      variant={formData.finalRisk === level ? 'default' : 'outline'}
                      onClick={() => updateField('finalRisk', level)}
                      className={cn(
                        "h-20 rounded-[1.5rem] font-black uppercase text-[11px] tracking-widest transition-all border-2",
                        formData.finalRisk === level 
                          ? (level === 'Low' ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-100" :
                             level === 'Normal' ? "bg-sitk-black border-sitk-black text-white shadow-lg shadow-slate-200" :
                             level === 'Medium' ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-100" :
                             "bg-red-600 border-red-600 text-white shadow-lg shadow-red-100")
                          : "border-slate-100 text-slate-400 hover:bg-slate-50 hover:border-slate-200"
                      )}
                    >
                      {level}
                    </Button>
                  ))}
                </div>
                {errors.finalRisk && <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest ml-1">{errors.finalRisk}</p>}
                <div className="p-6 bg-green-50 border-2 border-green-100 rounded-[2rem] flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-green-900 mb-1">Verification</h4>
                    <p className="text-sm font-bold text-green-700 leading-relaxed">
                      Ensure all controls are in place and effective before proceeding with the task.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 6: What Now */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-sitk-black text-white rounded-lg flex items-center justify-center font-black text-sm">6</div>
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">What Now</h2>
          </div>

          <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden border-2 border-slate-50">
            <CardContent className="p-8 sm:p-10">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="h-12 w-12 bg-sitk-yellow/10 rounded-2xl flex items-center justify-center shrink-0">
                  <Send className="w-6 h-6 text-sitk-yellow" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Post-Assessment Actions</h4>
                  <p className="text-sm font-bold text-slate-500 leading-relaxed">
                    Once completed, make available to the relevant workforce, and use in H&S training. Review and revise on a regular basis or when there are significant changes in relevant factors.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 7: Guidance Panel */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-sitk-black text-white rounded-lg flex items-center justify-center font-black text-sm">7</div>
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Guidance Panel</h2>
          </div>

          <Card className="border-none shadow-sm bg-slate-900 text-white rounded-[2rem] overflow-hidden">
            <CardContent className="p-8 sm:p-12">
              <div className="grid gap-12 lg:grid-cols-2">
                <div className="space-y-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sitk-yellow rounded-lg">
                      <Info className="w-5 h-5 text-sitk-black" />
                    </div>
                    <h4 className="font-black uppercase tracking-widest text-xs">Lifting Technique</h4>
                  </div>
                  <div className="grid gap-4">
                    {[
                      "Plan the lift – where is the load going?",
                      "Keep the load close to the waist.",
                      "Use your leg muscles to lift – not your back!"
                    ].map((tip, i) => (
                      <div key={i} className={cn(
                        "p-4 rounded-xl border flex items-center gap-4 transition-all",
                        i === 2 ? "bg-sitk-yellow/10 border-sitk-yellow/30" : "bg-white/5 border-white/10"
                      )}>
                        <div className={cn(
                          "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0",
                          i === 2 ? "bg-sitk-yellow text-sitk-black" : "bg-white/10 text-white"
                        )}>{i + 1}</div>
                        <p className={cn(
                          "text-sm font-bold leading-tight",
                          i === 2 ? "text-sitk-yellow" : "text-slate-300"
                        )}>{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sitk-yellow rounded-lg">
                      <ShieldCheck className="w-5 h-5 text-sitk-black" />
                    </div>
                    <h4 className="font-black uppercase tracking-widest text-xs">Assessment Guidance</h4>
                  </div>
                  <div className="space-y-6">
                    <p className="text-sm font-bold text-slate-300 leading-relaxed">
                      Guidance for assessing manual handling (not maximum or minimum figures). Focus on the L.I.T.E. principles to determine if the task is safe for the individual in their specific environment.
                    </p>
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-4">
                      <AlertCircle className="w-5 h-5 text-sitk-yellow shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-sitk-yellow mb-1">Safety First</p>
                        <p className="text-xs font-bold text-slate-400 leading-relaxed">
                          If in doubt, seek assistance or use mechanical aids. Never attempt a lift that feels beyond your capacity.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
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

      {/* Sticky Footer Actions */}
      {/* Photos Section */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
        <PhotoUpload photos={photos} onPhotosChange={updatePhotos} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 p-4 sm:p-6 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] export-hide">
        <div className="max-w-5xl mx-auto flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => handleSave('Draft')}
            disabled={isSubmitting}
            className="h-12 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest border-2 border-slate-100 hover:bg-slate-50 transition-all"
          >
            <Save className="w-4 h-4 mr-2" /> Save Draft
          </Button>
          <Button
            onClick={() => handleSave('Submitted')}
            disabled={isSubmitting}
            className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest bg-sitk-black text-white hover:bg-slate-800 shadow-lg transition-all"
          >
            {isSubmitting ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Send className="w-4 h-4 mr-2" /> Submit</>
            )}
          </Button>
        </div>
      </div>

      {/* Success Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-sitk-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-[3rem] p-12 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-2">
                {currentStatus === 'Draft' ? 'Draft Saved' : 'Assessment Submitted'}
              </h2>
              <p className="text-slate-500 font-bold text-sm mb-8">
                {currentStatus === 'Draft' 
                  ? 'Your progress has been saved. You can complete this later.' 
                  : 'The manual handling assessment has been successfully logged.'}
              </p>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2 }}
                  className="h-full bg-sitk-yellow"
                />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-4">Redirecting to reports...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
