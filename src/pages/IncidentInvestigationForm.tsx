import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldAlert, 
  Save, 
  Send, 
  Plus, 
  Trash2, 
  ChevronLeft,
  Info,
  CheckCircle2,
  AlertCircle,
  User,
  FileText,
  AlertTriangle,
  Clock,
  MapPin,
  Calendar,
  Users,
  Search,
  FileSearch,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { mockUser, saveReport } from '@/lib/mockData';
import { exportSavedReportToPDF } from '@/lib/exportUtils';
import { getSession } from '@/lib/auth';
import { useAutoSave, getAutoSavedData } from '@/lib/useAutoSave';
import { usePhotoStore } from '@/lib/usePhotoStore';
import { useBranding, DEFAULT_BRANDING } from '@/lib/brandingContext';
import PhotoUpload from '@/components/PhotoUpload';
import { InvolvedPerson, IncidentInvestigationReport, Report } from '@/types';
import { motion } from 'motion/react';
import SectionHeader from '@/components/SectionHeader';
import StatusBadge from '@/components/StatusBadge';

const INJURED_STATUS_OPTIONS = [
  "Employee",
  "Sub/Contractor",
  "Client",
  "Volunteer",
  "Visitor",
  "Member of public",
  "Tenant",
  "Other (State)"
];

const SEVERITY_OPTIONS = [
  { 
    id: 'catastrophic', 
    label: 'Catastrophic', 
    description: 'Serious injury, permanent incapacity, loss of limb, fatality, severe damage to property or environment, long-term loss of services.' 
  },
  { 
    id: 'major', 
    label: 'Major', 
    description: 'Major injury, multiple injuries, long term ill health, damage to property, short-term loss of services, significant effect on property or environment.' 
  },
  { 
    id: 'moderate', 
    label: 'Moderate', 
    description: 'Fractures, sprain, strain, laceration, ill health, moderate damage to property, environment, interruption to services.' 
  },
  { 
    id: 'minor', 
    label: 'Minor', 
    description: 'Cut, bruise, basic first aid treatment required, minor impact to services, property, or environment.' 
  },
  { 
    id: 'insignificant', 
    label: 'Insignificant', 
    description: 'Minimal injury (no first aid needed), no repairs required, minimal impact to services, property, or environment.' 
  },
  { 
    id: 'near-miss', 
    label: 'Near miss', 
    description: 'No harm or damage to property or environment but had the potential to cause harm or damage.' 
  },
  { 
    id: 'other', 
    label: 'Other (describe)', 
    description: 'Any other severity not listed above.' 
  }
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

export default function IncidentInvestigationForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const editId = (location.state as any)?.editId as string | undefined;
  const { branding } = useBranding();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [currentStatus, setCurrentStatus] = React.useState<'Draft' | 'Submitted'>('Draft');
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [formData, setFormData] = React.useState<Partial<IncidentInvestigationReport>>({
    investigatorName: (getSession()?.name ?? ''),
    investigatorPosition: '',
    investigationDate: new Date().toISOString().split('T')[0],
    companyDetails: `${branding.companyName}\n${branding.address}`,
    
    incidentDate: new Date().toISOString().split('T')[0],
    incidentTime: '',
    incidentLocation: '',
    injuredPersonName: '',
    
    injuredPersonStatus: '',
    otherStatusDetails: '',
    
    involvedPeople: [],
    
    severity: '',
    otherSeverityDetails: '',
    actionRequired: '',
    
    observations: '',
    peopleToSpeakTo: '',
    documents: '',
    
    trainedAndAuthorised: '',
    writtenRules: '',
    breaches: '',
    influencingFactors: '',
    recommendations: '',
    supportingEvidence: '',
    
    riddorReportable: 'N/A',
    riddorDate: '',
    riddorReportedBy: '',
    
    finalComments: '',
    description: '',
    executiveSummary: ''
  });

  const addInvolvedPerson = () => {
    const newPerson: InvolvedPerson = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'Involved',
      nameTelephone: '',
      status: 'Employee'
    };
    setFormData(prev => ({ ...prev, involvedPeople: [...(prev.involvedPeople || []), newPerson] }));
  };

  const updateInvolvedPerson = (id: string, field: keyof InvolvedPerson, value: any) => {
    setFormData(prev => ({
      ...prev,
      involvedPeople: prev.involvedPeople?.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const removeInvolvedPerson = (id: string) => {
    setFormData(prev => ({
      ...prev,
      involvedPeople: prev.involvedPeople?.filter(p => p.id !== id)
    }));
  };

  const { photos, updatePhotos, clearPhotos } = usePhotoStore('incident_investigation');
  const { clearAutoSave } = useAutoSave('incident_investigation', formData);
  React.useEffect(() => {
    const saved = getAutoSavedData<any>('incident_investigation'); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (saved) setFormData(saved);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (status: 'Draft' | 'Submitted') => {
    setErrors({});
    
    if (status === 'Submitted') {
      const newErrors: Record<string, string> = {};
      if (!formData.investigatorName) newErrors.investigatorName = "Investigator name is required";
      if (!formData.investigatorPosition) newErrors.investigatorPosition = "Position is required";
      if (!formData.investigationDate) newErrors.investigationDate = "Investigation date is required";
      if (!formData.incidentDate) newErrors.incidentDate = "Incident date is required";
      if (!formData.incidentLocation) newErrors.incidentLocation = "Incident location is required";
      if (!formData.injuredPersonName) newErrors.injuredPersonName = "Injured person name is required";
      if (!formData.injuredPersonStatus) newErrors.injuredPersonStatus = "Status of injured person is required";
      if (!formData.severity) newErrors.severity = "Incident severity is required";
      if (!formData.description) newErrors.description = "Incident description is required";

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        // Scroll to first error
        const firstErrorKey = Object.keys(newErrors)[0];
        const element = document.getElementsByName(firstErrorKey)[0];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
    }

    clearAutoSave();
    setIsSubmitting(true);
    setCurrentStatus(status);

    try {
      // Generate a descriptive title
      const reportTitle = formData.injuredPersonName 
        ? `Investigation: ${formData.injuredPersonName}` 
        : formData.incidentLocation 
          ? `Investigation: ${formData.incidentLocation}`
          : `Investigation: ${formData.incidentDate || 'New Report'}`;

      const newReport: Report = {
        id: editId ?? `r${Date.now()}`,
        title: reportTitle,
        type: 'Accident / Incident Investigation',
        status: status,
        location: formData.incidentLocation || 'Unknown Location',
        date: formData.incidentDate || new Date().toISOString().split('T')[0],
        authorId: mockUser.id,
        description: formData.description || 'No description provided.',
        photos,
      };

      saveReport({ ...formData, ...newReport });
      clearPhotos();

      if (status === 'Submitted') {
        try {
          await exportSavedReportToPDF({ ...formData, ...newReport }, branding ?? DEFAULT_BRANDING);
        } catch (pdfErr) {
          console.error('[IncidentInvestigationForm] PDF generation failed:', pdfErr);
        }
      }

      navigate('/my-reports');
    } catch (err) {
      console.error('[IncidentInvestigationForm] Save failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-32 px-4 sm:px-6">
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
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse" />
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
            {isSubmitting && currentStatus === 'Submitted' ? 'Submitting...' : 'Submit Report'}
          </Button>
        </div>
      </div>

      <SectionHeader 
        title="Accident / Incident Investigation Form" 
        icon={ShieldAlert}
        description="To be completed by the appropriate supervisor/manager. Send to the nominated Manager/Director within 3 days."
      />

      {/* Section 1: Form Completion Details */}
      <Card className="border-none shadow-md overflow-hidden bg-white rounded-2xl">
        <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-5 px-6 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="bg-sitk-yellow p-2 rounded-xl shadow-sm">
              <User className="w-4 h-4 text-sitk-black" />
            </div>
            <div>
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-800">Section 1: Form Completion Details</CardTitle>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Investigator and Company Information</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-1.5">
              <RequiredLabel required>PRINT Name of person completing Form</RequiredLabel>
              <Input 
                name="investigatorName"
                value={formData.investigatorName}
                onChange={e => setFormData(prev => ({ ...prev, investigatorName: e.target.value }))}
                placeholder="Full Name" 
                className={cn(
                  "bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow h-12 rounded-xl transition-all hover:bg-white",
                  errors.investigatorName && "border-red-500 focus-visible:ring-red-500 bg-red-50/10"
                )}
              />
              <ErrorMessage message={errors.investigatorName} />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel required>Position</RequiredLabel>
              <Input 
                name="investigatorPosition"
                value={formData.investigatorPosition}
                onChange={e => setFormData(prev => ({ ...prev, investigatorPosition: e.target.value }))}
                placeholder="Job Title" 
                className={cn(
                  "bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow h-12 rounded-xl transition-all hover:bg-white",
                  errors.investigatorPosition && "border-red-500 focus-visible:ring-red-500 bg-red-50/10"
                )}
              />
              <ErrorMessage message={errors.investigatorPosition} />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel required>Date of Investigation</RequiredLabel>
              <Input 
                name="investigationDate"
                type="date"
                value={formData.investigationDate}
                onChange={e => setFormData(prev => ({ ...prev, investigationDate: e.target.value }))}
                className={cn(
                  "bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow h-12 rounded-xl transition-all hover:bg-white",
                  errors.investigationDate && "border-red-500 focus-visible:ring-red-500 bg-red-50/10"
                )}
              />
              <ErrorMessage message={errors.investigationDate} />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel>Signature of person completing Form</RequiredLabel>
              <Input 
                value={formData.investigatorSignature}
                onChange={e => setFormData(prev => ({ ...prev, investigatorSignature: e.target.value }))}
                placeholder="Digital Signature" 
                className="bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow h-12 rounded-xl transition-all hover:bg-white"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <RequiredLabel>Co. Name & Address</RequiredLabel>
              <Textarea 
                value={formData.companyDetails}
                onChange={e => setFormData(prev => ({ ...prev, companyDetails: e.target.value }))}
                placeholder="Company Name and Full Address" 
                className="bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow min-h-[100px] resize-none rounded-xl transition-all hover:bg-white p-4"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Accident / Incident Details */}
      <Card className="border-none shadow-md overflow-hidden bg-white rounded-2xl">
        <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-5 px-6 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="bg-sitk-yellow p-2 rounded-xl shadow-sm">
              <AlertTriangle className="w-4 h-4 text-sitk-black" />
            </div>
            <div>
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-800">Section 2: Accident / Incident Details</CardTitle>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">When and where the incident occurred</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-1.5">
              <RequiredLabel required>Date of accident/incident</RequiredLabel>
              <Input 
                name="incidentDate"
                type="date"
                value={formData.incidentDate}
                onChange={e => setFormData(prev => ({ ...prev, incidentDate: e.target.value }))}
                className={cn(
                  "bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow h-12 rounded-xl transition-all hover:bg-white",
                  errors.incidentDate && "border-red-500 focus-visible:ring-red-500 bg-red-50/10"
                )}
              />
              <ErrorMessage message={errors.incidentDate} />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel>Time</RequiredLabel>
              <Input 
                type="time"
                value={formData.incidentTime}
                onChange={e => setFormData(prev => ({ ...prev, incidentTime: e.target.value }))}
                className="bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow h-12 rounded-xl transition-all hover:bg-white"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <RequiredLabel required>Place/address of occurrence</RequiredLabel>
              <Input 
                name="incidentLocation"
                value={formData.incidentLocation}
                onChange={e => setFormData(prev => ({ ...prev, incidentLocation: e.target.value }))}
                placeholder="Full Address where the incident occurred" 
                className={cn(
                  "bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow h-12 rounded-xl transition-all hover:bg-white",
                  errors.incidentLocation && "border-red-500 focus-visible:ring-red-500 bg-red-50/10"
                )}
              />
              <ErrorMessage message={errors.incidentLocation} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <RequiredLabel required>Name of injured person(s)</RequiredLabel>
              <Input 
                name="injuredPersonName"
                value={formData.injuredPersonName}
                onChange={e => setFormData(prev => ({ ...prev, injuredPersonName: e.target.value }))}
                placeholder="Full Name of the injured person" 
                className={cn(
                  "bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow h-12 rounded-xl transition-all hover:bg-white",
                  errors.injuredPersonName && "border-red-500 focus-visible:ring-red-500 bg-red-50/10"
                )}
              />
              <ErrorMessage message={errors.injuredPersonName} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Status of injured person(s) */}
      <Card className="border-none shadow-md overflow-hidden bg-white rounded-2xl">
        <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-5 px-6 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="bg-sitk-yellow p-2 rounded-xl shadow-sm">
              <Users className="w-4 h-4 text-sitk-black" />
            </div>
            <div>
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-800">Section 3: Status of injured person(s)</CardTitle>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Employment or visitor status</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <div className="space-y-8">
            <div className="space-y-4">
              <RequiredLabel required>Select Status</RequiredLabel>
              <RadioGroup 
                name="injuredPersonStatus"
                value={formData.injuredPersonStatus} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, injuredPersonStatus: val }))}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {INJURED_STATUS_OPTIONS.map((option) => (
                  <div key={option} className={cn(
                    "flex items-center space-x-3 p-4 rounded-xl border transition-all cursor-pointer group",
                    formData.injuredPersonStatus === option 
                      ? "border-sitk-yellow bg-sitk-yellow/5 shadow-sm ring-1 ring-sitk-yellow/20" 
                      : errors.injuredPersonStatus 
                        ? "border-red-200 bg-red-50/30" 
                        : "border-slate-100 hover:border-slate-300 hover:bg-slate-50 bg-white"
                  )}>
                    <RadioGroupItem value={option} id={`status-${option}`} className="text-sitk-black border-slate-300" />
                    <Label htmlFor={`status-${option}`} className="text-[11px] font-bold text-slate-700 cursor-pointer uppercase tracking-tight group-hover:text-sitk-black transition-colors">{option}</Label>
                  </div>
                ))}
              </RadioGroup>
              <ErrorMessage message={errors.injuredPersonStatus} />
            </div>

            {formData.injuredPersonStatus === 'Other (State)' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-2 p-5 rounded-2xl bg-slate-50 border border-slate-100"
              >
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Please specify status details</Label>
                <Input 
                  value={formData.otherStatusDetails}
                  onChange={e => setFormData(prev => ({ ...prev, otherStatusDetails: e.target.value }))}
                  placeholder="Describe status..." 
                  className="bg-white border-slate-200 shadow-sm focus-visible:ring-sitk-yellow h-12 rounded-xl"
                />
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Were others involved/injured/witnesses? */}
      <Card className="border-none shadow-md overflow-hidden bg-white rounded-2xl">
        <CardHeader className="bg-slate-50/80 border-b border-slate-100 flex flex-row items-center justify-between py-5 px-6 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="bg-sitk-yellow p-2 rounded-xl shadow-sm">
              <Users className="w-4 h-4 text-sitk-black" />
            </div>
            <div>
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-800">Section 4: Others involved/injured/witnesses</CardTitle>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Witnesses or other involved parties</p>
            </div>
          </div>
          <Button 
            onClick={addInvolvedPerson}
            variant="outline" 
            size="sm"
            className="bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 font-black uppercase text-[9px] tracking-widest h-8 px-3 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-3 h-3 mr-1.5" /> Add Person
          </Button>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          {formData.involvedPeople && formData.involvedPeople.length > 0 ? (
            <div className="space-y-6">
              {formData.involvedPeople.map((person, index) => (
                <motion.div 
                  key={person.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-2xl border border-slate-100 bg-slate-50/30 space-y-6 relative group hover:border-slate-200 transition-all"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-sitk-black text-white flex items-center justify-center text-[10px] font-black shadow-sm">
                        {index + 1}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Person Details</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeInvolvedPerson(person.id)}
                      className="h-8 text-slate-400 hover:text-red-500 hover:bg-red-50 font-black uppercase text-[9px] tracking-widest rounded-lg px-2"
                    >
                      <Trash2 className="w-3 h-3 mr-1.5" /> Remove
                    </Button>
                  </div>

                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role</Label>
                      <Select 
                        value={person.type} 
                        onValueChange={(val: any) => updateInvolvedPerson(person.id, 'type', val)}
                      >
                        <SelectTrigger className="bg-white border-slate-200 h-11 rounded-xl shadow-sm focus:ring-sitk-yellow">
                          <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                          <SelectItem value="Involved">Involved</SelectItem>
                          <SelectItem value="Injured">Injured</SelectItem>
                          <SelectItem value="Witness">Witness</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Name / Telephone</Label>
                      <Input 
                        value={person.nameTelephone}
                        onChange={e => updateInvolvedPerson(person.id, 'nameTelephone', e.target.value)}
                        placeholder="Full Name & Contact No." 
                        className="bg-white border-slate-200 h-11 rounded-xl shadow-sm focus-visible:ring-sitk-yellow"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</Label>
                      <Select 
                        value={person.status} 
                        onValueChange={(val: any) => updateInvolvedPerson(person.id, 'status', val)}
                      >
                        <SelectTrigger className="bg-white border-slate-200 h-11 rounded-xl shadow-sm focus:ring-sitk-yellow">
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                          <SelectItem value="Employee">Employee</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Users className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No other people added yet</p>
              <Button 
                onClick={addInvolvedPerson}
                variant="link" 
                className="text-sitk-black font-black uppercase text-[10px] tracking-widest mt-2 hover:no-underline hover:text-slate-600 transition-colors"
              >
                Click to add someone
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 5: Incident Severity */}
      <Card className="border-none shadow-md overflow-hidden bg-white rounded-2xl">
        <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-5 px-6 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="bg-sitk-yellow p-2 rounded-xl shadow-sm">
              <ShieldAlert className="w-4 h-4 text-sitk-black" />
            </div>
            <div>
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-800">Section 5: Incident Severity</CardTitle>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Classification of the event impact</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <div className="space-y-10">
            <div className="space-y-5">
              <RequiredLabel required>Select Severity Level</RequiredLabel>
              <RadioGroup 
                name="severity"
                value={formData.severity} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, severity: val }))}
                className="grid grid-cols-1 gap-4"
              >
                {SEVERITY_OPTIONS.map((option) => (
                  <div key={option.id} className={cn(
                    "flex flex-col p-5 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden",
                    formData.severity === option.id 
                      ? "border-sitk-yellow bg-sitk-yellow/5 shadow-sm ring-1 ring-sitk-yellow/20" 
                      : errors.severity 
                        ? "border-red-200 bg-red-50/30" 
                        : "border-slate-100 hover:border-slate-300 hover:bg-slate-50 bg-white"
                  )}>
                    <div className="flex items-center space-x-3 mb-2.5">
                      <RadioGroupItem value={option.id} id={`sev-${option.id}`} className="text-sitk-black border-slate-300" />
                      <Label htmlFor={`sev-${option.id}`} className="text-[11px] font-black uppercase tracking-widest cursor-pointer group-hover:text-sitk-black transition-colors">{option.label}</Label>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed pl-7 group-hover:text-slate-500 transition-colors">
                      {option.description}
                    </p>
                    {formData.severity === option.id && (
                      <div className="absolute top-0 right-0 w-12 h-12 bg-sitk-yellow/10 rounded-bl-full flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-sitk-yellow mt-[-4px] mr-[-4px]" />
                      </div>
                    )}
                  </div>
                ))}
              </RadioGroup>
              <ErrorMessage message={errors.severity} />
            </div>

            {formData.severity === 'other' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-2 p-5 rounded-2xl bg-slate-50 border border-slate-100"
              >
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Other severity details</Label>
                <Input 
                  value={formData.otherSeverityDetails}
                  onChange={e => setFormData(prev => ({ ...prev, otherSeverityDetails: e.target.value }))}
                  placeholder="Please describe the incident severity" 
                  className="bg-white border-slate-200 shadow-sm focus-visible:ring-sitk-yellow h-12 rounded-xl"
                />
              </motion.div>
            )}

            <div className="space-y-2">
              <RequiredLabel>Action required</RequiredLabel>
              <Textarea 
                value={formData.actionRequired}
                onChange={e => setFormData(prev => ({ ...prev, actionRequired: e.target.value }))}
                placeholder="Detail immediate actions taken or required to manage the incident" 
                className="bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow min-h-[120px] resize-none rounded-xl p-4 transition-all hover:bg-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 6: Investigation Summary */}
      <Card className="border-none shadow-md overflow-hidden bg-white rounded-2xl">
        <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-5 px-6 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="bg-sitk-yellow p-2 rounded-xl shadow-sm">
              <Search className="w-4 h-4 text-sitk-black" />
            </div>
            <div>
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-800">Section 6: Investigation Summary</CardTitle>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Evidence collection and interviews</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 space-y-12">
          {/* A. Direct Observations */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-7 h-7 rounded-xl bg-sitk-black text-white flex items-center justify-center text-[11px] font-black shadow-sm">A</div>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-800">Direct Observations</h3>
            </div>
            <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-100 space-y-4 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Info className="w-3.5 h-3.5 text-sitk-yellow" />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Consider the following evidence:</p>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                {[
                  "Premises layout", 
                  "Equipment (make/model/status)", 
                  "Presence or absence of articles",
                  "General conditions / Housekeeping", 
                  "Other person(s) and activities", 
                  "Reconstruction of incident",
                  "Measurements and plans", 
                  "Position of injured person", 
                  "Presence of CCTV cameras",
                  "Assess findings reliability", 
                  "Identify gaps in evidence"
                ].map(item => (
                  <li key={item} className="text-[10px] text-slate-500 font-bold flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-sitk-yellow/40" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <Textarea 
              value={formData.observations}
              onChange={e => setFormData(prev => ({ ...prev, observations: e.target.value }))}
              placeholder="Record your direct observations here..." 
              className="bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow min-h-[180px] resize-none rounded-2xl p-5 transition-all hover:bg-white"
            />
          </div>

          {/* B. People to speak to */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-7 h-7 rounded-xl bg-sitk-black text-white flex items-center justify-center text-[11px] font-black shadow-sm">B</div>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-800">People to speak to</h3>
            </div>
            <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-100 space-y-4 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-3.5 h-3.5 text-sitk-yellow" />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Key contacts to interview:</p>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2.5">
                {[
                  "Injured person", 
                  "Direct witnesses", 
                  "First aider", 
                  "Site Manager", 
                  "H&S Consultant", 
                  "Insurance Broker"
                ].map(item => (
                  <span key={item} className="text-[10px] text-slate-500 font-bold flex items-center gap-2.5 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-sitk-yellow" /> {item}
                  </span>
                ))}
              </div>
            </div>
            <Textarea 
              value={formData.peopleToSpeakTo}
              onChange={e => setFormData(prev => ({ ...prev, peopleToSpeakTo: e.target.value }))}
              placeholder="List people interviewed or to be interviewed..." 
              className="bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow min-h-[120px] resize-none rounded-2xl p-5 transition-all hover:bg-white"
            />
          </div>

          {/* C. Documents */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-7 h-7 rounded-xl bg-sitk-black text-white flex items-center justify-center text-[11px] font-black shadow-sm">C</div>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-800">Documents</h3>
            </div>
            <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-100 space-y-4 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <FileSearch className="w-3.5 h-3.5 text-sitk-yellow" />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Check availability of:</p>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
                {[
                  "Accident report form", "First aider report", "Risk assessments",
                  "COSHH assessments", "Training records", "Maintenance results",
                  "Previous reports", "HSE guidance", "Minutes of meetings",
                  "Safe procedures", "Manufacturer’s info", "Witness statements"
                ].map(item => (
                  <li key={item} className="text-[10px] text-slate-500 font-bold flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-sitk-yellow/40" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <Textarea 
              value={formData.documents}
              onChange={e => setFormData(prev => ({ ...prev, documents: e.target.value }))}
              placeholder="List relevant documents reviewed..." 
              className="bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow min-h-[120px] resize-none rounded-2xl p-5 transition-all hover:bg-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 7: Incident Questions */}
      <Card className="border-none shadow-md overflow-hidden bg-white rounded-2xl">
        <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-5 px-6 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="bg-sitk-yellow p-2 rounded-xl shadow-sm">
              <MessageSquare className="w-4 h-4 text-sitk-black" />
            </div>
            <div>
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-800">Section 7: Incident Questions</CardTitle>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Detailed analysis and recommendations</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 space-y-10">
          <div className="space-y-2">
            <RequiredLabel required>Briefly describe the incident. Don’t make assumptions. State the facts as known, or described to you.</RequiredLabel>
            <Textarea 
              name="description"
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Provide a factual account of what happened..."
              className={cn(
                "bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow min-h-[140px] resize-none rounded-2xl p-5 transition-all hover:bg-white",
                errors.description && "border-red-500 focus-visible:ring-red-500 bg-red-50/10"
              )}
            />
            <ErrorMessage message={errors.description} />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-relaxed">Was the person involved/injured appropriately trained and authorised? Give details.</Label>
            <Textarea 
              value={formData.trainedAndAuthorised}
              onChange={e => setFormData(prev => ({ ...prev, trainedAndAuthorised: e.target.value }))}
              placeholder="Details regarding training and authorisation..."
              className="bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow min-h-[100px] resize-none rounded-2xl p-5 transition-all hover:bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-relaxed">Are there any written rules, risk assessments or other instructions applicable to the work? Give details.</Label>
            <Textarea 
              value={formData.writtenRules}
              onChange={e => setFormData(prev => ({ ...prev, writtenRules: e.target.value }))}
              placeholder="List applicable rules or assessments..."
              className="bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow min-h-[100px] resize-none rounded-2xl p-5 transition-all hover:bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-relaxed">Were there any apparent breaches of rules or instructions, or any apparent malpractice? Give details.</Label>
            <Textarea 
              value={formData.breaches}
              onChange={e => setFormData(prev => ({ ...prev, breaches: e.target.value }))}
              placeholder="Details of any breaches or malpractice..."
              className="bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow min-h-[100px] resize-none rounded-2xl p-5 transition-all hover:bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-relaxed">Were there other influencing factors i.e. weather; PPE, housekeeping etc? Give details.</Label>
            <Textarea 
              value={formData.influencingFactors}
              onChange={e => setFormData(prev => ({ ...prev, influencingFactors: e.target.value }))}
              placeholder="External factors that may have contributed..."
              className="bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow min-h-[100px] resize-none rounded-2xl p-5 transition-all hover:bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-relaxed">What recommendations/action will help prevent a re-occurrence? (i.e. training/ signs / document reviews etc.)</Label>
            <Textarea 
              value={formData.recommendations}
              onChange={e => setFormData(prev => ({ ...prev, recommendations: e.target.value }))}
              placeholder="Proposed preventative measures..."
              className="bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow min-h-[100px] resize-none rounded-2xl p-5 transition-all hover:bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 leading-relaxed">List any supporting evidence</Label>
            <Textarea 
              value={formData.supportingEvidence}
              onChange={e => setFormData(prev => ({ ...prev, supportingEvidence: e.target.value }))}
              placeholder="e.g. photos, CCTV footage, witness statements"
              className="bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow min-h-[80px] resize-none rounded-2xl p-5 transition-all hover:bg-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 8: RIDDOR */}
      <Card className="border-none shadow-md overflow-hidden bg-white rounded-2xl">
        <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-5 px-6 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="bg-sitk-yellow p-2 rounded-xl shadow-sm">
              <FileSearch className="w-4 h-4 text-sitk-black" />
            </div>
            <div>
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-800">Section 8: RIDDOR</CardTitle>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Regulatory reporting requirements</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 space-y-8">
          <div className="space-y-5">
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Finally, is this accident / incident reportable under RIDDOR?</Label>
              <p className="text-[10px] text-slate-400 font-bold italic ml-1">Reporting of Injuries, Diseases and Dangerous Occurrences Regulations.</p>
            </div>
            <RadioGroup 
              value={formData.riddorReportable} 
              onValueChange={(val: any) => setFormData(prev => ({ ...prev, riddorReportable: val }))}
              className="flex flex-wrap gap-4"
            >
              {['YES', 'NO', 'N/A'].map((option) => (
                <div key={option} className={cn(
                  "flex items-center space-x-3 p-4 rounded-xl border transition-all cursor-pointer min-w-[120px] group",
                  formData.riddorReportable === option 
                    ? "border-sitk-yellow bg-sitk-yellow/5 shadow-sm ring-1 ring-sitk-yellow/20" 
                    : "border-slate-100 hover:border-slate-300 hover:bg-slate-50 bg-white"
                )}>
                  <RadioGroupItem value={option} id={`riddor-${option}`} className="text-sitk-black border-slate-300" />
                  <Label htmlFor={`riddor-${option}`} className="text-[11px] font-black uppercase tracking-widest cursor-pointer group-hover:text-sitk-black transition-colors">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {formData.riddorReportable === 'YES' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid gap-6 md:grid-cols-2 p-6 rounded-2xl bg-slate-50 border border-slate-100"
            >
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Report Date</Label>
                <Input 
                  type="date"
                  value={formData.riddorDate}
                  onChange={e => setFormData(prev => ({ ...prev, riddorDate: e.target.value }))}
                  className="bg-white border-slate-200 h-12 rounded-xl shadow-sm focus:ring-sitk-yellow"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reported by</Label>
                <Input 
                  value={formData.riddorReportedBy}
                  onChange={e => setFormData(prev => ({ ...prev, riddorReportedBy: e.target.value }))}
                  placeholder="Name of person who reported" 
                  className="bg-white border-slate-200 h-12 rounded-xl shadow-sm focus:ring-sitk-yellow"
                />
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Section 9: Final comments */}
      <Card className="border-none shadow-md overflow-hidden bg-white rounded-2xl">
        <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-5 px-6 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="bg-sitk-yellow p-2 rounded-xl shadow-sm">
              <FileText className="w-4 h-4 text-sitk-black" />
            </div>
            <div>
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-800">Section 9: Final comments</CardTitle>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Additional notes or closing remarks</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Final comments</Label>
            <Textarea 
              value={formData.finalComments}
              onChange={e => setFormData(prev => ({ ...prev, finalComments: e.target.value }))}
              placeholder="Any additional information or closing remarks regarding the investigation" 
              className="bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow min-h-[140px] resize-none rounded-2xl p-5 transition-all hover:bg-white"
            />
          </div>
        </CardContent>
      </Card>

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

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-8 bg-white rounded-3xl border border-slate-100 shadow-xl gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner">
            <Clock className="w-6 h-6 text-slate-300" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Status</p>
            <StatusBadge status={currentStatus} />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={() => handleSave('Draft')}
            disabled={isSubmitting}
            className="font-black uppercase text-[10px] tracking-widest border-slate-200 py-7 px-10 hover:bg-slate-50 hover:border-slate-300 rounded-2xl transition-all w-full sm:w-auto"
          >
            <Save className="mr-2.5 h-4 w-4 text-slate-400" />
            Save Draft
          </Button>
          <Button 
            onClick={() => handleSave('Submitted')}
            disabled={isSubmitting}
            className="bg-sitk-black text-white hover:bg-slate-800 font-black uppercase text-[10px] tracking-widest py-7 px-10 rounded-2xl shadow-lg shadow-sitk-black/10 transition-all w-full sm:w-auto"
          >
            <Send className="mr-2.5 h-4 w-4" />
            Submit Investigation
          </Button>
        </div>
      </div>
    </div>
  );
}
