import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  FileText,
  ClipboardCheck,
  BarChart3,
  Flame,
  Wrench,
  FileCheck,
  Users,
  ArrowRight,
  Plus,
  LayoutDashboard,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import SectionHeader from '@/components/SectionHeader';
import { motion } from 'motion/react';

const categories = [
  {
    title: 'Risk Assessments',
    description: 'Dynamic, manual handling, lone working & DSE assessments.',
    icon: ShieldAlert,
    href: '/risk-assessments',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
  },
  {
    title: 'Incident Reports',
    description: 'Report accidents, near misses or site incidents.',
    icon: FileText,
    href: '/incidents',
    color: 'text-red-500',
    bg: 'bg-red-50',
  },
  {
    title: 'Checklists',
    description: 'Daily and weekly site safety inspection checklists.',
    icon: ClipboardCheck,
    href: '/checklists',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
  },
  {
    title: 'Audits',
    description: 'Full site compliance audits and HS mini-audits.',
    icon: BarChart3,
    href: '/audits',
    color: 'text-purple-500',
    bg: 'bg-purple-50',
  },
  {
    title: 'Fire Safety',
    description: 'Fire briefings, drill reports and warden checklists.',
    icon: Flame,
    href: '/fire-safety',
    color: 'text-rose-500',
    bg: 'bg-rose-50',
  },
  {
    title: 'Premises & Equipment',
    description: 'Monthly, 6-monthly and annual premises inspections.',
    icon: Wrench,
    href: '/premises-checks',
    color: 'text-teal-500',
    bg: 'bg-teal-50',
  },
  {
    title: 'Toolbox Talks',
    description: 'Deliver and record toolbox talk sessions.',
    icon: FileCheck,
    href: '/toolbox-talks',
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
  },
  {
    title: 'Permits to Work',
    description: 'General and specialist permit-to-work forms.',
    icon: FileCheck,
    href: '/permits',
    color: 'text-indigo-500',
    bg: 'bg-indigo-50',
  },
  {
    title: 'Contractor Vetting',
    description: 'Verify and approve external contractors.',
    icon: Users,
    href: '/contractors',
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
];

export default function NewReportPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      {/* Header */}
      <section className="space-y-1">
        <div className="flex items-center gap-2 text-sitk-black/40 font-black uppercase text-[10px] tracking-[0.2em]">
          <LayoutDashboard className="w-3 h-3" /> Dashboard
        </div>
        <h2 className="text-4xl font-black tracking-tighter uppercase text-slate-900 leading-none">
          New Report
        </h2>
        <p className="text-muted-foreground font-medium text-sm">
          Choose a report type to get started
        </p>
      </section>

      <SectionHeader title="Select Report Type" icon={Plus} description="Pick a category to view available forms" />

      <div className="grid gap-4 md:gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr items-stretch">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="h-full"
          >
            <Card
              className="h-full border border-slate-200/80 shadow-sm cursor-pointer hover:shadow-md hover:border-sitk-yellow transition-all group bg-white"
              onClick={() => navigate(cat.href)}
            >
              <CardContent className="p-6 flex items-start gap-4">
                <div className={`${cat.bg} rounded-xl p-3 flex-shrink-0`}>
                  <cat.icon className={`h-6 w-6 ${cat.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black uppercase text-[11px] tracking-widest text-slate-900 leading-tight">
                    {cat.title}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 leading-snug">
                    {cat.description}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-sitk-yellow group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
