import { Shield, Lock, Unlock, Bell, BellOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SecurityHeaderProps {
  isMonitoring: boolean;
  isLocked: boolean;
  isOnline?: boolean;
  onManualSync?: () => void;
  isSyncing?: boolean;
}

export function SecurityHeader({ isMonitoring, isLocked, isOnline = true, onManualSync, isSyncing }: SecurityHeaderProps) {
  return (
    <header className="flex items-center justify-between py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gradient-primary">secureguard</h1>
          <div className="flex items-center gap-2">
            {isMonitoring && !isOnline ? (
              <Badge className="bg-destructive/20 text-destructive border-destructive/50 font-mono text-[10px] uppercase tracking-wider animate-pulse">
                PC Offline
              </Badge>
            ) : (
              <>
                <div className={`status-indicator ${isMonitoring ? 'status-indicator-active' : 'status-indicator-inactive'}`} />
                <span className="text-xs text-muted-foreground font-mono">
                  {isMonitoring ? 'ACTIVE' : 'STANDBY'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Manual Sync Button - Always visible when monitoring */}
        {isMonitoring && onManualSync && (
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-lg"
            onClick={onManualSync}
            disabled={isSyncing}
            title="Sync with backend"
          >
            <RefreshCw className={cn("w-5 h-5 text-primary", isSyncing && "animate-spin")} />
          </Button>
        )}
        
        {/* Notification Status Indicator */}
        <div 
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center border transition-all duration-300",
            isMonitoring 
              ? "bg-[hsl(142_76%_46%/0.15)] border-[hsl(142_76%_46%/0.5)]" 
              : "bg-muted border-muted-foreground/30"
          )}
          title={isMonitoring ? "Notifications Active" : "Notifications Disabled"}
        >
          {isMonitoring ? (
            <Bell className="w-5 h-5 text-[hsl(142_76%_46%)]" />
          ) : (
            <BellOff className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        
        <div 
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center border transition-all duration-300",
            isLocked 
              ? "bg-destructive/15 border-destructive/50" 
              : "bg-[hsl(158_64%_52%/0.15)] border-[hsl(158_64%_52%/0.5)]"
          )}
          title={isLocked ? "System Locked" : "System Unlocked"}
        >
          {isLocked ? (
            <Lock className="w-5 h-5 text-destructive" />
          ) : (
            <Unlock className="w-5 h-5 text-[hsl(158_64%_52%)]" />
          )}
        </div>
      </div>
    </header>
  );
}
