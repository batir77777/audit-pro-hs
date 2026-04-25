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
  Clock
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
import { DEFAULT_BRANDING } from '@/lib/brandingContext';
import { getSession } from '@/lib/auth';
import { useAutoSave, getAutoSavedData } from '@/lib/useAutoSave';
import { usePhotoStore } from '@/lib/usePhotoStore';
import PhotoUpload from '@/components/PhotoUpload';
import { RiskAssessmentEntry, Report } from '@/types';
import { motion } from 'motion/react';
import SectionHeader from '@/components/SectionHeader';
import StatusBadge from '@/components/StatusBadge';
import ExportButtons from '@/components/ExportButtons';

const PRE_START_CHECKS = [
  "I am fit for work",
  "I have been briefed on the task",
  "I understand the site rules",
  "I have the correct training / competence for this task",
  "Required PPE is available and in good condition",
  "Tools / equipment are suitable and inspected",
  "Access and egress are safe",
  "Work area is safe to start",
  "Emergency arrangements are understood",
  "No changes to the job have been identified",
  "Permits are in place where required"
];

const HAZARDS = [
  "Confined space", "Dust / fumes", "Electricity / overhead services", 
  "Excavations / underground services", "Falling objects", "Hazardous substances", 
  "Hot works", "Lone working", "Manual handling", "Medical condition", 
  "Moving vehicles / plant", "Noise / vibration", "Poor lighting", 
  "Public / third parties", "Slips / trips", "Unsafe ground / unstable surfaces", 
  "Weather conditions", "Work at height", "X-OTHER"
];

const CONTROLS = [
  "Barriers", "Dust control", "Exclusion zone", "Isolation", 
  "Lifting aids", "Permit to Work (PTW)", "PPE", "Safe access equipment", 
  "Safety signs", "Supervision", "Traffic management"
];

const RATING_OPTIONS = [
  { value: "1", label: "1 - Very Low" },
  { value: "2", label: "2 - Low" },
  { value: "3", label: "3 - Medium" },
  { value: "4", label: "4 - High" },
  { value: "5", label: "5 - Very High" },
];

export default function DynamicRiskAssessmentForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const editId = (location.state as any)?.editId as string | undefined;
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [reportId] = React.useState(() => editId ?? crypto.randomUUID());

  // Form State
  const [formData, setFormData] = React.useState({
    projectName: '',
    projectAddress: '',
    clientName: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    personCompleting: (getSession()?.name ?? ''),
    jobTitle: '',
    workActivity: '',
    numberOfWorkers: 1,
    exactLocation: '',
    preStart: {} as Record<string, boolean>,
    hazards: {} as Record<string, boolean>,
    otherHazardDetails: '',
    controls: {} as Record<string, boolean>,
    riskEntries: [] as RiskAssessmentEntry[],
    proceed: 'Proceed' as 'Proceed' | 'Do Not Proceed',
    proceedExplanation: '',
    actionTaken: '',
    managerNotified: 'N/A' as 'Yes' | 'No' | 'N/A',
    workerDeclaration: {
      name: (getSession()?.name ?? ''),
      date: new Date().toISOString().split('T')[0],
      signature: '',
      comments: ''
    },
    supervisorReview: {
      name: '',
      date: '',
      signature: '',
      comments: ''
    },
    executiveSummary: ''
  });

  const [currentStatus, setCurrentStatus] = React.useState<'Draft' | 'Submitted'>('Draft');

  const addRiskEntry = () => {
    const newEntry: RiskAssessmentEntry = {
      id: Math.random().toString(36).substr(2, 9),
      hazard: '',
      whoHarmed: '',
      controls: '',
      likelihood: 1,
      consequence: 1,
      riskRating: 1,
      furtherAction: '',
      byWhom: '',
      byWhen: ''
    };
    setFormData(prev => ({ ...prev, riskEntries: [...prev.riskEntries, newEntry] }));
  };

  const updateRiskEntry = (id: string, field: keyof RiskAssessmentEntry, value: any) => {
    setFormData(prev => ({
      ...prev,
      riskEntries: prev.riskEntries.map(entry => {
        if (entry.id === id) {
          const updated = { ...entry, [field]: value };
          // Ensure likelihood and consequence are numbers for calculation
          const l = Number(updated.likelihood) || 0;
          const c = Number(updated.consequence) || 0;
          updated.riskRating = l * c;
          return updated;
        }
        return entry;
      })
    }));
  };

  const getRiskLevel = (rating: number) => {
    if (rating <= 5) return { label: 'LOW', color: 'bg-green-600' };
    if (rating <= 12) return { label: 'MEDIUM', color: 'bg-orange-600' };
    return { label: 'HIGH', color: 'bg-red-600' };
  };

  const removeRiskEntry = (id: string) => {
    setFormData(prev => ({ ...prev, riskEntries: prev.riskEntries.filter(e => e.id !== id) }));
  };

  const { photos, updatePhotos, clearPhotos } = usePhotoStore('dra');
  const { clearAutoSave } = useAutoSave('dra', formData);
  React.useEffect(() => {
    const saved = getAutoSavedData<any>('dra'); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (saved) setFormData(prev => ({ ...prev, ...saved }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (status: 'Draft' | 'Submitted') => {
    clearAutoSave();
    setIsSubmitting(true);
    setCurrentStatus(status);

    try {
      const newReport: Report = {
        ...formData,
        id: reportId,
        title: formData.projectName || 'Untitled Risk Assessment',
        type: 'Dynamic Risk Assessment',
        status,
        location: formData.exactLocation || 'Unknown Location',
        date: formData.date,
        authorId: mockUser.id,
        description: formData.workActivity || 'No description provided.',
        photos,
      };

      saveReport(newReport);
      clearPhotos();

      if (status === 'Submitted') {
        try {
          await exportSavedReportToPDF(newReport, DEFAULT_BRANDING);
        } catch (pdfErr) {
          console.error('[DynamicRiskAssessmentForm] PDF generation failed:', pdfErr);
        }
      }

      navigate('/my-reports');
    } catch (err) {
      console.error('[DynamicRiskAssessmentForm] Save failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-7 md:space-y-8 pb-24 md:pb-12 px-1 sm:px-0" id="dra-report">
      {/* Header Actions */}
      <div className="sticky top-2 md:top-3 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 rounded-xl border border-slate-200/80 bg-white/95 backdrop-blur px-3 py-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 export-hide h-9"
          >
            <ChevronLeft className="mr-2 h-3 w-3" />
            Back
          </Button>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full export-hide border border-slate-200/80">
            <Clock className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Current Status:</span>
            <StatusBadge status={currentStatus} />
          </div>
        </div>
        
        <ExportButtons 
          elementId="dra-report"
          reportTitle={`Dynamic Risk Assessment: ${formData.projectName}`}
          formData={formData}          photos={photos}          reportId={reportId}
          onSave={handleSave}
          isSubmitting={isSubmitting}
          className="w-full md:w-auto flex flex-wrap justify-start md:justify-end gap-2"
        />
      </div>

      {/* Title & Instructions */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-slate-500 font-black uppercase text-[10px] tracking-[0.16em]">
            <ShieldAlert className="w-3 h-3" /> Dynamic Risk Assessment
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-tight">
            Dynamic Risk Assessment
          </h2>
          <p className="text-slate-500 font-medium text-[10px] uppercase tracking-[0.12em]">Safety is the Key Ltd | SITK-DRA-001</p>
        </div>

        <Card className="border border-amber-200/80 bg-amber-50/60 border-l-4 border-l-sitk-yellow rounded-xl shadow-sm">
          <CardContent className="p-4 flex gap-3">
            <Info className="w-5 h-5 text-sitk-black shrink-0 mt-0.5" />
            <p className="text-sm font-bold leading-relaxed text-sitk-black">
              This form must be completed before starting work on each site or whenever conditions change. 
              If the work cannot be carried out safely, stop and inform your supervisor immediately.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Section 1: Project Details */}
      <Card className="border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden border-t-4 border-t-sitk-black bg-white">
        <CardContent className="p-6 sm:p-8 space-y-8">
          <SectionHeader title="Section 1: Project Details" icon={Info} className="mb-0" />
          <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
            <div className="space-y-2.5">
              <Label className="text-xs font-bold text-slate-700">Project Name/Ref</Label>
              <Input 
                value={formData.projectName} 
                onChange={e => setFormData({...formData, projectName: e.target.value})} 
                placeholder="Enter project name or reference" 
                className="py-6 bg-slate-50 border-slate-200 focus-visible:ring-sitk-yellow h-12"
              />
            </div>
            <div className="space-y-2.5">
              <Label className="text-xs font-bold text-slate-700">Client Name</Label>
              <Input 
                value={formData.clientName} 
                onChange={e => setFormData({...formData, clientName: e.target.value})} 
                placeholder="Enter client name" 
                className="py-6 bg-slate-50 border-slate-200 focus-visible:ring-sitk-yellow h-12"
              />
            </div>
            <div className="space-y-2.5 md:col-span-2">
              <Label className="text-xs font-bold text-slate-700">Project address</Label>
              <Input 
                value={formData.projectAddress} 
                onChange={e => setFormData({...formData, projectAddress: e.target.value})} 
                placeholder="Enter full site address" 
                className="py-6 bg-slate-50 border-slate-200 focus-visible:ring-sitk-yellow h-12"
              />
            </div>
            <div className="space-y-2.5">
              <Label className="text-xs font-bold text-slate-700">Date</Label>
              <Input 
                type="date" 
                value={formData.date} 
                onChange={e => setFormData({...formData, date: e.target.value})} 
                className="py-6 bg-slate-50 border-slate-200 focus-visible:ring-sitk-yellow font-mono h-12"
              />
            </div>
            <div className="space-y-2.5">
              <Label className="text-xs font-bold text-slate-700">Time</Label>
              <Input 
                type="time" 
                value={formData.time} 
                onChange={e => setFormData({...formData, time: e.target.value})} 
                className="py-6 bg-slate-50 border-slate-200 focus-visible:ring-sitk-yellow font-mono h-12"
              />
            </div>
            <div className="space-y-2.5">
              <Label className="text-xs font-bold text-slate-700">Person completing this Form</Label>
              <Input value={formData.personCompleting} disabled className="py-6 bg-slate-100 border-slate-200 font-bold h-12" />
            </div>
            <div className="space-y-2.5">
              <Label className="text-xs font-bold text-slate-700">Job Title</Label>
              <Input value={formData.jobTitle} disabled className="py-6 bg-slate-100 border-slate-200 font-bold h-12" />
            </div>
            <div className="space-y-2.5 md:col-span-2">
              <Label className="text-xs font-bold text-slate-700">Describe the work activity</Label>
              <Textarea 
                value={formData.workActivity} 
                onChange={e => setFormData({...formData, workActivity: e.target.value})} 
                placeholder="Provide a brief description of the work activity" 
                className="bg-slate-50 border-slate-200 focus-visible:ring-sitk-yellow min-h-[100px] text-sm"
              />
            </div>
            <div className="space-y-2.5">
              <Label className="text-xs font-bold text-slate-700">How many workers involved</Label>
              <Input 
                type="number" 
                value={formData.numberOfWorkers} 
                onChange={e => setFormData({...formData, numberOfWorkers: parseInt(e.target.value)})} 
                className="py-6 bg-slate-50 border-slate-200 focus-visible:ring-sitk-yellow h-12"
              />
            </div>
            <div className="space-y-2.5">
              <Label className="text-xs font-bold text-slate-700">Exact location of works</Label>
              <Input 
                value={formData.exactLocation} 
                onChange={e => setFormData({...formData, exactLocation: e.target.value})} 
                placeholder="e.g. Ground floor, North wing" 
                className="py-6 bg-slate-50 border-slate-200 focus-visible:ring-sitk-yellow h-12"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Tick as applicable */}
      <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-8 space-y-6">
          <SectionHeader title="Section 2: Tick as applicable" icon={CheckCircle2} className="mb-0" />
          <div className="grid gap-4 sm:grid-cols-2">
            {PRE_START_CHECKS.map(check => (
              <div key={check} className="flex items-start space-x-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-sitk-yellow/5 hover:border-sitk-yellow/30 transition-all cursor-pointer group">
                <Checkbox 
                  id={check} 
                  checked={formData.preStart[check]} 
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, preStart: { ...prev.preStart, [check]: !!checked } }))}
                  className="mt-0.5 data-[state=checked]:bg-sitk-black data-[state=checked]:border-sitk-black"
                />
                <Label htmlFor={check} className="text-sm font-semibold leading-tight cursor-pointer group-hover:text-sitk-black transition-colors">{check}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Tick any hazards Identified */}
      <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-8 space-y-6">
          <SectionHeader title="Section 3: Tick any hazards Identified" icon={AlertCircle} className="mb-0" />
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {HAZARDS.map(hazard => (
              <div key={hazard} className="flex items-start space-x-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-sitk-yellow/5 hover:border-sitk-yellow/30 transition-all cursor-pointer group">
                <Checkbox 
                  id={hazard} 
                  checked={formData.hazards[hazard]} 
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hazards: { ...prev.hazards, [hazard]: !!checked } }))}
                  className="mt-0.5 data-[state=checked]:bg-sitk-black data-[state=checked]:border-sitk-black"
                />
                <Label htmlFor={hazard} className="text-xs font-bold leading-tight cursor-pointer group-hover:text-sitk-black transition-colors uppercase tracking-tight">{hazard}</Label>
              </div>
            ))}
          </div>
          {formData.hazards["X-OTHER"] && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2.5 pt-4"
            >
              <Label className="text-xs font-bold text-slate-700">Other hazard details</Label>
              <Input 
                value={formData.otherHazardDetails} 
                onChange={e => setFormData({...formData, otherHazardDetails: e.target.value})} 
                placeholder="Please specify other hazards identified" 
                className="py-6 bg-slate-50 border-slate-200 focus-visible:ring-sitk-yellow h-12"
              />
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Section 4: Tick controls measures in place */}
      <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-8 space-y-6">
          <SectionHeader title="Section 4: Tick controls measures in place" icon={ShieldAlert} className="mb-0" />
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {CONTROLS.map(control => (
              <div key={control} className="flex items-start space-x-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-sitk-yellow/5 hover:border-sitk-yellow/30 transition-all cursor-pointer group">
                <Checkbox 
                  id={control} 
                  checked={formData.controls[control]} 
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, controls: { ...prev.controls, [control]: !!checked } }))}
                  className="mt-0.5 data-[state=checked]:bg-sitk-black data-[state=checked]:border-sitk-black"
                />
                <Label htmlFor={control} className="text-xs font-bold leading-tight cursor-pointer group-hover:text-sitk-black transition-colors uppercase tracking-tight">{control}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Dynamic Risk Assessment Entries */}
      <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="p-8 pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <SectionHeader title="Section 5: Dynamic Risk Assessment Entries" icon={AlertTriangle} className="mb-0" />
          <Button size="sm" onClick={addRiskEntry} className="bg-sitk-black text-white hover:bg-slate-800 font-black uppercase text-[10px] tracking-widest rounded-xl py-6 px-8 shadow-lg">
            <Plus className="w-4 h-4 mr-2" />
            Add Row
          </Button>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          {formData.riskEntries.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No risk entries added yet</p>
              <Button variant="link" onClick={addRiskEntry} className="text-sitk-black font-bold mt-2">Add your first row</Button>
            </div>
          ) : (
            <div className="space-y-12">
              {formData.riskEntries.map((entry, index) => (
                <motion.div 
                  key={entry.id} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="p-8 rounded-2xl bg-slate-50/50 border border-slate-200 relative space-y-8 group shadow-sm"
                >
                  <div className="absolute -top-4 -left-4 w-10 h-10 bg-sitk-black text-white rounded-xl flex items-center justify-center font-black text-sm shadow-xl border-2 border-white">
                    {index + 1}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-4 right-4 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all rounded-full"
                    onClick={() => removeRiskEntry(entry.id)}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                  
                  <div className="grid gap-8">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2.5">
                        <Label className="text-xs font-bold text-slate-700">Hazard and risks</Label>
                        <Input 
                          value={entry.hazard} 
                          onChange={e => updateRiskEntry(entry.id, 'hazard', e.target.value)} 
                          placeholder="What is the specific hazard and associated risk?" 
                          className="bg-white border-slate-200 shadow-sm focus-visible:ring-sitk-yellow py-6 h-12"
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label className="text-xs font-bold text-slate-700">Who may be harmed?</Label>
                        <Input 
                          value={entry.whoHarmed} 
                          onChange={e => updateRiskEntry(entry.id, 'whoHarmed', e.target.value)} 
                          placeholder="e.g. Workers, Public, Contractors" 
                          className="bg-white border-slate-200 shadow-sm focus-visible:ring-sitk-yellow py-6 h-12"
                        />
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-xs font-bold text-slate-700 leading-relaxed">Current controls and recommendations in place to eliminate and/or reduce and control the risks identified</Label>
                      <Textarea 
                        value={entry.controls} 
                        onChange={e => updateRiskEntry(entry.id, 'controls', e.target.value)} 
                        placeholder="Describe the control measures currently implemented" 
                        className="bg-white border-slate-200 shadow-sm focus-visible:ring-sitk-yellow min-h-[100px] text-sm"
                      />
                    </div>

                    <div className="grid gap-6 md:grid-cols-3 items-end">
                      <div className="space-y-2.5">
                        <Label className="text-xs font-bold text-slate-700">Likelihood</Label>
                        <Select 
                          value={entry.likelihood.toString()} 
                          onValueChange={(val) => updateRiskEntry(entry.id, 'likelihood', parseInt(val))}
                        >
                          <SelectTrigger className="bg-white border-slate-200 shadow-sm focus:ring-sitk-yellow h-12">
                            <SelectValue placeholder="Select Likelihood" />
                          </SelectTrigger>
                          <SelectContent>
                            {RATING_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2.5">
                        <Label className="text-xs font-bold text-slate-700">Consequences</Label>
                        <Select 
                          value={entry.consequence.toString()} 
                          onValueChange={(val) => updateRiskEntry(entry.id, 'consequence', parseInt(val))}
                        >
                          <SelectTrigger className="bg-white border-slate-200 shadow-sm focus:ring-sitk-yellow h-12">
                            <SelectValue placeholder="Select Consequences" />
                          </SelectTrigger>
                          <SelectContent>
                            {RATING_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2.5">
                        <Label className="text-xs font-bold text-slate-700">Risk-Rating</Label>
                        <div className={cn(
                          "h-12 flex items-center justify-center gap-2 px-4 rounded-xl font-black text-white shadow-md transition-all duration-300",
                          getRiskLevel(entry.riskRating).color
                        )}>
                          <span className="text-lg">{entry.riskRating}</span>
                          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded uppercase tracking-widest">
                            {getRiskLevel(entry.riskRating).label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-xs font-bold text-slate-700">If further action required, say by whom and when</Label>
                      <Input 
                        value={entry.furtherAction} 
                        onChange={e => updateRiskEntry(entry.id, 'furtherAction', e.target.value)} 
                        placeholder="e.g. Site Manager to install barriers by 15/04/2026" 
                        className="bg-white border-slate-200 shadow-sm focus-visible:ring-sitk-yellow py-6 h-12"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {/* Risk Legend */}
              <div className="flex flex-wrap gap-6 p-6 bg-slate-100/50 rounded-2xl border border-slate-200/50">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 w-full mb-1">Risk Score Legend</div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-600 shadow-sm" />
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Low (1-5)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-600 shadow-sm" />
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Medium (6-12)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-600 shadow-sm" />
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">High (15-25)</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 6: Dynamic Assessment Decision */}
      <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-8 space-y-8">
          <SectionHeader title="Section 6: Dynamic Assessment Decision" icon={CheckCircle2} className="mb-0" />
          <div className="space-y-8">
            <div className="space-y-4">
              <Label className="text-xs font-bold text-slate-700">Decision to Proceed</Label>
              <div className="flex flex-wrap gap-4">
                <Button 
                  type="button"
                  variant={formData.proceed === 'Proceed' ? 'default' : 'outline'} 
                  className={cn(
                    "flex-1 min-w-[150px] font-black uppercase text-[10px] tracking-widest py-8 rounded-xl transition-all border-2",
                    formData.proceed === 'Proceed' 
                      ? "bg-green-600 text-white border-green-600 shadow-lg scale-[1.02]" 
                      : "text-slate-500 border-slate-200 hover:border-green-200 hover:bg-green-50"
                  )}
                  onClick={() => setFormData({...formData, proceed: 'Proceed'})}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  YES Proceed
                </Button>
                <Button 
                  type="button"
                  variant={formData.proceed === 'Do Not Proceed' ? 'destructive' : 'outline'}
                  className={cn(
                    "flex-1 min-w-[150px] font-black uppercase text-[10px] tracking-widest py-8 rounded-xl transition-all border-2",
                    formData.proceed === 'Do Not Proceed' 
                      ? "bg-red-600 text-white border-red-600 shadow-lg scale-[1.02]" 
                      : "text-slate-500 border-slate-200 hover:border-red-200 hover:bg-red-50"
                  )}
                  onClick={() => setFormData({...formData, proceed: 'Do Not Proceed'})}
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  NO. (Explain)
                </Button>
              </div>
            </div>
            
            {formData.proceed === 'Do Not Proceed' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2.5"
              >
                <Label className="text-xs font-bold text-slate-700">Explanation</Label>
                <Textarea 
                  value={formData.proceedExplanation} 
                  onChange={e => setFormData({...formData, proceedExplanation: e.target.value})} 
                  placeholder="Please provide a detailed explanation of why the work cannot proceed safely" 
                  className="bg-slate-50 border-slate-200 focus-visible:ring-sitk-yellow min-h-[120px] text-sm"
                />
              </motion.div>
            )}

            <div className="space-y-2.5">
              <Label className="text-xs font-bold text-slate-700">Action taken</Label>
              <Input 
                value={formData.actionTaken} 
                onChange={e => setFormData({...formData, actionTaken: e.target.value})} 
                placeholder="Describe any immediate actions taken to address identified issues" 
                className="py-6 bg-slate-50 border-slate-200 focus-visible:ring-sitk-yellow h-12"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 7: Manager / Supervisor Notified */}
      <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-8 space-y-6">
          <SectionHeader title="Section 7: Manager / Supervisor Notified" icon={User} className="mb-0" />
          <div className="flex flex-wrap gap-3 p-1.5 bg-slate-100 rounded-2xl w-fit">
            {['YES', 'NO', 'N/A'].map(opt => (
              <Button 
                key={opt}
                type="button"
                variant={formData.managerNotified.toUpperCase() === opt ? 'default' : 'ghost'}
                className={cn(
                  "font-black uppercase text-[10px] tracking-widest px-8 py-3 rounded-xl transition-all min-w-[80px]",
                  formData.managerNotified.toUpperCase() === opt 
                    ? "bg-sitk-black text-white shadow-md" 
                    : "text-slate-500 hover:bg-white/50"
                )}
                onClick={() => setFormData({...formData, managerNotified: opt as any})}
              >
                {opt}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 8: Worker declaration */}
      <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-sitk-yellow/5 border border-sitk-yellow/20">
        <CardContent className="p-8 space-y-8">
          <SectionHeader title="Section 8: Worker declaration" icon={ShieldAlert} className="mb-0" />
          <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
            <div className="space-y-2.5">
              <Label className="text-xs font-bold text-slate-700">Name</Label>
              <Input 
                value={formData.workerDeclaration.name} 
                onChange={e => setFormData({...formData, workerDeclaration: {...formData.workerDeclaration, name: e.target.value}})} 
                className="py-6 bg-white border-slate-200 shadow-sm focus-visible:ring-sitk-yellow h-12"
              />
            </div>
            <div className="space-y-2.5">
              <Label className="text-xs font-bold text-slate-700">Date</Label>
              <Input 
                type="date"
                value={formData.workerDeclaration.date} 
                onChange={e => setFormData({...formData, workerDeclaration: {...formData.workerDeclaration, date: e.target.value}})} 
                className="py-6 bg-white border-slate-200 shadow-sm focus-visible:ring-sitk-yellow font-mono h-12"
              />
            </div>
            <div className="space-y-2.5">
              <Label className="text-xs font-bold text-slate-700">Signature</Label>
              <Input 
                value={formData.workerDeclaration.signature} 
                onChange={e => setFormData({...formData, workerDeclaration: {...formData.workerDeclaration, signature: e.target.value}})} 
                placeholder="Type name to sign electronically"
                className="py-6 bg-white border-slate-200 shadow-sm focus-visible:ring-sitk-yellow italic font-serif h-12"
              />
            </div>
            <div className="space-y-2.5 md:col-span-2">
              <Label className="text-xs font-bold text-slate-700">Comments</Label>
              <Textarea 
                value={formData.workerDeclaration.comments} 
                onChange={e => setFormData({...formData, workerDeclaration: {...formData.workerDeclaration, comments: e.target.value}})} 
                placeholder="Any additional comments or observations from the worker" 
                className="bg-white border-slate-200 shadow-sm focus-visible:ring-sitk-yellow min-h-[100px] text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 9: Supervisor/Manager Review (if required) */}
      <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-8 space-y-8">
          <SectionHeader title="Section 9: Supervisor/Manager Review (if required)" icon={User} className="mb-0" />
          <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
            <div className="space-y-2.5">
              <Label className="text-xs font-bold text-slate-700">Name</Label>
              <Input 
                value={formData.supervisorReview.name} 
                onChange={e => setFormData({...formData, supervisorReview: {...formData.supervisorReview, name: e.target.value}})} 
                placeholder="Enter supervisor name"
                className="py-6 bg-slate-50 border-slate-200 focus-visible:ring-sitk-yellow h-12"
              />
            </div>
            <div className="space-y-2.5">
              <Label className="text-xs font-bold text-slate-700">Date</Label>
              <Input 
                type="date"
                value={formData.supervisorReview.date} 
                onChange={e => setFormData({...formData, supervisorReview: {...formData.supervisorReview, date: e.target.value}})} 
                className="py-6 bg-slate-50 border-slate-200 focus-visible:ring-sitk-yellow font-mono h-12"
              />
            </div>
            <div className="space-y-2.5">
              <Label className="text-xs font-bold text-slate-700">Signature</Label>
              <Input 
                value={formData.supervisorReview.signature} 
                onChange={e => setFormData({...formData, supervisorReview: {...formData.supervisorReview, signature: e.target.value}})} 
                placeholder="Type name to sign electronically"
                className="py-6 bg-slate-50 border-slate-200 focus-visible:ring-sitk-yellow italic font-serif h-12"
              />
            </div>
            <div className="space-y-2.5 md:col-span-2">
              <Label className="text-xs font-bold text-slate-700">Comments</Label>
              <Textarea 
                value={formData.supervisorReview.comments} 
                onChange={e => setFormData({...formData, supervisorReview: {...formData.supervisorReview, comments: e.target.value}})} 
                placeholder="Management review comments and sign-off" 
                className="bg-slate-50 border-slate-200 focus-visible:ring-sitk-yellow min-h-[100px] text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Footer Actions */}
      {/* Photos Section */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
        <PhotoUpload photos={photos} onPhotosChange={updatePhotos} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 p-4 sm:p-6 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] export-hide">
        <div className="max-w-4xl mx-auto flex items-center justify-end gap-3">
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
    </div>
  );
}
