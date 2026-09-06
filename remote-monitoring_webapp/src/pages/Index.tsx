import { useState, useCallback, useEffect } from "react";
import { SecurityHeader } from "@/components/SecurityHeader";
import { MonitorToggle } from "@/components/MonitorToggle";
import { LiveActivity } from "@/components/LiveActivity";
import { EmergencyLock } from "@/components/EmergencyLock";
import { BlacklistToggle } from "@/components/BlacklistToggle";
import { NetworkOps } from "@/components/NetworkOps";
import { LockScreen } from "@/components/LockScreen";
import { useMonitorPersistence } from "@/hooks/useMonitorPersistence";
import { useBlacklistPersistence } from "@/hooks/useBlacklistPersistence";
import { toast } from "@/hooks/use-toast";

const BASE_URL = "https://phenomenologically-unbemoaned-kimberley.ngrok-free.dev";
const NGROK_HEADERS = { "ngrok-skip-browser-warning": "true", "Content-Type": "application/json" };

const Index = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const { isMonitoring, setMonitorState, syncFromBackend } = useMonitorPersistence();
  const { blacklistEnabled, setBlacklistState, syncFromBackend: syncBlacklistFromBackend } = useBlacklistPersistence();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Sync all states from backend
  const syncAllStates = useCallback((data: { monitor?: boolean; isLocked?: boolean; blacklistEnabled?: boolean }) => {
    if (data.monitor !== undefined) {
      syncFromBackend(data.monitor);
    }
    if (data.isLocked !== undefined) {
      setIsLocked(data.isLocked);
    }
    if (data.blacklistEnabled !== undefined) {
      syncBlacklistFromBackend(data.blacklistEnabled);
    }
  }, [syncFromBackend, syncBlacklistFromBackend]);

  // Poll for all states every 1 second
  useEffect(() => {
    if (!isMonitoring) return;

    const fetchStates = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(`${BASE_URL}/activity`, {
          headers: NGROK_HEADERS,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          syncAllStates(data);
          setIsOnline(true);
        } else {
          setIsOnline(false);
        }
      } catch {
        setIsOnline(false);
        // Silent fail - LiveActivity handles connection status
      }
    };

    const intervalId = setInterval(fetchStates, 1000);
    return () => clearInterval(intervalId);
  }, [isMonitoring, syncAllStates]);

  // Manual sync handler for header refresh button
  const handleManualSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(`${BASE_URL}/activity`, {
        headers: NGROK_HEADERS,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        syncAllStates(data);
        
        toast({
          title: "✅ Synced",
          description: "Successfully synced with backend.",
        });
      }
    } catch {
      toast({
        title: "❌ Sync Failed",
        description: "Could not reach the backend.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [syncAllStates]);

  if (!isUnlocked) {
    return <LockScreen onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 pb-8">
        <SecurityHeader 
          isMonitoring={isMonitoring}
          isLocked={isLocked}
          isOnline={isOnline}
          onManualSync={handleManualSync}
          isSyncing={isSyncing}
        />
        
        <div className="space-y-4 sm:space-y-6">
          {/* Monitor Toggle */}
          <MonitorToggle 
            isActive={isMonitoring} 
            onToggle={setMonitorState} 
          />
          
          {/* Security Log */}
          <div className="h-[280px] sm:h-[320px]">
            <LiveActivity 
              isMonitoring={isMonitoring} 
              onMonitorSync={syncFromBackend}
            />
          </div>
          
          {/* Emergency Lock */}
          <EmergencyLock 
            isLocked={isLocked} 
            onLockSuccess={() => setIsLocked(true)} 
          />
          
          {/* Blacklist Toggle */}
          <BlacklistToggle 
            isEnabled={blacklistEnabled} 
            onToggle={setBlacklistState} 
          />
          
          {/* Network Ops */}
          <NetworkOps />
        </div>
      </div>
    </div>
  );
};

export default Index;
