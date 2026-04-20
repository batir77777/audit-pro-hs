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
  Flame,
  HardHat,
  Construction,
  Zap,
  Maximize,
  Users
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
import { PermitToWorkReport, ReportStatus, ChecklistAnswer } from '@/types';
import SectionHeader from '@/components/SectionHeader';
import StatusBadge from '@/components/StatusBadge';

const PERMIT_TYPES = [
  { id: 'Confined Space', icon: HardHat, color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'Excavation', icon: Construction, color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'Work at Height', icon: Maximize, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'Hot Works', icon: Flame, color: 'text-red-600', bg: 'bg-red-50' },
  { id: 'Work on Live Electrics', icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50' }
] as const;

const HAZARDS_BY_TYPE = {
  'Confined Space': [
    "Oxygen Levels / Atmosphere Check", "Mains Gas / Services Isolation", "Electrical / High Voltage Hazards", "Water Ingress / Flooding Risk", "Cables and Pipework", 
    "Drainage and Sewage Systems", "Fragile Flooring / Surfaces", "Awkward Postures / Ergonomics", "Noise Levels", "Heat and Temperature", 
    "Lighting and Visibility", "Rest Breaks and Fatigue", "Asbestos Presence", "Ease of Escape / Access", "Biological Hazards", "Minimum 2 Staff Presence"
  ],
  'Excavation': [
    "Oxygen Levels / Atmosphere Check", "Mains Gas / Services Isolation", "Electrical / High Voltage Hazards", "Water Ingress / Flooding Risk", "Cables and Pipework", 
    "Drainage and Sewage Systems", "Safe Shoring / Benchings", "Awkward Postures / Ergonomics", "Noise Levels", "Heat and Temperature", 
    "Lighting and Visibility", "Rescue Plan / Equipment", "Asbestos Presence", "Ease of Escape / Access", "Biological Hazards", "Weather Conditions"
  ],
  'Work at Height': [
    "Must the work be done at height?", "Ladder Safety / Condition", "Step Ladder Safety / Condition", "MEWP Safety / Certification", "Scaffold Safety / Tagging", 
    "Guard Rails and Toe Boards", "Toe Guards / Debris Netting", "Ground Stability / Level", "Area Fenced Off / Segregated", "Supervised Working", 
    "Fall Protection Systems", "Harness and Lanyard Condition", "Weather Conditions (Wind/Rain)", "IPAF / PASMA Certification", "Rescue Plan / Equipment", "Safety Signs Displayed"
  ],
  'Hot Works': [
    "Area clear of combustible materials", "CO2 Extinguisher present", "Water Extinguisher present", 
    "No flammable gases in atmosphere", "Foam Extinguisher present", "Powder Extinguisher present", 
    "Prevention of fire spread considered", "Fire Blanket available", "First Aid Burns Kit available", 
    "Fire/smoke alarm isolation authorised"
  ],
  'Work on Live Electrics': [
    "Point of isolation identified", "CO2 Extinguisher present", "Powder Extinguisher present", 
    "Non-conductive tools in use", "Client authorisation obtained", "Check plans and drawings", 
    "Temporary insulation required", "Cable detector in use", "First Aid Burns Kit available", 
    "Staff trained in electrical safety"
  ]
};

const PRECAUTIONS_BY_TYPE = {
  'Confined Space': ["Works supervised and no lone working", "Staff wear correct PPE and trained", "Pre-start inspection checks", "Rescue plan in place"],
  'Excavation': ["Excavation shored safely", "Staff wear correct PPE and trained", "Pre-start inspection checks", "No heavy equipment close to edges"],
  'Work at Height': ["Guards or covers over all gaps", "Staff wear correct PPE and trained", "Pre-start inspection checks", "Equipment checked as safe"],
  'Hot Works': [], // Hot works has repeatable log instead
  'Work on Live Electrics': ["Works supervised and no lone working", "Staff wear correct PPE and trained", "Pre-start inspection checks", "Rescue plan in place"]
};

const FINAL_CHECKLIST_ITEMS = [
  "Is the person(s) carrying out these works fully trained and competent to do so?",
  "Does the person(s) have the correct Training Card / Certificate (if required)?",
  "Is there a First Aid Kit close to the works for an emergency?",
  "Are there suitable Fire Extinguishers close to the works?",
  "Have you considered the Rescue Plan / Emergency Actions?",
  "Do all operatives know how to contact the emergency service if needs be?",
  "Does the person(s) carrying out the task have the right PPE?",
  "Site-specific information"
];

export default function PermitToWorkMultiGeneralForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const editId = (location.state as any)?.editId as string | undefined;
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [currentStatus, setCurrentStatus] = React.useState<ReportStatus>('Draft');
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [formData, setFormData] = React.useState<Omit<PermitToWorkReport, 'id' | 'authorId' | 'status' | 'title' | 'type' | 'location'>>({
    dateOfInitialIssue: new Date().toISOString().split('T')[0],
    printName: (getSession()?.name ?? ''),
    signature: '',
    jobTitle: '',
    projectAddress: '',
    locationOfPermitWork: '',
    namesOfOperatives: '',
    permitType: '',
    hazards: {},
    otherHazards: '',
    precautions: {},
    fireWatchDuration: '',
    hotWorksLog: [
      { id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], startTime: '', finishTime: '' },
      { id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], startTime: '', finishTime: '' },
      { id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], startTime: '', finishTime: '' }
    ],
    handBack: {
      name: '',
      date: new Date().toISOString().split('T')[0],
      time: ''
    },
    finalChecklist: FINAL_CHECKLIST_ITEMS.map((q, i) => ({
      id: `fc-${i + 1}`,
      question: q,
      answer: undefined,
      notes: ''
    })),
    revalidationLog: [
      { id: crypto.randomUUID(), date: '', supervisorName: '', supervisorSignature: '', operativeNames: '', operativeSignature: '' }
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

  const updateNestedField = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...(prev as any)[parent], [field]: value }
    }));
  };

  const updateHazard = (hazard: string, answer: ChecklistAnswer) => {
    setFormData(prev => ({
      ...prev,
      hazards: { ...prev.hazards, [hazard]: answer }
    }));
  };

  const togglePrecaution = (precaution: string) => {
    setFormData(prev => ({
      ...prev,
      precautions: { ...prev.precautions, [precaution]: !prev.precautions[precaution] }
    }));
  };

  const updateHotWorksRow = (id: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      hotWorksLog: prev.hotWorksLog?.map(row => row.id === id ? { ...row, [field]: value } : row)
    }));
  };

  const updateFinalCheck = (id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      finalChecklist: prev.finalChecklist.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const addRevalidationRow = () => {
    setFormData(prev => ({
      ...prev,
      revalidationLog: [...prev.revalidationLog, { id: crypto.randomUUID(), date: '', supervisorName: '', supervisorSignature: '', operativeNames: '', operativeSignature: '' }]
    }));
  };

  const updateRevalidationRow = (id: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      revalidationLog: prev.revalidationLog.map(row => row.id === id ? { ...row, [field]: value } : row)
    }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.printName.trim()) newErrors.printName = 'Print Name is required';
    if (!formData.projectAddress.trim()) newErrors.projectAddress = 'Project Address is required';
    if (!formData.locationOfPermitWork.trim()) newErrors.locationOfPermitWork = 'Location of Permit Work is required';
    if (!formData.permitType) newErrors.permitType = 'Please select a Permit Type';
    
    // Check if all hazards for selected type are answered
    if (formData.permitType) {
      const hazards = HAZARDS_BY_TYPE[formData.permitType as keyof typeof HAZARDS_BY_TYPE];
      const unansweredHazards = hazards.filter(h => !formData.hazards[h]);
      if (unansweredHazards.length > 0) {
        newErrors.hazards = `Please answer all ${unansweredHazards.length} hazard items.`;
      }

      if (formData.permitType === 'Hot Works' && !formData.fireWatchDuration) {
        newErrors.fireWatchDuration = 'Please select a Fire Watch duration';
      }
    }

    const unansweredFinal = formData.finalChecklist.filter(item => !item.answer);
    if (unansweredFinal.length > 0) {
      newErrors.finalChecklist = `Please answer all ${unansweredFinal.length} final checklist items.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { photos, updatePhotos, clearPhotos } = usePhotoStore('permit_to_work');
  const { clearAutoSave } = useAutoSave('permit_to_work', formData);
  React.useEffect(() => {
    const saved = getAutoSavedData<any>('permit_to_work'); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (saved) setFormData(saved);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (status: ReportStatus) => {
    if (status === 'Submitted' && !validate()) {
      const firstError = document.querySelector('.text-red-500');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    clearAutoSave();
    setIsSubmitting(true);
    setCurrentStatus(status);

    try {
      const newId = editId ?? crypto.randomUUID();
      const report: PermitToWorkReport = {
        ...formData,
        id: newId,
        authorId: mockUser.id,
        status,
        title: `Permit to Work - ${formData.permitType || 'Multi General'} - ${formData.dateOfInitialIssue}`,
        type: 'Permit to Work',
        location: formData.locationOfPermitWork || formData.projectAddress.split('\n')[0] || 'Not Specified',
        date: formData.dateOfInitialIssue,
        photos,
      };

      saveReport(report);
      clearPhotos();

      if (status === 'Submitted') {
        try {
          await exportSavedReportToPDF(report, DEFAULT_BRANDING);
        } catch (pdfErr) {
          console.error('[PermitToWorkMultiGeneralForm] PDF generation failed:', pdfErr);
        }
      }

      navigate('/my-reports');
    } catch (err) {
      console.error('[PermitToWorkMultiGeneralForm] Save failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/permits')}
          className="text-slate-500 hover:text-sitk-black font-black uppercase text-[10px] tracking-widest"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Permits
        </Button>
        <div className="flex items-center gap-3">
          <StatusBadge status={currentStatus} />
        </div>
      </div>

      <SectionHeader 
        title="Permit to Work MULTI GENERAL" 
        icon={FileText}
        description="Comprehensive authorisation for high-risk site activities."
      />

      {/* Progress Tracker */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {[
          { label: 'Details', done: !!(formData.printName && formData.projectAddress && formData.locationOfPermitWork) },
          { label: 'Type', done: !!formData.permitType },
          { label: 'Hazards', done: formData.permitType ? Object.keys(formData.hazards).length >= HAZARDS_BY_TYPE[formData.permitType as keyof typeof HAZARDS_BY_TYPE].length : false },
          { label: 'Hand Back', done: !!(formData.handBack.name && formData.handBack.date) },
          { label: 'Final Check', done: formData.finalChecklist.every(item => item.answer) },
          { label: 'Revalidation', done: formData.revalidationLog.length > 0 && !!formData.revalidationLog[0].date }
        ].map((step, i) => (
          <div key={step.label} className="space-y-2">
            <div className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              step.done ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]" : "bg-slate-200"
            )} />
            <p className={cn(
              "text-[9px] font-black uppercase tracking-widest text-center",
              step.done ? "text-green-600" : "text-slate-400"
            )}>
              {i + 1}. {step.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 space-y-16">
        {/* Section 1: Permit Details */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-sitk-black text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-sitk-black/10">1</div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Permit Details</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Basic information and site location</p>
            </div>
          </div>

          <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
            <CardContent className="p-8 sm:p-12">
              <div className="grid gap-10 sm:grid-cols-2">
                <div className="space-y-4">
                  <Label htmlFor="dateOfInitialIssue" className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2 ml-1">
                    <Calendar className="w-3 h-3" /> Date of initial Issue <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative group/input">
                    <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                    <Input 
                      id="dateOfInitialIssue"
                      type="date"
                      value={formData.dateOfInitialIssue}
                      onChange={e => updateField('dateOfInitialIssue', e.target.value)}
                      className="pl-14 bg-slate-50/50 border-slate-200 h-16 rounded-2xl focus:bg-white focus:border-sitk-yellow transition-all font-bold text-base"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label htmlFor="printName" className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2 ml-1">
                    <User className="w-3 h-3" /> PRINT Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative group/input">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                    <Input 
                      id="printName"
                      value={formData.printName}
                      onChange={e => updateField('printName', e.target.value)}
                      className={cn(
                        "pl-14 bg-slate-50/50 border-slate-200 h-16 rounded-2xl focus:bg-white focus:border-sitk-yellow transition-all font-bold text-base",
                        errors.printName && "border-red-500 bg-red-50/30"
                      )}
                    />
                  </div>
                  {errors.printName && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest ml-1">{errors.printName}</p>}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="signature" className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                    Signature
                  </Label>
                  <div className="relative group/input">
                    <PenTool className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                    <Input 
                      id="signature"
                      value={formData.signature}
                      onChange={e => updateField('signature', e.target.value)}
                      placeholder="Type name to sign..."
                      className="pl-14 bg-slate-50/50 border-slate-200 h-16 rounded-2xl focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-base font-bold italic"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="jobTitle" className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                    Job Title
                  </Label>
                  <div className="relative group/input">
                    <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                    <Input 
                      id="jobTitle"
                      value={formData.jobTitle}
                      onChange={e => updateField('jobTitle', e.target.value)}
                      className="pl-14 bg-slate-50/50 border-slate-200 h-16 rounded-2xl focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-base font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-3 sm:col-span-2">
                  <Label htmlFor="projectAddress" className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                    Project Address <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative group/input">
                    <MapPin className="absolute left-6 top-6 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                    <Textarea 
                      id="projectAddress"
                      value={formData.projectAddress}
                      onChange={e => updateField('projectAddress', e.target.value)}
                      placeholder="Enter full project address..."
                      className={cn(
                        "pl-14 bg-slate-50/50 border-slate-200 min-h-[100px] rounded-3xl focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-base font-bold",
                        errors.projectAddress && "border-red-500 bg-red-50/30"
                      )}
                    />
                  </div>
                  {errors.projectAddress && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{errors.projectAddress}</p>}
                </div>

                <div className="space-y-3 sm:col-span-2">
                  <Label htmlFor="locationOfPermitWork" className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                    Location of Permit Work <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative group/input">
                    <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                    <Input 
                      id="locationOfPermitWork"
                      value={formData.locationOfPermitWork}
                      onChange={e => updateField('locationOfPermitWork', e.target.value)}
                      placeholder="e.g. Basement, Roof Area, Room 402..."
                      className={cn(
                        "pl-14 bg-slate-50/50 border-slate-200 h-16 rounded-2xl focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-base font-bold",
                        errors.locationOfPermitWork && "border-red-500 bg-red-50/30"
                      )}
                    />
                  </div>
                  {errors.locationOfPermitWork && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{errors.locationOfPermitWork}</p>}
                </div>

                <div className="space-y-3 sm:col-span-2">
                  <Label htmlFor="namesOfOperatives" className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                    Names of operatives
                  </Label>
                  <div className="relative group/input">
                    <Users className="absolute left-6 top-6 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                    <Textarea 
                      id="namesOfOperatives"
                      value={formData.namesOfOperatives}
                      onChange={e => updateField('namesOfOperatives', e.target.value)}
                      placeholder="List all operatives involved..."
                      className="pl-14 bg-slate-50/50 border-slate-200 min-h-[80px] rounded-3xl focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-base font-bold"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 2: Permit Type Selection */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-sitk-black text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-sitk-black/10">2</div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Permit Type Selection <span className="text-red-500">*</span></h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Select the specific high-risk activity</p>
            </div>
          </div>

          <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-[2rem] flex gap-4 items-start">
            <div className="bg-blue-500 p-2 rounded-xl shrink-0 shadow-lg">
              <Info className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-medium text-slate-700 leading-relaxed">
              Choose the correct Permit type. Mark items with a safe or unsafe status and mark precautions needed.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PERMIT_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => updateField('permitType', type.id)}
                className={cn(
                  "p-6 rounded-[2.5rem] border-2 transition-all text-left flex flex-col gap-5 group relative overflow-hidden",
                  formData.permitType === type.id 
                    ? "border-sitk-black bg-sitk-black text-white shadow-2xl scale-[1.02]" 
                    : (errors.permitType ? "border-red-200 bg-red-50/30 hover:border-red-300" : "border-slate-100 bg-white hover:border-sitk-yellow hover:shadow-xl")
                )}
              >
                {formData.permitType === type.id && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-6 right-6"
                  >
                    <CheckCircle2 className="w-6 h-6 text-sitk-yellow" />
                  </motion.div>
                )}
                <div className={cn(
                  "p-4 rounded-2xl w-fit transition-colors",
                  formData.permitType === type.id ? "bg-white/10" : type.bg
                )}>
                  <type.icon className={cn("w-7 h-7", formData.permitType === type.id ? "text-white" : type.color)} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className={cn(
                      "font-black uppercase text-[10px] tracking-[0.2em]",
                      formData.permitType === type.id ? "text-white/50" : "text-slate-400"
                    )}>Permit Type</p>
                    {formData.permitType === type.id && (
                      <span className="bg-sitk-yellow text-sitk-black text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-tighter">Selected</span>
                    )}
                  </div>
                  <h3 className="font-black uppercase tracking-tight text-xl leading-tight">{type.id}</h3>
                </div>
              </button>
            ))}
          </div>
          {errors.permitType && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 mt-4">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-xs font-black uppercase tracking-widest">{errors.permitType}</p>
            </div>
          )}
        </section>

        {/* Section 3: Permit Type Hazard and Precaution Sections */}
        {formData.permitType && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-sitk-black text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-sitk-black/10">3</div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">{formData.permitType} Hazards & Precautions <span className="text-red-500">*</span></h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Specific safety checks for {formData.permitType}</p>
              </div>
            </div>

            {errors.hazards && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-xs font-black uppercase tracking-widest">{errors.hazards}</p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {HAZARDS_BY_TYPE[formData.permitType as keyof typeof HAZARDS_BY_TYPE].map((hazard, index) => (
                <Card key={hazard} className={cn(
                  "border-2 shadow-sm bg-white rounded-[2rem] overflow-hidden hover:shadow-md transition-shadow",
                  !formData.hazards[hazard] && errors.hazards ? "border-red-200 bg-red-50/30" : "border-slate-100"
                )}>
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-5">
                      <div className="flex gap-4">
                        <div className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                          <span className="text-slate-400 font-black text-xs">{index + 1}</span>
                        </div>
                        <p className="text-sm font-bold text-slate-900 leading-snug pt-1">{hazard}</p>
                      </div>
                      <div className="flex gap-2">
                        {(['Safe', 'Unsafe', 'N/A'] as const).map((option) => (
                          <Button
                            key={option}
                            type="button"
                            variant={formData.hazards[hazard] === option ? 'default' : 'outline'}
                            onClick={() => updateHazard(hazard, option as any)}
                            className={cn(
                              "flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all border-2",
                              formData.hazards[hazard] === option 
                                ? (option === 'Safe' ? "bg-green-600 border-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200" : 
                                   option === 'Unsafe' ? "bg-red-600 border-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200" :
                                   "bg-slate-600 border-slate-600 hover:bg-slate-700 text-white shadow-lg shadow-slate-200")
                                : "border-slate-100 text-slate-400 hover:bg-slate-50 hover:border-slate-200"
                            )}
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-4">
              <Label className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                <Plus className="w-3 h-3" /> List any other hazard(s)
              </Label>
              <Textarea 
                value={formData.otherHazards}
                onChange={e => updateField('otherHazards', e.target.value)}
                placeholder="Enter any additional hazards identified during site walk-around..."
                className="bg-white border-slate-200 rounded-[2rem] min-h-[120px] p-6 focus-visible:ring-sitk-yellow font-bold text-base shadow-sm"
              />
            </div>

            {/* Precautions Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Precautions needed to make this work safe</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {PRECAUTIONS_BY_TYPE[formData.permitType as keyof typeof PRECAUTIONS_BY_TYPE]?.map((precaution) => (
                  <button
                    key={precaution}
                    onClick={() => togglePrecaution(precaution)}
                    className={cn(
                      "p-6 rounded-[2rem] border-2 text-left transition-all flex items-center gap-5 group",
                      formData.precautions[precaution]
                        ? "border-sitk-black bg-sitk-black text-white shadow-lg"
                        : "border-slate-100 bg-white hover:border-sitk-yellow hover:shadow-md"
                    )}
                  >
                    <div className={cn(
                      "h-8 w-8 rounded-xl border-2 flex items-center justify-center transition-all shrink-0",
                      formData.precautions[precaution] ? "bg-sitk-yellow border-sitk-yellow scale-110" : "border-slate-200 group-hover:border-sitk-yellow"
                    )}>
                      {formData.precautions[precaution] && <CheckCircle2 className="w-5 h-5 text-sitk-black" />}
                    </div>
                    <span className="text-sm font-bold leading-tight">{precaution}</span>
                  </button>
                ))}
                <div className="p-6 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50/50 flex items-center gap-5">
                  <div className="h-8 w-8 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4 text-slate-400" />
                  </div>
                  <span className="text-sm font-bold text-slate-400 italic">Other site-specific precautions...</span>
                </div>
              </div>
            </div>

            {/* Hot Works Specific Log */}
            {formData.permitType === 'Hot Works' && (
              <div className="space-y-12">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Flame className="w-5 h-5 text-red-600" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Fire Watch Duration <span className="text-red-500">*</span></h3>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {['30 Mins', '45 Mins', '60 Mins'].map((duration) => (
                      <button
                        key={duration}
                        onClick={() => updateField('fireWatchDuration', duration)}
                        className={cn(
                          "p-6 rounded-[2rem] border-2 transition-all text-center",
                          formData.fireWatchDuration === duration 
                            ? "border-red-600 bg-red-600 text-white shadow-xl scale-[1.02]" 
                            : (errors.fireWatchDuration ? "border-red-200 bg-red-50/30 hover:border-red-300" : "border-slate-100 bg-white hover:border-red-200 hover:shadow-lg")
                        )}
                      >
                        <p className={cn(
                          "font-black uppercase text-[10px] tracking-widest mb-1",
                          formData.fireWatchDuration === duration ? "text-white/60" : "text-slate-400"
                        )}>Duration</p>
                        <h4 className="font-black uppercase tracking-tight text-lg">{duration}</h4>
                      </button>
                    ))}
                  </div>
                  {errors.fireWatchDuration && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest text-center">{errors.fireWatchDuration}</p>}
                </div>

                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <Clock className="w-5 h-5 text-slate-600" />
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Hot Works Time Log</h3>
                    </div>
                    <p className="hidden sm:block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Required for fire watch monitoring</p>
                  </div>
                  <div className="space-y-4">
                    {formData.hotWorksLog?.map((row, index) => (
                      <Card key={row.id} className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden hover:shadow-md transition-shadow">
                        <CardContent className="p-6 sm:p-8">
                          <div className="grid gap-8 sm:grid-cols-3 items-end">
                            <div className="space-y-3">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Calendar className="w-3 h-3" /> Date
                              </Label>
                              <Input 
                                type="date"
                                value={row.date}
                                onChange={e => updateHotWorksRow(row.id, 'date', e.target.value)}
                                className="bg-slate-50/50 border-slate-100 rounded-xl font-bold h-14 focus:bg-white transition-colors"
                              />
                            </div>
                            <div className="space-y-3">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Clock className="w-3 h-3" /> Start Time
                              </Label>
                              <Input 
                                type="time"
                                value={row.startTime}
                                onChange={e => updateHotWorksRow(row.id, 'startTime', e.target.value)}
                                className="bg-slate-50/50 border-slate-100 rounded-xl font-bold h-14 focus:bg-white transition-colors"
                              />
                            </div>
                            <div className="space-y-3">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Clock className="w-3 h-3" /> Finish Time
                              </Label>
                              <Input 
                                type="time"
                                value={row.finishTime}
                                onChange={e => updateHotWorksRow(row.id, 'finishTime', e.target.value)}
                                className="bg-slate-50/50 border-slate-100 rounded-xl font-bold h-14 focus:bg-white transition-colors"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.section>
        )}

        {/* Section 4: Hand Back and Cancellation */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-sitk-black text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-sitk-black/10">4</div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Hand Back & Cancellation</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Confirm work completion and site safety</p>
            </div>
          </div>

          <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
            <CardContent className="p-8 sm:p-10">
              <div className="mb-8 p-6 bg-green-50 border border-green-100 rounded-3xl">
                <p className="text-sm font-bold text-green-800 leading-relaxed">
                  I confirm work is complete, checked and area left in a safe condition.
                </p>
              </div>
              <div className="grid gap-8 sm:grid-cols-3">
                <div className="space-y-3">
                  <Label className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                    <User className="w-3 h-3" /> Name
                  </Label>
                  <div className="relative group/input">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                    <Input 
                      value={formData.handBack.name}
                      onChange={e => updateNestedField('handBack', 'name', e.target.value)}
                      className="pl-12 bg-slate-50/50 border-slate-200 h-14 rounded-xl focus:bg-white transition-all font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Date
                  </Label>
                  <div className="relative group/input">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                    <Input 
                      type="date"
                      value={formData.handBack.date}
                      onChange={e => updateNestedField('handBack', 'date', e.target.value)}
                      className="pl-12 bg-slate-50/50 border-slate-200 h-14 rounded-xl focus:bg-white transition-all font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Time
                  </Label>
                  <div className="relative group/input">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                    <Input 
                      type="time"
                      value={formData.handBack.time}
                      onChange={e => updateNestedField('handBack', 'time', e.target.value)}
                      className="pl-12 bg-slate-50/50 border-slate-200 h-14 rounded-xl focus:bg-white transition-all font-bold"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 5: Final Permit Check */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-sitk-black text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-sitk-black/10">5</div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Final Permit Check <span className="text-red-500">*</span></h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Pre-start verification of all safety controls</p>
            </div>
          </div>

          <div className="p-6 bg-sitk-yellow/10 border border-sitk-yellow/20 rounded-[2rem] flex gap-4 items-start">
            <div className="bg-sitk-yellow p-2 rounded-xl shrink-0 shadow-lg">
              <AlertCircle className="w-5 h-5 text-sitk-black" />
            </div>
            <p className="text-sm font-medium text-slate-700 leading-relaxed">
              Complete all Sections before signing this Permit. Be certain that all risks have been identified and that work will be carried out in the safest way possible on this site.
            </p>
          </div>

          {errors.finalChecklist && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-xs font-black uppercase tracking-widest">{errors.finalChecklist}</p>
            </div>
          )}

          <div className="space-y-6">
            {formData.finalChecklist.map((item, index) => (
              <Card key={item.id} className={cn(
                "border-2 shadow-sm bg-white rounded-[2.5rem] overflow-hidden group hover:shadow-md transition-shadow",
                !item.answer && errors.finalChecklist ? "border-red-200 bg-red-50/30" : "border-slate-100"
              )}>
                <CardContent className="p-8 sm:p-10">
                  <div className="flex flex-col lg:flex-row gap-10">
                    <div className="flex-1 space-y-6">
                      <div className="flex gap-5">
                        <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                          <span className="text-slate-400 font-black text-sm">{index + 1}</span>
                        </div>
                        <p className="text-lg font-bold text-slate-900 leading-tight pt-1">{item.question}</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        {['Yes', 'No', 'N/A'].map((option) => (
                          <Button
                            key={option}
                            type="button"
                            variant={item.answer === option ? 'default' : 'outline'}
                            onClick={() => updateFinalCheck(item.id, 'answer', option as any)}
                            className={cn(
                              "flex-1 sm:flex-none min-w-[100px] h-14 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all border-2",
                              item.answer === option 
                                ? (option === 'Yes' ? "bg-green-600 border-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200" : 
                                   option === 'No' ? "bg-red-600 border-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200" :
                                   "bg-slate-600 border-slate-600 hover:bg-slate-700 text-white shadow-lg shadow-slate-200")
                                : "border-slate-100 text-slate-400 hover:bg-slate-50 hover:border-slate-200"
                            )}
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="lg:w-1/3 space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Info className="w-3 h-3" /> Notes & Observations
                      </Label>
                      <Textarea 
                        value={item.notes}
                        onChange={e => updateFinalCheck(item.id, 'notes', e.target.value)}
                        placeholder="Add specific details..."
                        className="bg-slate-50/50 border-slate-100 rounded-2xl text-sm font-medium min-h-[120px] focus:bg-white transition-colors"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Section 6: Permit Revalidation */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-sitk-black text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-sitk-black/10">6</div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Permit Revalidation</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Daily verification and extension log</p>
              </div>
            </div>
            <Button 
              onClick={addRevalidationRow}
              className="bg-sitk-yellow text-sitk-black hover:bg-sitk-yellow/90 font-black uppercase text-[10px] tracking-widest px-6 h-12 rounded-xl shadow-lg shadow-sitk-yellow/20"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Revalidation
            </Button>
          </div>

          <div className="p-6 bg-slate-50 border border-slate-200 rounded-[2rem] flex gap-4 items-start">
            <div className="bg-slate-200 p-2 rounded-xl shrink-0">
              <Info className="w-5 h-5 text-slate-600" />
            </div>
            <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
              This Permit can be used for up to 5 working days (3 for Hot Works) only if it is re-signed and re-dated below by the relevant persons and all the above information remains correct and valid. Check all controls daily.
            </p>
          </div>

          <div className="space-y-8">
            {formData.revalidationLog.map((row, index) => (
              <Card key={row.id} className="border-none shadow-sm bg-white rounded-[3rem] overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-8 sm:p-12">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-sitk-black text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="text-xl font-black uppercase tracking-tight text-slate-900">Permit Revalidation</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daily verification log</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Calendar className="w-3 h-3" /> Revalidation Date
                      </Label>
                      <Input 
                        type="date"
                        value={row.date}
                        onChange={e => updateRevalidationRow(row.id, 'date', e.target.value)}
                        className="bg-slate-50/50 border-slate-100 rounded-xl font-bold h-12 w-full sm:w-48 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid gap-16 lg:grid-cols-2">
                    {/* Supervisor Section */}
                    <div className="space-y-8">
                      <div className="p-6 bg-sitk-yellow/5 border border-sitk-yellow/10 rounded-3xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-sitk-yellow" />
                        <p className="text-sm font-bold text-slate-700 italic leading-relaxed">
                          "I have checked this Permit remains valid. All controls are in place and work can safely commence."
                        </p>
                      </div>
                      <div className="grid gap-6">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Supervisor / Manager Name</Label>
                          <div className="relative group/input">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                            <Input 
                              value={row.supervisorName}
                              onChange={e => updateRevalidationRow(row.id, 'supervisorName', e.target.value)}
                              className="pl-12 bg-slate-50/50 border-slate-100 rounded-xl font-bold h-14 focus:bg-white transition-colors"
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Supervisor Signature</Label>
                          <div className="relative group/input">
                            <PenTool className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                            <Input 
                              value={row.supervisorSignature}
                              onChange={e => updateRevalidationRow(row.id, 'supervisorSignature', e.target.value)}
                              placeholder="Type name to sign..."
                              className="pl-12 bg-slate-50/50 border-slate-100 rounded-xl font-bold h-14 italic focus:bg-white transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Operative Section */}
                    <div className="space-y-8">
                      <div className="p-6 bg-sitk-black/5 border border-sitk-black/10 rounded-3xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-sitk-black" />
                        <p className="text-sm font-bold text-slate-700 italic leading-relaxed">
                          "I confirm I will work safely and abide by all conditions set out in this Permit."
                        </p>
                      </div>
                      <div className="grid gap-6">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Operatives / Workers Names</Label>
                          <div className="relative group/input">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                            <Input 
                              value={row.operativeNames}
                              onChange={e => updateRevalidationRow(row.id, 'operativeNames', e.target.value)}
                              className="pl-12 bg-slate-50/50 border-slate-100 rounded-xl font-bold h-14 focus:bg-white transition-colors"
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Operative Signature</Label>
                          <div className="relative group/input">
                            <PenTool className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                            <Input 
                              value={row.operativeSignature}
                              onChange={e => updateRevalidationRow(row.id, 'operativeSignature', e.target.value)}
                              placeholder="Type name to sign..."
                              className="pl-12 bg-slate-50/50 border-slate-100 rounded-xl font-bold h-14 italic focus:bg-white transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="p-8 bg-red-50 border-2 border-dashed border-red-200 rounded-[2.5rem] flex flex-col items-center text-center gap-4">
            <div className="h-12 w-12 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-200">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xl font-black uppercase tracking-tighter text-red-600">STOP!</h4>
              <p className="text-sm font-bold text-red-800 max-w-md mx-auto">
                This Permit can only be used for up to 4 days. Start a new Permit if work needs to continue.
              </p>
            </div>
          </div>
        </section>
      </div>

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
                  <Send className="w-4 h-4 mr-2" /> Submit Permit
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
              {currentStatus === 'Draft' ? 'Draft Saved' : 'Permit Submitted'}
            </h3>
            <p className="text-slate-500 font-medium mb-8 leading-relaxed">
              {currentStatus === 'Draft' 
                ? 'Your progress has been saved. You can complete this permit later from your dashboard.' 
                : 'The Permit to Work has been successfully recorded and authorised for site works.'}
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
