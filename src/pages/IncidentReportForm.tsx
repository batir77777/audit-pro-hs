import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  AlertTriangle, 
  Save, 
  Send, 
  ChevronLeft,
  Camera,
  Clock,
  User,
  MapPin,
  FileText,
  Info,
  Users,
  Activity
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
import { mockUser, saveReport } from '@/lib/mockData';
import { exportSavedReportToPDF } from '@/lib/exportUtils';
import { DEFAULT_BRANDING } from '@/lib/brandingContext';
import { getSession } from '@/lib/auth';
import { useAutoSave, getAutoSavedData } from '@/lib/useAutoSave';
import { usePhotoStore } from '@/lib/usePhotoStore';
import PhotoUpload from '@/components/PhotoUpload';
import { IncidentType } from '@/types';
import { motion } from 'motion/react';
import SectionHeader from '@/components/SectionHeader';
import ExportButtons from '@/components/ExportButtons';

export default function IncidentReportForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const editId = (location.state as any)?.editId as string | undefined;
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [reportId] = React.useState(() => editId ?? crypto.randomUUID());

  const [formData, setFormData] = React.useState({
    incidentType: 'Incident' as IncidentType,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    location: '',
    personReporting: (getSession()?.name ?? ''),
    personsInvolved: '',
    description: '',
    injuryDetails: '',
    immediateAction: '',
    furtherAction: '',
    executiveSummary: ''
  });

  const { photos, updatePhotos, clearPhotos } = usePhotoStore('incident_report');
  const { clearAutoSave } = useAutoSave('incident_report', formData);
  React.useEffect(() => {
    const saved = getAutoSavedData<any>('incident_report'); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (saved) setFormData(prev => ({ ...prev, ...saved }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (status: 'Draft' | 'Submitted') => {
    clearAutoSave();
    setIsSubmitting(true);

    try {
      const report = {
        ...formData,
        id: reportId,
        title: `Incident Report: ${formData.incidentType} - ${formData.date}`,
        type: 'Incident Report' as const,
        status,
        location: formData.location || 'Unknown Location',
        date: formData.date,
        authorId: mockUser.id,
        description: formData.description,
        photos,
      };

      saveReport(report as any);
      clearPhotos();

      if (status === 'Submitted') {
        try {
          await exportSavedReportToPDF(report, DEFAULT_BRANDING);
        } catch (pdfErr) {
          console.error('[IncidentReportForm] PDF generation failed:', pdfErr);
        }
      }

      navigate('/my-reports');
    } catch (err) {
      console.error('[IncidentReportForm] Save failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-7 md:space-y-8 pb-24 md:pb-12 max-w-[1200px] mx-auto px-1 sm:px-0" id="incident-report">
      <div className="sticky top-2 md:top-3 z-30 flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-xl border border-slate-200/80 bg-white/95 backdrop-blur px-3 py-2 shadow-sm">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 export-hide w-fit"
        >
          <ChevronLeft className="mr-2 h-3 w-3" />
          Back
        </Button>
        
        <ExportButtons 
          elementId="incident-report"
          reportTitle={`Incident Report: ${formData.incidentType} - ${formData.date}`}
          formData={formData}
          photos={photos}
          reportId={reportId}
          onSave={handleSave}
          isSubmitting={isSubmitting}
          className="flex flex-wrap justify-end"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sitk-black/40 font-black uppercase text-[10px] tracking-[0.2em]">
          <AlertTriangle className="w-3 h-3" /> Incident Reporting
        </div>
        <h2 className="text-3xl font-black tracking-tighter uppercase text-slate-900 leading-none">
          Incident Report
        </h2>
        <p className="text-muted-foreground font-medium text-[10px] uppercase tracking-widest">Safety is the Key Ltd | SITK-IR-001</p>
      </div>

      <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-8 space-y-12">
          {/* Basic Info Section */}
          <section className="space-y-6">
            <SectionHeader title="Incident Details" icon={Info} description="When and where it happened" className="mb-0" />
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Incident Type</Label>
                <Select 
                  value={formData.incidentType} 
                  onValueChange={(value) => setFormData({...formData, incidentType: value as IncidentType})}
                >
                  <SelectTrigger className="py-6 bg-slate-50 border-none focus:ring-sitk-yellow">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Accident">Accident</SelectItem>
                    <SelectItem value="Near Miss">Near Miss</SelectItem>
                    <SelectItem value="Incident">Incident</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Date</Label>
                  <Input 
                    type="date" 
                    value={formData.date} 
                    onChange={e => setFormData({...formData, date: e.target.value})} 
                    className="py-6 bg-white border-slate-300 shadow-sm focus-visible:border-sitk-yellow focus-visible:ring-sitk-yellow/35 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Time</Label>
                  <Input 
                    type="time" 
                    value={formData.time} 
                    onChange={e => setFormData({...formData, time: e.target.value})} 
                    className="py-6 bg-white border-slate-300 shadow-sm focus-visible:border-sitk-yellow focus-visible:ring-sitk-yellow/35 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    className="pl-12 py-6 bg-white border-slate-300 shadow-sm focus-visible:border-sitk-yellow focus-visible:ring-sitk-yellow/35" 
                    value={formData.location} 
                    onChange={e => setFormData({...formData, location: e.target.value})} 
                    placeholder="Where did it happen?"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* People Involved Section */}
          <section className="space-y-6">
            <SectionHeader title="People Involved" icon={Users} description="Who was present or affected" className="mb-0" />
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Person Reporting</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    className="pl-12 py-6 bg-white border-slate-300 shadow-sm focus-visible:border-sitk-yellow focus-visible:ring-sitk-yellow/35 font-bold"
                    value={formData.personReporting}
                    onChange={e => setFormData({...formData, personReporting: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Persons Involved</Label>
                <Input 
                  className="py-6 bg-white border-slate-300 shadow-sm focus-visible:border-sitk-yellow focus-visible:ring-sitk-yellow/35"
                  value={formData.personsInvolved} 
                  onChange={e => setFormData({...formData, personsInvolved: e.target.value})} 
                  placeholder="Names of anyone involved"
                />
              </div>
            </div>
          </section>

          {/* Description Section */}
          <section className="space-y-6">
            <SectionHeader title="Incident Description" icon={FileText} description="What happened and what was done" className="mb-0" />
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Description of Incident</Label>
                <Textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="Provide a clear description of what happened..."
                  className="min-h-[120px] bg-white border-slate-300 shadow-sm focus-visible:border-sitk-yellow focus-visible:ring-sitk-yellow/35 p-4"
                />
              </div>

              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Injury Details (if any)</Label>
                <Input 
                  className="py-6 bg-white border-slate-300 shadow-sm focus-visible:border-sitk-yellow focus-visible:ring-sitk-yellow/35"
                  value={formData.injuryDetails} 
                  onChange={e => setFormData({...formData, injuryDetails: e.target.value})} 
                  placeholder="Nature of injuries, if applicable"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Immediate Action Taken</Label>
                  <Input 
                    className="py-6 bg-white border-slate-300 shadow-sm focus-visible:border-sitk-yellow focus-visible:ring-sitk-yellow/35"
                    value={formData.immediateAction} 
                    onChange={e => setFormData({...formData, immediateAction: e.target.value})} 
                    placeholder="What was done straight away?"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="uppercase text-[10px] font-black tracking-widest text-muted-foreground">Further Action Required</Label>
                  <Input 
                    className="py-6 bg-white border-slate-300 shadow-sm focus-visible:border-sitk-yellow focus-visible:ring-sitk-yellow/35"
                    value={formData.furtherAction} 
                    onChange={e => setFormData({...formData, furtherAction: e.target.value})} 
                    placeholder="What needs to happen next?"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Evidence Section */}
          <section className="space-y-6">
            <SectionHeader title="Evidence" icon={Camera} description="Supporting photos or documents" className="mb-0" />
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
              <PhotoUpload photos={photos} onPhotosChange={updatePhotos} label="Evidence Photos" />
            </div>
          </section>

          <div className="pt-8 border-t border-slate-50">
            <Button 
              className="w-full bg-sitk-black text-white hover:bg-slate-800 font-black uppercase text-[10px] tracking-[0.2em] py-8 rounded-2xl shadow-xl transition-all hover:-translate-y-1 active:translate-y-0"
              onClick={() => handleSave('Submitted')}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Incident Report"}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-50 p-6 rounded-2xl border border-red-100 flex gap-4"
      >
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-tight text-red-900 mb-1">Emergency Protocol</h4>
          <p className="text-xs text-red-800 font-medium leading-relaxed">
            Serious incidents must be reported to the Site Manager or Director immediately by phone in addition to this report.
          </p>
        </div>
      </motion.div>

      {/* Sticky Footer Actions */}
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

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 p-4 sm:p-6 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] export-hide">
        <div className="max-w-3xl mx-auto flex items-center justify-end gap-3">
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
