"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

const STORAGE_KEY = "ppr-admin-impersonation";

interface ImpersonationState {
  storeId: string;
  userId: string; // target creator's Clerk ID
  storeName: string;
  creatorName: string;
}

interface ImpersonationContextValue {
  /** The impersonated store ID, or null if not impersonating */
  impersonatedStoreId: string | null;
  /** The impersonated creator's Clerk ID, or null if not impersonating */
  impersonatedUserId: string | null;
  /** The impersonated store name */
  impersonatedStoreName: string | null;
  /** The impersonated creator's name */
  impersonatedCreatorName: string | null;
  /** Whether admin is currently impersonating a creator */
  isImpersonating: boolean;
  /** Start impersonating a creator's store */
  startImpersonation: (state: ImpersonationState) => void;
  /** Stop impersonating and return to admin view */
  stopImpersonation: () => void;
}

const ImpersonationContext = createContext<ImpersonationContextValue>({
  impersonatedStoreId: null,
  impersonatedUserId: null,
  impersonatedStoreName: null,
  impersonatedCreatorName: null,
  isImpersonating: false,
  startImpersonation: () => {},
  stopImpersonation: () => {},
});

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ImpersonationState | null>(null);

  // Restore from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ImpersonationState;
        if (parsed.storeId && parsed.userId) {
          setState(parsed);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const startImpersonation = useCallback((newState: ImpersonationState) => {
    setState(newState);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const stopImpersonation = useCallback(() => {
    setState(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  return (
    <ImpersonationContext.Provider
      value={{
        impersonatedStoreId: state?.storeId ?? null,
        impersonatedUserId: state?.userId ?? null,
        impersonatedStoreName: state?.storeName ?? null,
        impersonatedCreatorName: state?.creatorName ?? null,
        isImpersonating: state !== null,
        startImpersonation,
        stopImpersonation,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}

/** Access the impersonation context */
export function useImpersonation() {
  return useContext(ImpersonationContext);
}

/**
 * Returns the effective user ID for store queries.
 * When admin is impersonating, returns the target creator's Clerk ID.
 * Otherwise returns the provided user ID (typically from useUser().user.id).
 */
export function useEffectiveUserId(currentUserId: string | undefined | null): string | undefined {
  const { isImpersonating, impersonatedUserId } = useContext(ImpersonationContext);
  if (isImpersonating && impersonatedUserId) return impersonatedUserId;
  return currentUserId ?? undefined;
}
