import React, { createContext, useContext, useState, useEffect } from 'react';
import type { BrandingSettings } from '@/types';

const STORAGE_KEY = 'sitk_branding';

export const DEFAULT_BRANDING: BrandingSettings = {
  companyName: 'Safety is the Key Ltd',
  logoDataUrl: '',
  address: '2 Palace Green, Croydon, CR0 9AG',
  phone: '020 8406 5039',
  email: 'info@safetyisthekey.co.uk',
  website: 'www.safetyisthekey.co.uk',
};

const STALE_MARKERS = ['Manchester', 'Industrial Way', 'M1 1AB', '161 000', 'example.com', 'yourcompany'];

function isStale(value: string): boolean {
  return STALE_MARKERS.some(marker => value.toLowerCase().includes(marker.toLowerCase()));
}

function loadBranding(): BrandingSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: Partial<BrandingSettings> = JSON.parse(stored);
      // Purge any field that contains old/incorrect placeholder data
      const cleaned: Partial<BrandingSettings> = {};
      for (const key of Object.keys(parsed) as (keyof BrandingSettings)[]) {
        const val = parsed[key];
        if (typeof val === 'string' && isStale(val)) continue; // drop stale value, fall back to default
        (cleaned as any)[key] = val;
      }
      return { ...DEFAULT_BRANDING, ...cleaned };
    }
  } catch {
    // ignore
  }
  return DEFAULT_BRANDING;
}

interface BrandingContextValue {
  branding: BrandingSettings;
  updateBranding: (updates: Partial<BrandingSettings>) => void;
  resetBranding: () => void;
}

const BrandingContext = createContext<BrandingContextValue | null>(null);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<BrandingSettings>(loadBranding);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(branding));
    } catch {
      // ignore quota errors
    }
  }, [branding]);

  const updateBranding = (updates: Partial<BrandingSettings>) => {
    setBranding(prev => ({ ...prev, ...updates }));
  };

  const resetBranding = () => {
    setBranding(DEFAULT_BRANDING);
  };

  return (
    <BrandingContext.Provider value={{ branding, updateBranding, resetBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding(): BrandingContextValue {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error('useBranding must be used within BrandingProvider');
  return ctx;
}
