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
    { label: 'Draft Reports', value: activeReports.filter(r => r.status === 'Draft').length, icon: FileEdit, color: 'text-slate-500', bg: 'bg-slate-100' },
    { label: 'Submitted', value: activeReports.filter(r => r.status === 'Submitted').length, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-100' },
    { label: 'Completed', value: activeReports.filter(r => r.status === 'Completed').length, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-100' },
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
        <div className="space-y-10">
          {/* Welcome Section */}
              <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                      <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sitk-black/40 font-black uppercase text-[10px] tracking-[0.2em]">
                                            <LayoutDashboard className="w-3 h-3" />
                                            Dashboard
                                </div>div>
                                <h2 className="text-4xl font-black tracking-tighter uppercase text-slate-900 leading-none">
                                            Welcome, {currentUser?.name.split(' ')[0] ?? 'Back'}
                                </h2>h2>
                                <p className="text-muted-foreground font-medium text-sm">Safety is the Key Ltd | Site Safety Overview</p>p>
                      </div>div>
                      <div className="flex items-center gap-4">
                                <Button
                                              onClick={() => navigate('/new-report')}
                                              className="bg-sitk-black text-white hover:bg-slate-800 font-black uppercase text-[10px] tracking-[0.2em] py-6 px-8 shadow-lg"
                                            >
                                            <Plus className="mr-2 h-4 w-4" />
                                            New Report
                                </Button>Button>
                                <div className="hidden md:block">
                                            <Logo size="sm" showFullText={false} className="rotate-[-1deg] opacity-20 hover:opacity-100 transition-opacity" />
                                </div>div>
                      </div>div>
              </section>section>
        
          {/* Summary Stats */}
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
                {stats.map((stat, i) => (
                    <motion.div
                                  key={stat.label}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.1 }}
                                >
                                <Card className="border-none shadow-sm overflow-hidden group">
                                              <div className={cn("h-1 w-full", stat.bg.replace('bg-', 'bg-').replace('100', '500'))} />
                                              <CardContent className="p-6">
                                                              <div className="flex items-center justify-between mb-2">
                                                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>p>
                                                                                <stat.icon className={cn("h-4 w-4", stat.color)} />
                                                              </div>div>
                                                              <div className="text-3xl font-black tracking-tighter">{stat.value}</div>div>
                                              </CardContent>CardContent>
                                </Card>Card>
                    </motion.div>motion.div>
                  ))}
              </div>div>
        
          {/* Quick Actions */}
              <section className="space-y-6">
                      <SectionHeader title="Quick Actions" icon={Plus} description="Start a new report or assessment" />
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {quickActions.map((action, i) => (
                      <motion.div
                                      key={action.name}
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: 0.3 + (i * 0.1) }}
                                                       >
                                    <ActionCard
                                                      title={action.name}
                                                      description={action.description}
                                                      icon={action.icon}
                                                      to={action.href}
                                                    />
                      </motion.div>motion.div>
                    ))}
                      </div>div>
              </section>section>
        
              <div className="grid gap-8 lg:grid-cols-3">
                {/* Recent Activity */}
                      <Card className="border-none shadow-sm lg:col-span-2">
                                <div className="p-6 pb-2">
                                            <SectionHeader title="Recent Activity" icon={ActivityIcon} description="Latest updates across the platform" className="mb-0" />
                                </div>div>
                                <CardContent>
                                            <div className="space-y-1">
                                              {activities.length === 0 ? (
                          <p className="text-sm text-muted-foreground font-medium px-4 py-6 text-center">No recent activity yet. Start by creating a report.</p>p>
                        ) : activities.map((activity, i) => (
                          <div
                                              key={activity.id}
                                              className={cn(
                                                                    "flex items-center gap-4 p-4 rounded-xl transition-colors hover:bg-slate-50",
                                                                    i !== activities.length - 1 && "border-b border-slate-100 rounded-b-none"
                                                                  )}
                                            >
                                            <div className="bg-slate-100 p-2 rounded-lg">
                                                                <ActivityIcon className="w-4 h-4 text-slate-500" />
                                            </div>div>
                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm leading-tight">
                                                                                      <span className="font-black uppercase text-[10px] tracking-widest mr-2">{activity.userName}</span>span>
                                                                                      <span className="text-slate-600 font-medium">{activity.action}</span>{' '}
                                                                                      <span className="font-bold text-slate-900">{activity.target}</span>span>
                                                                </p>p>
                                                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">{activity.timestamp}</p>p>
                                            </div>div>
                          </div>div>
                        ))}
                                            </div>div>
                                            <Button
                                                            variant="ghost"
                                                            className="w-full mt-4 font-black uppercase text-[10px] tracking-widest hover:bg-sitk-yellow/10"
                                                            onClick={() => navigate('/my-reports')}>
                                                          View All Activity <ArrowRight className="ml-2 h-3 w-3" />
                                            </Button>Button>
                                </CardContent>CardContent>
                      </Card>Card>
              
                {/* Recent Reports Quick View */}
                      <Card className="border-none shadow-sm">
                                <div className="p-6 pb-2">
                                            <SectionHeader title="Recent Reports" icon={FileText} description="Latest submissions" className="mb-0" />
                                </div>div>
                                <CardContent>
                                            <div className="space-y-3">
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
                                                                                        </h4>h4>
                                                                                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{report.type}</p>p>
                                                                </div>div>
                                                                <StatusBadge status={report.status} className="shrink-0" />
                                            </div>div>
                                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                                <span>{report.location}</span>span>
                                                                <span className="font-mono">{formatDateUK(report.date)}</span>span>
                                            </div>div>
                          </div>div>
                        ))}
                                            </div>div>
                                            <Button
                                                            className="w-full mt-6 bg-sitk-black text-white hover:bg-slate-800 font-black uppercase text-[10px] tracking-widest py-6"
                                                            onClick={() => navigate('/my-reports')}>
                                                          Manage All Reports
                                            </Button>Button>
                                </CardContent>CardContent>
                      </Card>Card>
              </div>div>
        </div>div>
      );
}</div>
