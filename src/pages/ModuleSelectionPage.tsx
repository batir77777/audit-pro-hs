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
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
          colors: { headerBg: 'bg-amber-100', iconText: 'text-amber-800', countBg: 'bg-amber-50', itemIconBg: 'bg-amber-50', itemIconHover: 'group-hover:bg-amber-100', itemIconText: 'text-amber-600', itemIconTextHover: 'group-hover:text-amber-900' },
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
          colors: { headerBg: 'bg-red-100', iconText: 'text-red-800', countBg: 'bg-red-50', itemIconBg: 'bg-red-50', itemIconHover: 'group-hover:bg-red-100', itemIconText: 'text-red-600', itemIconTextHover: 'group-hover:text-red-900' },
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
          colors: { headerBg: 'bg-purple-100', iconText: 'text-purple-800', countBg: 'bg-purple-50', itemIconBg: 'bg-purple-50', itemIconHover: 'group-hover:bg-purple-100', itemIconText: 'text-purple-600', itemIconTextHover: 'group-hover:text-purple-900' },
        templates: [
          { id: 'permit-multi', title: 'Permit to Work MULTI GENERAL', description: 'Consolidated permit for various high-risk tasks including Hot Works, Confined Space, and more.', icon: FileText }
        ]
      };
    }
    if (path.includes('checklists')) {
      return {
        title: 'Checklists',
        description: 'Daily and weekly site safety inspections',
        icon: ClipboardCheck,
          colors: { headerBg: 'bg-green-100', iconText: 'text-green-800', countBg: 'bg-green-50', itemIconBg: 'bg-green-50', itemIconHover: 'group-hover:bg-green-100', itemIconText: 'text-green-600', itemIconTextHover: 'group-hover:text-green-900' },
        templates: [
          { id: 'temp-site-safety', title: 'Daily Site Safety Inspection', description: 'Daily site safety inspection checklist.', icon: ClipboardCheck },
          { id: 'temp-construction-site', title: 'Site Induction Checklist', description: 'Construction site worker induction record.', icon: HardHat },
          { id: 'temp-general-hs', title: 'General H&S Checklist', description: 'Standard workplace safety audit.', icon: ClipboardCheck }
        ]
      };
    }
    if (path.includes('audits')) {
      return {
        title: 'Audits',
        description: 'Full site compliance audits and scoring',
        icon: BarChart3,
          colors: { headerBg: 'bg-blue-100', iconText: 'text-blue-800', countBg: 'bg-blue-50', itemIconBg: 'bg-blue-50', itemIconHover: 'group-hover:bg-blue-100', itemIconText: 'text-blue-600', itemIconTextHover: 'group-hover:text-blue-900' },
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
          colors: { headerBg: 'bg-orange-100', iconText: 'text-orange-800', countBg: 'bg-orange-50', itemIconBg: 'bg-orange-50', itemIconHover: 'group-hover:bg-orange-100', itemIconText: 'text-orange-600', itemIconTextHover: 'group-hover:text-orange-900' },
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
          colors: { headerBg: 'bg-teal-100', iconText: 'text-teal-800', countBg: 'bg-teal-50', itemIconBg: 'bg-teal-50', itemIconHover: 'group-hover:bg-teal-100', itemIconText: 'text-teal-600', itemIconTextHover: 'group-hover:text-teal-900' },
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

  const handleStart = (template: Template) => {
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
    else if (path.includes('checklists')) navigate(`/checklists/new?templateId=${template.id}`);
    else if (path.includes('audits')) navigate(`/audits/new?templateId=${template.id}`);
    else if (template.id === 'incident-investigation') navigate('/incidents/investigation/new');
    else if (template.id === 'incident-report') navigate('/incidents/new');
    else if (template.id === 'fire-drill') navigate('/fire-safety/drill/new');
    else if (template.id === 'fire-warden') navigate('/fire-safety/warden-checklist/new');
    else navigate(`${path}/new?template=${template.id}`);
  };

  const buttonLabel = path.includes('premises-checks') ? 'Start Form' : 'Start';

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      {/* Category header */}
      <div className="flex items-center gap-4 pb-2">
         <div className={cn("p-3 rounded-2xl shadow-sm", config.colors.headerBg)}>
        <config.icon className={cn("w-5 h-5", config.colors.iconText)} />
        </div>
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">{config.title}</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">{config.description}</p>
        </div>
      </div>

      {/* Template list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className={cn("px-5 py-3 border-b border-slate-100", config.colors.countBg)}>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            {config.templates.length} {config.templates.length === 1 ? 'template' : 'templates'} available
          </p>
        </div>

        <ul className="divide-y divide-slate-100">
          {config.templates.map((template) => (
            <li
              key={template.id}
              className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group cursor-pointer"
              onClick={() => handleStart(template)}
            >
              {/* Icon */}
              <div className={cn("shrink-0 p-2.5 rounded-xl transition-colors", config.colors.itemIconBg, config.colors.itemIconHover)}>
                <template.icon className={cn("w-4 h-4 transition-colors", config.colors.itemIconText, config.colors.itemIconTextHover)} />
              </div>

              {/* Title + description */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate group-hover:text-sitk-black transition-colors">
                  {template.title}
                </p>
                <p className="text-[11px] text-slate-400 font-medium leading-snug mt-0.5 line-clamp-1">
                  {template.description}
                </p>
              </div>

              {/* Action */}
              <Button
                size="sm"
                className="shrink-0 bg-sitk-black text-white hover:bg-slate-700 font-black uppercase text-[9px] tracking-widest px-4 py-2 rounded-xl"
                onClick={(e) => { e.stopPropagation(); handleStart(template); }}
              >
                {buttonLabel}
                <ArrowRight className="ml-1.5 w-3 h-3" />
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
