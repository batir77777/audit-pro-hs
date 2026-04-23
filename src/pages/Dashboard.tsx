import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShieldAlert,
    FileText,
    ClipboardCheck,
    BarChart3,
    ArrowRight,
    Clock,
    CheckCircle2,
    FileEdit,
    Activity as ActivityIcon,
    LayoutDashboard,
    Plus,
    User,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getRecentActivity } from '@/lib/mockData';
import { useReports } from '@/lib/useReports';
import { useAuth } from '@/lib/authContext';
import { motion } from 'motion/react';
import Logo from '@/components/Logo';
import ActionCard from '@/components/ActionCard';
import SectionHeader from '@/components/SectionHeader';
import StatusBadge from '@/components/StatusBadge';
import { cn, formatDateUK } from '@/lib/utils';

export default function Dashboard() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
  const { reports } = useReports(currentUser);
    const [activities, setActivities] = React.useState(getRecentActivity);

  React.useEffect(() => {
        const handleUpdate = () => {
                setActivities(getRecentActivity());
        };
        window.addEventListener('reportsUpdated', handleUpdate);
        return () => window.removeEventListener('reportsUpdated', handleUpdate);
  }, []);


  const activeReports = reports.filter(r => r.status !== 'Deleted');

  const stats = [
    {
      label: 'Draft Reports',
      value: activeReports.filter(r => r.status === 'Draft').length,
      icon: FileEdit,
      iconColor: 'text-amber-800',
      labelColor: 'text-amber-800',
      stripe: 'bg-amber-500',
      chip: 'bg-amber-100 ring-1 ring-amber-300/70',
      cardBg: 'bg-amber-50/95',
      border: 'border-amber-300/60',
    },
    {
      label: 'Submitted',
      value: activeReports.filter(r => r.status === 'Submitted').length,
      icon: Clock,
      iconColor: 'text-blue-800',
      labelColor: 'text-blue-800',
      stripe: 'bg-blue-600',
      chip: 'bg-blue-100 ring-1 ring-blue-300/70',
      cardBg: 'bg-blue-50/95',
      border: 'border-blue-300/60',
    },
    {
      label: 'Completed',
      value: activeReports.filter(r => r.status === 'Completed').length,
      icon: CheckCircle2,
      iconColor: 'text-emerald-800',
      labelColor: 'text-emerald-800',
      stripe: 'bg-emerald-600',
      chip: 'bg-emerald-100 ring-1 ring-emerald-300/70',
      cardBg: 'bg-emerald-50/95',
      border: 'border-emerald-300/60',
    },
  ];

  const quickActions = [
    { name: 'Start Dynamic Risk Assessment', description: 'Complete a pre-start risk assessment for site tasks.', icon: ShieldAlert, href: '/risk-assessments/new' },
    { name: 'Report Incident', description: 'Report an accident, near miss, or site incident.', icon: FileText, href: '/incidents/new' },
    { name: 'Start Checklist', description: 'Daily and weekly site safety inspections.', icon: ClipboardCheck, href: '/checklists/new' },
    { name: 'Start Audit', description: 'Full site compliance audits and scoring.', icon: BarChart3, href: '/audits/new' },
    { name: 'Premises / Equipment Checks', description: 'Regular inspections for workplace premises and equipment.', icon: ClipboardCheck, href: '/premises-checks' },
    { name: 'Contractor Vetting', description: 'Verify and approve external contractors.', icon: User, href: '/contractors' },
    { name: 'Site Induction', description: 'Complete a construction site induction checklist.', icon: ClipboardCheck, href: '/checklists/site-induction/new' },
      ];

  return (
    <div className="space-y-7 md:space-y-8">
      {/* Welcome Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-5 md:gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-[0.16em]">
            <LayoutDashboard className="w-3 h-3" /> Dashboard
          </div>
          <h2 className="text-[2.1rem] md:text-[2.7rem] font-black tracking-tight text-slate-900 leading-[1.04]">
            Welcome, {currentUser?.name.split(' ')[0] ?? 'Back'}
          </h2>
          <p className="text-slate-400 font-normal text-[13px] md:text-sm leading-relaxed">Safety is the Key Ltd | Site Safety Overview</p>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <Button 
            onClick={() => navigate('/new-report')}
            size="lg"
            className="bg-slate-900 text-white ring-1 ring-amber-300/35 hover:bg-amber-500 hover:text-slate-950 hover:shadow-[0_4px_12px_rgba(245,158,11,0.28)] font-black uppercase text-[10px] tracking-[0.16em] px-6 transition-[background-color,color,box-shadow] duration-200"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Report
          </Button>
          <div className="hidden md:block">
            <Logo size="sm" showFullText={false} className="rotate-[-1deg] opacity-20 hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </section>

      {/* Summary Stats */}
      <section className="space-y-4 md:space-y-5">
        <SectionHeader title="Summary" icon={BarChart3} description="Current report status at a glance" className="mb-0 relative pl-3 before:absolute before:left-0 before:top-1.5 before:h-5 before:w-1 before:rounded-full before:bg-sitk-yellow/80" />
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={cn(
              "overflow-hidden border shadow-[0_4px_14px_rgba(15,23,42,0.07)]",
              stat.cardBg,
              stat.border
            )}>
              <div className={cn("h-[2px] w-full", stat.stripe)} />
              <CardContent className="p-3.5 md:p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <p className={cn("text-[10px] font-black uppercase tracking-[0.12em]", stat.labelColor)}>{stat.label}</p>
                  <div className={cn('p-1.5 rounded-lg', stat.chip)}>
                    <stat.icon className={cn('h-4 w-4', stat.iconColor)} strokeWidth={2} />
                  </div>
                </div>
                <div className="text-[2.15rem] md:text-[2.45rem] font-black tracking-[-0.03em] text-slate-950 tabular-nums leading-[0.95]">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      </section>

      {/* Quick Actions */}
      <section className="space-y-4 md:space-y-5">
        <SectionHeader title="Quick Actions" icon={Plus} description="Start a new report or assessment" className="relative pl-3 before:absolute before:left-0 before:top-1.5 before:h-5 before:w-1 before:rounded-full before:bg-sitk-yellow/80" />
        <div className="grid gap-4 md:gap-5 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, i) => (
            <motion.div
              key={action.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (i * 0.1) }}
            >
              <ActionCard 
                title={action.name}
                description={action.description}
                icon={action.icon}
                to={action.href}
              />
            </motion.div>
          ))}
        </div>
      </section>

      <section className="space-y-4 md:space-y-5 border-t border-slate-200 pt-8 md:pt-10 pb-2 md:pb-3">
        <SectionHeader title="Reports &amp; Activity" icon={ActivityIcon} description="Recent submissions and platform activity" className="mb-0 relative pl-3 before:absolute before:left-0 before:top-1.5 before:h-5 before:w-1 before:rounded-full before:bg-sitk-yellow/80" />
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-3 md:p-4 lg:p-5">
          <div className="grid gap-4 md:gap-5 lg:gap-6 lg:grid-cols-2 items-stretch">
          {/* Recent Activity */}
          <Card className="border border-slate-200 bg-white shadow-[0_4px_14px_rgba(15,23,42,0.06)] flex flex-col min-h-[26rem]">
            <div className="flex items-center justify-between px-5 md:px-6 pt-5 md:pt-6 pb-4 border-b border-slate-100">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-600 mb-0.5">Live Feed</p>
                <h3 className="text-lg font-black tracking-tight text-slate-900">Recent Activity</h3>
              </div>
              <div className="bg-slate-100 p-2 rounded-lg">
                <ActivityIcon className="w-4 h-4 text-slate-500" strokeWidth={2} />
              </div>
            </div>
            <div className="flex-1 divide-y divide-slate-100">
              {activities.length === 0 ? (
                <p className="text-sm text-slate-400 font-medium px-5 py-8 text-center">No recent activity yet. Start by creating a report.</p>
              ) : activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 px-5 md:px-6 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 ring-2 ring-amber-100" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] md:text-sm leading-relaxed text-slate-700">
                      <span className="font-black text-slate-900">{activity.userName}</span>
                      {' '}<span className="font-normal">{activity.action}</span>{' '}
                      <span className="font-semibold text-slate-800">{activity.target}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em] mt-0.5">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 md:px-6 py-4 border-t border-slate-100">
              <Button variant="ghost" className="w-full border border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-[0.12em] hover:bg-slate-50 hover:border-slate-300" onClick={() => navigate('/my-reports')}>
                View All Activity <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            </div>
          </Card>

          {/* Recent Reports */}
          <Card className="border border-slate-200 bg-white shadow-[0_4px_14px_rgba(15,23,42,0.06)] flex flex-col min-h-[26rem]">
            <div className="flex items-center justify-between px-5 md:px-6 pt-5 md:pt-6 pb-4 border-b border-slate-100">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-600 mb-0.5">Latest</p>
                <h3 className="text-lg font-black tracking-tight text-slate-900">Recent Reports</h3>
              </div>
              <div className="bg-slate-100 p-2 rounded-lg">
                <FileText className="w-4 h-4 text-slate-500" strokeWidth={2} />
              </div>
            </div>
            <div className="flex-1 divide-y divide-slate-100">
              {activeReports.slice(0, 5).map((report) => (
                          <div
                                              key={report.id}
                                              className="group flex flex-col gap-2 p-4 rounded-xl border border-slate-100 hover:border-sitk-yellow hover:bg-sitk-yellow/5 cursor-pointer transition-all"
                                              onClick={() => navigate('/my-reports')}
                                            >
                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="space-y-1">
                                                                                      <h4 className="text-sm font-black uppercase tracking-tight leading-tight group-hover:text-sitk-black transition-colors">
                                                                                        {report.title}
                                                                                        </h4>
                                                                                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{report.type}</p>
                                                                </div>
                                                                <StatusBadge status={report.status} className="shrink-0" />
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                                <span>{report.location}</span>
                                                                <span className="font-mono">{formatDateUK(report.date)}</span>
                                            </div>
                          </div>
                        ))}
                                            </div>
                                            <Button
                                                            className="w-full mt-6 bg-sitk-black text-white hover:bg-slate-800 font-black uppercase text-[10px] tracking-widest py-6"
                                                            onClick={() => navigate('/my-reports')}>
                                                          Manage All Reports
                                            </Button>
                                </CardContent>
                      </Card>
              </div>
        </div>
      );
=======
    <div className="space-y-7 md:space-y-8">
      {/* Welcome Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-5 md:gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-[0.16em]">
            <LayoutDashboard className="w-3 h-3" /> Dashboard
          </div>
          <h2 className="text-[2.1rem] md:text-[2.7rem] font-black tracking-tight text-slate-900 leading-[1.04]">
            Welcome, {currentUser?.name.split(' ')[0] ?? 'Back'}
          </h2>
          <p className="text-slate-400 font-normal text-[13px] md:text-sm leading-relaxed">Safety is the Key Ltd | Site Safety Overview</p>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <Button 
            onClick={() => navigate('/new-report')}
            size="lg"
            className="bg-slate-900 text-white ring-1 ring-amber-300/35 hover:bg-amber-500 hover:text-slate-950 hover:shadow-[0_4px_12px_rgba(245,158,11,0.28)] font-black uppercase text-[10px] tracking-[0.16em] px-6 transition-[background-color,color,box-shadow] duration-200"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Report
          </Button>
          <div className="hidden md:block">
            <Logo size="sm" showFullText={false} className="rotate-[-1deg] opacity-20 hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </section>

      {/* Summary Stats */}
      <section className="space-y-4 md:space-y-5">
        <SectionHeader title="Summary" icon={BarChart3} description="Current report status at a glance" className="mb-0 relative pl-3 before:absolute before:left-0 before:top-1.5 before:h-5 before:w-1 before:rounded-full before:bg-sitk-yellow/80" />
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={cn(
              "overflow-hidden border shadow-[0_4px_14px_rgba(15,23,42,0.07)]",
              stat.cardBg,
              stat.border
            )}>
              <div className={cn("h-[2px] w-full", stat.stripe)} />
              <CardContent className="p-3.5 md:p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <p className={cn("text-[10px] font-black uppercase tracking-[0.12em]", stat.labelColor)}>{stat.label}</p>
                  <div className={cn('p-1.5 rounded-lg', stat.chip)}>
                    <stat.icon className={cn('h-4 w-4', stat.iconColor)} strokeWidth={2} />
                  </div>
                </div>
                <div className="text-[2.15rem] md:text-[2.45rem] font-black tracking-[-0.03em] text-slate-950 tabular-nums leading-[0.95]">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      </section>

      {/* Quick Actions */}
      <section className="space-y-4 md:space-y-5">
        <SectionHeader title="Quick Actions" icon={Plus} description="Start a new report or assessment" className="relative pl-3 before:absolute before:left-0 before:top-1.5 before:h-5 before:w-1 before:rounded-full before:bg-sitk-yellow/80" />
        <div className="grid gap-4 md:gap-5 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, i) => (
            <motion.div
              key={action.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (i * 0.1) }}
            >
              <ActionCard 
                title={action.name}
                description={action.description}
                icon={action.icon}
                to={action.href}
              />
            </motion.div>
          ))}
        </div>
      </section>

      <section className="space-y-4 md:space-y-5 border-t border-slate-200 pt-8 md:pt-10 pb-2 md:pb-3">
        <SectionHeader title="Reports &amp; Activity" icon={ActivityIcon} description="Recent submissions and platform activity" className="mb-0 relative pl-3 before:absolute before:left-0 before:top-1.5 before:h-5 before:w-1 before:rounded-full before:bg-sitk-yellow/80" />
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-3 md:p-4 lg:p-5">
          <div className="grid gap-4 md:gap-5 lg:gap-6 lg:grid-cols-2 items-stretch">
          {/* Recent Activity */}
          <Card className="border border-slate-200 bg-white shadow-[0_4px_14px_rgba(15,23,42,0.06)] flex flex-col min-h-[26rem]">
            <div className="flex items-center justify-between px-5 md:px-6 pt-5 md:pt-6 pb-4 border-b border-slate-100">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-600 mb-0.5">Live Feed</p>
                <h3 className="text-lg font-black tracking-tight text-slate-900">Recent Activity</h3>
              </div>
              <div className="bg-slate-100 p-2 rounded-lg">
                <ActivityIcon className="w-4 h-4 text-slate-500" strokeWidth={2} />
              </div>
            </div>
            <div className="flex-1 divide-y divide-slate-100">
              {activities.length === 0 ? (
                <p className="text-sm text-slate-400 font-medium px-5 py-8 text-center">No recent activity yet. Start by creating a report.</p>
              ) : activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 px-5 md:px-6 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 ring-2 ring-amber-100" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] md:text-sm leading-relaxed text-slate-700">
                      <span className="font-black text-slate-900">{activity.userName}</span>
                      {' '}<span className="font-normal">{activity.action}</span>{' '}
                      <span className="font-semibold text-slate-800">{activity.target}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em] mt-0.5">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 md:px-6 py-4 border-t border-slate-100">
              <Button variant="ghost" className="w-full border border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-[0.12em] hover:bg-slate-50 hover:border-slate-300" onClick={() => navigate('/my-reports')}>
                View All Activity <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            </div>
          </Card>

          {/* Recent Reports */}
          <Card className="border border-slate-200 bg-white shadow-[0_4px_14px_rgba(15,23,42,0.06)] flex flex-col min-h-[26rem]">
            <div className="flex items-center justify-between px-5 md:px-6 pt-5 md:pt-6 pb-4 border-b border-slate-100">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-600 mb-0.5">Latest</p>
                <h3 className="text-lg font-black tracking-tight text-slate-900">Recent Reports</h3>
              </div>
              <div className="bg-slate-100 p-2 rounded-lg">
                <FileText className="w-4 h-4 text-slate-500" strokeWidth={2} />
              </div>
            </div>
            <div className="flex-1 divide-y divide-slate-100">
              {activeReports.slice(0, 5).map((report) => (
                <div
                  key={report.id}
                  className="group flex flex-col gap-1.5 px-5 md:px-6 py-3.5 hover:bg-amber-50/60 cursor-pointer transition-colors"
                  onClick={() => navigate('/my-reports')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-[14px] font-semibold tracking-tight leading-snug text-slate-900 flex-1 min-w-0 truncate">
                      {report.title}
                    </h4>
                    <StatusBadge status={report.status} className="shrink-0" />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                    <span className="truncate">{report.type}</span>
                    <span className="font-mono shrink-0 ml-2">{formatDateUK(report.date)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 md:px-6 py-4 border-t border-slate-100">
              <Button className="w-full bg-slate-900 text-white hover:bg-amber-500 hover:shadow-[0_4px_12px_rgba(245,158,11,0.35)] font-black uppercase text-[10px] tracking-[0.12em] transition-all duration-200" size="lg" onClick={() => navigate('/my-reports')}>
                Manage All Reports <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            </div>
          </Card>
          </div>
        </div>
      </section>
    </div>
  );
>>>>>>> c545ff7 (UI improvements + stable sync version (mobile + dashboard + sidebar polish))
}
