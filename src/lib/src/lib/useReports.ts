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
         * useReports — Stage 2A: Supabase-first report loading hook.
          *
           * Behaviour:
            *  1. If currentUser is null, returns empty reports with loading=false immediately.
             *     This prevents any fetch before auth has resolved.
              *  2. Once currentUser is defined, fetches from Supabase using the user's id
               *     as an explicit filter (created_by = userId), in addition to RLS.
                *  3. On success: updates React state AND writes the result into the
                 *     sitk_reports localStorage cache so getReportById() and offline reads
                  *     continue to work for exports and edit pre-population.
                   *  4. On failure: falls back to getStoredReports() from the localStorage cache
                    *     and surfaces the error so the caller can inform the user if needed.
                     *  5. Listens for the 'reportsUpdated' window event dispatched after a
                      *     saveReport() call so same-device saves refresh the list immediately.
                       *  6. Re-fetches whenever currentUser changes (handles login on a new device
                        *     where currentUser starts as null and resolves after auth restores).
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

                                                               // Write into localStorage cache so exports / getReportById() stay functional.
                                                                     // We merge: server reports win on conflict, but local-only records (e.g. not yet
                                                                           // synced) are preserved until Stage 2B when saveReport becomes Supabase-first.
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
                                                                                                                                                                                                                                 // Fallback: read from localStorage cache
                                                                                                                                                                                                                                       const cached = getStoredReports();
                                                                                                                                                                                                                                             setReports(cached);
                                                                                                                                                                                                                                                 } finally {
                                                                                                                                                                                                                                                       setLoading(false);
                                                                                                                                                                                                                                                           }
                                                                                                                                                                                                                                                             }, []);

                                                                                                                                                                                                                                                               useEffect(() => {
                                                                                                                                                                                                                                                                   if (!currentUser) {
                                                                                                                                                                                                                                                                         // Auth not resolved yet or user logged out - clear and wait
                                                                                                                                                                                                                                                                               setReports([]);
                                                                                                                                                                                                                                                                                     setLoading(false);
                                                                                                                                                                                                                                                                                           setError(null);
                                                                                                                                                                                                                                                                                                 return;
                                                                                                                                                                                                                                                                                                     }

                                                                                                                                                                                                                                                                                                         // Auth is ready - fetch from Supabase
                                                                                                                                                                                                                                                                                                             fetchAndSet(currentUser.id);

                                                                                                                                                                                                                                                                                                                 // Listen for same-device save events (dispatched by saveReport in mockData.ts)
                                                                                                                                                                                                                                                                                                                     const handleUpdate = () => {
                                                                                                                                                                                                                                                                                                                           fetchAndSet(currentUser.id);
                                                                                                                                                                                                                                                                                                                               };
                                                                                                                                                                                                                                                                                                                                   window.addEventListener('reportsUpdated', handleUpdate);
                                                                                                                                                                                                                                                                                                                                       return () => window.removeEventListener('reportsUpdated', handleUpdate);
                                                                                                                                                                                                                                                                                                                                         }, [currentUser, fetchAndSet]);

                                                                                                                                                                                                                                                                                                                                           const reload = useCallback(() => {
                                                                                                                                                                                                                                                                                                                                               if (currentUser) {
                                                                                                                                                                                                                                                                                                                                                     fetchAndSet(currentUser.id);
                                                                                                                                                                                                                                                                                                                                                         }
                                                                                                                                                                                                                                                                                                                                                           }, [currentUser, fetchAndSet]);

                                                                                                                                                                                                                                                                                                                                                             return { reports, loading, error, reload };
                                                                                                                                                                                                                                                                                                                                                             }
                                                                                                                                                                                                                                                                                                                                                             