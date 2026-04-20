import React from 'react';
import type { PhotoAttachment } from '@/types';

const PREFIX = 'sitk_photos_';

/**
 * Persists photos for a specific form to localStorage.
 * Use one store per form (identified by a unique key matching the autosave key).
 * Photos survive page refresh and are included in saved reports.
 *
 * @param formKey - Unique key matching the form's autosave key (e.g. 'incident_report')
 */
export function usePhotoStore(formKey: string) {
  const storageKey = PREFIX + formKey;

  const [photos, setPhotosState] = React.useState<PhotoAttachment[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as PhotoAttachment[]) : [];
    } catch {
      return [];
    }
  });

  const updatePhotos = React.useCallback(
    (next: PhotoAttachment[]) => {
      setPhotosState(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // storage quota exceeded — silently skip
      }
    },
    [storageKey],
  );

  const clearPhotos = React.useCallback(() => {
    setPhotosState([]);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  return { photos, updatePhotos, clearPhotos };
}

/** Read persisted photos for a given form key (for use in read-only views). */
export function getStoredPhotos(formKey: string): PhotoAttachment[] {
  try {
    const raw = localStorage.getItem(PREFIX + formKey);
    return raw ? (JSON.parse(raw) as PhotoAttachment[]) : [];
  } catch {
    return [];
  }
}

/** Map report type → photo store key (for PublicReportView). */
export const REPORT_TYPE_TO_PHOTO_KEY: Record<string, string> = {
  'Dynamic Risk Assessment': 'dra',
  'Incident Report': 'incident_report',
  'Checklist': 'checklist',
  'Audit': 'audit',
  'Accident / Incident Investigation': 'incident_investigation',
  'DSE Assessment': 'dse',
  'Construction Site Checklist': 'construction_site',
  'Contractor Vetting 10-001': 'contractor_vetting_full',
  'Contractor Vetting 10-002': 'contractor_vetting_small',
  'Fire Briefing': 'fire_briefing',
  'Fire Drill Report': 'fire_drill',
  'Fire Warden Checklist': 'fire_warden',
  'H&S Mini Audit': 'hs_mini_audit',
  'Monthly Premises Checklist': 'monthly_premises',
  'Six-Monthly Premises Checklist': 'six_monthly_premises',
  'Annual Premises Checklist': 'annual_premises',
  'Equipment Safety Inspection': 'equipment_inspection',
  'Pallet Racking Checklist': 'pallet_racking',
  'Permit to Work': 'permit_to_work',
  'Lone Working Checklist': 'lone_working',
  'Manual Handling Assessment': 'manual_handling',
  'Toolbox Talk': 'toolbox_talk',
  // Specific template names (AuditForm / ChecklistForm)
  'Monthly Site Safety Audit': 'audit',
  'H&S Audit Form': 'audit',
  'Daily Site Safety Inspection': 'checklist',
  'Computer DSE Checklist': 'checklist',
  'Lone Worker Checklist': 'checklist',
  'Manual Handling Checklist': 'checklist',
  'General H&S Checklist': 'checklist',
};
