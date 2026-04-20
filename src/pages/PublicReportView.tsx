import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  FileText, 
  Download,
  FileDown,
  Printer, 
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Info,
  User,
  MapPin,
  Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getReportById } from '@/lib/mockData';
import { exportToPDF, exportSavedReportToWord, printReport, makeReportFileName, formatDateUK } from '@/lib/exportUtils';
import { useBranding } from '@/lib/brandingContext';
import StatusBadge from '@/components/StatusBadge';
import SectionHeader from '@/components/SectionHeader';
import { getStoredPhotos, REPORT_TYPE_TO_PHOTO_KEY } from '@/lib/usePhotoStore';
import { motion } from 'framer-motion';

export default function PublicReportView() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { branding } = useBranding();
  const [report, setReport] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (reportId) {
      const data = getReportById(reportId);
      setReport(data);
    }
    setLoading(false);
  }, [reportId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-sitk-yellow border-t-sitk-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-2">Report Not Found</h1>
        <p className="text-slate-500 max-w-md mb-8">The report you are looking for might have been moved, deleted, or the link is incorrect.</p>
        <Button onClick={() => navigate('/')} className="bg-sitk-black text-white hover:bg-slate-800 font-black uppercase text-[10px] tracking-widest py-6 px-10 rounded-2xl shadow-xl">
          Return to Home
        </Button>
      </div>
    );
  }

  const fileName = makeReportFileName(report);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Public Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm export-hide">
        <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-sitk-black rounded-xl flex items-center justify-center shadow-lg shadow-sitk-black/20 overflow-hidden shrink-0">
              {branding.logoDataUrl ? (
                <img src={branding.logoDataUrl} alt={branding.companyName} className="w-full h-full object-contain p-1" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-sitk-yellow" />
              )}
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-tight text-slate-900 leading-none">{branding.companyName}</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-sitk-yellow mt-1">Safety Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => navigate('/my-reports')}
              className="hidden sm:flex font-black uppercase text-[10px] tracking-widest border-2 border-slate-100 rounded-xl hover:bg-slate-50 transition-all"
            >
              <ArrowLeft className="w-3 h-3 mr-2" /> Reports
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => exportToPDF('public-report-content', fileName, branding)}
              className="hidden sm:flex font-black uppercase text-[10px] tracking-widest border-2 border-slate-100 rounded-xl hover:bg-sitk-yellow hover:border-sitk-yellow transition-all"
            >
              <Download className="w-3 h-3 mr-2" /> PDF
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => exportSavedReportToWord(report, branding)}
              className="hidden sm:flex font-black uppercase text-[10px] tracking-widest border-2 border-slate-100 rounded-xl hover:bg-sitk-yellow hover:border-sitk-yellow transition-all"
            >
              <FileDown className="w-3 h-3 mr-2" /> Word
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={printReport}
              className="hidden sm:flex font-black uppercase text-[10px] tracking-widest border-2 border-slate-100 rounded-xl hover:bg-sitk-yellow hover:border-sitk-yellow transition-all"
            >
              <Printer className="w-3 h-3 mr-2" /> Print
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-8" id="public-report-content">

        {/* Report Content */}
        <div className="space-y-5">
          {/* Basic Details */}
          <Card className="border-none shadow-sm rounded-2xl overflow-hidden border-t-4 border-t-sitk-black">
            <CardContent className="p-6 space-y-5">
              <SectionHeader title="General Information" icon={Info} className="mb-0" />
              <div className="grid gap-5 grid-cols-2 md:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Location / Site</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-sitk-yellow shrink-0" />
                    <p className="text-sm font-bold text-slate-900 break-words">{report.location || '—'}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prepared By</p>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-sitk-yellow shrink-0" />
                    <p className="text-sm font-bold text-slate-900 break-words">{report.authorName || '—'}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</p>
                  <StatusBadge status={report.status} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Company</p>
                  <p className="text-sm font-bold text-slate-900 break-words">{branding.companyName}</p>
                </div>
              </div>
              {/* Executive Summary — manually entered by the assessor; replaces auto-generated description */}
              {(() => {
                const summary =
                  (report as any).executiveSummary ||
                  (report.data as any)?.executiveSummary ||
                  (report as any).overallComments ||
                  (report.data as any)?.overallComments || '';
                return summary ? (
                  <div className="space-y-1 pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Executive Summary</p>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{summary}</p>
                  </div>
                ) : null;
              })()}
            </CardContent>
          </Card>

          {/* Report Specific Content */}
          <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-6 space-y-5">
              <SectionHeader title="Report Details" icon={FileText} className="mb-0" />

              {/* Generic Data Display */}
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(
                  (typeof report.data === 'object' && report.data !== null && Object.keys(report.data).length > 0)
                    ? report.data
                    : report
                ).map(([key, value]) => {
                  const SKIP = new Set(['id','title','type','status','location','date','authorId','authorName','description','data','photos','executiveSummary','overallComments','sections','overallScore','maxPoints','actualPoints','rating']);
                  if (SKIP.has(key)) return null;
                  if (value === null || value === undefined || value === '') return null;

                  const label = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, s => s.toUpperCase())
                    .trim();

                  // Detect and format ISO date strings
                  const formatVal = (v: any): string => {
                    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
                    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) {
                      const p = v.split('T')[0].split('-');
                      return `${p[2]}/${p[1]}/${p[0]}`;
                    }
                    return String(v);
                  };

                  // Arrays → clean table
                  if (Array.isArray(value)) {
                    if (value.length === 0) return null;
                    const firstItem = value[0];
                    if (typeof firstItem === 'object' && firstItem !== null) {
                      const SKIP_COLS = new Set(['id', 'key', 'signature', 'note']);
                      const allHeaders = Object.keys(firstItem).filter(k => !SKIP_COLS.has(k));
                      if (allHeaders.length === 0) return null;
                      // Detect checklist pattern: question/item/label + answer columns
                      const qKey = allHeaders.find(h => ['question', 'item', 'label'].includes(h));
                      const ansH = allHeaders.includes('answer') ? 'answer' : allHeaders.includes('score') ? 'score' : null;
                      const hasQA = !!qKey && !!ansH;
                      const cmtH = allHeaders.includes('comment') ? 'comment' : allHeaders.includes('comments') ? 'comments' : allHeaders.includes('notes') ? 'notes' : null;
                      // Use ordered columns for checklist tables; all scalar columns otherwise
                      const headers = hasQA
                        ? [qKey!, ansH!, ...(cmtH ? [cmtH] : [])]
                        : allHeaders.filter(h => !Array.isArray(firstItem[h]) && typeof firstItem[h] !== 'object');
                      if (headers.length === 0) return null;
                      return (
                        <div key={key} className="md:col-span-2 rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                          <div className="overflow-x-auto">
                            <table className="w-full table-fixed text-left text-xs">
                              {hasQA && (
                                <colgroup>
                                  <col style={{ width: cmtH ? '55%' : '72%' }} />
                                  <col style={{ width: cmtH ? '15%' : '28%' }} />
                                  {cmtH && <col style={{ width: '30%' }} />}
                                </colgroup>
                              )}
                              <thead>
                                <tr className="border-b-2 border-slate-100 bg-slate-50">
                                  {headers.map(h => (
                                    <th key={h} className="py-2 px-3 font-black uppercase tracking-tight text-slate-500 text-[10px] text-left align-top">
                                      {h.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim()}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {value.map((item: any, i: number) => {
                                  // Pre-resolve values with note→answer promotion
                                  const answerRaw = hasQA && ansH ? (item[ansH] != null && item[ansH] !== '' ? formatVal(item[ansH]) : '') : '';
                                  const notesRaw  = hasQA && cmtH ? formatVal(item[cmtH] ?? '') : '';
                                  const resolveCell = (h: string): string => {
                                    if (hasQA && h === ansH) {
                                      return answerRaw || notesRaw || 'N/A'; // promote notes if answer empty
                                    }
                                    if (hasQA && h === cmtH && !answerRaw && notesRaw) {
                                      return ''; // value promoted to answer column
                                    }
                                    const raw = item[h];
                                    return raw != null && raw !== '' ? formatVal(raw) : '';
                                  };
                                  return (
                                    <tr key={i} className={`border-b border-slate-50 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                      {headers.map(h => {
                                        const isAnswerCol = hasQA && h === ansH;
                                        const cellVal = resolveCell(h);
                                        const lc = isAnswerCol ? cellVal.toLowerCase() : '';
                                        const badge = isAnswerCol
                                          ? lc === 'yes' || lc === '1' ? 'bg-green-100 text-green-700'
                                            : lc === 'no' || lc === '0' ? 'bg-red-100 text-red-700'
                                            : 'bg-slate-100 text-slate-600'
                                          : null;
                                        return (
                                          <td key={h} className="py-2 px-3 align-top font-medium text-slate-700 leading-snug break-words min-w-0">
                                            {badge
                                              ? <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${badge}`}>{cellVal}</span>
                                              : cellVal || '—'}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    }
                    // Simple array of strings
                    return (
                      <div key={key} className="md:col-span-2 space-y-2 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <ul className="space-y-1">
                          {value.map((item: any, i: number) => (
                            <li key={i} className="text-sm font-medium text-slate-700 flex items-start gap-2">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sitk-yellow flex-shrink-0" />
                              {formatVal(item)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  }

                  // Objects → key/value chips
                  if (typeof value === 'object') {
                    const entries = Object.entries(value as object).filter(([, v]) => v !== null && v !== undefined && v !== '');
                    if (entries.length === 0) return null;
                    return (
                      <div key={key} className="space-y-2 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex flex-wrap gap-2">
                          {entries.map(([k, v]) => (
                            <div key={k} className="px-3 py-1.5 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-600 border border-slate-100">
                              {k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim()}
                              {': '}{formatVal(v)}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  // Scalar
                  return (
                    <div key={key} className="space-y-1 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                      <p className="text-sm font-bold text-slate-900 leading-snug break-words">{formatVal(value)}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Dedicated Sections Renderer (Audit / HSMiniAudit) */}
          {(() => {
            const bodyData: any = (typeof report.data === 'object' && report.data !== null && Object.keys(report.data).length > 0) ? report.data : report;
            const rawSections: any[] = Array.isArray(bodyData.sections) ? bodyData.sections : [];
            if (rawSections.length === 0) return null;
            return (
              <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-6 space-y-6">
                  {rawSections.map((section: any, sIdx: number) => {
                    const sectionTitle: string = String(section.title || `Section ${sIdx + 1}`);
                    const items: any[] = Array.isArray(section.items) ? section.items
                      : Array.isArray(section.questions) ? section.questions : [];
                    if (items.length === 0) return null;
                    const firstItem = items[0];
                    const answerKey = 'answer' in firstItem ? 'answer' : 'score' in firstItem ? 'score' : null;
                    const commentKey = 'comment' in firstItem ? 'comment' : 'comments' in firstItem ? 'comments' : 'notes' in firstItem ? 'notes' : null;
                    return (
                      <div key={section.id ?? sIdx} className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-5 bg-sitk-yellow rounded-full shrink-0" />
                          <h4 className="text-sm font-black uppercase tracking-tight text-slate-800">{sectionTitle}</h4>
                        </div>
                        <div className="rounded-xl border border-slate-100 overflow-hidden">
                          <table className="w-full table-fixed text-left text-xs">
                            <colgroup>
                              <col style={{ width: commentKey ? '55%' : '70%' }} />
                              {answerKey && <col style={{ width: commentKey ? '15%' : '30%' }} />}
                              {commentKey && <col style={{ width: '30%' }} />}
                            </colgroup>
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="py-2 px-3 font-black uppercase tracking-tight text-slate-500 text-[10px] text-left">Question</th>
                                {answerKey && <th className="py-2 px-3 font-black uppercase tracking-tight text-slate-500 text-[10px] text-left">Answer</th>}
                                {commentKey && <th className="py-2 px-3 font-black uppercase tracking-tight text-slate-500 text-[10px] text-left">Notes</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((item: any, i: number) => {
                                // Answer: empty string is treated the same as null/undefined → N/A
                                const rawAns = answerKey ? item[answerKey] : undefined;
                                const answerVal = answerKey
                                  ? (rawAns != null && rawAns !== '' ? String(rawAns) : 'N/A')
                                  : null;
                                const lc = (answerVal || '').toLowerCase();
                                const answerColor = lc === 'yes' || lc === '1' ? 'bg-green-100 text-green-700'
                                  : lc === 'no' || lc === '0' ? 'bg-red-100 text-red-700'
                                  : 'bg-slate-100 text-slate-600';
                                const isShortAnswer = !answerVal || answerVal.length <= 6;
                                return (
                                  <tr key={item.id ?? i} className={`border-b border-slate-50 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                                    <td className="py-2.5 px-3 font-medium text-slate-700 leading-snug break-words min-w-0 align-top">{item.question ?? item.label ?? '—'}</td>
                                    {answerKey && (
                                      <td className="py-2.5 px-3 align-top min-w-0">
                                        {isShortAnswer
                                          ? <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${answerColor}`}>{answerVal}</span>
                                          : <span className={`block break-words leading-snug font-semibold ${answerColor.includes('green') ? 'text-green-700' : answerColor.includes('red') ? 'text-red-700' : 'text-slate-700'}`}>{answerVal}</span>
                                        }
                                      </td>
                                    )}
                                    {commentKey && <td className="py-2.5 px-3 text-slate-500 leading-snug break-words min-w-0 align-top">{String(item[commentKey] || '—')}</td>}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })()}

          {/* Photos Section */}
          {(() => {
            const photoKey = REPORT_TYPE_TO_PHOTO_KEY[report.type] ?? '';
            const storedPhotos = photoKey ? getStoredPhotos(photoKey) : [];
            const reportPhotos = (report.photos as any[] | undefined) ?? storedPhotos;
            if (!reportPhotos || reportPhotos.length === 0) return null;
            return (
              <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-6 space-y-5">
                  <SectionHeader title="Photos" icon={Camera} className="mb-0" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {reportPhotos.map((photo: any) => (
                      <div key={photo.id} className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                        <img src={photo.dataUrl} alt={photo.caption || 'Photo'} className="w-full aspect-[4/3] object-cover" />
                        {photo.caption && (
                          <div className="p-2 bg-white">
                            <p className="text-[10px] font-medium text-slate-600">{photo.caption}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Footer */}
          <div className="pt-10 border-t border-slate-100 space-y-1 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{branding.companyName}</p>
            <p className="text-[10px] font-medium text-slate-400">
              {[branding.address, branding.phone, branding.email, branding.website].filter(Boolean).join('  ·  ')}
            </p>
            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em] pt-1">© {new Date().getFullYear()} {branding.companyName} · All Rights Reserved</p>
          </div>
        </div>
      </main>

      {/* Mobile Actions */}
      <div className="fixed bottom-6 left-4 right-4 sm:hidden export-hide">
        <div className="bg-sitk-black rounded-2xl p-2 flex gap-2 shadow-2xl">
          <Button 
            className="flex-1 bg-sitk-yellow text-sitk-black hover:bg-sitk-yellow/90 font-black uppercase text-[10px] tracking-widest py-6 rounded-xl"
            onClick={() => exportToPDF('public-report-content', fileName, branding)}
          >
            <Download className="w-4 h-4 mr-2" /> PDF
          </Button>
          <Button 
            className="flex-1 bg-white/10 text-white hover:bg-white/20 font-black uppercase text-[10px] tracking-widest py-6 rounded-xl"
            onClick={() => exportSavedReportToWord(report, branding)}
          >
            <FileDown className="w-4 h-4 mr-2" /> Word
          </Button>
          <Button 
            className="flex-1 bg-white/10 text-white hover:bg-white/20 font-black uppercase text-[10px] tracking-widest py-6 rounded-xl"
            onClick={printReport}
          >
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
        </div>
      </div>
    </div>
  );
}
