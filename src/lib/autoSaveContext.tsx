import React, { createContext, useContext, useState } from 'react';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved';

interface AutoSaveCtx {
  status: AutoSaveStatus;
  setStatus: (s: AutoSaveStatus) => void;
}

const AutoSaveContext = createContext<AutoSaveCtx | null>(null);

export function AutoSaveProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  return (
    <AutoSaveContext.Provider value={{ status, setStatus }}>
      {children}
    </AutoSaveContext.Provider>
  );
}

export function useAutoSaveContext(): AutoSaveCtx {
  const ctx = useContext(AutoSaveContext);
  if (!ctx) throw new Error('useAutoSaveContext must be used within AutoSaveProvider');
  return ctx;
}
