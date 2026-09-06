import { useState } from "react";
import { Zap, Loader2, Activity, Hourglass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

const BASE_URL = "https://phenomenologically-unbemoaned-kimberley.ngrok-free.dev";
const NGROK_HEADERS = {
  "ngrok-skip-browser-warning": "true",
  "Content-Type": "application/json",
};

export function NetworkOps() {
  const [ssid, setSsid] = useState("");
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);

  const handlePrioritize = async () => {
    if (!ssid.trim()) {
      toast({ title: "⚠️ Missing SSID", description: "Enter a network name first.", variant: "destructive" });
      return;
    }
    setIsPrioritizing(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${BASE_URL}/set-priority`, {
        method: "POST",
        headers: NGROK_HEADERS,
        body: JSON.stringify({ ssid: ssid.trim() }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        toast({ title: "✅ Success", description: data.message || "Priority set." });
      } else {
        throw new Error("Request failed");
      }
    } catch {
      toast({ title: "❌ Failed", description: "Could not set network priority.", variant: "destructive" });
    } finally {
      setIsPrioritizing(false);
    }
  };

  const handleCheckPing = async () => {
    setIsPinging(true);
    setPingResult(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${BASE_URL}/get-ping`, {
        method: "POST",
        headers: NGROK_HEADERS,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        setPingResult(data.ping || data.latency || data.ms ? `${data.ping || data.latency || data.ms}ms` : JSON.stringify(data));
      } else {
        throw new Error("Failed");
      }
    } catch {
      toast({ title: "❌ Ping Failed", description: "Could not retrieve ping.", variant: "destructive" });
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-[hsl(var(--surface-elevated))] p-4 sm:p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-primary" />
        <h3 className="text-sm sm:text-base font-bold text-primary uppercase tracking-wider">
          Clandestine Network Ops
        </h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-foreground font-semibold text-sm">Network Priority Overdrive</Label>
          <p className="text-xs text-muted-foreground">Force PC to Priority 1 on the current Wi-Fi.</p>
        </div>

        <Input
          placeholder="Enter SSID name…"
          value={ssid}
          onChange={(e) => setSsid(e.target.value)}
          className="bg-background/50 border-border focus-visible:ring-ring/50 placeholder:text-muted-foreground/50"
        />

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={handlePrioritize}
            disabled={isPrioritizing}
            className="bg-primary hover:bg-primary/80 text-primary-foreground font-semibold gap-2"
          >
            {isPrioritizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Prioritize My PC
          </Button>

          <Button
            variant="outline"
            onClick={handleCheckPing}
            disabled={isPinging}
            className="border-primary/40 text-primary hover:bg-primary/10 gap-2"
          >
            {isPinging ? <Hourglass className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
            Check Live Ping
          </Button>

          {pingResult && (
            <Badge className="bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] border-[hsl(var(--success))]/40 font-mono text-xs shadow-[0_0_8px_hsl(var(--success)/0.4)]">
              {pingResult}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
