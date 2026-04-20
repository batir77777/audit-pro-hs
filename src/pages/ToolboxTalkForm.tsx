import React from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  User, 
  PenTool, 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  ArrowLeft, 
  CheckCircle2, 
  Info, 
  AlertCircle,
  ShieldAlert,
  FileText,
  MessageSquare
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
import { ReportStatus } from '@/types';
import { mockUser, saveReport } from '@/lib/mockData';
import { exportSavedReportToPDF } from '@/lib/exportUtils';
import { DEFAULT_BRANDING } from '@/lib/brandingContext';
import { getSession } from '@/lib/auth';
import { useAutoSave, getAutoSavedData } from '@/lib/useAutoSave';
import { usePhotoStore } from '@/lib/usePhotoStore';
import PhotoUpload from '@/components/PhotoUpload';
import ExportButtons from '@/components/ExportButtons';

// This is a simplified version of the talk content. 
// In a real app, this would be fetched from a database or a more comprehensive constants file.
const TALK_CONTENT: Record<string, any> = {
  'tt-26-001': {
    title: 'Stepladders',
    ref: '26-001',
    intro: 'Falls from steps and ladders are a major cause of workplace injuries. Stepladders are often misused or poorly maintained, leading to serious accidents.',
    regulations: 'Work at Height Regulations 2005.',
    furtherInfo: 'Refer to HSE INDG455 and ladderassociation.org.uk for detailed guidance.',
    sections: [
      {
        title: 'Before Use',
        items: [
          'Ensure the stepladder is in good condition (no bent stiles, missing feet, or damaged rungs).',
          'Check that the stepladder is in a good position (level, firm ground, and not blocking exits).',
          'Verify that the spreaders are fully locked and the platform is secure.'
        ]
      },
      {
        title: 'In Use',
        items: [
          'Always maintain three points of contact (e.g., two feet and one hand).',
          'Do not overreach; keep your belt buckle within the stiles.',
          'Avoid carrying heavy or bulky loads while climbing.',
          'Do not stand on the top three steps unless there is a suitable handhold.'
        ]
      },
      {
        title: 'Classifications',
        items: [
          'EN131 Professional Use: Designed for use in a workplace environment.',
          'EN131 Non-Professional Use: Designed for domestic use only (not for site use).'
        ]
      },
      {
        title: 'Safety Message',
        text: 'Never take risks with work at height. If the ladder feels unstable, stop and reassess.'
      }
    ]
  },
  'tt-26-002': {
    title: 'Fire Safety',
    ref: '26-002',
    intro: 'Fire safety is everyone\'s responsibility. Understanding how to prevent fires and how to react in an emergency can save lives.',
    regulations: 'Regulatory Reform (Fire Safety) Order 2005.',
    furtherInfo: 'Consult the site fire risk assessment and emergency evacuation plan.',
    sections: [
      {
        title: 'Key Safety Points',
        items: [
          'Know your fire assembly point and the nearest escape routes.',
          'Understand the Fire Triangle: Heat, Fuel, and Oxygen are needed for a fire to start.',
          'Fire Prevention: Keep work areas tidy and dispose of waste correctly.',
          'Raising the Alarm: Know where the call points are and how to use them.',
          'Ignition Sources: Keep flammable materials away from heat sources.',
          'Escape Routes: Ensure they are kept clear of obstructions at all times.'
        ]
      },
      {
        title: 'Extinguisher Guide',
        table: {
          headers: ['Type', 'Colour', 'Class'],
          rows: [
            ['Water', 'Red', 'A (Solids)'],
            ['Foam', 'Cream', 'A (Solids); B (Liquids)'],
            ['CO2', 'Black', 'B (Liquids); E (Electrical)'],
            ['Powder', 'Blue', 'A; B; C; E (All-purpose)'],
            ['Wet Chemical', 'Yellow', 'A (Solids); F (Cooking Fats)']
          ]
        }
      },
      {
        title: 'Safety Message',
        text: 'In the event of a fire, your priority is to evacuate safely. Do not tackle a fire unless trained and it is safe to do so.'
      }
    ]
  },
  'tt-26-004': {
    title: 'Manual Handling',
    ref: '26-004',
    intro: 'Manual handling relates to the moving of loads by hand or bodily force. It is a leading cause of musculoskeletal disorders in the workplace.',
    regulations: 'Manual Handling Operations Regulations 1992.',
    furtherInfo: 'Refer to HSE INDG143 for safe lifting guidance.',
    sections: [
      {
        title: 'Risk Management',
        items: [
          'Significant risks include back strain, hernia, and foot injuries.',
          'Eliminate risks by using mechanical aids (trolleys, hoists) where possible.',
          'Reduce risks by breaking down loads into smaller, manageable sizes.'
        ]
      },
      {
        title: 'L.I.T.E. Assessment',
        items: [
          'Load: Is it heavy, bulky, or unstable?',
          'Individual: Do you have the physical capacity or any health issues?',
          'Task: Does it involve twisting, stooping, or long distances?',
          'Environment: Are there floor variations, poor lighting, or space constraints?'
        ]
      },
      {
        title: 'Safe Lifting Technique',
        items: [
          'Adopt a stable position with feet apart.',
          'Bend your knees, not your back.',
          'Keep the load close to the waist.',
          'Avoid twisting the back or leaning sideways.',
          'Keep your head up and look ahead once the load is secure.'
        ]
      },
      {
        title: 'Safety Message',
        text: 'If a load feels too heavy or awkward, stop. Ask for help or use a mechanical aid.'
      }
    ]
  },
  'tt-26-005': {
    title: 'Chemicals COSHH',
    ref: '26-005',
    intro: 'COSHH is the law that requires employers to control substances that are hazardous to health.',
    regulations: 'Control of Substances Hazardous to Health (COSHH) Regulations 2002.',
    furtherInfo: 'Always check the Safety Data Sheet (SDS) before using any new chemical.',
    sections: [
      {
        title: 'Hazard Awareness',
        items: [
          'Common substances: Dusts, fumes, liquids, and gases.',
          'Harm routes: Inhalation, ingestion, skin contact, and injection.'
        ]
      },
      {
        title: 'CLP Warning Symbols',
        items: [
          'Harmful / Irritant',
          'Gas under Pressure',
          'Toxic / Corrosive',
          'Flammable / Oxidising',
          'Explosive',
          'Dangerous to the Environment',
          'Long-term Health Hazards'
        ]
      },
      {
        title: 'Safety Guidance',
        items: [
          'Use the least hazardous substance possible.',
          'Ensure adequate ventilation when using chemicals.',
          'Wear the correct PPE as specified in the SDS.',
          'Store chemicals in original containers with clear labels.',
          'Wash hands thoroughly after handling any substances.'
        ]
      },
      {
        title: 'Safety Message',
        text: 'Never mix chemicals and always report any spillages immediately.'
      }
    ]
  },
  'tt-26-008': {
    title: 'PPE General',
    ref: '26-008',
    intro: 'Personal Protective Equipment (PPE) is equipment that will protect the user against health or safety risks at work.',
    regulations: 'Personal Protective Equipment at Work Regulations 1992.',
    furtherInfo: 'PPE is the last resort; always try to eliminate the hazard first.',
    sections: [
      {
        title: 'Duties & Responsibilities',
        items: [
          'The company must provide suitable PPE free of charge.',
          'Employees must use PPE correctly and report any loss or damage.',
          'PPE must be maintained in good working order and stored correctly.'
        ]
      },
      {
        title: 'Common PPE Items',
        items: [
          'Head: Helmets / Hard Hats',
          'Eyes: Goggles / Safety Glasses',
          'Hearing: Earplugs / Defenders',
          'Respiratory: Masks / Respirators',
          'Body: Overalls / Hi-Viz Vests',
          'Hands: Gloves (task-specific)',
          'Feet: Safety Boots / Shoes',
          'Fall Protection: Harnesses / Lanyards'
        ]
      },
      {
        title: 'Correct Use',
        items: [
          'Ensure PPE fits correctly and is comfortable.',
          'Do not modify PPE (e.g., drilling holes in helmets).',
          'Check PPE for signs of wear and tear before every use.'
        ]
      },
      {
        title: 'Safety Message',
        text: 'PPE only works if you wear it. Don\'t take shortcuts with your safety.'
      }
    ]
  },
  'tt-26-009': {
    title: 'Asbestos Awareness',
    ref: '26-009',
    intro: 'Asbestos is a naturally occurring mineral that was widely used in construction. It is extremely dangerous when disturbed.',
    regulations: 'Control of Asbestos Regulations 2012.',
    furtherInfo: 'Refer to HSE INDG289 for asbestos awareness guidance.',
    sections: [
      {
        title: 'Common Locations',
        items: [
          'Insulation and sprayed coatings on steelwork.',
          'Asbestos Insulating Board (AIB) in walls and ceilings.',
          'Asbestos cement products (roofing sheets, pipes).',
          'Textured coatings (Artex) and floor tiles.'
        ]
      },
      {
        title: 'Health Effects',
        items: [
          'Inhaling asbestos fibres can cause fatal diseases like Mesothelioma and Lung Cancer.',
          'Symptoms often take 15 to 60 years to develop.',
          'There is no safe level of exposure to asbestos fibres.'
        ]
      },
      {
        title: 'Emergency Action',
        items: [
          'If you suspect asbestos: STOP WORK IMMEDIATELY.',
          'Do not disturb the material any further.',
          'Evacuate the area and prevent others from entering.',
          'Report the discovery to your supervisor immediately.',
          'Only laboratory analysis can confirm if a material contains asbestos.'
        ]
      },
      {
        title: 'Safety Message',
        text: 'IMPORTANT: Never drill, sand, or break any material if you are unsure of its content.'
      }
    ]
  },
  'tt-26-015': {
    title: 'Accident Prevention',
    ref: '26-015',
    intro: 'Most accidents are preventable. By identifying hazards and following safe systems of work, we can ensure everyone goes home safe.',
    regulations: 'Health and Safety at Work Act 1974.',
    furtherInfo: 'Report all near misses to help prevent future accidents.',
    sections: [
      {
        title: 'Causes of Accidents',
        items: [
          'Unsafe acts: Taking shortcuts, horseplay, or ignoring rules.',
          'Unsafe conditions: Poor housekeeping, faulty equipment, or lack of guarding.',
          'Human factors: Fatigue, stress, or lack of training.'
        ]
      },
      {
        title: 'Prevention DOs',
        items: [
          'DO keep your work area tidy.',
          'DO use the correct tools for the job.',
          'DO follow all safety signs and instructions.',
          'DO report any hazards or near misses immediately.'
        ]
      },
      {
        title: 'Prevention DON\'Ts',
        items: [
          'DON\'T take shortcuts to save time.',
          'DON\'T use equipment you are not trained for.',
          'DON\'T remove safety guards or bypass controls.',
          'DON\'T ignore "minor" injuries; get them treated.'
        ]
      },
      {
        title: 'Safety Message',
        text: 'Safety is a team effort. Look out for yourself and your colleagues.'
      }
    ]
  },
  'tt-26-020': {
    title: 'Lifting Equipment',
    ref: '26-020',
    intro: 'Lifting equipment includes any work equipment used for lifting or lowering loads, including attachments used for anchoring, fixing, or supporting it.',
    regulations: 'Lifting Operations and Lifting Equipment Regulations (LOLER) 1998.',
    furtherInfo: 'Refer to HSE INDG290 for LOLER guidance.',
    sections: [
      {
        title: 'Main Points',
        items: [
          'All lifting operations must be planned, supervised, and carried out safely.',
          'Equipment must be strong, stable, and suitable for the task.',
          'Lifting gear (slings, shackles) must be inspected before every use.'
        ]
      },
      {
        title: 'SWL Warnings',
        items: [
          'Never exceed the Safe Working Load (SWL) marked on the equipment.',
          'Ensure the SWL is clearly visible and legible.',
          'If the SWL is missing or unreadable, do not use the equipment.'
        ]
      },
      {
        title: 'Lifting Gear Guidance',
        items: [
          'Check for signs of wear, corrosion, or damage.',
          'Ensure hooks have safety catches in place.',
          'Store lifting gear in a clean, dry area to prevent degradation.'
        ]
      },
      {
        title: 'Safety Message',
        text: 'A failure in lifting equipment can be catastrophic. If in doubt, don\'t lift.'
      }
    ]
  },
  'tt-26-030': {
    title: 'Employees’ H&S Duties',
    ref: '26-030',
    intro: 'While employers have the primary responsibility for health and safety, employees also have legal duties under the law.',
    regulations: 'Health and Safety at Work Act 1974 (Section 7 & 8).',
    furtherInfo: 'Refer to the HSE "Health and Safety Law" poster for more details.',
    sections: [
      {
        title: 'Legal Duties',
        items: [
          'Take reasonable care for your own health and safety.',
          'Take care for the safety of others who may be affected by your acts or omissions.',
          'Co-operate with your employer on health and safety matters.',
          'Do not intentionally or recklessly interfere with anything provided for health and safety.'
        ]
      },
      {
        title: 'What This Means',
        items: [
          'Follow all safety training and instructions.',
          'Use PPE and safety equipment correctly.',
          'Report any hazards, accidents, or near misses.',
          'Attend safety briefings and contribute to risk assessments.'
        ]
      },
      {
        title: 'Safety Message',
        text: 'Health and safety is not just a management issue; it\'s your legal responsibility too.'
      }
    ]
  },
  'tt-26-036': {
    title: 'Work at Height',
    ref: '26-036',
    intro: 'Work at height remains one of the biggest causes of fatalities and major injuries in the construction industry.',
    regulations: 'Work at Height Regulations 2005.',
    furtherInfo: 'Refer to HSE INDG401 for work at height guidance.',
    sections: [
      {
        title: 'Hierarchy of Control',
        items: [
          'AVOID work at height where possible (e.g., using long-reach tools from the ground).',
          'PREVENT falls using an existing safe place of work or collective equipment (e.g., guardrails).',
          'MINIMISE the distance and consequences of a fall (e.g., using nets or fall arrest gear).'
        ]
      },
      {
        title: 'Key Safety Points',
        items: [
          'Ensure all work at height is properly planned and supervised.',
          'Check weather conditions before starting work outdoors.',
          'Ensure equipment (scaffolding, MEWPs, ladders) is inspected and safe.',
          'Protect others from falling objects (e.g., using toe-boards or exclusion zones).'
        ]
      },
      {
        title: 'Safety Message',
        text: 'A fall from even a low height can be life-changing. Always use the right equipment.'
      }
    ]
  },
  'tt-26-054': {
    title: 'Dynamic Risk Assessments',
    ref: '26-054',
    intro: 'A Dynamic Risk Assessment (DRA) is a continuous process of identifying hazards and assessing risk in a rapidly changing environment.',
    regulations: 'Management of Health and Safety at Work Regulations 1999.',
    furtherInfo: 'DRAs complement, but do not replace, formal written risk assessments.',
    sections: [
      {
        title: 'When to Use a DRA',
        items: [
          'When site conditions change unexpectedly (e.g., sudden bad weather).',
          'When a new hazard is identified during a task.',
          'In emergency situations where immediate action is required.'
        ]
      },
      {
        title: 'How to Carry Out a DRA',
        items: [
          'Step 1: Evaluate the situation and identify new hazards.',
          'Step 2: Assess the risk to yourself and others.',
          'Step 3: Implement control measures to manage the risk.',
          'Step 4: Decide if it is safe to proceed or if work must stop.'
        ]
      },
      {
        title: 'Safety Message',
        text: 'If the risk cannot be managed safely, STOP WORK and report to your supervisor.'
      }
    ]
  },
  'tt-26-063': {
    title: 'Slips, Trips and Falls',
    ref: '26-063',
    intro: 'Slips, trips, and falls are the most common cause of major injuries at work. Most can be prevented with simple housekeeping.',
    regulations: 'Workplace (Health, Safety and Welfare) Regulations 1992.',
    furtherInfo: 'Refer to HSE INDG225 for preventing slips and trips.',
    sections: [
      {
        title: 'Common Causes',
        items: [
          'Housekeeping: Objects left in walkways or untidy work areas.',
          'Spillages: Oil, water, or chemicals on the floor.',
          'Cables: Trailing leads across pedestrian routes.',
          'Lighting: Poor visibility in stairs or corridors.',
          'Footwear: Unsuitable or damaged safety boots.'
        ]
      },
      {
        title: 'Prevention Measures',
        items: [
          'Keep walkways clear of obstructions at all times.',
          'Clean up spillages immediately or signpost them.',
          'Use cable covers or route leads overhead.',
          'Report any blown bulbs or poor lighting areas.',
          'Ensure safety footwear has good grip and is in good condition.'
        ]
      },
      {
        title: 'Safety Message',
        text: 'See it, sort it. Don\'t walk past a trip hazard; move it or report it.'
      }
    ]
  }
};

export default function ToolboxTalkForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template') || 'tt-26-001';
  const talkData = TALK_CONTENT[templateId] || TALK_CONTENT['tt-26-001'];

  const location = useLocation();
  const editId = (location.state as any)?.editId as string | undefined;
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [currentStatus, setCurrentStatus] = React.useState<ReportStatus>('Draft');
  const [reportId] = React.useState(() => editId ?? crypto.randomUUID());

  const [formData, setFormData] = React.useState({
    date: new Date().toISOString().split('T')[0],
    deliveredBy: (getSession()?.name ?? ''),
    questions: [{ id: '1', question: '', answer: '' }],
    attendees: [{ id: '1', name: '', signature: '', date: new Date().toISOString().split('T')[0] }],
    executiveSummary: ''
  });

  const completedSections = React.useMemo(() => {
    const steps = [
      formData.date && formData.deliveredBy,
      true, // Content is always "read"
      formData.questions.some(q => q.question && q.answer),
      formData.attendees.some(a => a.name && a.signature)
    ];
    return steps.filter(Boolean).length;
  }, [formData]);

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, { id: crypto.randomUUID(), question: '', answer: '' }]
    }));
  };

  const removeQuestion = (id: string) => {
    if (formData.questions.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }));
  };

  const updateQuestion = (id: string, field: 'question' | 'answer', value: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === id ? { ...q, [field]: value } : q)
    }));
  };

  const addAttendee = () => {
    setFormData(prev => ({
      ...prev,
      attendees: [...prev.attendees, { 
        id: crypto.randomUUID(), 
        name: '', 
        signature: '', 
        date: new Date().toISOString().split('T')[0] 
      }]
    }));
  };

  const removeAttendee = (id: string) => {
    if (formData.attendees.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.filter(a => a.id !== id)
    }));
  };

  const updateAttendee = (id: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.map(a => a.id === id ? { ...a, [field]: value } : a)
    }));
  };

  const { photos, updatePhotos, clearPhotos } = usePhotoStore('toolbox_talk');
  const { clearAutoSave } = useAutoSave('toolbox_talk', formData);
  React.useEffect(() => {
    const saved = getAutoSavedData<any>('toolbox_talk'); // eslint-disable-line @typescript-eslint/no-explicit-any
    if (saved) setFormData(saved);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (status: ReportStatus) => {
    clearAutoSave();
    setIsSubmitting(true);

    try {
      const report = {
        id: reportId,
        authorId: mockUser.id,
        status,
        title: `Toolbox Talk: ${talkData.title} (${talkData.ref})`,
        type: 'Toolbox Talk',
        location: 'Site Briefing',
        date: formData.date,
        photos,
        data: {
          ...formData,
          templateId,
          ref: talkData.ref
        }
      };

      saveReport(report as any);
      clearPhotos();
      setCurrentStatus(status);

      if (status === 'Submitted') {
        try {
          await exportSavedReportToPDF(report, DEFAULT_BRANDING);
        } catch (pdfErr) {
          console.error('[ToolboxTalkForm] PDF generation failed:', pdfErr);
        }
      }

      navigate('/my-reports');
    } catch (err) {
      console.error('[ToolboxTalkForm] Save failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-32" id="toolbox-talk-report">
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
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sitk-yellow mb-1">Safety Briefing Module</p>
            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Toolbox Talk</h1>
          </div>
          <StatusBadge status={currentStatus} className="export-hide" />
        </div>
        
        <ExportButtons 
          elementId="toolbox-talk-report"
          reportTitle={`Toolbox Talk: ${talkData.title}`}
          formData={formData}
          photos={photos}
          reportId={reportId}
          onSave={handleSave}
          isSubmitting={isSubmitting}
          className="flex flex-wrap justify-end"
        />
      </div>

      <SectionHeader 
        title={talkData.title} 
        icon={Users}
        description={`Ref: ${talkData.ref} - Safety presentation and briefing sheet.`}
      />

      {/* Progress Tracker */}
      <div className="mt-8 mb-12">
        <div className="flex items-center justify-between mb-4 px-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Briefing Progress</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-sitk-yellow">{Math.round((completedSections / 4) * 100)}% Complete</p>
        </div>
        <div className="flex gap-2 h-1.5 px-1">
          {[1, 2, 3, 4].map((step) => (
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

      <div className="mt-12 space-y-20">
        {/* Section 1: Talk Details */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-sitk-black text-sitk-yellow rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-sitk-black/10">1</div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Talk Details</h2>
          </div>

          <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
            <CardContent className="p-8 sm:p-12">
              <div className="grid gap-10 sm:grid-cols-2">
                <div className="space-y-3">
                  <Label className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] ml-1">Date of Briefing</Label>
                  <div className="relative group/input">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                    <Input 
                      type="date"
                      value={formData.date}
                      onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="pl-12 bg-slate-50/50 border-slate-100 h-16 rounded-2xl focus:bg-white focus:border-sitk-yellow transition-all font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] ml-1">Delivered By (Name)</Label>
                  <div className="relative group/input">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/input:text-sitk-yellow transition-colors" />
                    <Input 
                      value={formData.deliveredBy}
                      onChange={e => setFormData(prev => ({ ...prev, deliveredBy: e.target.value }))}
                      placeholder="Enter name..."
                      className="pl-12 bg-slate-50/50 border-slate-100 h-16 rounded-2xl focus:bg-white focus:border-sitk-yellow transition-all font-bold text-sm"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 2: Talk Content */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-sitk-black text-sitk-yellow rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-sitk-black/10">2</div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Talk Content</h2>
          </div>

          <div className="grid gap-8">
            {/* Intro & Regs Card */}
            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-8 sm:p-12 space-y-12">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-6 bg-sitk-yellow rounded-full" />
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Introduction</h3>
                  </div>
                  <p className="text-lg font-bold text-slate-700 leading-relaxed italic">"{talkData.intro}"</p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-6 bg-sitk-yellow rounded-full" />
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Relevant Regulations</h3>
                  </div>
                  <div className="p-6 bg-sitk-black text-white rounded-2xl shadow-xl shadow-sitk-black/10">
                    <p className="text-sm font-black uppercase tracking-widest leading-relaxed">{talkData.regulations}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Content Sections */}
            {talkData.sections?.map((section: any, sIdx: number) => (
              <Card key={sIdx} className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-8 sm:p-12 space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="bg-sitk-yellow/10 p-3 rounded-xl">
                      <FileText className="w-5 h-5 text-sitk-black" />
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">{section.title}</h3>
                  </div>
                  
                  {section.items && (
                    <div className="grid gap-4">
                      {section.items.map((item: string, iIdx: number) => (
                        <div key={iIdx} className="flex items-start gap-5 p-5 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-md transition-all duration-300">
                          <div className="h-6 w-6 rounded-lg bg-sitk-yellow flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                            <span className="text-[10px] font-black text-sitk-black">{iIdx + 1}</span>
                          </div>
                          <p className="text-sm font-bold text-slate-700 leading-relaxed">{item}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {section.text && (
                    <div className="p-8 bg-sitk-yellow/5 rounded-[2rem] border-2 border-dashed border-sitk-yellow/20">
                      <p className="text-base font-bold text-slate-700 leading-relaxed text-center italic">{section.text}</p>
                    </div>
                  )}

                  {section.table && (
                    <div className="overflow-x-auto rounded-3xl border-2 border-slate-50 shadow-inner">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-sitk-black">
                            {section.table.headers.map((header: string, hIdx: number) => (
                              <th key={hIdx} className="p-5 text-[10px] font-black uppercase tracking-widest text-sitk-yellow border-b border-white/5">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {section.table.rows.map((row: string[], rIdx: number) => (
                            <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                              {row.map((cell: string, cIdx: number) => (
                                <td key={cIdx} className="p-5 text-xs font-bold text-slate-600 border-b border-slate-50">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Further Info Callout */}
            <div className="p-10 bg-sitk-yellow rounded-[2.5rem] shadow-xl shadow-sitk-yellow/10 flex flex-col sm:flex-row items-center gap-8 text-center sm:text-left">
              <div className="h-20 w-20 bg-sitk-black rounded-[2rem] flex items-center justify-center shrink-0 shadow-lg">
                <Info className="w-10 h-10 text-sitk-yellow" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-sitk-black/40">Further Information & Guidance</h4>
                <p className="text-lg font-black uppercase tracking-tight text-sitk-black leading-tight">
                  {talkData.furtherInfo}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Questions Asked */}
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-sitk-black text-sitk-yellow rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-sitk-black/10">3</div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Questions Asked</h2>
            </div>
            <Button 
              onClick={addQuestion}
              variant="outline"
              className="rounded-2xl border-2 border-slate-100 font-black uppercase text-[10px] tracking-widest h-14 px-8 hover:bg-sitk-yellow hover:border-sitk-yellow transition-all"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Question
            </Button>
          </div>

          <div className="grid gap-6">
            {formData.questions.map((q, idx) => (
              <Card key={q.id} className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden group">
                <CardContent className="p-8">
                  <div className="flex items-start gap-8">
                    <div className="flex-1 space-y-8">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] ml-1">Question {idx + 1}</Label>
                          <span className="text-[10px] font-black text-sitk-yellow uppercase tracking-widest bg-sitk-black px-3 py-1 rounded-full">Workforce Query</span>
                        </div>
                        <Input 
                          value={q.question}
                          onChange={e => updateQuestion(q.id, 'question', e.target.value)}
                          placeholder="What was asked by the team?"
                          className="bg-slate-50/50 border-slate-100 h-16 rounded-2xl focus:bg-white transition-all font-bold text-sm"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] ml-1">Response Given</Label>
                        <Textarea 
                          value={q.answer}
                          onChange={e => updateQuestion(q.id, 'answer', e.target.value)}
                          placeholder="Provide the answer or guidance given..."
                          className="bg-slate-50/50 border-slate-100 min-h-[120px] rounded-2xl focus:bg-white transition-all font-bold text-sm resize-none"
                        />
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeQuestion(q.id)}
                      className="text-slate-200 hover:text-red-500 hover:bg-red-50 transition-colors h-12 w-12 rounded-xl mt-8"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Section 4: Attendee Declaration */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-sitk-black text-sitk-yellow rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-sitk-black/10">4</div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Attendee Declaration</h2>
          </div>

          <div className="p-10 bg-sitk-black text-white rounded-[3rem] shadow-2xl shadow-sitk-black/20 mb-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
              <ShieldAlert className="w-64 h-64 -mr-20 -mt-20" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-10 text-center md:text-left">
              <div className="h-20 w-20 bg-sitk-yellow rounded-[2rem] flex items-center justify-center shrink-0 shadow-xl shadow-sitk-yellow/10">
                <CheckCircle2 className="w-10 h-10 text-sitk-black" />
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-[0.4em] text-sitk-yellow">Legal Confirmation</h4>
                <p className="text-2xl font-black tracking-tight leading-tight italic">
                  "I have read or been briefed in the above. I understand that I must report any health and safety problem."
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Briefing Attendance Register</p>
              <Button 
                onClick={addAttendee}
                variant="outline"
                className="rounded-2xl border-2 border-slate-100 font-black uppercase text-[10px] tracking-widest h-14 px-8 hover:bg-sitk-yellow hover:border-sitk-yellow transition-all"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Attendee
              </Button>
            </div>

            <div className="grid gap-4">
              {formData.attendees.map((a, idx) => (
                <Card key={a.id} className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden group hover:shadow-md transition-all">
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex flex-col lg:flex-row items-end gap-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 w-full">
                        <div className="space-y-2">
                          <Label className="text-slate-400 font-black uppercase text-[9px] tracking-widest ml-1">Date</Label>
                          <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                            <Input 
                              type="date"
                              value={a.date}
                              onChange={e => updateAttendee(a.id, 'date', e.target.value)}
                              className="pl-10 bg-slate-50/50 border-slate-100 h-14 rounded-xl focus:bg-white transition-all font-bold text-xs"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-400 font-black uppercase text-[9px] tracking-widest ml-1">Full Name</Label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                            <Input 
                              value={a.name}
                              onChange={e => updateAttendee(a.id, 'name', e.target.value)}
                              placeholder="Enter name..."
                              className="pl-10 bg-slate-50/50 border-slate-100 h-14 rounded-xl focus:bg-white transition-all font-bold text-xs"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-400 font-black uppercase text-[9px] tracking-widest ml-1">Digital Signature</Label>
                          <div className="relative">
                            <PenTool className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                            <Input 
                              value={a.signature}
                              onChange={e => updateAttendee(a.id, 'signature', e.target.value)}
                              placeholder="Type to sign..."
                              className="pl-10 bg-slate-50/50 border-slate-100 h-14 rounded-xl focus:bg-white transition-all font-bold text-xs italic"
                            />
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeAttendee(a.id)}
                        className="text-slate-200 hover:text-red-500 hover:bg-red-50 transition-colors h-14 w-14 rounded-xl shrink-0"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Section 5: What Now */}
        <section className="space-y-8 pb-12">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-sitk-black text-sitk-yellow rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-sitk-black/10">5</div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">What Now</h2>
          </div>

          <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden border-2 border-slate-50">
            <CardContent className="p-8 sm:p-12">
              <div className="flex flex-col sm:flex-row items-start gap-8">
                <div className="h-16 w-16 bg-sitk-yellow/10 rounded-[1.5rem] flex items-center justify-center shrink-0">
                  <Send className="w-8 h-8 text-sitk-yellow" />
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Post-Briefing Actions</h4>
                  <p className="text-base font-bold text-slate-500 leading-relaxed">
                    Once the briefing is submitted, it will be permanently recorded in the site safety log. Ensure all attendees have signed and that any specific concerns raised during the Q&A are addressed by site management.
                  </p>
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
            className="min-h-[160px] bg-slate-50 border-none focus-visible:ring-sitk-yellow p-4 resize-none font-medium text-sm"
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
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[3rem] p-12 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="h-24 w-24 bg-green-100 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-2">Talk Recorded</h2>
              <p className="text-sm font-bold text-slate-500 mb-8">The safety briefing has been saved to your reports.</p>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2 }}
                  className="h-full bg-sitk-yellow"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
