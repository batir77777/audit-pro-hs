import { User, Company, Report, Activity } from '../types';
import { getCurrentUserId, getSession } from './auth';
import { syncReportToSupabase } from './reportService';

export const mockUser: User = {
  id: 'u1',
  name: 'Shabbir Smith',
  email: 'shabbir.smith@example.co.uk',
  role: 'Site Manager',
  companyId: 'c1',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Shabbir'
};

export const mockCompany: Company = {
  id: 'c1',
  name: 'Safety is the Key Ltd',
  address: '2 Palace Green, Croydon, CR0 9AG'
};

export const mockReports: Report[] = [
  {
    id: 'r1',
    title: 'Site Perimeter Check',
    type: 'Checklist',
    status: 'Completed',
    location: 'Manchester Site A',
    date: '2024-03-15',
    authorId: 'u1',
    description: 'Daily perimeter security and safety check.'
  },
  {
    id: 'r2',
    title: 'Excavation Risk Assessment',
    type: 'Dynamic Risk Assessment',
    status: 'Submitted',
    location: 'London Bridge Project',
    date: '2024-03-14',
    authorId: 'u1',
    description: 'Risk assessment for new trenching works.'
  },
  {
    id: 'r3',
    title: 'Trip Hazard Incident',
    type: 'Incident Report',
    status: 'Draft',
    location: 'Manchester Site A',
    date: '2024-03-16',
    authorId: 'u1',
    description: 'Minor trip hazard identified near site entrance.'
  },
  {
    id: 'r4',
    title: 'Monthly Safety Audit',
    type: 'Audit',
    status: 'Completed',
    location: 'Birmingham Hub',
    date: '2024-03-01',
    authorId: 'u1',
    description: 'Full site safety and compliance audit.'
  },
  {
    id: 'r5',
    title: 'PPE Compliance Check',
    type: 'Checklist',
    status: 'Submitted',
    location: 'London Bridge Project',
    date: '2024-03-15',
    authorId: 'u1'
  },
  {
    id: 'r6',
    title: 'Permit to Work - Hot Works - 2024-03-17',
    type: 'Permit to Work',
    status: 'Draft',
    location: 'Manchester Site A',
    date: '2024-03-17',
    authorId: 'u1',
    description: 'Hot works permit for welding in basement area.'
  }
];

export const mockActivities: Activity[] = [];

/** Derive relative timestamp from an ISO date string. */
function relativeTime(isoDate: string): string {
  const saved = new Date(isoDate);
  if (isNaN(saved.getTime())) return 'recently';
  const diffMs = Date.now() - saved.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1)   return 'just now';
  if (diffMins < 60)  return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24)   return `${diffHrs} hour${diffHrs === 1 ? '' : 's'} ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 30)  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  const diffWks = Math.floor(diffDays / 7);
  if (diffWks < 8)    return `${diffWks} week${diffWks === 1 ? '' : 's'} ago`;
  return saved.toLocaleDateString('en-GB');
}

/** Map report status to a human-readable action verb. */
function statusToAction(status: Report['status']): string {
  if (status === 'Completed') return 'completed';
  if (status === 'Submitted') return 'submitted';
  return 'created draft';
}

/**
 * Returns the most recent activity entries derived from stored reports for the current user.
 * Sorted newest first, capped at `limit` entries.
 */
export function getRecentActivity(limit = 5): Activity[] {
  const reports = getStoredReports().filter(r => r.status !== 'Deleted');
  // Sort by savedAt > date — most recently touched first
  const sorted = [...reports].sort((a, b) => {
    const ta = (a as any).savedAt || a.date || '';
    const tb = (b as any).savedAt || b.date || '';
    return tb.localeCompare(ta);
  });
  return sorted.slice(0, limit).map(r => ({
    id: r.id,
    userId: r.authorId,
    userName: r.authorName || 'Unknown',
    action: statusToAction(r.status),
    target: r.title,
    timestamp: relativeTime((r as any).savedAt || r.date || ''),
  }));
}

// Helper to manage reports in localStorage for demo purposes
const STORAGE_KEY = 'sitk_reports';

/** Resolve the correct full type name from a templateId (for legacy records saved with generic 'Audit'/'Checklist' type). */
const TEMPLATE_ID_TO_TYPE: Record<string, string> = {
  'audit-hs-form':        'H&S Audit Form',
  'audit-monthly-safety': 'Monthly Site Safety Audit',
  'temp-site-safety':     'Daily Site Safety Inspection',
  'temp-dse-checklist':   'Computer DSE Checklist',
  'temp-lone-worker':     'Lone Worker Checklist',
  'temp-manual-handling': 'Manual Handling Checklist',
  'temp-general-hs':      'General H&S Checklist',
  'temp-construction-site': 'Construction Site Checklist',
};

/** Migrate a single report loaded from localStorage, fixing known data-quality issues. */
function sanitizeReport(r: Report): Report {
  let { title, type } = r;
  const templateId = (r as any).templateId as string | undefined;

  // 1. Resolve generic 'Audit'/'Checklist' type via stored templateId
  if ((type === 'Audit' || type === 'Checklist') && templateId && TEMPLATE_ID_TO_TYPE[templateId]) {
    type = TEMPLATE_ID_TO_TYPE[templateId] as Report['type'];
  }

  // 2. Fix "undefined" title — rebuild from type + date
  const titleLower = String(title || '').toLowerCase().trim();
  if (!title || titleLower.startsWith('undefined') || titleLower === 'null') {
    title = `${type} - ${r.date || ''}`.replace(/\s*-\s*$/, '');
  }

  if (type !== r.type || title !== r.title) {
    return { ...r, type, title };
  }
  return r;
}

const MIGRATION_VERSION_KEY = 'sitk_reports_migration_v1';

/** All reports stored — regardless of user. */
const getAllStoredReports = (): Report[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const raw: Report[] = stored ? JSON.parse(stored) : mockReports;
    const sanitized = raw.map(sanitizeReport);

    // One-time migration: persist sanitized data back so fixes survive a hard reload.
    if (!localStorage.getItem(MIGRATION_VERSION_KEY)) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
        localStorage.setItem(MIGRATION_VERSION_KEY, '1');
      } catch { /* quota — skip write-back */ }
    }

    return sanitized;
  } catch {
    return mockReports;
  }
};

/** Reports belonging to the currently logged-in user only. */
export const getStoredReports = (): Report[] => {
  const userId = getCurrentUserId();
  if (!userId) return [];
  return getAllStoredReports().filter(r => r.authorId === userId);
};

export const saveReport = (report: Report) => {
  // Always stamp the report with the real current user's id and name
  const session = getSession();
  const reportToSave: Report = sanitizeReport(session
    ? { ...report, authorId: session.id, authorName: session.name, savedAt: new Date().toISOString() }
    : { ...report, savedAt: new Date().toISOString() }) as any;

  const all = getAllStoredReports();
  const index = all.findIndex(r => r.id === reportToSave.id);
  const updated = index >= 0
    ? all.map((r, i) => i === index ? reportToSave : r)
    : [reportToSave, ...all];

  const persist = (data: Report[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('reportsUpdated'));
  };

  try {
    persist(updated);
    console.log('[saveReport] Saved successfully:', reportToSave.id);
        syncReportToSupabase(reportToSave).then((r) => { if (r.ok) { console.log('[saveReport] Supabase sync OK:', reportToSave.id); } else { console.error('[saveReport] Supabase sync FAILED:', reportToSave.id, r.error); } }).catch((e) => { console.error('[saveReport] Supabase sync threw:', e); });
  } catch {
    // Quota exceeded — retry without embedded photos in all reports
    console.warn('[saveReport] Storage quota exceeded — retrying without photos');
    try {
      const stripped = updated.map(r => ({ ...r, photos: [] }));
      persist(stripped);
      console.log('[saveReport] Saved without photos due to storage limit');
    } catch (e2) {
      // Still failing — save only the current report as last resort
      console.error('[saveReport] Critical storage failure, attempting minimal save:', e2);
      try {
        persist([{ ...reportToSave, photos: [] }]);
      } catch {
        // Cannot save at all — do not throw, just log, so the form doesn't freeze
        console.error('[saveReport] Unable to write to localStorage. Storage may be full.');
      }
    }
  }
};

export const getReportById = (id: string): Report | undefined => {
  return getAllStoredReports().find(r => r.id === id);
};

export const softDeleteReport = (id: string) => {
  const all = getAllStoredReports();
  const updated = all.map(r =>
    r.id === id ? { ...r, status: 'Deleted' as Report['status'], _prevStatus: r.status } : r
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('reportsUpdated'));
};

export const restoreReport = (id: string) => {
  const all = getAllStoredReports();
  const updated = all.map(r => {
    if (r.id !== id) return r;
    const prev = (r as any)._prevStatus as Report['status'] | undefined;
    const { _prevStatus, ...rest } = r as any;
    return { ...rest, status: prev || 'Draft' };
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('reportsUpdated'));
};

export const permanentDeleteReport = (id: string) => {
  const all = getAllStoredReports();
  const updated = all.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('reportsUpdated'));
};
