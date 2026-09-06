import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "secureguard-monitor-state";

export function useMonitorPersistence() {
  // Initialize state from localStorage
  const [isMonitoring, setIsMonitoring] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === "true";
    } catch {
      return false;
    }
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(isMonitoring));
    } catch (error) {
      console.warn("[Monitor] Failed to persist state:", error);
    }
  }, [isMonitoring]);

  // Callback to update state (from UI toggle or backend sync)
  const setMonitorState = useCallback((state: boolean) => {
    setIsMonitoring(state);
  }, []);

  // Sync from backend - only update if different
  const syncFromBackend = useCallback((backendState: boolean) => {
    setIsMonitoring(prev => {
      if (prev !== backendState) {
        return backendState;
      }
      return prev;
    });
  }, []);

  return {
    isMonitoring,
    setMonitorState,
    syncFromBackend,
  };
}
