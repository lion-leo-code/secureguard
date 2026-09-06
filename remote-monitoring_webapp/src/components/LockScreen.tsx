import { useState, useCallback } from "react";
import { Shield, Delete } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const CORRECT_CODE = "0981";

interface LockScreenProps {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  const handleDigit = useCallback((digit: string) => {
    setError(false);
    setCode(prev => {
      const newCode = prev + digit;
      if (newCode.length === 4) {
        if (newCode === CORRECT_CODE) {
          onUnlock();
        } else {
          setError(true);
          toast({
            title: "❌ Access Denied",
            description: "Incorrect PIN code.",
            variant: "destructive",
          });
          setTimeout(() => {
            setCode("");
            setError(false);
          }, 600);
        }
        return newCode;
      }
      return newCode;
    });
  }, [onUnlock]);

  const handleDelete = useCallback(() => {
    setCode(prev => prev.slice(0, -1));
    setError(false);
  }, []);

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-xl">
      <div className="flex flex-col items-center gap-8 p-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gradient-primary">secureguard</h1>
        </div>

        <div className="flex flex-col items-center gap-6">
          <p className="text-sm text-muted-foreground">Enter PIN to unlock</p>

          {/* PIN dots */}
          <div className="flex gap-3">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className={cn(
                  "w-4 h-4 rounded-full border-2 transition-all duration-200",
                  code.length > i
                    ? error
                      ? "bg-destructive border-destructive"
                      : "bg-primary border-primary"
                    : "border-muted-foreground/50"
                )}
              />
            ))}
          </div>

          {/* Numeric keypad */}
          <div className="grid grid-cols-3 gap-3">
            {digits.map((digit, i) => {
              if (digit === "") return <div key={i} />;
              if (digit === "del") {
                return (
                  <button
                    key={i}
                    onClick={handleDelete}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors active:scale-95"
                  >
                    <Delete className="w-6 h-6" />
                  </button>
                );
              }
              return (
                <button
                  key={i}
                  onClick={() => handleDigit(digit)}
                  className={cn(
                    "w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center",
                    "text-xl sm:text-2xl font-semibold text-foreground",
                    "bg-muted/30 border border-border/50",
                    "hover:bg-muted/60 transition-all active:scale-95",
                    error && "animate-shake"
                  )}
                >
                  {digit}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
