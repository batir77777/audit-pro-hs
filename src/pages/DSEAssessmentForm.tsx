import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Monitor, 
  User, 
  Building, 
  Calendar, 
  Clock, 
  Info, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Save, 
  Send, 
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Keyboard,
  Mouse,
  Layout as LayoutIcon,
  ShieldAlert,
  FileText
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import { mockUser, saveReport } from '../lib/mockData';
import { exportSavedReportToPDF } from '../lib/exportUtils';
import { getSession } from '../lib/auth';
import { useAutoSave, getAutoSavedData } from '../lib/useAutoSave';
import { usePhotoStore } from '../lib/usePhotoStore';
import { useBranding, DEFAULT_BRANDING } from '../lib/brandingContext';
import PhotoUpload from '../components/PhotoUpload';
import { DSEAssessmentReport, ReportStatus } from '../types';

const USAGE_OPTIONS = {
  averageUse: [
    'Under 1hr/day',
    '1 to 3 hrs/day',
    '3 to 6 hrs/day',
    'Over 6 hrs/day'
  ],
  daysPerWeek: [
    '1-2 days/week',
    '3-4 days/week',
    '5 or more days/week'
  ],
  screenKeyboardMix: [
    'More screen-based',
    '50/50 usage',
    'More keyboard-based'
  ],
  computerType: [
    'Desktop',
    'Laptop',
    'Mixture'
  ],
  workInterrupted: [
    'Rarely',
    'Occasionally',
    'Regularly'
  ]
};

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

const StatusBadge = ({ status }: { status: ReportStatus }) => {
  const styles = {
    Draft: "bg-slate-100 text-slate-600 border-slate-200",
    Submitted: "bg-blue-50 text-blue-600 border-blue-100",
    Completed: "bg-green-50 text-green-600 border-green-100"
  };
  
  return (
    <Badge variant="outline" className={cn("font-black uppercase text-[9px] tracking-widest px-2 py-0.5", styles[status])}>
      {status}
    </Badge>
  );
};

const ASSESSMENT_SECTIONS = [
  {
    title: 'Section 1: Keyboards',
    items: [
      { 
        id: '1.1', 
        question: 'Is your keyboard separate from the screen?', 
        consider: 'This is required unless impracticable e.g. where you need to use a portable keyboard.' 
      },
      { 
        id: '1.2', 
        question: 'Does the keyboard tilt?', 
        consider: 'Tilt need not be built in.' 
      },
      { 
        id: '1.3', 
        question: 'Are you able to find a comfortable keying position?', 
        consider: 'Try pushing the display screen further back to create more room for the keyboard, hands, and wrists. Users of thick, raised keyboards may need a wrist rest.' 
      },
      { 
        id: '1.4', 
        question: 'Do you have a good keyboard technique?', 
        consider: 'Training can be used to prevent hands bent up at the wrist, hitting the keys too hard, and overstretching the fingers.' 
      },
      { 
        id: '1.5', 
        question: 'Characters clear and readable?', 
        consider: 'Keyboards should be kept clean. If characters can’t be read, the keyboard may need modifying or replacing. Use a keyboard with a matt finish to reduce glare and reflection.' 
      }
    ]
  },
  {
    title: 'Section 2: Mouse, trackball etc.',
    items: [
      { 
        id: '2.1', 
        question: 'Is the device suitable for the tasks that you use it for?', 
        consider: 'If you are having problems, try a different device.' 
      },
      { 
        id: '2.2', 
        question: 'Is the device positioned close to you?', 
        consider: 'Most devices are best placed as close as possible, e.g. right beside the keyboard. Training may be needed to prevent arm overreaching and encourage a relaxed arm and straight wrist.' 
      },
      { 
        id: '2.3', 
        question: 'Is there support for your wrist and forearm?', 
        consider: 'Support can be gained from the desk surface or arm of a chair. If not, a separate supporting device may help.' 
      },
      { 
        id: '2.4', 
        question: 'Does the device work smoothly at a speed that suits you?', 
        consider: 'See if cleaning is required. Check the work surface is suitable. A mouse mat may be needed.' 
      },
      { 
        id: '2.5', 
        question: 'Can you adjust software settings for speed and accuracy?', 
        consider: 'Users may need training in how to adjust device settings.' 
      }
    ]
  },
  {
    title: 'Section 3: Display Screens',
    items: [
      { 
        id: '3.1', 
        question: 'Are the characters clear and readable?', 
        consider: 'Make sure the screen is clean and cleaning materials are available. Check that the text and background colours work well together.' 
      },
      { 
        id: '3.2', 
        question: 'Is the text size comfortable to read?', 
        consider: 'Software settings may need adjusting to change text size.' 
      },
      { 
        id: '3.3', 
        question: 'Is the image stable, i.e. free of flicker and jitter?', 
        consider: 'Try using different screen colours to reduce flicker. If there are still problems, get the set-up checked.' 
      },
      { 
        id: '3.4', 
        question: 'Is the screen’s specification suitable for its intended use?', 
        consider: 'Intensive graphic work or work requiring fine attention to small details may require large display screens.' 
      },
      { 
        id: '3.5', 
        question: 'Are you able to adjust the brightness and/or contrast?', 
        consider: 'Separate adjustment controls are not essential, provided the user can read the screen easily at all times.' 
      },
      { 
        id: '3.6', 
        question: 'Does the screen swivel and tilt?', 
        consider: 'Swivel and tilt need not be built in; you can add a swivel and tilt mechanism. However, the screen may need replacing if swivel or tilt is absent or unsatisfactory.' 
      },
      { 
        id: '3.7', 
        question: 'Is your screen free from glare and reflections?', 
        consider: 'Use a mirror placed in front of the screen to check where reflections are coming from. You might need to move the screen or desk, or shield the screen from the source of reflections. Most modern screens are anti-glare by default.' 
      },
      { 
        id: '3.8', 
        question: 'Are adjustable window coverings provided and in adequate condition?', 
        consider: 'Check blinds work. Blinds with vertical slats can be more suitable than horizontal ones.' 
      }
    ]
  },
  {
    title: 'Section 4: Software',
    items: [
      { 
        id: '4.1', 
        question: 'Is the software suitable for the task?', 
        consider: 'Software should help the user carry out the task, minimise stress and be user-friendly. Check users have had appropriate training.' 
      }
    ]
  },
  {
    title: 'Section 5: Furniture',
    items: [
      { 
        id: '5.1', 
        question: 'Is the work surface large enough for all the necessary items needed for work?', 
        consider: 'Create more room by moving printers, reference materials etc. elsewhere. There should be some scope for flexible rearrangement.' 
      },
      { 
        id: '5.2', 
        question: 'Can you comfortably reach all the equipment and papers that you need to use?', 
        consider: 'Rearrange equipment and papers to bring frequently used things within easy reach. A document holder may be needed.' 
      },
      { 
        id: '5.3', 
        question: 'Are surfaces free from glare and reflection?', 
        consider: 'Consider mats or blotters to reduce reflections and glare from desk.' 
      },
      { 
        id: '5.4', 
        question: 'Is the chair suitable?', 
        consider: 'The chair should be stable and allow the user easy movement and a comfortable position.' 
      },
      { 
        id: '5.5', 
        question: 'Does the chair have a working: seat back height and tilt adjustment? seat height adjustment? castors or glides?', 
        consider: 'The chair may need repairing or replacing if the user is uncomfortable or cannot use the adjustment mechanisms.' 
      },
      { 
        id: '5.7', 
        question: 'Is the chair adjusted correctly?', 
        consider: 'The user should be able to carry out their work sitting comfortably. Consider training the user in how to adopt suitable postures while working.' 
      },
      { 
        id: '5.8', 
        question: 'Is the small of your back supported by the chair?', 
        consider: 'Users should relax shoulders and sit with a straight back, supported by the chair.' 
      },
      { 
        id: '5.9', 
        question: 'Are forearms horizontal and eyes at roughly the same height as the top of the DSE?', 
        consider: 'Adjust the chair height to get the user’s arms in the right position, and then adjust the DSE height if necessary.' 
      },
      { 
        id: '5.10', 
        question: 'Are feet flat on the floor, and not too much seat pressure on the backs of the legs?', 
        consider: 'If not, a footrest may be needed.' 
      }
    ]
  },
  {
    title: 'Section 6: Environment',
    items: [
      { 
        id: '6.1', 
        question: 'Is there enough room to change position and vary movement?', 
        consider: 'Space is needed to move, stretch, and fidget. Cables should be tidy and not a trip or snag hazard.' 
      },
      { 
        id: '6.2', 
        question: 'Is the lighting suitable, e.g. not too bright, or too dim to work comfortably?', 
        consider: 'Users should be able to control light levels. Consider shading or repositioning light sources or providing local lighting.' 
      },
      { 
        id: '6.3', 
        question: 'Does the air feel comfortable?', 
        consider: 'Computers may dry the air. Circulate fresh air if possible.' 
      },
      { 
        id: '6.4', 
        question: 'Are levels of heat comfortable?', 
        consider: 'Heating may need better control. More ventilation or air conditioning may be required.' 
      },
      { 
        id: '6.5', 
        question: 'Are levels of noise comfortable?', 
        consider: 'Consider moving sources of noise, e.g. printers, away from the user.' 
      }
    ]
  },
  {
    title: 'Section 7: Final Questions to users',
    items: [
      { 
        id: '7.1', 
        question: 'Have you been advised of your entitlement to free eye and eyesight testing?', 
        consider: 'If you use computers for more than one hour a day, you are entitled to free eyesight tests and corrective appliance if needed for computer work. Applies to employees only.' 
      },
      { 
        id: '7.2', 
        question: 'Do you take regular breaks working away from DSE?', 
        consider: 'Short but very regular changes of activity will help prevent computer problems occurring.' 
      },
      { 
        id: '7.3', 
        question: 'Have you experienced any discomfort or other symptoms which you attribute to working with your DSE?', 
        consider: 'If yes, please provide details in the Action to Take column and inform your manager.' 
      }
    ]
  }
];

export default function DSEAssessmentForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const editId = (location.state as any)?.editId as string | undefined;
  const { branding } = useBranding();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<ReportStatus>('Draft');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    ASSESSMENT_SECTIONS.reduce((acc, section) => ({ ...acc, [section.title]: true }), {})
  );

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const [formData, setFormData] = useState({
    companyAddress: `${branding.companyName}, ${branding.address}`,
    userName: (getSession()?.name ?? ''),
    jobTitle: '',
    computerIdLocation: '',
    assessmentDate: new Date().toISOString().split('T')[0],
    
    averageUsage: '',
    daysPerWeek: '',
    screenKeyboardMix: '',
    computerType: '',
    workInterrupted: '',
    
    correctiveActionRequired: undefined as 'YES' | 'NO' | undefined,
    actionRequired: '',
    whoWillAction: '',
    actionCompletedSignDate: '',
    
    managementCheckedBy: '',
    managementPrintName: '',
    managementTitle: '',
    managementDate: '',
    managementComments: '',
    
    assessmentEntries: ASSESSMENT_SECTIONS.flatMap(section => 
      section.items.map(item => ({
        id: item.id,
        riskFactor: item.question,
        answer: undefined as 'Yes' | 'No' | 'N/A' | undefined,
        thingsToConsider: item.consider,
        actionToTake: ''
      }))
    ),
    executiveSummary: ''
  });

  const updateEntry = (id: string, field: 'answer' | 'actionToTake', value: any) => {
    setFormData(prev => ({
      ...prev,
      assessmentEntries: prev.assessmentEntries.map(entry => 
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.userName) newErrors.userName = 'User name is required';
    if (!formData.jobTitle) newErrors.jobTitle = 'Job title is required';
    if (!formData.computerIdLocation) newErrors.computerIdLocation = 'Computer ID/Location is required';
    if (!formData.assessmentDate) newErrors.assessmentDate = 'Assessment date is required';
    
    if (!formData.averageUsage) newErrors.averageUsage = 'Please select average usage';
    if (!formData.daysPerWeek) newErrors.daysPerWeek = 'Please select days per week';
    if (!formData.screenKeyboardMix) newErrors.screenKeyboardMix = 'Please select screen/keyboard mix';
    if (!formData.computerType) newErrors.computerType = 'Please select computer type';
    if (!formData.workInterrupted) newErrors.workInterrupted = 'Please select interruption frequency';

    // Validate assessment entries
    const unanswered = formData.assessmentEntries.filter(e => !e.answer);
    if (unanswered.length > 0) {
      newErrors.assessment = `Please complete all ${unanswered.length} assessment questions`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { photos, updatePhotos, clearPhotos } = usePhotoStore('dse');
  const { clearAutoSave } = useAutoSave('dse', formData);
  React.useEffect(() => {
    const saved = getAutoSavedData<any>('dse'); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (saved) setFormData(saved);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (status: ReportStatus) => {
    if (status === 'Submitted' && !validateForm()) {
      const firstError = document.querySelector('.text-red-500');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    clearAutoSave();
    setIsSubmitting(true);
    setCurrentStatus(status);

    try {
      const newReport: DSEAssessmentReport = {
        id: editId ?? `r${Date.now()}`,
        title: `DSE Assessment - ${formData.userName}`,
        type: 'DSE Assessment',
        status: status,
        location: formData.computerIdLocation,
        date: formData.assessmentDate,
        authorId: mockUser.id,
        description: `DSE Assessment for ${formData.userName}`,
        photos,
        ...formData
      };

      console.log('[DSEAssessmentForm] Saving report...');
      saveReport(newReport);
      clearPhotos();

      if (status === 'Submitted') {
        try {
          await exportSavedReportToPDF(newReport, branding ?? DEFAULT_BRANDING);
        } catch (pdfErr) {
          console.error('[DSEAssessmentForm] PDF generation failed:', pdfErr);
        }
      }

      console.log('[DSEAssessmentForm] Report saved, navigating.');
      navigate('/my-reports');
    } catch (err) {
      console.error('[DSEAssessmentForm] Save failed:', err);
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
            {isSubmitting && currentStatus === 'Submitted' ? 'Submitting...' : 'Submit Assessment'}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 leading-none">Computer / DSE / VDU Assessment Form</h1>
        <div className="flex items-center gap-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Workplaces • Safety is the Key Ltd</p>
          <div className="h-px w-12 bg-slate-200" />
          <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-200 text-[9px] font-black uppercase tracking-widest px-2 py-0">v2.4</Badge>
        </div>
      </div>

      {/* Introduction Panel */}
      <Card className="border-none shadow-md overflow-hidden bg-white rounded-2xl">
        <CardHeader className="bg-blue-50/50 border-b border-blue-100 py-5 px-6 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2 rounded-xl shadow-sm">
              <Info className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-xs font-black uppercase tracking-widest text-blue-900">Introduction & Guidance</CardTitle>
              <p className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter mt-0.5">Please read before completing the assessment</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="prose prose-slate max-w-none">
            <p className="text-xs text-slate-600 leading-relaxed">
              All employees that work with computers or DSE (display screen equipment) for more than 1 hour a day, must complete the enclosed DSE Assessment Form. This will help provide guidelines on the safe use of computers. There is a separate but similar form for homeworkers or WFH staff.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8 mt-6">
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-sitk-yellow" />
                  Employee Responsibilities
                </h4>
                <ul className="space-y-2">
                  {[
                    "Follow the advice and recommendations given in this guidance and training",
                    "Ensure that your computer workstation is properly adjusted for your individual needs",
                    "Inform Management of any problems relating to your equipment or computer use"
                  ].map((item, i) => (
                    <li key={i} className="text-[11px] text-slate-500 flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5 text-sitk-yellow" />
                  Note on DSE Groups
                </h4>
                <div className="space-y-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-700 uppercase mb-1">Users</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed">Someone who habitually uses DSE as a significant part of their normal work (at least 1hr/day).</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-700 uppercase mb-1">Operators</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed">Contractors who provide services to the Company and are not employees.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-2">Background Information</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Certain potential health risks have been identified which may result from the use of computers such as physical problems, upper limb disorders, fatigue, mental stress, eye strain and worsening of existing eye problems. The incidence of these problems may have a direct relationship with poor equipment, poor working environments or incorrect or excessive usage. The Regulations aim to ensure that risks are eliminated or reduced to an acceptable level.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 1: User and Assessment Details */}
      <Card className="border-none shadow-md overflow-hidden bg-white rounded-2xl">
        <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-5 px-6 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="bg-sitk-yellow p-2 rounded-xl shadow-sm">
              <User className="w-4 h-4 text-sitk-black" />
            </div>
            <div>
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-800">Section 1: User and Assessment Details</CardTitle>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Employee and Location Information</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <RequiredLabel>Company and Address</RequiredLabel>
              <Textarea 
                value={formData.companyAddress}
                onChange={e => setFormData(prev => ({ ...prev, companyAddress: e.target.value }))}
                className="bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow min-h-[80px] resize-none rounded-xl transition-all hover:bg-white p-4"
              />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel required>Computer User's Name</RequiredLabel>
              <Input 
                value={formData.userName}
                onChange={e => setFormData(prev => ({ ...prev, userName: e.target.value }))}
                placeholder="Full Name" 
                className={cn(
                  "bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow h-12 rounded-xl transition-all hover:bg-white",
                  errors.userName && "border-red-500 focus-visible:ring-red-500 bg-red-50/10"
                )}
              />
              <ErrorMessage message={errors.userName} />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel required>Job Title</RequiredLabel>
              <Input 
                value={formData.jobTitle}
                onChange={e => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                placeholder="e.g. Administrator" 
                className={cn(
                  "bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow h-12 rounded-xl transition-all hover:bg-white",
                  errors.jobTitle && "border-red-500 focus-visible:ring-red-500 bg-red-50/10"
                )}
              />
              <ErrorMessage message={errors.jobTitle} />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel required>Computer ID or Location</RequiredLabel>
              <Input 
                value={formData.computerIdLocation}
                onChange={e => setFormData(prev => ({ ...prev, computerIdLocation: e.target.value }))}
                placeholder="e.g. Desk 14 / Laptop SN-123" 
                className={cn(
                  "bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow h-12 rounded-xl transition-all hover:bg-white",
                  errors.computerIdLocation && "border-red-500 focus-visible:ring-red-500 bg-red-50/10"
                )}
              />
              <ErrorMessage message={errors.computerIdLocation} />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel required>Date of Assessment</RequiredLabel>
              <Input 
                type="date"
                value={formData.assessmentDate}
                onChange={e => setFormData(prev => ({ ...prev, assessmentDate: e.target.value }))}
                className={cn(
                  "bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow h-12 rounded-xl transition-all hover:bg-white",
                  errors.assessmentDate && "border-red-500 focus-visible:ring-red-500 bg-red-50/10"
                )}
              />
              <ErrorMessage message={errors.assessmentDate} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Usage Profile */}
      <Card className="border-none shadow-md overflow-hidden bg-white rounded-2xl">
        <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-5 px-6 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="bg-sitk-yellow p-2 rounded-xl shadow-sm">
              <LayoutIcon className="w-4 h-4 text-sitk-black" />
            </div>
            <div>
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-800">Section 2: Usage Profile</CardTitle>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Computer usage patterns and device types</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <RequiredLabel required>Average daily usage</RequiredLabel>
              <Select value={formData.averageUsage} onValueChange={(val) => setFormData(prev => ({ ...prev, averageUsage: val }))}>
                <SelectTrigger className="bg-slate-50/50 border-slate-200 h-12 rounded-xl focus:ring-sitk-yellow transition-all hover:bg-white">
                  <SelectValue placeholder="Select usage..." />
                </SelectTrigger>
                <SelectContent>
                  {USAGE_OPTIONS.averageUse.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
              </Select>
              <ErrorMessage message={errors.averageUsage} />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel required>Days per week</RequiredLabel>
              <Select value={formData.daysPerWeek} onValueChange={(val) => setFormData(prev => ({ ...prev, daysPerWeek: val }))}>
                <SelectTrigger className="bg-slate-50/50 border-slate-200 h-12 rounded-xl focus:ring-sitk-yellow transition-all hover:bg-white">
                  <SelectValue placeholder="Select frequency..." />
                </SelectTrigger>
                <SelectContent>
                  {USAGE_OPTIONS.daysPerWeek.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
              </Select>
              <ErrorMessage message={errors.daysPerWeek} />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel required>Screen/Keyboard Mix</RequiredLabel>
              <Select value={formData.screenKeyboardMix} onValueChange={(val) => setFormData(prev => ({ ...prev, screenKeyboardMix: val }))}>
                <SelectTrigger className="bg-slate-50/50 border-slate-200 h-12 rounded-xl focus:ring-sitk-yellow transition-all hover:bg-white">
                  <SelectValue placeholder="Select mix..." />
                </SelectTrigger>
                <SelectContent>
                  {USAGE_OPTIONS.screenKeyboardMix.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
              </Select>
              <ErrorMessage message={errors.screenKeyboardMix} />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel required>Main Computer Type</RequiredLabel>
              <Select value={formData.computerType} onValueChange={(val) => setFormData(prev => ({ ...prev, computerType: val }))}>
                <SelectTrigger className="bg-slate-50/50 border-slate-200 h-12 rounded-xl focus:ring-sitk-yellow transition-all hover:bg-white">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {USAGE_OPTIONS.computerType.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
              </Select>
              <ErrorMessage message={errors.computerType} />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel required>Work Interrupted Regularly?</RequiredLabel>
              <Select value={formData.workInterrupted} onValueChange={(val) => setFormData(prev => ({ ...prev, workInterrupted: val }))}>
                <SelectTrigger className="bg-slate-50/50 border-slate-200 h-12 rounded-xl focus:ring-sitk-yellow transition-all hover:bg-white">
                  <SelectValue placeholder="Select frequency..." />
                </SelectTrigger>
                <SelectContent>
                  {USAGE_OPTIONS.workInterrupted.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
              </Select>
              <ErrorMessage message={errors.workInterrupted} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Table Guidance */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-sitk-yellow p-2 rounded-xl">
            <LayoutIcon className="w-4 h-4 text-sitk-black" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-widest">Assessment Guidance</h3>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="bg-green-500/20 p-1.5 rounded-lg mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed"><span className="font-black text-white">YES</span> means no further action is required.</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-red-500/20 p-1.5 rounded-lg mt-0.5">
              <XCircle className="w-3.5 h-3.5 text-red-400" />
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed"><span className="font-black text-white">NO</span> requires investigation and/or remedial action.</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-slate-700 p-1.5 rounded-lg mt-0.5">
              <Info className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed"><span className="font-black text-white">N/A</span> means Not Applicable to your workstation.</p>
          </div>
        </div>
      </div>

      {/* Assessment Table Structure (Placeholder for next step) */}
      <Card className="border-none shadow-md overflow-hidden bg-white rounded-2xl">
        <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-5 px-6 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="bg-sitk-yellow p-2 rounded-xl shadow-sm">
              <LayoutIcon className="w-4 h-4 text-sitk-black" />
            </div>
            <div>
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-800">Section 3: Workstation Assessment</CardTitle>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Detailed risk factor analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setExpandedSections(ASSESSMENT_SECTIONS.reduce((acc, s) => ({ ...acc, [s.title]: true }), {}))}
              className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-sitk-black"
            >
              Expand All
            </Button>
            <div className="w-px h-3 bg-slate-200" />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setExpandedSections(ASSESSMENT_SECTIONS.reduce((acc, s) => ({ ...acc, [s.title]: false }), {}))}
              className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-sitk-black"
            >
              Collapse All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {ASSESSMENT_SECTIONS.map((section) => {
              const isExpanded = expandedSections[section.title];
              const answeredCount = section.items.filter(item => 
                formData.assessmentEntries.find(e => e.id === item.id)?.answer
              ).length;
              const totalCount = section.items.length;
              const isComplete = answeredCount === totalCount;

              return (
                <div key={section.title} className="bg-white">
                  <button 
                    onClick={() => toggleSection(section.title)}
                    className="w-full flex items-center justify-between p-4 px-6 sm:px-8 hover:bg-slate-50 transition-colors group text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                        isComplete ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400 group-hover:bg-sitk-yellow/20 group-hover:text-sitk-black"
                      )}>
                        {isComplete ? <CheckCircle2 className="w-4 h-4" /> : <ChevronDown className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} />}
                      </div>
                      <div>
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900">{section.title}</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                          {answeredCount} of {totalCount} questions answered
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {isComplete && (
                        <Badge className="bg-green-50 text-green-600 border-green-100 text-[8px] font-black uppercase tracking-widest px-2 py-0.5">Complete</Badge>
                      )}
                      <ChevronRight className={cn("w-4 h-4 text-slate-300 transition-transform", isExpanded && "rotate-90")} />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-100">
                      {/* Desktop Table View */}
                      <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                              <th className="text-left p-4 px-8 text-[9px] font-black uppercase tracking-widest text-slate-400 min-w-[300px]">Risk Factors</th>
                              <th className="text-center p-4 text-[9px] font-black uppercase tracking-widest text-slate-400 w-20">Yes</th>
                              <th className="text-center p-4 text-[9px] font-black uppercase tracking-widest text-slate-400 w-20">No</th>
                              <th className="text-center p-4 text-[9px] font-black uppercase tracking-widest text-slate-400 w-20">N/A</th>
                              <th className="text-left p-4 text-[9px] font-black uppercase tracking-widest text-slate-400 min-w-[250px]">Things to Consider</th>
                              <th className="text-left p-4 px-8 text-[9px] font-black uppercase tracking-widest text-slate-400 min-w-[250px]">Action to Take</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {section.items.map((item) => {
                              const entry = formData.assessmentEntries.find(e => e.id === item.id);
                              return (
                                <tr key={item.id} className="group hover:bg-slate-50/30 transition-colors">
                                  <td className="p-4 px-8">
                                    <div className="flex items-start gap-3">
                                      <span className="text-[10px] font-black text-slate-300 mt-0.5">{item.id}</span>
                                      <p className="text-[11px] font-bold text-slate-700 leading-relaxed">{item.question}</p>
                                    </div>
                                  </td>
                                  <td className="p-4 text-center">
                                    <button 
                                      onClick={() => updateEntry(item.id, 'answer', 'Yes')}
                                      className={cn(
                                        "w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all mx-auto",
                                        entry?.answer === 'Yes' 
                                          ? "bg-green-500 border-green-500 text-white shadow-lg shadow-green-200" 
                                          : "border-slate-100 bg-white text-slate-300 hover:border-green-200 hover:text-green-500"
                                      )}
                                    >
                                      <CheckCircle2 className="w-5 h-5" />
                                    </button>
                                  </td>
                                  <td className="p-4 text-center">
                                    <button 
                                      onClick={() => updateEntry(item.id, 'answer', 'No')}
                                      className={cn(
                                        "w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all mx-auto",
                                        entry?.answer === 'No' 
                                          ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-200" 
                                          : "border-slate-100 bg-white text-slate-300 hover:border-red-200 hover:text-red-500"
                                      )}
                                    >
                                      <XCircle className="w-5 h-5" />
                                    </button>
                                  </td>
                                  <td className="p-4 text-center">
                                    <button 
                                      onClick={() => updateEntry(item.id, 'answer', 'N/A')}
                                      className={cn(
                                        "w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all mx-auto",
                                        entry?.answer === 'N/A' 
                                          ? "bg-slate-600 border-slate-600 text-white shadow-lg shadow-slate-200" 
                                          : "border-slate-100 bg-white text-slate-300 hover:border-slate-300 hover:text-slate-600"
                                      )}
                                    >
                                      <Info className="w-5 h-5" />
                                    </button>
                                  </td>
                                  <td className="p-4">
                                    <div className="flex items-start gap-2 bg-blue-50/30 p-3 rounded-xl border border-blue-100/50">
                                      <Info className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                                      <p className="text-[10px] text-slate-500 leading-relaxed italic">{item.consider}</p>
                                    </div>
                                  </td>
                                  <td className="p-4 px-8">
                                    <Input 
                                      value={entry?.actionToTake || ''}
                                      onChange={e => updateEntry(item.id, 'actionToTake', e.target.value)}
                                      placeholder="Required if NO..."
                                      className={cn(
                                        "bg-slate-50/50 border-slate-200 h-10 text-[11px] rounded-lg focus-visible:ring-sitk-yellow",
                                        entry?.answer === 'No' && !entry?.actionToTake && "border-red-300 bg-red-50/10"
                                      )}
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card View */}
                      <div className="lg:hidden divide-y divide-slate-100">
                        {section.items.map((item) => {
                          const entry = formData.assessmentEntries.find(e => e.id === item.id);
                          return (
                            <div key={item.id} className="p-6 space-y-6 bg-white">
                              <div className="flex items-start gap-4">
                                <span className="text-[10px] font-black text-sitk-yellow bg-sitk-black px-2 py-0.5 rounded-md mt-0.5 shadow-sm">{item.id}</span>
                                <p className="text-[13px] font-bold text-slate-800 leading-snug">{item.question}</p>
                              </div>

                              <div className="grid grid-cols-3 gap-3">
                                <button 
                                  onClick={() => updateEntry(item.id, 'answer', 'Yes')}
                                  className={cn(
                                    "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all active:scale-95",
                                    entry?.answer === 'Yes' 
                                      ? "bg-green-500 border-green-500 text-white shadow-lg shadow-green-200" 
                                      : "border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200"
                                  )}
                                >
                                  <CheckCircle2 className="w-6 h-6" />
                                  <span className="text-[9px] font-black uppercase tracking-widest">Yes</span>
                                </button>
                                <button 
                                  onClick={() => updateEntry(item.id, 'answer', 'No')}
                                  className={cn(
                                    "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all active:scale-95",
                                    entry?.answer === 'No' 
                                      ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-200" 
                                      : "border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200"
                                  )}
                                >
                                  <XCircle className="w-6 h-6" />
                                  <span className="text-[9px] font-black uppercase tracking-widest">No</span>
                                </button>
                                <button 
                                  onClick={() => updateEntry(item.id, 'answer', 'N/A')}
                                  className={cn(
                                    "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all active:scale-95",
                                    entry?.answer === 'N/A' 
                                      ? "bg-slate-600 border-slate-600 text-white shadow-lg shadow-slate-200" 
                                      : "border-slate-100 bg-slate-50/50 text-slate-400 hover:border-slate-200"
                                  )}
                                >
                                  <Info className="w-6 h-6" />
                                  <span className="text-[9px] font-black uppercase tracking-widest">N/A</span>
                                </button>
                              </div>

                              <div className="bg-blue-50/40 p-4 rounded-2xl border border-blue-100/50 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Info className="w-3.5 h-3.5 text-blue-500" />
                                  <span className="text-[9px] font-black uppercase tracking-widest text-blue-500">Things to Consider</span>
                                </div>
                                <p className="text-[11px] text-slate-600 leading-relaxed italic font-medium">{item.consider}</p>
                              </div>

                              <div className="space-y-2.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Action to Take</Label>
                                <Input 
                                  value={entry?.actionToTake || ''}
                                  onChange={e => updateEntry(item.id, 'actionToTake', e.target.value)}
                                  placeholder="Required if NO..."
                                  className={cn(
                                    "bg-slate-50 border-slate-200 h-14 text-sm rounded-xl focus-visible:ring-sitk-yellow transition-all hover:bg-white",
                                    entry?.answer === 'No' && !entry?.actionToTake && "border-red-300 bg-red-50/30"
                                  )}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {errors.assessment && (
            <div className="p-4 bg-red-50 border-t border-red-100 flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{errors.assessment}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 8: Corrective Action */}
      <Card className="border-none shadow-md overflow-hidden bg-white rounded-2xl">
        <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-5 px-6 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="bg-sitk-yellow p-2 rounded-xl shadow-sm">
              <ShieldAlert className="w-4 h-4 text-sitk-black" />
            </div>
            <div>
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-800">Section 8: Corrective Action</CardTitle>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Assessor's conclusion and remedial steps</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 space-y-8">
          <div className="space-y-4">
            <RequiredLabel required>In the opinion of the assessor, is corrective action required?</RequiredLabel>
            <RadioGroup 
              value={formData.correctiveActionRequired} 
              onValueChange={(val: any) => setFormData(prev => ({ ...prev, correctiveActionRequired: val }))}
              className="flex flex-wrap gap-4"
            >
              <div className={cn(
                "flex items-center space-x-3 p-3.5 px-6 rounded-xl border transition-all cursor-pointer group min-w-[120px]",
                formData.correctiveActionRequired === 'YES' 
                  ? "border-sitk-yellow bg-sitk-yellow/5 shadow-sm ring-1 ring-sitk-yellow/20" 
                  : "border-slate-100 hover:border-slate-300 hover:bg-slate-50 bg-white"
              )}>
                <RadioGroupItem value="YES" id="corrective-yes" className="text-sitk-black border-slate-300" />
                <Label htmlFor="corrective-yes" className="text-[11px] font-bold text-slate-700 cursor-pointer uppercase tracking-tight group-hover:text-sitk-black transition-colors">YES</Label>
              </div>
              <div className={cn(
                "flex items-center space-x-3 p-3.5 px-6 rounded-xl border transition-all cursor-pointer group min-w-[120px]",
                formData.correctiveActionRequired === 'NO' 
                  ? "border-sitk-yellow bg-sitk-yellow/5 shadow-sm ring-1 ring-sitk-yellow/20" 
                  : "border-slate-100 hover:border-slate-300 hover:bg-slate-50 bg-white"
              )}>
                <RadioGroupItem value="NO" id="corrective-no" className="text-sitk-black border-slate-300" />
                <Label htmlFor="corrective-no" className="text-[11px] font-bold text-slate-700 cursor-pointer uppercase tracking-tight group-hover:text-sitk-black transition-colors">NO</Label>
              </div>
            </RadioGroup>
          </div>

          {formData.correctiveActionRequired === 'YES' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid gap-6 pt-4 border-t border-slate-50"
            >
              <div className="space-y-1.5">
                <RequiredLabel required>What action is required?</RequiredLabel>
                <Textarea 
                  value={formData.actionRequired}
                  onChange={e => setFormData(prev => ({ ...prev, actionRequired: e.target.value }))}
                  placeholder="Describe the necessary remedial actions..."
                  className="bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow min-h-[100px] resize-none rounded-xl transition-all hover:bg-white p-4"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <RequiredLabel required>Who will action this?</RequiredLabel>
                  <Input 
                    value={formData.whoWillAction}
                    onChange={e => setFormData(prev => ({ ...prev, whoWillAction: e.target.value }))}
                    placeholder="Name / Department" 
                    className="bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow h-12 rounded-xl transition-all hover:bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <RequiredLabel required>Sign and date when action completed</RequiredLabel>
                  <Input 
                    value={formData.actionCompletedSignDate}
                    onChange={e => setFormData(prev => ({ ...prev, actionCompletedSignDate: e.target.value }))}
                    placeholder="Signature and Date" 
                    className="bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow h-12 rounded-xl transition-all hover:bg-white"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Section 9: Management Section */}
      <Card className="border-none shadow-md overflow-hidden bg-white rounded-2xl">
        <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-5 px-6 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="bg-sitk-yellow p-2 rounded-xl shadow-sm">
              <Building className="w-4 h-4 text-sitk-black" />
            </div>
            <div>
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-800">Section 9: Management Section</CardTitle>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Review and sign-off</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-1.5">
              <RequiredLabel required>Assessment checked by</RequiredLabel>
              <Input 
                value={formData.managementCheckedBy}
                onChange={e => setFormData(prev => ({ ...prev, managementCheckedBy: e.target.value }))}
                placeholder="Signature" 
                className="bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow h-12 rounded-xl transition-all hover:bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel required>Print Name</RequiredLabel>
              <Input 
                value={formData.managementPrintName}
                onChange={e => setFormData(prev => ({ ...prev, managementPrintName: e.target.value }))}
                placeholder="Manager Name" 
                className="bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow h-12 rounded-xl transition-all hover:bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel required>Title</RequiredLabel>
              <Input 
                value={formData.managementTitle}
                onChange={e => setFormData(prev => ({ ...prev, managementTitle: e.target.value }))}
                placeholder="e.g. Operations Manager" 
                className="bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow h-12 rounded-xl transition-all hover:bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel required>Date</RequiredLabel>
              <Input 
                type="date"
                value={formData.managementDate}
                onChange={e => setFormData(prev => ({ ...prev, managementDate: e.target.value }))}
                className="bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow h-12 rounded-xl transition-all hover:bg-white"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <RequiredLabel>Comments</RequiredLabel>
              <Textarea 
                value={formData.managementComments}
                onChange={e => setFormData(prev => ({ ...prev, managementComments: e.target.value }))}
                placeholder="Any additional management comments..."
                className="bg-slate-50/50 border-slate-200 shadow-none focus-visible:ring-sitk-yellow min-h-[100px] resize-none rounded-xl transition-all hover:bg-white p-4"
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

      <div className="flex flex-col sm:flex-row items-center justify-between p-8 bg-white rounded-3xl border border-slate-100 shadow-xl gap-6">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner transition-colors",
            currentStatus === 'Draft' ? "bg-yellow-50 border-yellow-100" : 
            currentStatus === 'Submitted' ? "bg-blue-50 border-blue-100" : "bg-green-50 border-green-100"
          )}>
            <Clock className={cn(
              "w-6 h-6",
              currentStatus === 'Draft' ? "text-yellow-400" : 
              currentStatus === 'Submitted' ? "text-blue-400" : "text-green-400"
            )} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Status</p>
            <StatusBadge status={currentStatus} />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={() => handleSave('Draft')}
            disabled={isSubmitting}
            className="font-black uppercase text-[10px] tracking-widest border-slate-200 py-7 px-10 hover:bg-slate-50 hover:border-slate-300 rounded-2xl transition-all w-full sm:w-auto shadow-sm"
          >
            <Save className="mr-2.5 h-4 w-4 text-slate-400" />
            Save Draft
          </Button>
          <Button 
            onClick={() => handleSave('Submitted')}
            disabled={isSubmitting}
            className="bg-sitk-black text-white hover:bg-slate-800 font-black uppercase text-[10px] tracking-widest py-7 px-12 rounded-2xl shadow-xl shadow-sitk-black/20 transition-all w-full sm:w-auto active:scale-[0.98]"
          >
            <Send className="mr-2.5 h-4 w-4" />
            Submit Assessment
          </Button>
        </div>
      </div>
    </div>
  );
}
