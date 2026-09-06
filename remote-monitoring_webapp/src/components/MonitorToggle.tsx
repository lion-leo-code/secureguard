import { useState } from "react";
import { Shield, ShieldOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const BASE_URL = "https://phenomenologically-unbemoaned-kimberley.ngrok-free.dev";
const NGROK_HEADERS = {
  "ngrok-skip-browser-warning": "true",
  "Content-Type": "application/json"
};

interface MonitorToggleProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
}

export function MonitorToggle({
  isActive,
  onToggle
}: MonitorToggleProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    const newState = !isActive;
    setIsLoading(true);
    
    try {
      const response = await fetch(`${BASE_URL}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...NGROK_HEADERS
        },
        body: JSON.stringify({
          active: newState,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update monitor mode');
      }

      const data = await response.json();
      
      // Use the monitor key from response to update UI
      const monitorState = data.monitor !== undefined ? data.monitor : newState;
      onToggle(monitorState);
      
      toast({
        title: monitorState ? "Monitor Mode Enabled" : "Monitor Mode Disabled",
        description: monitorState ? "Your PC is now being monitored." : "Monitoring has been turned off."
      });
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Could not connect to the security service.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card-elevated p-6 sm:p-8">
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          {isActive ? (
            <Shield className="w-6 h-6 text-primary" />
          ) : (
            <ShieldOff className="w-6 h-6 text-muted-foreground" />
          )}
          <h2 className="text-lg font-semibold text-foreground">Monitor Mode</h2>
        </div>
        
        <div className="flex flex-col items-center gap-4">
          <button
            className={cn(
              "relative w-24 h-12 rounded-full transition-all duration-300",
              isActive 
                ? "bg-primary/20 glow-primary" 
                : "bg-muted",
              isLoading ? "cursor-wait opacity-70" : "cursor-pointer"
            )}
            onClick={handleToggle}
            disabled={isLoading}
          >
            <div
              className={cn(
                "absolute top-1 w-10 h-10 rounded-full transition-all duration-300 flex items-center justify-center",
                isActive 
                  ? "left-[calc(100%-2.75rem)] bg-primary" 
                  : "left-1 bg-muted-foreground"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" />
              ) : isActive ? (
                <Shield className="w-5 h-5 text-primary-foreground" />
              ) : (
                <ShieldOff className="w-5 h-5 text-background" />
              )}
            </div>
          </button>
          
          <span className={cn(
            "text-sm font-medium transition-colors",
            isActive ? "text-primary" : "text-muted-foreground"
          )}>
            {isActive ? "Protection Active" : "Protection Disabled"}
          </span>
        </div>
      </div>
    </div>
  );
}
