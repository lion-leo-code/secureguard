import { useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const BASE_URL = "https://phenomenologically-unbemoaned-kimberley.ngrok-free.dev";
const NGROK_HEADERS = {
  "ngrok-skip-browser-warning": "true",
  "Content-Type": "application/json"
};

interface BlacklistToggleProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function BlacklistToggle({ isEnabled, onToggle }: BlacklistToggleProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    const newState = !isEnabled;
    
    try {
      const response = await fetch(`${BASE_URL}/toggle-blacklist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...NGROK_HEADERS
        },
        body: JSON.stringify({
          enabled: newState,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to toggle blacklist');
      }

      // Only update UI after backend confirms with 200 OK
      onToggle(newState);
      
      toast({
        title: newState ? "🛡️ Blacklist Enabled" : "⚠️ Blacklist Disabled",
        description: newState 
          ? "Automated blacklist protection is now active." 
          : "Automated blacklist protection is now disabled.",
      });
    } catch (error) {
      // Do NOT update UI on failure - keep previous state
      toast({
        title: "Toggle Failed",
        description: "Could not connect to the security service.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card-elevated p-4 sm:p-6" data-testid="blacklist-toggle">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center border transition-all duration-300",
            isEnabled 
              ? "bg-primary/20 border-primary/50" 
              : "bg-muted border-muted-foreground/30"
          )}>
            <ShieldCheck className={cn(
              "w-5 h-5 transition-colors",
              isEnabled ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-foreground">
              Automated Blacklist Protection
            </h3>
            <p className="text-xs text-muted-foreground">
              {isEnabled ? "Protection active" : "Protection disabled"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={isLoading}
            className="data-[state=checked]:bg-primary"
          />
        </div>
      </div>
    </div>
  );
}
