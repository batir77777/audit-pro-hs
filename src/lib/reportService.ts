// Stage 2A - build trigger
import { supabase } from './supabase';
import { Report } from '../types';

/**
 * Step 7: Supabase Report Service.
 * - mergeSupabaseReportsToLocal() added: fetches reports from Supabase on
 *   mount and merges them into localStorage so Dashboard/MyReports always
 *   show current data across devices and users.
 * - localStorage remains source of truth for reads/writes/exports.
 * - All errors are swallowed so existing behaviour is never broken.
 */

const STORAGE_KEY = 'sitk_reports';

function stripPhotos(report: Report): Report {
          if (!report.photos || report.photos.length === 0) return report;
          return { ...report, photos: report.photos.map(p => ({ ...p, dataUrl: '' })) };
}

/** Fetch the current user's organisation_id from their profile. */
async function getMyOrgId(): Promise<string | null> {
          try {
                      const { data: { session } } = await supabase.auth.getSession();
                      if (!session) return null;
                      const { data } = await supabase
                        .from('profiles')
                        .select('organisation_id')
                        .eq('id', session.user.id)
                        .single();
                      return data?.organisation_id ?? null;
          } catch {
                      return null;
          }
}

function toSupabasePayload(report: Report, organisationId: string | null) {
          const { id, title, type, status, location, date, authorId, description, photos, ...rest } = report as any;
          const reportRow: Record<string, any> = {
                      id,
                      title,
                      type: type || null,
                      status,
                      location: location || null,
                      date: date || null,
                      created_by: authorId || null,
                      description: description || null,
          };
          if (organisationId) {
                      reportRow.organisation_id = organisationId;
          }
          const formPayload = {
                      ...rest,
                      photos: photos ? photos.map((p: any) => ({ ...p, dataUrl: '' })) : [],
          };
          return { reportRow, formPayload };
}

export async function syncReportToSupabase(report: Report): Promise<{ ok: boolean; error?: string }> {
    console.log('[syncReport] FUNCTION CALLED');
    console.log('[syncReport] Starting sync for report:', report.id, 'authorId:', report.authorId);
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            console.warn('[syncReport] No active session - skipping sync');
            return { ok: false, error: 'no_session' };
        }
        const authUid = session.user.id;
        if (!authUid) { throw new Error('No authenticated user id - cannot satisfy RLS created_by = auth.uid()'); }
        console.log('[syncReport] Session OK. auth.uid():', authUid);
        const orgId = await getMyOrgId();
        console.log('[syncReport] orgId:', orgId);
        const { reportRow, formPayload } = toSupabasePayload(stripPhotos(report), orgId);
        reportRow.created_by = authUid;
        if (!reportRow.id) { console.error('[syncReport] MISSING report id — upsert will fail'); return { ok: false, error: 'missing_id' }; }
        console.log('[syncReport] reportRow keys:', Object.keys(reportRow).join(', '));
        console.log('[syncReport] reportRow values:', JSON.stringify(reportRow));
        console.log('[syncReport] >>> Calling supabase reports upsert...');
        const { data: rData, error: reportError } = await supabase
        .from('reports').upsert(reportRow, { onConflict: 'id' }).select('id');
        console.log('[syncReport] reports upsert returned — error:', JSON.stringify(reportError), 'data:', JSON.stringify(rData));
        if (reportError) {
            console.error('[syncReport] REPORTS UPSERT FAILED code:', reportError.code, 'msg:', reportError.message, 'detail:', reportError.details, 'hint:', (reportError as any).hint);
            throw new Error('reports upsert: ' + reportError.message + ' (code: ' + reportError.code + ')');
        }
        console.log('[syncReport] reports upsert OK:', JSON.stringify(rData));
        console.log('[syncReport] >>> Calling supabase report_data upsert...');
        const { data: rdData, error: dataError } = await supabase
        .from('report_data').upsert({ report_id: reportRow.id, data: formPayload }, { onConflict: 'report_id' }).select('report_id');
        console.log('[syncReport] report_data upsert returned — error:', JSON.stringify(dataError), 'data:', JSON.stringify(rdData));
        if (dataError) {
            console.error('[syncReport] REPORT_DATA UPSERT FAILED code:', dataError.code, 'msg:', dataError.message, 'hint:', (dataError as any).hint);
            throw new Error('report_data upsert: ' + dataError.message + ' (code: ' + dataError.code + ')');
        }
        console.log('[syncReport] SUCCESS synced to Supabase:', reportRow.id);
        return { ok: true };
    } catch (err: any) {
        console.error('[syncReport] CAUGHT ERROR — message:', err?.message, 'full:', JSON.stringify(err));
        return { ok: false, error: err?.message ?? 'unknown error' };
    }
}

export async function fetchReportsFromSupabase(userId: string): Promise<Report[]> {
          try {
                      const { data: { session } } = await supabase.auth.getSession();
                      if (!session) return [];
                      const SELECT_COLS = 'id, title, type, status, location, date, description, created_by, report_data(data)';
                      console.log('[fetchReports] using select:', SELECT_COLS);
                      const { data, error } = await supabase
                        .from('reports')
                        .select(SELECT_COLS)
                        .eq('created_by', userId)
                        .order('updated_at', { ascending: false })
                      if (error) { console.warn('[reportService] fetch:', error.message); return []; }
                      return (data || []).map((row: any) => {
                                    const formData = row.report_data?.[0]?.data || {};
                                    return {
                                                    id: row.id,
                                                    title: row.title,
                                                    type: row.type,
                                                    status: row.status,
                                                    location: row.location || '',
                                                    date: row.date || '',
                                                    authorId: row.created_by || '',
                                                    description: row.description || '',
                                                    ...formData,
                                    } as Report;
                      });
          } catch (err) {
                      console.warn('[reportService] fetch error (non-fatal):', err);
                      return [];
          }
}

/**
 * Step 7: Fetch reports from Supabase and merge into localStorage.
 * Called on mount in Dashboard and MyReports.
 * - Server records are upserted into the local store (server wins on conflict).
 * - Photos and savedAt from local records are preserved.
 * - Dispatches 'reportsUpdated' so components refresh automatically.
 * - Completely silent on error ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ localStorage data is always preserved.
 */
/**
 * @deprecated No longer called from Dashboard or MyReports.
 * Kept for backward compatibility during Stage 2A transition.
 * Will be removed in a subsequent cleanup pass.
 */
export async function mergeSupabaseReportsToLocal(): Promise<void> {
          try {
                      const { data: { session: mergeSession } } = await supabase.auth.getSession();
                      if (!mergeSession) return;
                      const serverReports = await fetchReportsFromSupabase(mergeSession.user.id);
                      if (serverReports.length === 0) return;
                      const raw = localStorage.getItem(STORAGE_KEY);
                      const local: Report[] = raw ? JSON.parse(raw) : [];
                      const localMap = new Map(local.map(r => [r.id, r]));
                      for (const serverReport of serverReports) {
                                    const existing = localMap.get(serverReport.id);
                                    if (existing) {
                                                    localMap.set(serverReport.id, {
                                                                      ...serverReport,
                                                                      photos: (existing as any).photos || [],
                                                                      savedAt: (existing as any).savedAt || serverReport.date,
                                                    } as any);
                                    } else {
                                                    localMap.set(serverReport.id, serverReport);
                                    }
                      }
                      const merged = Array.from(localMap.values());
                      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
                      window.dispatchEvent(new Event('reportsUpdated'));
                      console.log('[reportService] Merged', serverReports.length, 'reports from Supabase');
          } catch (err) {
                      console.warn('[reportService] mergeSupabaseReportsToLocal error (non-fatal):', err);
          }
}

export async function softDeleteReportInSupabase(id: string): Promise<void> {
          try {
                      const { data: { session } } = await supabase.auth.getSession();
                      if (!session) return;
                      await supabase.from('reports').update({ status: 'Deleted' }).eq('id', id);
          } catch (err) {
                      console.warn('[reportService] softDelete error (non-fatal):', err);
          }
}
