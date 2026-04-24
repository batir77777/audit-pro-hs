import React from 'react';
import { Search, Eye, Edit2, FileText, Printer, Plus, ListFilter, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { softDeleteReport, restoreReport, permanentDeleteReport } from '@/lib/mockData';
import { useAuth } from '@/lib/authContext';
import { useReports } from '@/lib/useReports';
import { exportSavedReportToPDF } from '@/lib/exportUtils';
import { preloadDraftForEdit } from '@/lib/useAutoSave';
import { useBranding } from '@/lib/brandingContext';
import StatusBadge from '@/components/StatusBadge';
import SectionHeader from '@/components/SectionHeader';
import { ReportType, ReportStatus } from '@/types';
import { useNavigate } from 'react-router-dom';
import { cn, formatDateUK } from '@/lib/utils';
import type { Report } from '@/types';

/** Maps each report type to the autosave localStorage key used by its form. */
const REPORT_TYPE_TO_AUTOSAVE_KEY: Record<string, string> = {
  'Dynamic Risk Assessment': 'dra',
  'Incident Report': 'incident_report',
  'Accident / Incident Investigation': 'incident_investigation',
  'DSE Assessment': 'dse',
  'Lone Working Checklist': 'lone_working',
  'Manual Handling Assessment': 'manual_handling',
  'Construction Site Checklist': 'construction_site',
  'Audit': 'audit',
  'Monthly Site Safety Audit': 'audit',
  'H&S Audit Form': 'audit',
  'H&S Mini Audit': 'hs_mini_audit',
  'Fire Briefing': 'fire_briefing',
  'Fire Drill Report': 'fire_drill',
  'Fire Warden Checklist': 'fire_warden',
  'Monthly Premises Checklist': 'monthly_premises',
  'Six-Monthly Premises Checklist': 'six_monthly_premises',
  'Annual Premises Checklist': 'annual_premises',
  'Equipment Safety Inspection': 'equipment_inspection',
  'Pallet Racking Checklist': 'pallet_racking',
  'Permit to Work': 'permit_to_work',
  'Contractor Vetting 10-001': 'contractor_vetting_full',
  'Contractor Vetting 10-002': 'contractor_vetting_small',
  'Toolbox Talk': 'toolbox_talk',
  'Checklist': 'checklist',
  'Daily Site Safety Inspection': 'checklist',
  'Computer DSE Checklist': 'checklist',
  'Lone Worker Checklist': 'checklist',
  'Manual Handling Checklist': 'checklist',
  'General H&S Checklist': 'checklist',
};

/** Map a report type to its edit/new form route. Returns null if not editable inline. */
function getEditRoute(report: Report): string | null {
  const type = report.type;
  const tid = (report as any).templateId as string | undefined;
  const map: Record<string, string> = {
    'Dynamic Risk Assessment': '/risk-assessments/new',
    'Incident Report': '/incidents/new',
    'Accident / Incident Investigation': '/incidents/investigation/new',
    'DSE Assessment': '/risk-assessments/dse/new',
    'Lone Working Checklist': '/risk-assessments/lone-working/new',
    'Manual Handling Assessment': '/risk-assessments/manual-handling/new',
    'Construction Site Checklist': '/checklists/site-induction/new',
    'Audit': '/audits/new',
    'Monthly Site Safety Audit': '/audits/new?templateId=audit-monthly-safety',
    'H&S Audit Form': '/audits/new?templateId=audit-hs-form',
    'H&S Mini Audit': '/audits/mini-audit/new',
    'Fire Briefing': '/fire-safety/new',
    'Fire Drill Report': '/fire-safety/drill/new',
    'Fire Warden Checklist': '/fire-safety/warden-checklist/new',
    'Monthly Premises Checklist': '/premises-checks/5-001/new',
    'Six-Monthly Premises Checklist': '/premises-checks/5-002/new',
    'Annual Premises Checklist': '/premises-checks/5-003/new',
    'Equipment Safety Inspection': '/premises-checks/5-004/new',
    'Pallet Racking Checklist': '/premises-checks/5-017/new',
    'Permit to Work': '/permits/multi-general/new',
    'Contractor Vetting 10-001': '/contractors/10-001/new',
    'Contractor Vetting 10-002': '/contractors/10-002/new',
    'Toolbox Talk': '/toolbox-talks/new',
  };
  // Generic checklist types (from ChecklistForm) route via templateId
  const checklistTypes = new Set([
    'Checklist', 'Daily Site Safety Inspection', 'Computer DSE Checklist',
    'Lone Worker Checklist', 'Manual Handling Checklist', 'General H&S Checklist',
  ]);
  if (checklistTypes.has(type as string)) {
    return `/checklists/new${tid ? `?template=${tid}` : ''}`;
  }
  return map[type] ?? null;
}

export default function MyReports() {
  const navigate = useNavigate();
  const { branding } = useBranding();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('all');
  const { currentUser } = useAuth();
  const { reports } = useReports(currentUser);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; title: string } | null>(null);
  const [permDeleteTarget, setPermDeleteTarget] = React.useState<{ id: string; title: string } | null>(null);

  const handleSoftDelete = (id: string, title: string) => {
    setDeleteTarget({ id, title });
  };

  const handleEdit = (report: Report) => {
    const route = getEditRoute(report);
    if (route) {
      // Pre-populate the form's autosave slot with the saved report data so that
      // getAutoSavedData() in the form hydrates all fields correctly on mount.
      const autosaveKey = REPORT_TYPE_TO_AUTOSAVE_KEY[report.type] ??
        (report.type.includes('Checklist') || report.type.includes('Inspection') || report.type.includes('Assessment') ? 'checklist' : undefined);
      if (autosaveKey) {
        // Use report directly — it already has full form data from Supabase fetch
        preloadDraftForEdit(autosaveKey, report);
      }
      navigate(route, { state: { editId: report.id } });
    } else {
      navigate(`/share/${report.id}`);
    }
  };

  const handlePrint = (reportId: string) => {
    const win = window.open(`/share/${reportId}`, '_blank');
    if (win) {
      win.addEventListener('load', () => {
        win.focus();
        win.print();
      });
    }
  };

  const confirmSoftDelete = () => {
    if (!deleteTarget) return;
    softDeleteReport(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleRestore = (id: string) => {
    restoreReport(id);
  };

  const handlePermDelete = (id: string, title: string) => {
    setPermDeleteTarget({ id, title });
  };

  const confirmPermDelete = () => {
    if (!permDeleteTarget) return;
    permanentDeleteReport(permDeleteTarget.id);
    setPermDeleteTarget(null);
  };





  const filteredReports = reports.filter(report => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      report.title.toLowerCase().includes(q) ||
      report.location.toLowerCase().includes(q) ||
      report.type.toLowerCase().includes(q);
    if (activeTab === 'deleted') return matchesSearch && report.status === 'Deleted';
    if (activeTab === 'all') return matchesSearch && report.status !== 'Deleted';
    return matchesSearch && report.status.toLowerCase() === activeTab;
  });

  return (
    <TooltipProvider delayDuration={300}>
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <SectionHeader 
          title="My Reports" 
          icon={FileText} 
          description="Safety is the Key Ltd | Submission Tracking" 
          className="mb-0"
        />
        <Button 
          onClick={() => navigate('/dashboard')}
          className="w-full md:w-auto bg-sitk-black text-white hover:bg-slate-800 font-black uppercase text-[10px] tracking-[0.2em] py-6 px-8 shadow-lg"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Report
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by title or location..." 
            className="pl-12 py-6 bg-white border-none shadow-sm focus-visible:ring-sitk-yellow" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-auto py-3 px-6 font-black uppercase text-[10px] tracking-widest bg-white border-none shadow-sm">
              <ListFilter className="mr-2 h-4 w-4" />
              Filter Type
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="text-[10px] uppercase tracking-widest font-black">Filter by Type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs font-bold uppercase tracking-tight" onClick={() => setSearchQuery('Dynamic Risk Assessment')}>Dynamic Risk Assessment</DropdownMenuItem>
            <DropdownMenuItem className="text-xs font-bold uppercase tracking-tight" onClick={() => setSearchQuery('Incident Report')}>Incident Report</DropdownMenuItem>
            <DropdownMenuItem className="text-xs font-bold uppercase tracking-tight" onClick={() => setSearchQuery('Accident / Incident Investigation')}>Accident / Incident Investigation</DropdownMenuItem>
            <DropdownMenuItem className="text-xs font-bold uppercase tracking-tight" onClick={() => setSearchQuery('Checklist')}>Checklist</DropdownMenuItem>
            <DropdownMenuItem className="text-xs font-bold uppercase tracking-tight" onClick={() => setSearchQuery('Audit')}>Audit</DropdownMenuItem>
            <DropdownMenuItem className="text-xs font-bold uppercase tracking-tight" onClick={() => setSearchQuery('DSE Assessment')}>DSE Assessment</DropdownMenuItem>
            <DropdownMenuItem className="text-xs font-bold uppercase tracking-tight" onClick={() => setSearchQuery('Construction Site Checklist')}>Construction Site Checklist</DropdownMenuItem>
            <DropdownMenuItem className="text-xs font-bold uppercase tracking-tight" onClick={() => setSearchQuery('Contractor Vetting')}>Contractor Vetting</DropdownMenuItem>
            <DropdownMenuItem className="text-xs font-bold uppercase tracking-tight" onClick={() => setSearchQuery('Fire Briefing')}>Fire Briefing</DropdownMenuItem>
            <DropdownMenuItem className="text-xs font-bold uppercase tracking-tight" onClick={() => setSearchQuery('Fire Drill Report')}>Fire Drill Report</DropdownMenuItem>
            <DropdownMenuItem className="text-xs font-bold uppercase tracking-tight" onClick={() => setSearchQuery('Fire Warden Checklist')}>Fire Warden Checklist</DropdownMenuItem>
            <DropdownMenuItem className="text-xs font-bold uppercase tracking-tight" onClick={() => setSearchQuery('H&S Mini Audit')}>H&S Mini Audit</DropdownMenuItem>
            <DropdownMenuItem className="text-xs font-bold uppercase tracking-tight" onClick={() => setSearchQuery('Lone Working Checklist')}>Lone Working Checklist</DropdownMenuItem>
            <DropdownMenuItem className="text-xs font-bold uppercase tracking-tight" onClick={() => setSearchQuery('Manual Handling Assessment')}>Manual Handling Assessment</DropdownMenuItem>
            <DropdownMenuItem className="text-xs font-bold uppercase tracking-tight" onClick={() => setSearchQuery('Toolbox Talk')}>Toolbox Talk</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] uppercase tracking-widest font-black">Premises & Equipment</DropdownMenuLabel>
            <DropdownMenuItem className="text-xs font-bold uppercase tracking-tight" onClick={() => setSearchQuery('Monthly Premises Checklist')}>Monthly Premises Checklist</DropdownMenuItem>
            <DropdownMenuItem className="text-xs font-bold uppercase tracking-tight" onClick={() => setSearchQuery('Six-Monthly Premises Checklist')}>Six-Monthly Premises Checklist</DropdownMenuItem>
            <DropdownMenuItem className="text-xs font-bold uppercase tracking-tight" onClick={() => setSearchQuery('Annual Premises Checklist')}>Annual Premises Checklist</DropdownMenuItem>
            <DropdownMenuItem className="text-xs font-bold uppercase tracking-tight" onClick={() => setSearchQuery('Equipment Safety Inspection')}>Equipment Safety Inspection</DropdownMenuItem>
            <DropdownMenuItem className="text-xs font-bold uppercase tracking-tight" onClick={() => setSearchQuery('Pallet Racking Checklist')}>Pallet Racking Checklist</DropdownMenuItem>
            <DropdownMenuItem className="text-xs font-bold uppercase tracking-tight" onClick={() => setSearchQuery('Permit to Work')}>Permit to Work</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs font-bold uppercase tracking-tight text-red-500" onClick={() => setSearchQuery('')}>Clear Filter</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="bg-slate-200/50 p-1 rounded-xl w-fit flex-wrap gap-1">
          <TabsTrigger value="all" className="text-[10px] font-black uppercase tracking-widest px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">All</TabsTrigger>
          <TabsTrigger value="draft" className="text-[10px] font-black uppercase tracking-widest px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">Drafts</TabsTrigger>
          <TabsTrigger value="submitted" className="text-[10px] font-black uppercase tracking-widest px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">Submitted</TabsTrigger>
          <TabsTrigger value="completed" className="text-[10px] font-black uppercase tracking-widest px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">Completed</TabsTrigger>
          <TabsTrigger value="deleted" className="text-[10px] font-black uppercase tracking-widest px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-red-600">Deleted</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-8">
          {/* Desktop Table View */}
          <div className="hidden md:block border-none shadow-sm rounded-2xl overflow-hidden bg-white">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Title</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Type</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Location</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Date</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Status</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-bold text-slate-900 py-4">{report.title}</TableCell>
                    <TableCell className="text-[10px] font-black uppercase tracking-tight text-muted-foreground">{report.type}</TableCell>
                    <TableCell className="text-sm font-medium text-slate-600">{report.location}</TableCell>
                    <TableCell className="text-sm font-medium text-slate-600 font-mono">{formatDateUK(report.date)}</TableCell>
                    <TableCell>
                      <StatusBadge status={report.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {report.status === 'Deleted' ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg hover:bg-green-100 hover:text-green-700"
                              title="Restore"
                              onClick={() => handleRestore(report.id)}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg hover:bg-red-100 hover:text-red-600"
                              title="Delete permanently"
                              onClick={() => handlePermDelete(report.id, report.title)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-lg hover:bg-sitk-yellow/20 hover:text-sitk-black"
                                  onClick={() => navigate(`/share/${report.id}`)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View report</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-lg hover:bg-sitk-yellow/20 hover:text-sitk-black"
                                  onClick={() => exportSavedReportToPDF(report as any, branding)}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Download PDF</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-lg hover:bg-sitk-yellow/20 hover:text-sitk-black"
                                  onClick={() => handlePrint(report.id)}
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Print</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg hover:bg-sitk-yellow/20 hover:text-sitk-black"
                                  onClick={() => handleEdit(report)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit (new draft)</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg hover:bg-red-100 hover:text-red-600"
                                  onClick={() => handleSoftDelete(report.id, report.title)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete report</TooltipContent>
                            </Tooltip>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredReports.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-30">
                        <FileText className="w-8 h-8" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No reports found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredReports.map((report) => (
              <div key={report.id} className="p-5 border-none shadow-sm rounded-2xl bg-white space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h4 className="font-black uppercase tracking-tight text-slate-900 leading-tight">{report.title}</h4>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{report.type}</p>
                  </div>
                  <StatusBadge status={report.status} />
                </div>
                
                <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-50">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Location</p>
                    <p className="text-xs font-bold text-slate-700">{report.location}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</p>
                    <p className="text-xs font-bold text-slate-700 font-mono">{formatDateUK(report.date)}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {report.status === 'Deleted' ? (
                    <>
                      <Button
                        variant="outline"
                        className="flex-1 font-black uppercase text-[10px] tracking-widest py-5 rounded-xl border-slate-100 hover:bg-green-50 hover:text-green-700"
                        onClick={() => handleRestore(report.id)}
                      >
                        <RotateCcw className="mr-2 h-3 w-3" />
                        Restore
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 font-black uppercase text-[10px] tracking-widest py-5 rounded-xl border-red-100 text-red-600 hover:bg-red-50"
                        onClick={() => handlePermDelete(report.id, report.title)}
                      >
                        <Trash2 className="mr-2 h-3 w-3" />
                        Delete
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        className="flex-1 font-black uppercase text-[10px] tracking-widest py-5 rounded-xl border-slate-100"
                        onClick={() => navigate(`/share/${report.id}`)}
                      >
                        <Eye className="mr-2 h-3 w-3" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 font-black uppercase text-[10px] tracking-widest py-5 rounded-xl border-slate-100 hover:bg-sitk-yellow hover:border-sitk-yellow"
                        onClick={() => exportSavedReportToPDF(report as any, branding)}
                      >
                        <FileText className="mr-2 h-3 w-3" />
                        PDF
                      </Button>
                      <Button
                        variant="outline"
                        className="font-black uppercase text-[10px] tracking-widest py-5 px-4 rounded-xl border-red-100 text-red-500 hover:bg-red-50"
                        onClick={() => handleSoftDelete(report.id, report.title)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {filteredReports.length === 0 && (
              <div className="p-12 text-center bg-white rounded-2xl shadow-sm border-2 border-dashed border-slate-100">
                <div className="flex flex-col items-center gap-2 opacity-20">
                  <FileText className="w-10 h-10" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No reports found</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Soft Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <DialogTitle className="font-black uppercase tracking-tight">Delete Report?</DialogTitle>
            </div>
            <DialogDescription className="text-sm font-medium text-slate-600">
              <span className="font-bold text-slate-800">"{deleteTarget?.title}"</span> will be moved to the Deleted tab. You can restore it at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:flex-row flex-col">
            <Button
              variant="outline"
              className="flex-1 font-black uppercase text-[10px] tracking-widest rounded-xl border-slate-200"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] tracking-widest rounded-xl"
              onClick={confirmSoftDelete}
            >
              <Trash2 className="mr-2 h-3 w-3" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Confirmation */}
      <Dialog open={!!permDeleteTarget} onOpenChange={() => setPermDeleteTarget(null)}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <DialogTitle className="font-black uppercase tracking-tight text-red-700">Permanently Delete?</DialogTitle>
            </div>
            <DialogDescription className="text-sm font-medium text-slate-600">
              <span className="font-bold text-slate-800">"{permDeleteTarget?.title}"</span> will be <span className="font-bold text-red-600">permanently deleted</span> and cannot be recovered.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:flex-row flex-col">
            <Button
              variant="outline"
              className="flex-1 font-black uppercase text-[10px] tracking-widest rounded-xl border-slate-200"
              onClick={() => setPermDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-700 hover:bg-red-800 text-white font-black uppercase text-[10px] tracking-widest rounded-xl"
              onClick={confirmPermDelete}
            >
              <Trash2 className="mr-2 h-3 w-3" /> Delete Forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}
