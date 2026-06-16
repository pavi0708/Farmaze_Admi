/**
 * useOnboarding — onboarding state hook backed by the W2.1 backend.
 *
 * Source of truth is `GET /api/v1/users/me/onboarding` (users.onboarding_step
 * column). localStorage keeps a per-user cache so:
 *   - the first render doesn't flash the banner before the fetch resolves
 *   - the skip / "banner dismissed" choice survives page reloads without
 *     polluting the server state (we don't have a "skipped" column)
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getOnboardingStatus,
  patchOnboarding,
  type OnboardingStatus,
  type OnboardingStep,
} from "@/api/onboardingApi";

const STORAGE_PREFIX = "farmaze_onboarding_v2";

type CachedState = {
  step: OnboardingStep;
  horecaType: string | null;
  skipped: boolean;
  skippedAt?: string;
  fetchedAt?: string;
};

const DEFAULT_STATE: CachedState = {
  step: 0,
  horecaType: null,
  skipped: false,
};

const storageKey = (userId?: string) =>
  userId ? `${STORAGE_PREFIX}_${userId}` : STORAGE_PREFIX;

const readCache = (userId?: string): CachedState => {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...(JSON.parse(raw) as CachedState) };
  } catch {
    return DEFAULT_STATE;
  }
};

const writeCache = (userId: string | undefined, next: CachedState) => {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(next));
  } catch {
    /* ignore */
  }
};

const clearCache = (userId?: string) => {
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {
    /* ignore */
  }
};

export function useOnboarding() {
  const { user, isLoggedIn } = useAuth();
  const userId = user?.id;

  const [state, setState] = useState<CachedState>(() => readCache(userId));
  const [loading, setLoading] = useState<boolean>(!state.fetchedAt);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Reload from server whenever the user changes or we log in fresh.
  const refresh = useCallback(async () => {
    if (!isLoggedIn || !userId) return;
    setLoading(true);
    setError(null);
    try {
      const s = await getOnboardingStatus();
      if (!mountedRef.current) return;
      // Preserve client-only `skipped` flag when folding server state in.
      const merged: CachedState = {
        step: s.step,
        horecaType: s.horeca_type,
        skipped: state.skipped,
        skippedAt: state.skippedAt,
        fetchedAt: new Date().toISOString(),
      };
      setState(merged);
      writeCache(userId, merged);
    } catch (err) {
      // Backend unreachable: fall back to cache.
      if (mountedRef.current) {
        setError("Could not load onboarding status");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // ─── Mutations ───────────────────────────────────────────────────────────

  const advanceStep = useCallback(
    async (step: OnboardingStep, patch: Record<string, unknown> = {}) => {
      const res = await patchOnboarding({ step, patch });
      const next: CachedState = {
        ...state,
        step: res.step,
        horecaType: res.horeca_type,
      };
      setState(next);
      writeCache(userId, next);
      return res;
    },
    [state, userId]
  );

  const markSkipped = useCallback(() => {
    const next: CachedState = {
      ...state,
      skipped: true,
      skippedAt: new Date().toISOString(),
    };
    setState(next);
    writeCache(userId, next);
  }, [state, userId]);

  const reset = useCallback(() => {
    clearCache(userId);
    setState(DEFAULT_STATE);
  }, [userId]);

  // ─── Derived flags ───────────────────────────────────────────────────────

  const completed = state.step >= 5;
  // Needs onboarding = not complete AND not dismissed. Used for hard redirects.
  const needsOnboarding = !completed && !state.skipped;
  // Show the banner whenever the server hasn't logged completion, even if
  // the user temporarily dismissed it — we want to keep nudging.
  const showBanner = !completed;

  return {
    // raw state
    step: state.step as OnboardingStep,
    horecaType: state.horecaType,
    skipped: state.skipped,
    skippedAt: state.skippedAt,
    completed,
    // derived flags used by consumers
    needsOnboarding,
    showBanner,
    loading,
    error,
    // actions
    refresh,
    advanceStep,
    markSkipped,
    reset,
  };
}

// Convenience export for the backend payload-step enum
export const ONBOARDING_STEPS = {
  INVITED: 0,
  PASSWORD_SET: 1,
  PROFILE: 2,
  BRANCHES: 3,
  HORECA_TYPE: 4,
  COMPLETE: 5,
} as const;
