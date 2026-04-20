import { useEffect, useRef, useCallback } from 'react';
import { useAutoSaveContext, type AutoSaveStatus } from './autoSaveContext';

const PREFIX = 'sitk_autosave_';

/** Read previously autosaved data for a form key. Returns null if nothing saved. */
export function getAutoSavedData<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/**
 * Pre-populate the autosave slot for a given key with a saved report's data.
 * Call this before navigating to a form to edit an existing draft, so that
 * the form's getAutoSavedData() call will hydrate from the correct report.
 */
export function preloadDraftForEdit(key: string, data: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

/**
 * Autosaves `data` to localStorage whenever it changes (debounced).
 * Broadcasts status to the nearest AutoSaveProvider for display in Layout.
 * Attaches a beforeunload warning while there are unsaved changes.
 *
 * @param key  Unique form key (e.g. 'dra', 'incident_report')
 * @param data The form state to autosave
 * @param delay Debounce delay in ms (default 3000)
 */
export function useAutoSave<T>(
  key: string,
  data: T,
  delay = 3000,
): { clearAutoSave: () => void } {
  const { setStatus } = useAutoSaveContext();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevJsonRef = useRef<string>('');
  const isDirtyRef = useRef(false);
  const keyRef = useRef(key);
  keyRef.current = key;

  // Guard with JSON equality so we only save on actual data changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const serialized = JSON.stringify(data);

  useEffect(() => {
    // First mount — snapshot initial value without saving
    if (prevJsonRef.current === '') {
      prevJsonRef.current = serialized;
      return;
    }

    if (serialized === prevJsonRef.current) return;
    prevJsonRef.current = serialized;

    isDirtyRef.current = true;
    setStatus('saving');

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(PREFIX + keyRef.current, serialized);
        setStatus('saved');
      } catch {
        setStatus('idle');
      }
    }, delay);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized, delay, setStatus]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Warn before leaving if form is dirty
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const clearAutoSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    localStorage.removeItem(PREFIX + keyRef.current);
    isDirtyRef.current = false;
    setStatus('idle');
  }, [setStatus]);

  return { clearAutoSave };
}
