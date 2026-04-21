import { supabase } from './supabase';
import { Report } from '../types';

/**
 * Step 6: Updated Supabase Report Service.
 * - organisation_id now included in report sync (from user profile)
 * - column names aligned with actual DB schema
 * localStorage remains source of truth. Supabase syncs silently alongside.
 * All errors are swallowed so existing behaviour is never broken.
 */

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

export async function syncReportToSupabase(report: Report): Promise<void> {
        try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) return;

            const orgId = await getMyOrgId();
                    const { reportRow, formPayload } = toSupabasePayload(stripPhotos(report), orgId);

            const { error: reportError } = await supabase
                        .from('reports')
                        .upsert(reportRow, { onConflict: 'id' });
                    if (reportError) {
            console.warn('[reportService] upsert report:', reportError.message);
                                    return;
                    }

            const { error: dataError } = await supabase
                        .from('report_data')
                        .upsert({ report_id: reportRow.id, form_data: formPayload }, { onConflict: 'report_id' });
                    if (dataError) {
                                    console.warn('[reportService] upsert report_data:', dataError.message);
                                    return;
                    }

            console.log('[reportService] Synced to Supabase:', reportRow.id);
        } catch (err) {
                    console.warn('[reportService] sync error (non-fatal):', err);
        }
}

export async function fetchReportsFromSupabase(): Promise<Report[]> {
        try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) return [];

            const { data, error } = await supabase
                        .from('reports')
                        .select('id, title, type, status, location, date, description, created_by, report_data ( form_data )')
                        .order('created_at', { ascending: false });

            if (error) {
                            console.warn('[reportService] fetch:', error.message);
                            return [];
            }

            return (data || []).map((row: any) => {
                            const formData = row.report_data?.[0]?.form_data || {};
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

export async function softDeleteReportInSupabase(id: string): Promise<void> {
        try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) return;
                    await supabase.from('reports').update({ status: 'Deleted' }).eq('id', id);
        } catch (err) {
                    console.warn('[reportService] softDelete error (non-fatal):', err);
        }
}
