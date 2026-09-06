import { useEffect, useRef, useState, useCallback } from "react";
import { Activity, Clock, Wifi, WifiOff, AlertTriangle, Zap, ShieldAlert, Eye, Monitor, RefreshCw, CheckCircle, XCircle, Camera, ExternalLink } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const BASE_URL = "https://phenomenologically-unbemoaned-kimberley.ngrok-free.dev";
const NGROK_HEADERS = { "ngrok-skip-browser-warning": "true", "Content-Type": "application/json" };
const NTFY_ALERTS_URL = "https://ntfy.sh/secureguard_alerts";

interface RawLogEntry {
  type: string;
  msg: string;
  time: string;
}

interface LogEntry {
  type: "ALERT" | "APP" | "ACCESS" | "SECURITY" | "SYSTEM" | "POWER";
  message: string;
  timestamp: string;
}

interface LiveActivityProps {
  isMonitoring: boolean;
  onMonitorSync?: (backendMonitorState: boolean) => void;
  onManualSync?: () => void;
}

export function LiveActivity({ isMonitoring, onMonitorSync, onManualSync }: LiveActivityProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const previousLogsRef = useRef<Set<string>>(new Set());
  const hasConnectedOnceRef = useRef(false);
  const hasShownConnectionToastRef = useRef(false);
  const sessionStartTimeRef = useRef<string | null>(null);
  const wasMonitoringRef = useRef(false);

  // Display time string directly from backend (HH:MM:SS format)
  const formatTime = (timestamp: string) => {
    return timestamp || '--:--:--';
  };

  // Manual sync handler for force refresh
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
        setIsConnected(true);
        setIsOffline(false);
        
        if (data.monitor !== undefined && onMonitorSync) {
          onMonitorSync(data.monitor);
        }
        
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
  }, [onMonitorSync]);

  // Filter out Monitor Mode logs, state changes, and 'tk' (Python lock screen window)
  const shouldShowLog = (message: string) => {
    const lowerMessage = message.toLowerCase();
    return !message.includes("Monitor Mode: ON") && 
           !message.includes("Monitor Mode: OFF") &&
           !message.includes("MONITOR_STATE_CHANGED") &&
           !lowerMessage.includes("tk") &&
           !lowerMessage.includes("monitor_state_changed");
  };

  // Check if log is an intruder/denied event (requires bold red styling + camera icon)
  const isIntruderLog = (message: string) => {
    const lowerMessage = message.toLowerCase();
    return lowerMessage.includes("denied") || 
           lowerMessage.includes("intruder") ||
           lowerMessage.includes("access denied");
  };

  // Check if log should show camera icon (SECURITY or ACCESS DENIED)
  const shouldShowCameraIcon = (type: string, message: string) => {
    return type === "SECURITY" || isIntruderLog(message);
  };

  // Check if log is an emergency/security event requiring highlight
  const isEmergencyLog = (type: string, message: string) => {
    return type === "SECURITY" || message.includes("Remote Lock Triggered");
  };

  const getLogColor = (type: string, message: string) => {
    // Security/Emergency logs get blue text
    if (isEmergencyLog(type, message)) {
      return "log-security";
    }
    // ACCESS depends on granted/denied
    if (type === "ACCESS") {
      const lowerMsg = message.toLowerCase();
      if (lowerMsg.includes("denied") || lowerMsg.includes("failed")) {
        return "log-access-denied";
      }
      return "log-access-granted";
    }
    switch (type) {
      case "ALERT":
        return "log-alert";
      case "APP":
        return "log-app";
      case "POWER":
        return "log-power";
      case "SYSTEM":
        return "log-system";
      default:
        return "log-app";
    }
  };

  // Unique icon for each log type
  const getLogIcon = (type: string, message: string) => {
    if (isEmergencyLog(type, message)) {
      return <ShieldAlert className="w-3.5 h-3.5" />;
    }
    switch (type) {
      case "ALERT":
        return <AlertTriangle className="w-3.5 h-3.5" />;
      case "POWER":
        return <Zap className="w-3.5 h-3.5" />;
      case "APP":
        return <Eye className="w-3.5 h-3.5" />;
      case "SYSTEM":
        return <Monitor className="w-3.5 h-3.5" />;
      case "ACCESS":
        const lowerMsg = message.toLowerCase();
        if (lowerMsg.includes("denied") || lowerMsg.includes("failed")) {
          return <XCircle className="w-3.5 h-3.5" />;
        }
        return <CheckCircle className="w-3.5 h-3.5" />;
      case "SECURITY":
        return <ShieldAlert className="w-3.5 h-3.5" />;
      default:
        return <Eye className="w-3.5 h-3.5" />;
    }
  };

  // Track when monitoring is toggled ON to reset session
  useEffect(() => {
    if (isMonitoring && !wasMonitoringRef.current) {
      // Monitor just turned ON - set session start time and clear logs
      sessionStartTimeRef.current = new Date().toISOString();
      setLogs([]);
      previousLogsRef.current = new Set();
    }
    wasMonitoringRef.current = isMonitoring;
  }, [isMonitoring]);

  useEffect(() => {
    if (!isMonitoring) {
      setIsConnected(false);
      setIsOffline(false);
      hasShownConnectionToastRef.current = false;
      return;
    }

    const fetchActivity = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(`${BASE_URL}/activity`, {
          headers: NGROK_HEADERS,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error('Failed to fetch activity');
        }
        
        const data = await response.json();
        
          // Successfully connected
          if (!hasConnectedOnceRef.current) {
            hasConnectedOnceRef.current = true;
          }
          
          // Show connection toast only once per session
          if (!hasShownConnectionToastRef.current) {
            hasShownConnectionToastRef.current = true;
            toast({
              title: "🛡️ Connected",
              description: "Security service is now active.",
            });
          }
          
          setIsConnected(true);
          setIsOffline(false);
          
          // Persistence: Sync monitor state from backend response
          if (data.monitor !== undefined && onMonitorSync) {
            onMonitorSync(data.monitor);
          }
        
        // Extract logs from data.logs and map fields
        const rawLogs = data.logs;
        if (Array.isArray(rawLogs)) {
          // Map Python keys to our format: msg → message, time → timestamp
          const mappedLogs: LogEntry[] = rawLogs.map((entry: RawLogEntry) => ({
            type: entry.type as LogEntry["type"],
            message: entry.msg,
            timestamp: entry.time,
          }));

          // Update previous logs set
          previousLogsRef.current = new Set(
            mappedLogs.map((entry: LogEntry) => 
              `${entry.type}-${entry.message}-${entry.timestamp}`
            )
          );
          
          // Filter out Monitor Mode logs for display
          const filteredLogs = mappedLogs.filter(entry => shouldShowLog(entry.message));
          
          setLogs(filteredLogs);
        }
      } catch (error) {
        // Connection failed - heartbeat detection
        if (hasConnectedOnceRef.current && !isOffline) {
          setIsOffline(true);
          setIsConnected(false);
          // Toast for connection status only
          toast({
            title: "🔴 Service Unavailable",
            description: "Security service is offline or unreachable.",
            variant: "destructive",
          });
        } else {
          setIsConnected(false);
        }
        console.error("Error fetching activity:", error);
      }
    };

    fetchActivity(); // Initial fetch
    const intervalId = setInterval(fetchActivity, 1000); // 1 second polling

    return () => clearInterval(intervalId);
  }, [isMonitoring, isOffline]);

  return (
    <div className="card-elevated p-4 sm:p-6 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-primary shrink-0" />
        <h2 className="text-base sm:text-lg font-semibold text-foreground truncate">Security Log</h2>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Manual Sync Button - Shows only when monitoring is ON AND offline/disconnected */}
          {isMonitoring && (isOffline || !isConnected) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8"
              onClick={handleManualSync}
              disabled={isSyncing}
              title="Force Sync"
            >
              <RefreshCw className={cn("w-4 h-4 text-primary", isSyncing && "animate-spin")} />
            </Button>
          )}
          {isOffline ? (
            <>
              <WifiOff className="w-4 h-4 text-destructive" />
              <div className="status-indicator status-indicator-offline" />
              <span className="text-xs text-destructive font-medium hidden sm:inline">Offline</span>
            </>
          ) : isConnected ? (
            <>
              <Wifi className="w-4 h-4 text-connected" />
              <div className="status-indicator status-indicator-active" />
              <span className="text-xs text-connected hidden sm:inline">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {isMonitoring ? "..." : "Off"}
              </span>
            </>
          )}
        </div>
      </div>
      
      <ScrollArea className="flex-1 -mx-4 px-4 sm:-mx-6 sm:px-6">
        <div className="space-y-1">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {isMonitoring ? "Waiting for activity..." : "Enable monitoring to see logs"}
              </p>
            </div>
          ) : (
            logs.map((entry, index) => {
              const isIntruder = isIntruderLog(entry.message);
              const showCamera = shouldShowCameraIcon(entry.type, entry.message);
              
              return (
                <div
                  key={`${entry.type}-${entry.timestamp}-${index}`}
                  className={cn(
                    "grid grid-cols-[auto_1fr_auto] gap-2 p-2 rounded-lg transition-colors font-mono text-xs",
                    "bg-muted/30 hover:bg-muted/50",
                    isIntruder && "bg-destructive/10 hover:bg-destructive/15"
                  )}
                >
                  {/* Left: Icon + Type (fixed width) */}
                  <div className={cn(
                    "flex items-center gap-1 shrink-0",
                    isIntruder ? "text-destructive font-bold" : getLogColor(entry.type, entry.message)
                  )}>
                    <span className="shrink-0">{getLogIcon(entry.type, entry.message)}</span>
                    <span className="font-semibold text-[10px] sm:text-xs w-12 sm:w-14">[{entry.type}]</span>
                  </div>
                  
                  {/* Center: Message (flexible, wraps) */}
                  <p className={cn(
                    "leading-relaxed break-words overflow-wrap-anywhere",
                    isIntruder 
                      ? "text-destructive font-bold text-sm sm:text-base" 
                      : cn("text-[11px] sm:text-xs", getLogColor(entry.type, entry.message))
                  )}>
                    {entry.message}
                  </p>
                  
                  {/* Right: Camera icon (if applicable) + Timestamp (fixed width) */}
                  <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                    {showCamera && (
                      <Camera className={cn("w-3 h-3 shrink-0", isIntruder && "text-destructive")} />
                    )}
                    <Clock className="w-3 h-3 hidden sm:block shrink-0" />
                    <span className="text-[10px] sm:text-xs whitespace-nowrap">{formatTime(entry.timestamp)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
      
      {/* Footer: ntfy alerts link + snapshot note */}
      <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
        <span className="italic">📷 Intruder snapshots sent to ntfy</span>
        <a 
          href={NTFY_ALERTS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-primary hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          <span>Open Alerts</span>
        </a>
      </div>
    </div>
  );
}
