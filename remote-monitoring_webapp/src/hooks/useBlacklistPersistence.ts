import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "secureguard-blacklist-state";
const SYNC_COOLDOWN_MS = 3000; // Ignore poll updates for 3s after manual toggle

export function useBlacklistPersistence() {
  const lastManualToggle = useRef<number>(0);

  const [blacklistEnabled, setBlacklistEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(blacklistEnabled));
    } catch (error) {
      console.warn("[Blacklist] Failed to persist state:", error);
    }
  }, [blacklistEnabled]);

  // Manual toggle from UI - sets cooldown to prevent poll overwrite
  const setBlacklistState = useCallback((state: boolean) => {
    lastManualToggle.current = Date.now();
    setBlacklistEnabled(state);
  }, []);

  // Sync from backend poll - skipped during cooldown window
  const syncFromBackend = useCallback((backendState: boolean) => {
    if (Date.now() - lastManualToggle.current < SYNC_COOLDOWN_MS) {
      return; // Skip poll sync right after manual toggle
    }
    setBlacklistEnabled(prev => {
      if (prev !== backendState) {
        return backendState;
      }
      return prev;
    });
  }, []);

  return {
    blacklistEnabled,
    setBlacklistState,
    syncFromBackend,
  };
}
