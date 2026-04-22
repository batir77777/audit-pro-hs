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
 *  2. Once currentUser is defined, fetches from Supabase with explicit
 *     created_by = userId filter (in addition to RLS).
 *  3. On success: updates state AND writes into sitk_reports localStorage cache
 *     so getReportById() and offline reads remain functional.
 *  4. On failure: falls back to getStoredReports() from localStorage cache.
 *  5. Listens for reportsUpdated event from saveReport() for same-device refresh.
 *  6. Re-fetches when currentUser changes (fixes the auth race on a fresh device).
 */
export function useReports(currentUser: AuthUser | null): UseReportsResult {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAndSet = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const serverReports = await fetchReportsFromSupabase(userId);
      setReports(serverReports);
      // Write into localStorage cache so exports and getReportById() stay functional.
      // Server wins on conflict; local photos/savedAt are preserved.
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
