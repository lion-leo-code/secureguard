import { useState } from "react";
import { Lock, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const BASE_URL = "https://phenomenologically-unbemoaned-kimberley.ngrok-free.dev";
const NGROK_HEADERS = {
  "ngrok-skip-browser-warning": "true",
  "Content-Type": "application/json"
};

interface EmergencyLockProps {
  isLocked?: boolean;
  onLockSuccess?: () => void;
}

export function EmergencyLock({ isLocked = false, onLockSuccess }: EmergencyLockProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmergencyLock = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${BASE_URL}/lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...NGROK_HEADERS
        },
        body: JSON.stringify({
          action: 'emergency_lock',
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to trigger emergency lock');
      }

      toast({
        title: "🔒 Emergency Lock Activated",
        description: "Your PC has been locked successfully."
      });
      
      // Notify parent to update lock state immediately
      onLockSuccess?.();
    } catch (error) {
      toast({
        title: "Lock Failed",
        description: "Could not connect to the security service.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card-elevated p-6 sm:p-8" data-testid="emergency-lock">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Emergency Lock</h2>
        </div>
        
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Immediately lock your PC
        </p>
        
        <button
          onClick={handleEmergencyLock}
          onMouseDown={() => !isLocked && setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          onMouseLeave={() => setIsPressed(false)}
          disabled={isLoading || isLocked}
          className={cn(
            "relative w-32 h-32 sm:w-40 sm:h-40 rounded-full",
            "bg-gradient-to-b from-destructive to-red-700",
            "border-4 border-red-900/50",
            "flex items-center justify-center",
            "transition-all duration-150",
            !isLocked && "hover:from-red-500 hover:to-red-600",
            "active:scale-95",
            "disabled:opacity-70 disabled:cursor-not-allowed",
            isPressed && "scale-95",
            !isLoading && !isLocked && "glow-danger"
          )}
        >
          <div className="absolute inset-2 rounded-full bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          
          {isLoading ? (
            <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-white animate-spin" />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Lock className="w-10 h-10 sm:w-14 sm:h-14 text-white" />
              <span className="text-xs sm:text-sm font-bold text-white/90 uppercase tracking-wider text-center px-2">
                {isLocked ? "SYSTEM LOCKED" : "Lock"}
              </span>
            </div>
          )}
        </button>
        
        <p className="text-xs text-muted-foreground">
          Press to activate emergency lock
        </p>
      </div>
    </div>
  );
}
