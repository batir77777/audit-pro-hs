import { useState, useEffect, useCallback } from 'react';
import { AuthUser } from './auth';
import { Report } from '../types';
import { fetchReportsFromSupabase } from './reportService';
import { getStoredReports } from './mockData';

const STORAGE_KEY = 'sitk_reports';

export interface UseReportsResult {
  reports: Report[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * useReports - Stage 2A: Supabase-first report loading hook.
 *
 * Behaviour:
 *  1. If currentUser is null, returns empty reports immediately (no fetch).
 *  2. Seeds state from localStorage cache immediately so reports appear
 *     instantly on page load (no flash of empty state while fetching).
 *  3. Once currentUser is defined, fetches from Supabase with explicit
 *     created_by = userId filter (in addition to RLS).
 *  4. On success with >0 rows: updates state AND writes into sitk_reports
 *     localStorage cache so getReportById() and offline reads remain functional.
 *  5. On success with 0 rows: does NOT wipe local cache. Keeps showing
 *     cached reports. This handles the case where old reports were never
 *     synced to Supabase (localStorage-only legacy data).
 *  6. On failure: falls back to getStoredReports() from localStorage cache.
 *  7. Listens for reportsUpdated event from saveReport() for same-device refresh.
 *  8. Re-fetches when currentUser changes (fixes the auth race on a fresh device).
 */
export function useReports(currentUser: AuthUser | null): UseReportsResult {
  const [reports, setReports] = useState<Report[]>(() => {
    // Seed immediately from localStorage so there is no flash of empty state.
    // This is replaced by Supabase data once the fetch completes.
    if (!currentUser) return [];
    return getStoredReports();
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAndSet = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const serverReports = await fetchReportsFromSupabase(userId, currentUser?.role ?? '');

      if (serverReports.length > 0) {
        // Server returned real data — trust it and update cache.
        setReports(serverReports);
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          const local: Report[] = raw ? JSON.parse(raw) : [];
          const localMap = new Map(local.map((r: Report) => [r.id, r]));
          for (const sr of serverReports) {
            const existing = localMap.get(sr.id);
            localMap.set(sr.id, existing
              ? { ...sr, photos: (existing as any).photos || [], savedAt: (existing as any).savedAt || sr.date } as any
              : sr
            );
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(localMap.values())));
        } catch {
          // Cache write failure is non-fatal
        }
      } else {
        // Supabase returned 0 rows. This could mean:
        //   a) The user genuinely has no reports yet (new account), or
        //   b) Old reports exist only in localStorage (legacy, pre-Supabase data).
        // Safe fallback: show localStorage cache. If cache is also empty, show empty.
        const cached = getStoredReports();
        setReports(cached);
        console.log('[useReports] Supabase returned 0 rows — showing localStorage cache (' + cached.length + ' reports). Old reports may not yet be synced to Supabase.');
      }
    } catch (err: any) {
      console.warn('[useReports] Supabase fetch failed, falling back to localStorage cache:', err);
      setError(err?.message ?? 'Failed to load reports from server');
      setReports(getStoredReports());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setReports([]);
      setLoading(false);
      setError(null);
      return;
    }
    fetchAndSet(currentUser.id);
    const handleUpdate = () => { fetchAndSet(currentUser.id); };
    window.addEventListener('reportsUpdated', handleUpdate);
    return () => window.removeEventListener('reportsUpdated', handleUpdate);
  }, [currentUser, fetchAndSet]);

  const reload = useCallback(() => {
    if (currentUser) fetchAndSet(currentUser.id);
  }, [currentUser, fetchAndSet]);

  return { reports, loading, error, reload };
}
