import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ClipboardCheck, 
  ShieldAlert, 
  FileText, 
  User, 
  ArrowRight,
  Flame,
  HardHat,
  Box,
  Users,
  BarChart3,
  AlertTriangle,
  FileSearch
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SectionHeader from '@/components/SectionHeader';

interface Template {
  id: string;
  title: string;
  description: string;
  icon: any;
}

export default function ModuleSelectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const getModuleConfig = () => {
    if (path.includes('risk-assessments')) {
      return {
        title: 'Risk Assessments',
        description: 'Identify hazards and implement control measures',
        icon: ShieldAlert,
        templates: [
          { id: 'dynamic-ra', title: 'Dynamic Risk Assessment', description: 'On-the-spot assessment for changing site conditions.', icon: AlertTriangle },
          { id: 'manual-handling', title: 'Manual Handling Operations Assessment', description: 'L.I.T.E. based assessment to identify and control manual handling risks.', icon: Box },
          { id: 'lone-working', title: 'Lone Working Risk Evaluation Checklist', description: 'Safety verification for staff working alone or in isolation.', icon: User },
          { id: 'dse-assessment', title: 'DSE Workstation Assessment', description: 'Ergonomic review of office and remote workstations.', icon: ClipboardCheck }
        ]
      };
    }
    if (path.includes('fire-safety')) {
      return {
        title: 'Fire Safety',
        description: 'Manage fire prevention and emergency procedures',
        icon: Flame,
        templates: [
          { id: 'fire-briefing', title: 'Fire Briefing', description: 'Record of fire safety induction for new staff.', icon: Flame },
          { id: 'fire-drill', title: 'Fire Drill Evacuation Report', description: 'Log and evaluate site evacuation drills.', icon: Flame },
          { id: 'fire-warden', title: 'Fire Warden Checklist', description: 'Weekly checks for designated fire wardens.', icon: ClipboardCheck }
        ]
      };
    }
    if (path.includes('permits')) {
      return {
        title: 'Permit to Work',
        description: 'Authorisation for high-risk activities',
        icon: FileText,
        templates: [
          { id: 'permit-multi', title: 'Permit to Work MULTI GENERAL', description: 'Consolidated permit for various high-risk tasks including Hot Works, Confined Space, and more.', icon: FileText },
          { id: 'permit-hot', title: 'Hot Works Permit', description: 'Specific authorisation for welding and cutting.', icon: Flame },
          { id: 'permit-confined', title: 'Confined Space Permit', description: 'Entry authorisation for restricted areas.', icon: HardHat }
        ]
      };
    }
    if (path.includes('checklists')) {
      return {
        title: 'Checklists',
        description: 'Daily and weekly site safety inspections',
        icon: ClipboardCheck,
        templates: [
          { id: 'temp-dse-checklist', title: 'Computer DSE Checklist', description: 'Assess office workstation ergonomics.', icon: ClipboardCheck },
          { id: 'temp-construction-site', title: 'Construction Site Checklist', description: 'General site compliance inspection.', icon: HardHat },
          { id: 'temp-lone-worker', title: 'Lone Worker Checklist', description: 'Safety verification for staff working alone.', icon: User },
          { id: 'temp-manual-handling', title: 'Manual Handling Checklist', description: 'Task-specific lifting assessment.', icon: Users },
          { id: 'temp-general-hs', title: 'General H&S Checklist', description: 'Standard workplace safety audit.', icon: ClipboardCheck }
        ]
      };
    }
    if (path.includes('audits')) {
      return {
        title: 'Audits',
        description: 'Full site compliance audits and scoring',
        icon: BarChart3,
        templates: [
          { id: 'audit-mini', title: 'H&S Mini Audit Inspection', description: 'Quick health and safety compliance audit.', icon: BarChart3 },
          { id: 'audit-hs-form', title: 'H&S Audit Form', description: 'Comprehensive health and safety compliance audit.', icon: BarChart3 },
          { id: 'audit-monthly-safety', title: 'Monthly Site Safety Audit', description: 'Regular monthly site inspection and review.', icon: ClipboardCheck }
        ]
      };
    }
    if (path.includes('incidents')) {
      return {
        title: 'Incident Reports',
        description: 'Record and investigate site accidents and near misses',
        icon: ShieldAlert,
        templates: [
          { id: 'incident-report', title: 'Standard Incident Report', description: 'Quickly record an accident or near miss as it happens.', icon: AlertTriangle },
          { id: 'incident-investigation', title: 'Accident / Incident Investigation', description: 'Full investigation form for supervisors and managers.', icon: FileSearch }
        ]
      };
    }
    if (path.includes('premises-checks')) {
      return {
        title: 'Premises / Equipment / Workplace Checks',
        description: 'Regular inspections for workplace premises and equipment safety',
        icon: ClipboardCheck,
        templates: [
          { id: '5-001', title: '5-001 Monthly Premises H&S Checklist', description: 'Monthly workplace health and safety checks for premises, staff issues, fire safety, equipment, waste, and corrective actions.', icon: ClipboardCheck },
          { id: '5-002', title: '5-002 Six-Monthly Premises H&S Checklist', description: 'Six-monthly compliance and premises checks including fire drills, contractor servicing, risk assessments, COSHH, LOLER, ladders, and corrective actions.', icon: ClipboardCheck },
          { id: '5-003', title: '5-003 Annual Premises H&S Checklist', description: 'Annual premises and compliance review including servicing, PAT, training validity, risk assessment reviews, and accident trend review.', icon: ClipboardCheck },
          { id: '5-004', title: '5-004 Equipment Safety Inspection Checklist', description: 'Inspection register for tools, equipment, machinery, and ladders, including safety condition, guarding, training, and inspection records.', icon: HardHat },
          { id: '5-017', title: '5-017 Pallet Racking Monthly Checklist', description: 'Monthly pallet racking checks covering load signs, uprights, braces, beams, connectors, welds, and corrective actions.', icon: ClipboardCheck }
        ]
      };
    }
    return null;
  };

  const config = getModuleConfig();

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p>Module not found.</p>
        <Button onClick={() => navigate('/dashboard')} className="mt-4">Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      <SectionHeader 
        title={config.title} 
        icon={config.icon} 
        description={config.description} 
      />

      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr items-stretch">
        {config.templates.map((template) => (
          <Card key={template.id} className="h-full border border-slate-200/80 shadow-sm hover:shadow-md transition-all group bg-white">
            <CardHeader className="pb-4">
              <div className="bg-sitk-yellow/10 p-3 rounded-xl w-fit mb-4 group-hover:bg-sitk-yellow transition-colors">
                <template.icon className="w-6 h-6 text-sitk-black" />
              </div>
              <CardTitle className="text-lg font-black uppercase tracking-tight">{template.title}</CardTitle>
              <CardDescription className="text-xs font-medium leading-relaxed">
                {template.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button 
                className="w-full bg-sitk-black text-white hover:bg-slate-800 font-black uppercase text-[10px] tracking-widest py-6"
                onClick={() => {
                  if (template.id === 'temp-construction-site') navigate('/checklists/site-induction/new');
                  else if (template.id === 'audit-mini') navigate('/audits/mini-audit/new');
                  else if (template.id === '5-001') navigate('/premises-checks/5-001/new');
                  else if (template.id === '5-002') navigate('/premises-checks/5-002/new');
                  else if (template.id === '5-003') navigate('/premises-checks/5-003/new');
                  else if (template.id === '5-004') navigate('/premises-checks/5-004/new');
                  else if (template.id === '5-017') navigate('/premises-checks/5-017/new');
                  else if (template.id === 'permit-multi') navigate('/permits/multi-general/new');
                  else if (template.id === 'dynamic-ra') navigate('/risk-assessments/new');
                  else if (template.id === 'manual-handling') navigate('/risk-assessments/manual-handling/new');
                  else if (template.id === 'lone-working') navigate('/risk-assessments/lone-working/new');
                  else if (template.id === 'dse-assessment') navigate('/risk-assessments/dse/new');
                  else if (path.includes('checklists')) navigate(`/checklists/new?template=${template.id}`);
                  else if (path.includes('audits')) navigate(`/audits/new?template=${template.id}`);
                  else if (template.id === 'incident-investigation') navigate('/incidents/investigation/new');
                  else if (template.id === 'incident-report') navigate('/incidents/new');
                  else if (template.id === 'fire-drill') navigate('/fire-safety/drill/new');
                  else if (template.id === 'fire-warden') navigate('/fire-safety/warden-checklist/new');
                  else navigate(`${path}/new?template=${template.id}`);
                }}
              >
                {path.includes('premises-checks') ? 'Start Form' : 'Start Report'} <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
