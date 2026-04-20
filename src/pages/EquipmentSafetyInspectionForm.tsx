import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ClipboardCheck, 
  Calendar, 
  User, 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Info,
  PenTool,
  Wrench,
  ShieldCheck,
  Zap,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { mockUser, saveReport } from '@/lib/mockData';
import { exportSavedReportToPDF } from '@/lib/exportUtils';
import { DEFAULT_BRANDING } from '@/lib/brandingContext';
import { getSession } from '@/lib/auth';
import { useAutoSave, getAutoSavedData } from '@/lib/useAutoSave';
import { usePhotoStore } from '@/lib/usePhotoStore';
import PhotoUpload from '@/components/PhotoUpload';
import { motion } from 'motion/react';
import { EquipmentSafetyInspectionReport, EquipmentInspectionItem, ReportStatus } from '@/types';
import SectionHeader from '@/components/SectionHeader';
import StatusBadge from '@/components/StatusBadge';

export default function EquipmentSafetyInspectionForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const editId = (location.state as any)?.editId as string | undefined;
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [currentStatus, setCurrentStatus] = React.useState<ReportStatus>('Draft');
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [formData, setFormData] = React.useState<Omit<EquipmentSafetyInspectionReport, 'id' | 'authorId' | 'status' | 'title' | 'type' | 'location'>>({
    inspections: [
      {
        id: crypto.randomUUID(),
        equipmentNameType: '',
        lastElectricalCheck: '',
        isSafeToUse: null,
        isGuardingSafe: null,
        hasCorrectTraining: '',
        inspectionDate: new Date().toISOString().split('T')[0],
        checkedByPrint: (getSession()?.name ?? ''),
        checkedBySign: ''
      }
    ],
    executiveSummary: ''
  });

  const addInspection = () => {
    setFormData(prev => ({
      ...prev,
      inspections: [
        ...prev.inspections,
        {
          id: crypto.randomUUID(),
          equipmentNameType: '',
          lastElectricalCheck: '',
          isSafeToUse: null,
          isGuardingSafe: null,
          hasCorrectTraining: '',
          inspectionDate: new Date().toISOString().split('T')[0],
          checkedByPrint: (getSession()?.name ?? ''),
          checkedBySign: ''
        }
      ]
    }));
  };

  const removeInspection = (id: string) => {
    if (formData.inspections.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      inspections: prev.inspections.filter(item => item.id !== id)
    }));
  };

  const updateInspection = (id: string, field: keyof EquipmentInspectionItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      inspections: prev.inspections.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    formData.inspections.forEach((item, index) => {
      if (!item.equipmentNameType.trim()) {
        newErrors[`equipmentNameType-${index}`] = 'Required';
      }
      if (item.isSafeToUse === null) {
        newErrors[`isSafeToUse-${index}`] = 'Required';
      }
      if (item.isGuardingSafe === null) {
        newErrors[`isGuardingSafe-${index}`] = 'Required';
      }
      if (!item.checkedByPrint.trim()) {
        newErrors[`checkedByPrint-${index}`] = 'Required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { photos, updatePhotos, clearPhotos } = usePhotoStore('equipment_inspection');
  const { clearAutoSave } = useAutoSave('equipment_inspection', formData);
  React.useEffect(() => {
    const saved = getAutoSavedData<any>('equipment_inspection'); // eslint-disable-line @typescript-eslint/no-explicit-any
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
      const report: EquipmentSafetyInspectionReport = {
        ...formData,
        id: newId,
        authorId: mockUser.id,
        status,
        title: `Equipment Safety Inspection - ${new Date().toLocaleDateString('en-GB')}`,
        type: 'Equipment Safety Inspection',
        location: formData.inspections[0]?.equipmentNameType || 'Multiple Items',
        photos,
      };

      saveReport(report);
      clearPhotos();

      if (status === 'Submitted') {
        try {
          await exportSavedReportToPDF(report, DEFAULT_BRANDING);
        } catch (pdfErr) {
          console.error('[EquipmentSafetyInspectionForm] PDF generation failed:', pdfErr);
        }
      }

      navigate('/my-reports');
    } catch (err) {
      console.error('[EquipmentSafetyInspectionForm] Save failed:', err);
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
        title="5-004 Equipment Safety Inspection Checklist" 
        icon={Wrench}
        description="Repeatable inspection log for tools, machinery, and workplace equipment."
      />

      {/* Guidance Notes */}
      <div className="mt-8 p-8 bg-sitk-black text-white rounded-[2.5rem] shadow-2xl shadow-sitk-black/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Info className="w-32 h-32" />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-sitk-yellow p-2 rounded-xl">
              <Info className="w-5 h-5 text-sitk-black" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-sitk-yellow">Guidance Notes</h3>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {[
              "All portable electrical appliances should be checked on a regular basis by a competent person. PAT checks are one type of check but not a legal requirement.",
              "If the item is NOT safe to use, remove from service and report immediately.",
              "If guarding is missing, damaged or not in place, do not use the equipment and report the fault immediately.",
              "The more dangerous the item is to use, the more training the operator or user must have."
            ].map((note, i) => (
              <li key={i} className="flex gap-3 items-start">
                <div className="h-1.5 w-1.5 rounded-full bg-sitk-yellow mt-2 shrink-0" />
                <p className="text-xs font-medium text-slate-300 leading-relaxed">{note}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-12 space-y-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-sitk-black text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-sitk-black/10">
              {formData.inspections.length}
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Equipment Entries</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Log individual tools and machinery</p>
            </div>
          </div>
          <Button 
            onClick={addInspection}
            className="bg-sitk-yellow text-sitk-black hover:bg-sitk-yellow/90 font-black uppercase text-[10px] tracking-widest px-6 h-12 rounded-xl shadow-lg shadow-sitk-yellow/20"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Equipment
          </Button>
        </div>

        <div className="space-y-6">
          {formData.inspections.map((item, index) => (
            <Card key={item.id} className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden group">
              <CardContent className="p-8 sm:p-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <span className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black text-sm">
                      {index + 1}
                    </span>
                    <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">
                      {item.equipmentNameType || 'New Equipment Entry'}
                    </h3>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeInspection(item.id)}
                    disabled={formData.inspections.length <= 1}
                    className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>

                <div className="grid gap-8 sm:grid-cols-2">
                  {/* Equipment Name */}
                  <div className="space-y-3 sm:col-span-2">
                    <Label className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                      Equipment name and type plus ID or Ref. Number <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative group/input">
                      <Wrench className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                      <Input 
                        value={item.equipmentNameType}
                        onChange={e => updateInspection(item.id, 'equipmentNameType', e.target.value)}
                        placeholder="e.g. Makita Drill - ID: 4421"
                        className={cn(
                          "pl-14 bg-slate-50/50 border-slate-200 h-16 rounded-2xl focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-base font-bold",
                          errors[`equipmentNameType-${index}`] && "border-red-500 bg-red-50/30"
                        )}
                      />
                    </div>
                  </div>

                  {/* Electrical Check */}
                  <div className="space-y-3">
                    <Label className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                      Date of last electrical check (if applicable)
                    </Label>
                    <div className="relative group/input">
                      <Zap className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                      <Input 
                        type="date"
                        value={item.lastElectricalCheck}
                        onChange={e => updateInspection(item.id, 'lastElectricalCheck', e.target.value)}
                        className="pl-14 bg-slate-50/50 border-slate-200 h-16 rounded-2xl focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-base font-bold"
                      />
                    </div>
                  </div>

                  {/* Training */}
                  <div className="space-y-3">
                    <Label className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                      Does user have correct safety training?
                    </Label>
                    <div className="relative group/input">
                      <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                      <Input 
                        value={item.hasCorrectTraining}
                        onChange={e => updateInspection(item.id, 'hasCorrectTraining', e.target.value)}
                        placeholder="e.g. Level 2 Safety Cert"
                        className="pl-14 bg-slate-50/50 border-slate-200 h-16 rounded-2xl focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-base font-bold"
                      />
                    </div>
                  </div>

                  {/* Yes/No Toggles */}
                  <div className="space-y-6 sm:col-span-2 grid sm:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                        Visual check: Is item safe to use? <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex gap-2">
                        {['YES', 'NO'].map((option) => (
                          <Button
                            key={option}
                            type="button"
                            variant={item.isSafeToUse === option ? 'default' : 'outline'}
                            onClick={() => updateInspection(item.id, 'isSafeToUse', option)}
                            className={cn(
                              "flex-1 h-14 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] transition-all",
                              item.isSafeToUse === option 
                                ? (option === 'YES' ? "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200" : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200")
                                : "border-slate-200 text-slate-400 hover:bg-slate-50"
                            )}
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                      {errors[`isSafeToUse-${index}`] && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Required</p>}
                    </div>

                    <div className="space-y-4">
                      <Label className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                        Is all guarding in place and undamaged? <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex gap-2">
                        {['YES', 'NO'].map((option) => (
                          <Button
                            key={option}
                            type="button"
                            variant={item.isGuardingSafe === option ? 'default' : 'outline'}
                            onClick={() => updateInspection(item.id, 'isGuardingSafe', option)}
                            className={cn(
                              "flex-1 h-14 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] transition-all",
                              item.isGuardingSafe === option 
                                ? (option === 'YES' ? "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200" : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200")
                                : "border-slate-200 text-slate-400 hover:bg-slate-50"
                            )}
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                      {errors[`isGuardingSafe-${index}`] && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Required</p>}
                    </div>
                  </div>

                  {/* Inspection Details */}
                  <div className="space-y-3">
                    <Label className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                      Date of Inspection
                    </Label>
                    <div className="relative group/input">
                      <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                      <Input 
                        type="date"
                        value={item.inspectionDate}
                        onChange={e => updateInspection(item.id, 'inspectionDate', e.target.value)}
                        className="pl-14 bg-slate-50/50 border-slate-200 h-16 rounded-2xl focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-base font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                      Checked by (Print) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative group/input">
                      <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                      <Input 
                        value={item.checkedByPrint}
                        onChange={e => updateInspection(item.id, 'checkedByPrint', e.target.value)}
                        className={cn(
                          "pl-14 bg-slate-50/50 border-slate-200 h-16 rounded-2xl focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-base font-bold",
                          errors[`checkedByPrint-${index}`] && "border-red-500 bg-red-50/30"
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 sm:col-span-2">
                    <Label className="text-slate-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                      Checked by (Sign)
                    </Label>
                    <div className="relative group/input">
                      <PenTool className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                      <Input 
                        value={item.checkedBySign}
                        onChange={e => updateInspection(item.id, 'checkedBySign', e.target.value)}
                        placeholder="Type name to sign..."
                        className="pl-14 bg-slate-50/50 border-slate-200 h-16 rounded-2xl focus-visible:ring-sitk-yellow transition-all hover:bg-white hover:border-slate-300 text-base font-bold italic"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-12 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 text-center">
        <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest">
          This Checklist is designed to be a reminder of some of the actions you may need to take - it is <span className="text-sitk-black">NOT</span> a definitive or official list of actions to take.
        </p>
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
                  <Send className="w-4 h-4 mr-2" /> Submit Inspection
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
              {currentStatus === 'Draft' ? 'Draft Saved' : 'Inspection Submitted'}
            </h3>
            <p className="text-slate-500 font-medium mb-8">
              {currentStatus === 'Draft' 
                ? 'Your progress has been saved. You can complete this inspection later.' 
                : 'The equipment safety inspection has been successfully recorded.'}
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
