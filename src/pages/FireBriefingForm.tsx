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
  Trash2, 
  Save, 
  Send, 
  ChevronLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Signature,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { cn } from '../lib/utils';
import { mockUser, saveReport } from '../lib/mockData';
import { exportSavedReportToPDF } from '../lib/exportUtils';
import { DEFAULT_BRANDING } from '../lib/brandingContext';
import { getSession } from '../lib/auth';
import { useAutoSave, getAutoSavedData } from '../lib/useAutoSave';
import { usePhotoStore } from '../lib/usePhotoStore';
import PhotoUpload from '../components/PhotoUpload';
import { FireBriefingReport, ReportStatus, FireBriefingEntry, StaffSignature } from '../types';
import StatusBadge from '../components/StatusBadge';
import SectionHeader from '../components/SectionHeader';

const BRIEFING_CHECKLIST_ITEMS = [
  'Inform staff of the Fire Evacuation Procedures',
  'Show and walk through all the Fire Exits',
  'Show the Fire Assembly Point',
  'Show the location of relevant Fire Extinguishers',
  'Name the Fire Wardens and the most Senior persons',
  'Remind staff to report any fire safety issue immediately',
  'Remind staff that only trained staff should use the Fire Extinguishers',
  'Inform staff on how to escort out visitors, clients, or others to safety',
  'Explain any relevant points from the building Fire Risk Assessment'
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

export default function FireBriefingForm() {
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
    signature: '',
    date: new Date().toISOString().split('T')[0],
    premiseAddress: '',
    checklist: BRIEFING_CHECKLIST_ITEMS.map((item, index) => ({
      id: `item-${index}`,
      item,
      completed: false,
      notes: ''
    })),
    otherNotes: '',
    staffSignatures: [
      { id: 'sig-1', date: new Date().toISOString().split('T')[0], name: '', signature: '' }
    ],
    executiveSummary: ''
  });

  const updateChecklist = (id: string, field: keyof FireBriefingEntry, value: any) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const addStaffRow = () => {
    setFormData(prev => ({
      ...prev,
      staffSignatures: [
        ...prev.staffSignatures,
        { id: `sig-${Date.now()}`, date: new Date().toISOString().split('T')[0], name: '', signature: '' }
      ]
    }));
  };

  const removeStaffRow = (id: string) => {
    if (formData.staffSignatures.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      staffSignatures: prev.staffSignatures.filter(sig => sig.id !== id)
    }));
  };

  const updateStaffSignature = (id: string, field: keyof StaffSignature, value: string) => {
    setFormData(prev => ({
      ...prev,
      staffSignatures: prev.staffSignatures.map(sig => 
        sig.id === id ? { ...sig, [field]: value } : sig
      )
    }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.carriedBy) newErrors.carriedBy = 'Required';
    if (!formData.signature) newErrors.signature = 'Required';
    if (!formData.date) newErrors.date = 'Required';
    if (!formData.premiseAddress) newErrors.premiseAddress = 'Required';
    
    // Check if at least one staff member has signed
    const hasStaffSignatures = formData.staffSignatures.some(sig => sig.name.trim() !== '' && sig.signature.trim() !== '');
    if (!hasStaffSignatures) {
      newErrors.staffSignatures = 'At least one staff member must sign the declaration';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { photos, updatePhotos, clearPhotos } = usePhotoStore('fire_briefing');
  const { clearAutoSave } = useAutoSave('fire_briefing', formData);
  React.useEffect(() => {
    const saved = getAutoSavedData<any>('fire_briefing'); // eslint-disable-line @typescript-eslint/no-explicit-any
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

    const newId = reportId || `FB-${Date.now()}`;
    if (!reportId) setReportId(newId);

    const report: FireBriefingReport = {
      id: newId,
      title: `Fire Briefing - ${formData.premiseAddress || 'New'}`,
      type: 'Fire Briefing',
      status,
      location: formData.premiseAddress,
      date: formData.date,
      authorId: mockUser.id,
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
          console.error('[FireBriefingForm] PDF generation failed:', pdfErr);
        }
      }

      navigate('/my-reports');
    } catch (error) {
      console.error('Error saving report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/fire-safety')}
            className="group -ml-2 text-slate-500 hover:text-sitk-black transition-colors font-black uppercase text-[10px] tracking-[0.2em]"
          >
            <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Fire Safety
          </Button>
          <div className="space-y-2">
            <h1 className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[0.9] uppercase">
              Staff Fire <span className="text-sitk-yellow">Briefing</span>
            </h1>
            <p className="text-slate-500 font-medium text-base sm:text-lg max-w-2xl leading-relaxed">
              Record regular (at least annually) staff Fire Briefing on this form to ensure compliance and safety awareness.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-5 bg-white p-4 rounded-[2rem] shadow-xl border border-slate-100 h-fit self-start md:self-center group hover:border-sitk-yellow/30 transition-all duration-500">
          <div className="bg-sitk-yellow/10 p-4 rounded-2xl shadow-inner group-hover:bg-sitk-yellow/20 transition-colors">
            <Flame className="w-8 h-8 text-sitk-black" />
          </div>
          <div className="pr-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none mb-2">Module</p>
            <p className="text-sm font-black text-sitk-black uppercase tracking-tight">Fire Safety</p>
          </div>
        </div>
      </div>

      {/* Section 1: Briefing Details */}
      <Card className="border-none shadow-xl overflow-hidden bg-white rounded-[2.5rem] border border-slate-100 group">
        <div className="p-10 pb-0">
          <SectionHeader 
            title="Briefing Details" 
            icon={User} 
            description="Details of the person conducting the briefing" 
            className="mb-0"
          />
        </div>
        <CardContent className="p-10 pt-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-3 lg:col-span-1">
              <RequiredLabel required>Carried out by</RequiredLabel>
              <div className="relative group/input">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                <Input 
                  value={formData.carriedBy}
                  onChange={e => setFormData(prev => ({ ...prev, carriedBy: e.target.value }))}
                  placeholder="Enter name" 
                  className={cn(
                    "pl-14 bg-slate-50/50 border-slate-200 h-16 rounded-[1.25rem] focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-base font-bold",
                    errors.carriedBy && "border-red-500 bg-red-50/30"
                  )}
                />
              </div>
              <ErrorMessage message={errors.carriedBy} />
            </div>
            <div className="space-y-3 lg:col-span-1">
              <RequiredLabel required>Signature</RequiredLabel>
              <div className="relative group/input">
                <Signature className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                <Input 
                  value={formData.signature}
                  onChange={e => setFormData(prev => ({ ...prev, signature: e.target.value }))}
                  placeholder="Type name to sign" 
                  className={cn(
                    "pl-14 bg-slate-50/50 border-slate-200 h-16 rounded-[1.25rem] focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 font-signature text-2xl",
                    errors.signature && "border-red-500 bg-red-50/30"
                  )}
                />
              </div>
              <ErrorMessage message={errors.signature} />
            </div>
            <div className="space-y-3 lg:col-span-1">
              <RequiredLabel required>Date</RequiredLabel>
              <div className="relative group/input">
                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                <Input 
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className={cn(
                    "pl-14 bg-slate-50/50 border-slate-200 h-16 rounded-[1.25rem] focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-base font-bold",
                    errors.date && "border-red-500 bg-red-50/30"
                  )}
                />
              </div>
              <ErrorMessage message={errors.date} />
            </div>
            <div className="space-y-3 lg:col-span-1">
              <RequiredLabel required>Premise Address</RequiredLabel>
              <div className="relative group/input">
                <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                <Input 
                  value={formData.premiseAddress}
                  onChange={e => setFormData(prev => ({ ...prev, premiseAddress: e.target.value }))}
                  placeholder="Site address" 
                  className={cn(
                    "pl-14 bg-slate-50/50 border-slate-200 h-16 rounded-[1.25rem] focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-base font-bold",
                    errors.premiseAddress && "border-red-500 bg-red-50/30"
                  )}
                />
              </div>
              <ErrorMessage message={errors.premiseAddress} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Fire Briefing Checklist */}
      <div className="space-y-8">
        <SectionHeader 
          title="Fire Briefing Checklist" 
          icon={ClipboardCheck} 
          description="Ensure all points are covered and understood" 
        />
        
        <div className="grid gap-6">
          {formData.checklist.map((item, index) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "bg-white p-8 sm:p-10 rounded-[2.5rem] border transition-all duration-500 group",
                item.completed ? "border-green-100 bg-green-50/10 shadow-sm" : "border-slate-100 hover:border-sitk-yellow/30 shadow-xl hover:shadow-sitk-yellow/5"
              )}
            >
              <div className="flex flex-col lg:grid lg:grid-cols-[1fr,400px] gap-8 lg:items-center">
                <div className="flex items-start gap-6">
                  <div className="pt-1 flex-shrink-0">
                    <Checkbox 
                      id={item.id}
                      checked={item.completed}
                      onCheckedChange={(checked) => updateChecklist(item.id, 'completed', checked)}
                      className="w-8 h-8 rounded-[0.75rem] border-2 border-slate-200 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 transition-all shadow-sm"
                    />
                  </div>
                  <label 
                    htmlFor={item.id}
                    className={cn(
                      "text-lg font-black leading-tight cursor-pointer transition-colors pt-1 uppercase tracking-tight",
                      item.completed ? "text-green-800" : "text-slate-700 group-hover:text-sitk-black"
                    )}
                  >
                    {item.item}
                  </label>
                </div>
                <div className="relative group/input">
                  <Label className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-2 block">Item Notes</Label>
                  <Input 
                    value={item.notes}
                    onChange={e => updateChecklist(item.id, 'notes', e.target.value)}
                    placeholder="Add specific notes..."
                    className="bg-slate-50/50 border-slate-100 h-14 text-base rounded-2xl focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-200 font-medium"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Section 3: Other */}
      <Card className="border-none shadow-xl overflow-hidden bg-white rounded-[2.5rem] border border-slate-100 group">
        <div className="p-10 pb-0">
          <SectionHeader 
            title="Other Notes" 
            icon={Plus} 
            description="Additional notes or site-specific items" 
            className="mb-0"
          />
        </div>
        <CardContent className="p-10 pt-12">
          <div className="space-y-4">
            <RequiredLabel className="text-slate-400 ml-2">Additional Information & Site-Specific Items</RequiredLabel>
            <Textarea 
              value={formData.otherNotes}
              onChange={e => setFormData(prev => ({ ...prev, otherNotes: e.target.value }))}
              placeholder="Enter any other relevant points or site-specific fire safety items..."
              className="bg-slate-50/50 border-slate-200 min-h-[200px] rounded-[2rem] focus-visible:ring-sitk-yellow transition-all hover:bg-white p-8 resize-none text-base leading-relaxed font-medium"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Staff Declaration */}
      <div className="space-y-8">
        <SectionHeader 
          title="Staff Declaration" 
          icon={ShieldCheck} 
          description="Staff acknowledgement and sign-off" 
        />
        
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden">
          <div className="p-10 sm:p-16 space-y-12">
            <div className="relative">
              <div className="absolute -left-6 top-0 bottom-0 w-2 bg-sitk-yellow rounded-full shadow-[0_0_20px_rgba(255,191,0,0.4)]" />
              <div className="bg-slate-900 p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden group/decl">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover/decl:opacity-10 transition-opacity duration-700">
                  <ShieldCheck className="w-32 h-32 text-white" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white leading-tight italic relative z-10 tracking-tight">
                  "I have read or been briefed in the above and understand it."
                </p>
                <div className="flex items-center gap-3 mt-8 relative z-10">
                  <div className="h-[1px] w-12 bg-sitk-yellow/50" />
                  <p className="text-sitk-yellow text-[11px] font-black uppercase tracking-[0.3em]">
                    Official Declaration & Acknowledgement
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="hidden lg:grid grid-cols-[200px,1fr,1fr,80px] gap-8 px-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <div>Date of Sign-off</div>
                <div>Staff Full Name</div>
                <div>Digital Signature</div>
                <div></div>
              </div>

              <div className="space-y-6">
                {errors.staffSignatures && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-50 border-2 border-red-100 p-6 rounded-3xl flex items-center gap-4 text-red-600 shadow-sm"
                  >
                    <div className="bg-red-100 p-3 rounded-2xl">
                      <AlertCircle className="w-6 h-6 flex-shrink-0" />
                    </div>
                    <p className="text-base font-black uppercase tracking-tight">{errors.staffSignatures}</p>
                  </motion.div>
                )}
                {formData.staffSignatures.map((sig, index) => (
                  <motion.div 
                    key={sig.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="grid grid-cols-1 lg:grid-cols-[200px,1fr,1fr,80px] gap-8 p-8 sm:p-10 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 group hover:bg-white hover:border-sitk-yellow/20 transition-all duration-500 shadow-sm hover:shadow-xl"
                  >
                    <div className="space-y-3 lg:space-y-0">
                      <Label className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Date</Label>
                      <div className="relative group/input">
                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                        <Input 
                          type="date"
                          value={sig.date}
                          onChange={e => updateStaffSignature(sig.id, 'date', e.target.value)}
                          className="pl-14 bg-white border-slate-200 h-16 rounded-2xl focus-visible:ring-sitk-yellow transition-all font-bold"
                        />
                      </div>
                    </div>
                    <div className="space-y-3 lg:space-y-0">
                      <Label className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Full Name</Label>
                      <div className="relative group/input">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                        <Input 
                          value={sig.name}
                          onChange={e => updateStaffSignature(sig.id, 'name', e.target.value)}
                          placeholder="Print Name"
                          className="pl-14 bg-white border-slate-200 h-16 rounded-2xl focus-visible:ring-sitk-yellow transition-all font-black uppercase tracking-tight"
                        />
                      </div>
                    </div>
                    <div className="space-y-3 lg:space-y-0">
                      <Label className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Digital Signature</Label>
                      <div className="relative group/input">
                        <Signature className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                        <Input 
                          value={sig.signature}
                          onChange={e => updateStaffSignature(sig.id, 'signature', e.target.value)}
                          placeholder="Type to sign"
                          className="pl-14 bg-white border-slate-200 h-16 rounded-2xl focus-visible:ring-sitk-yellow transition-all font-signature text-2xl"
                        />
                      </div>
                    </div>
                    <div className="flex items-end lg:items-center justify-end">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeStaffRow(sig.id)}
                        disabled={formData.staffSignatures.length <= 1}
                        className="h-16 w-16 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-2xl group/delete"
                      >
                        <Trash2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Button 
                variant="outline" 
                onClick={addStaffRow}
                className="w-full h-20 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 hover:text-sitk-black hover:border-sitk-yellow hover:bg-sitk-yellow/5 font-black uppercase text-xs tracking-[0.3em] transition-all group"
              >
                <Plus className="w-5 h-5 mr-4 group-hover:rotate-90 transition-transform duration-500" />
                Add Another Staff Member
              </Button>
            </div>
          </div>
        </div>
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

      {/* Photos Section */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
        <PhotoUpload photos={photos} onPhotosChange={updatePhotos} />
      </div>

      {/* Form Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row items-center justify-between p-12 sm:p-16 bg-white rounded-[4rem] border border-slate-100 shadow-2xl gap-12 relative overflow-hidden group/footer"
      >
        <div className="absolute inset-0 bg-slate-50/50 opacity-0 group-hover/footer:opacity-100 transition-opacity duration-700" />
        
        <div className="flex items-center gap-10 relative z-10">
          <div className={cn(
            "w-28 h-28 rounded-[3rem] flex items-center justify-center border shadow-2xl transition-all duration-700",
            saveSuccess ? "bg-green-50 border-green-100 rotate-0 shadow-green-100" :
            currentStatus === 'Draft' ? "bg-yellow-50 border-yellow-100 rotate-[-6deg] shadow-yellow-100" : 
            currentStatus === 'Submitted' ? "bg-blue-50 border-blue-100 rotate-[6deg] shadow-blue-100" : "bg-green-50 border-green-100 shadow-green-100"
          )}>
            {saveSuccess ? (
              <CheckCircle2 className="w-14 h-14 text-green-500" />
            ) : (
              <Clock className={cn(
                "w-14 h-14",
                currentStatus === 'Draft' ? "text-yellow-500" : 
                currentStatus === 'Submitted' ? "text-blue-500" : "text-green-500"
              )} />
            )}
          </div>
          <div className="space-y-4">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] leading-none ml-2">Report Status</p>
            <StatusBadge status={saveSuccess ? 'Completed' : currentStatus} className="px-10 py-4 text-sm font-black shadow-xl" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-8 w-full lg:w-auto relative z-10">
          <Button 
            variant="outline" 
            onClick={() => handleSave('Draft')}
            disabled={isSubmitting}
            className="w-full sm:w-auto h-24 px-16 rounded-[2rem] border-2 border-slate-200 font-black uppercase tracking-[0.3em] text-xs hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all active:scale-95 shadow-lg group/draft"
          >
            {isSubmitting && currentStatus === 'Draft' ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <Clock className="h-6 w-6" />
              </motion.div>
            ) : (
              <Save className="w-6 h-6 mr-5 text-slate-400 group-hover/draft:text-white transition-colors" />
            )}
            {isSubmitting && currentStatus === 'Draft' ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button 
            onClick={() => handleSave('Submitted')}
            disabled={isSubmitting}
            className="w-full sm:w-auto h-24 px-20 rounded-[2rem] bg-sitk-yellow text-sitk-black font-black uppercase tracking-[0.3em] text-xs hover:bg-sitk-black hover:text-sitk-yellow shadow-2xl shadow-sitk-yellow/30 transition-all active:scale-95 group/submit"
          >
            {isSubmitting && currentStatus === 'Submitted' ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <Clock className="h-6 w-6" />
              </motion.div>
            ) : (
              <Send className="w-6 h-6 mr-5 group-hover/submit:translate-x-1 group-hover/submit:-translate-y-1 transition-transform" />
            )}
            {isSubmitting && currentStatus === 'Submitted' ? 'Submitting...' : 'Submit Briefing'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
