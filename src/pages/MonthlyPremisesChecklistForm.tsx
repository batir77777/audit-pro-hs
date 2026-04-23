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
  PenTool
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { mockUser, saveReport } from '@/lib/mockData';
import { exportSavedReportToPDF } from '@/lib/exportUtils';
import { DEFAULT_BRANDING } from '@/lib/brandingContext';
import { getSession } from '@/lib/auth';
import { useAutoSave, getAutoSavedData } from '@/lib/useAutoSave';
import { usePhotoStore } from '@/lib/usePhotoStore';
import PhotoUpload from '@/components/PhotoUpload';
import { motion } from 'motion/react';
import { MonthlyPremisesChecklistReport, MonthlyPremisesChecklistItem, CorrectiveAction, ReportStatus } from '@/types';
import SectionHeader from '@/components/SectionHeader';
import StatusBadge from '@/components/StatusBadge';

const CHECKLIST_ITEMS = [
  "Premise walk-round shows no health and safety problems?",
  "All accidents recorded and investigated?",
  "First aid boxes stocked?",
  "First aiders certificated?",
  "Fire doors/extinguishers safe? Fire Wardens certificated?",
  "All staff trained in H&S (including new and temp. staff)?",
  "Smoke alarms; emergency lights; green break glass devices tested?",
  "All risk assessments valid? (e.g. premises, equipment, tasks etc.)",
  "Steps/ladders checked?",
  "Storage/racking checked?",
  "Tools, equipment and machinery remain safe to use?",
  "Premises electrics and electrical appliances remain safe to use?",
  "Gas bottles and gas equipment remain safe to use?",
  "Workplace transport safety presents no issues?",
  "Waste stored and disposed of safely?",
  "Have staff-reported health and safety issues been corrected?"
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function MonthlyPremisesChecklistForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const editId = (location.state as any)?.editId as string | undefined;
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [currentStatus, setCurrentStatus] = React.useState<ReportStatus>('Draft');
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [formData, setFormData] = React.useState<Omit<MonthlyPremisesChecklistReport, 'id' | 'authorId' | 'status' | 'title' | 'type' | 'location'>>({
    premiseAddress: '',
    ref: '',
    date: new Date().toISOString().split('T')[0],
    completedByPrint: (getSession()?.name ?? ''),
    completedBySign: '',
    month: MONTHS[new Date().getMonth()],
    checklistItems: CHECKLIST_ITEMS.map((q, i) => ({
      id: `q-${i + 1}`,
      question: q,
      answer: undefined as 'Yes' | 'No' | 'N/A' | undefined,
      notes: ''
    })),
    correctiveActionLog: [],
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

  const updateChecklistItem = (id: string, field: keyof MonthlyPremisesChecklistItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      checklistItems: prev.checklistItems.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const addAction = () => {
    const newAction: CorrectiveAction = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      actionRequired: '',
      dateCompleted: ''
    };
    setFormData(prev => ({
      ...prev,
      correctiveActionLog: [...prev.correctiveActionLog, newAction]
    }));
  };

  const updateAction = (id: string, field: keyof CorrectiveAction, value: string) => {
    setFormData(prev => ({
      ...prev,
      correctiveActionLog: prev.correctiveActionLog.map(action => 
        action.id === id ? { ...action, [field]: value } : action
      )
    }));
  };

  const removeAction = (id: string) => {
    setFormData(prev => ({
      ...prev,
      correctiveActionLog: prev.correctiveActionLog.filter(action => action.id !== id)
    }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.premiseAddress.trim()) newErrors.premiseAddress = 'Premise Address is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.completedByPrint.trim()) newErrors.completedByPrint = 'Name is required';
    
    // Check if all questions are answered for submission
    const unanswered = formData.checklistItems.filter(item => !item.answer);
    if (unanswered.length > 0) {
      newErrors.checklist = `Please answer all ${unanswered.length} checklist items.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { photos, updatePhotos, clearPhotos } = usePhotoStore('monthly_premises');
  const { clearAutoSave } = useAutoSave('monthly_premises', formData);
  React.useEffect(() => {
    const saved = getAutoSavedData<any>('monthly_premises'); // eslint-disable-line @typescript-eslint/no-explicit-any
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
      const report: MonthlyPremisesChecklistReport = {
        ...formData,
        id: newId,
        authorId: mockUser.id,
        status,
        title: `Monthly Premises H&S Checklist - ${formData.month} ${new Date(formData.date).getFullYear()}`,
        type: 'Monthly Premises Checklist',
        location: formData.premiseAddress.split('\n')[0] || 'Not Specified',
        photos,
      };

      saveReport(report);
      clearPhotos();

      if (status === 'Submitted') {
        try {
          await exportSavedReportToPDF(report, DEFAULT_BRANDING);
        } catch (pdfErr) {
          console.error('[MonthlyPremisesChecklistForm] PDF generation failed:', pdfErr);
        }
      }

      navigate('/my-reports');
    } catch (err) {
      console.error('[MonthlyPremisesChecklistForm] Save failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 md:space-y-9 pb-24 md:pb-12 px-2 sm:px-3 lg:px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/premises-checks')}
          className="text-slate-500 hover:text-sitk-black font-black uppercase text-[10px] tracking-widest"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Templates
        </Button>
        <div className="flex items-center gap-3">
          <StatusBadge status={currentStatus} />
        </div>
      </div>

      <SectionHeader 
        title="5-001 Monthly Premises H&S Checklist" 
        icon={ClipboardCheck}
        description="Monthly workplace health and safety checks for premises and equipment."
      />

      {/* Reminder Box */}
      <div className="mt-6 md:mt-8 p-4 md:p-6 bg-sitk-yellow/15 border border-sitk-yellow/45 rounded-2xl flex gap-3 md:gap-4 items-start shadow-[0_4px_14px_rgba(234,179,8,0.14)]">
        <div className="bg-sitk-yellow/90 p-2.5 rounded-xl shrink-0 shadow-sm ring-1 ring-sitk-black/10">
          <Info className="w-5 h-5 text-sitk-black" />
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-black uppercase tracking-widest text-sitk-black">Important Reminder</p>
          <p className="text-sm font-medium text-slate-700 leading-relaxed">
            <span className="font-bold">REMEMBER:</span> If you have a Fire Alarm system, it must be tested weekly. 
            In addition to this Monthly Checklist, still carry simple daily visual workplace H&S checks.
          </p>
        </div>
      </div>

      <div className="mt-12 space-y-16">
        {/* Section 1: Premises Details */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-sitk-black text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-sitk-black/10">1</div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Premises Details</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Basic information about the location and assessor</p>
            </div>
          </div>

          <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
            <CardContent className="p-8 sm:p-10">
              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-3 sm:col-span-2">
                  <Label htmlFor="premiseAddress" className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                    Premise Address <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative group/input">
                    <FileText className="absolute left-6 top-6 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                    <Textarea 
                      id="premiseAddress"
                      value={formData.premiseAddress}
                      onChange={e => updateField('premiseAddress', e.target.value)}
                      placeholder="Enter full premise address..."
                      className={cn(
                        "pl-14 bg-slate-50/50 border-slate-200 min-h-[120px] rounded-3xl focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-base font-bold",
                        errors.premiseAddress && "border-red-500 bg-red-50/30"
                      )}
                    />
                  </div>
                  {errors.premiseAddress && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{errors.premiseAddress}</p>}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="ref" className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                    Ref
                  </Label>
                  <div className="relative group/input">
                    <Hash className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                    <Input 
                      id="ref"
                      value={formData.ref}
                      onChange={e => updateField('ref', e.target.value)}
                      className="pl-14 bg-slate-50/50 border-slate-200 h-16 rounded-2xl focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-base font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="date" className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                    Date <span className="text-red-500">*</span>
                  </Label>
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
                </div>

                <div className="space-y-3">
                  <Label htmlFor="month" className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                    Month
                  </Label>
                  <Select value={formData.month} onValueChange={v => updateField('month', v)}>
                    <SelectTrigger className="bg-slate-50/50 border-slate-200 h-16 rounded-2xl focus:ring-sitk-yellow text-base font-bold px-6">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                      {MONTHS.map(m => (
                        <SelectItem key={m} value={m} className="font-bold py-3 focus:bg-sitk-yellow/10 focus:text-sitk-black rounded-xl mx-1">{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="completedByPrint" className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                    Completed by (Print) <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative group/input">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                    <Input 
                      id="completedByPrint"
                      value={formData.completedByPrint}
                      onChange={e => updateField('completedByPrint', e.target.value)}
                      className={cn(
                        "pl-14 bg-slate-50/50 border-slate-200 h-16 rounded-2xl focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-base font-bold",
                        errors.completedByPrint && "border-red-500 bg-red-50/30"
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-3 sm:col-span-2">
                  <Label htmlFor="completedBySign" className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                    Completed by (Sign)
                  </Label>
                  <div className="relative group/input">
                    <PenTool className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                    <Input 
                      id="completedBySign"
                      value={formData.completedBySign}
                      onChange={e => updateField('completedBySign', e.target.value)}
                      placeholder="Type name to sign..."
                      className="pl-14 bg-slate-50/50 border-slate-200 h-16 rounded-2xl focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-base font-bold italic"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 2: Monthly Recorded Checks */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-sitk-black text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-sitk-black/10">2</div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Monthly Recorded Checks</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Regular workplace health and safety verification</p>
            </div>
          </div>

          {errors.checklist && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-xs font-black uppercase tracking-widest">{errors.checklist}</p>
            </div>
          )}

          <div className="space-y-4">
            {formData.checklistItems.map((item, index) => (
              <Card key={item.id} className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden group">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex gap-4">
                        <span className="text-slate-300 font-black text-xl leading-none">{index + 1}.</span>
                        <p className="text-base font-bold text-slate-900 leading-tight">{item.question}</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {['Yes', 'No', 'N/A'].map((option) => (
                          <Button
                            key={option}
                            type="button"
                            variant={item.answer === option ? 'default' : 'outline'}
                            onClick={() => updateChecklistItem(item.id, 'answer', option as any)}
                            className={cn(
                              "flex-1 sm:flex-none min-w-[80px] h-12 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] transition-all",
                              item.answer === option 
                                ? (option === 'Yes' ? "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200" : 
                                   option === 'No' ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200" :
                                   "bg-slate-600 hover:bg-slate-700 text-white shadow-lg shadow-slate-200")
                                : "border-slate-200 text-slate-400 hover:bg-slate-50"
                            )}
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="sm:w-1/3 space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notes</Label>
                      <Textarea 
                        value={item.notes}
                        onChange={e => updateChecklistItem(item.id, 'notes', e.target.value)}
                        placeholder="Add notes if required..."
                        className="bg-slate-50/50 border-slate-100 rounded-xl text-sm font-medium min-h-[80px] focus-visible:ring-sitk-yellow"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Section 3: Corrective Actions */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-sitk-black text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-sitk-black/10">3</div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Corrective Actions</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Record and track required improvements</p>
              </div>
            </div>
            <Button 
              onClick={addAction}
              className="bg-sitk-yellow text-sitk-black hover:bg-sitk-yellow/90 font-black uppercase text-[10px] tracking-widest px-6 h-12 rounded-xl shadow-lg shadow-sitk-yellow/20"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Action
            </Button>
          </div>

          <div className="space-y-4">
            {formData.correctiveActionLog.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No corrective actions logged</p>
              </div>
            ) : (
              formData.correctiveActionLog.map((action, index) => (
                <Card key={action.id} className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-6">
                      <span className="bg-sitk-black text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Action #{index + 1}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeAction(action.id)}
                        className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date</Label>
                        <Input 
                          type="date"
                          value={action.date}
                          onChange={e => updateAction(action.id, 'date', e.target.value)}
                          className="bg-slate-50/50 border-slate-100 rounded-xl font-bold h-12"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Action(s) Required</Label>
                        <Input 
                          value={action.actionRequired}
                          onChange={e => updateAction(action.id, 'actionRequired', e.target.value)}
                          placeholder="Describe the required action..."
                          className="bg-slate-50/50 border-slate-100 rounded-xl font-bold h-12"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sign/Date when completed</Label>
                        <Input 
                          value={action.dateCompleted}
                          onChange={e => updateAction(action.id, 'dateCompleted', e.target.value)}
                          placeholder="Completed by Name / Date..."
                          className="bg-slate-50/50 border-slate-100 rounded-xl font-bold h-12"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
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
              <ClipboardCheck className="w-5 h-5 text-slate-400" />
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
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[3rem] p-12 flex flex-col items-center text-center max-w-sm w-full shadow-2xl"
          >
            <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mb-8">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-2">
              {currentStatus === 'Draft' ? 'Draft Saved' : 'Audit Submitted'}
            </h3>
            <p className="text-slate-500 font-medium mb-8">
              {currentStatus === 'Draft' 
                ? 'Your progress has been saved. You can complete this audit later.' 
                : 'The monthly premises checklist has been successfully recorded.'}
            </p>
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
          </motion.div>
        </div>
      )}
    </div>
  );
}
