import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Trophy, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ScoreCardProps {
  name: string;
  score: number;
  color: "primary" | "secondary";
  isActive: boolean;
  onUpdateScore: (amount: number) => void;
  isWinner?: boolean;
}

export function ScoreCard({ name, score, color, isActive, onUpdateScore, isWinner }: ScoreCardProps) {
  const glowClass = color === "primary" ? "shadow-[0_0_30px_hsl(var(--primary)/0.3)] border-primary" : "shadow-[0_0_30px_hsl(var(--secondary)/0.3)] border-secondary";
  const textGlow = color === "primary" ? "text-glow-primary" : "text-glow-secondary";
  const bgGradient = color === "primary" 
    ? "bg-gradient-to-br from-primary/10 to-transparent" 
    : "bg-gradient-to-br from-secondary/10 to-transparent";

  return (
    <motion.div
      layout
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ 
        scale: isActive ? 1.05 : 1, 
        opacity: 1,
        borderColor: isActive ? (color === "primary" ? "hsl(var(--primary))" : "hsl(var(--secondary))") : "transparent"
      }}
      className={cn(
        "relative flex flex-col items-center p-8 rounded-2xl border-2 transition-all duration-300 glass-panel overflow-hidden",
        isActive ? glowClass : "border-border/50 opacity-80",
        bgGradient,
        isWinner && "ring-4 ring-accent ring-offset-4 ring-offset-background scale-110 z-10"
      )}
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
      
      {isWinner && (
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute top-4 text-accent"
        >
          <Trophy className="w-8 h-8 drop-shadow-[0_0_10px_rgba(255,255,0,0.5)]" />
        </motion.div>
      )}

      <h2 className="text-2xl font-bold font-display uppercase tracking-widest text-muted-foreground mb-4 mt-2">
        {name}
      </h2>

      <div className="relative mb-8">
        <motion.div
          key={score}
          initial={{ scale: 1.5, opacity: 0, filter: "blur(10px)" }}
          animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
          className={cn("text-9xl font-black font-display tabular-nums tracking-tighter", textGlow, color === "primary" ? "text-primary" : "text-secondary")}
        >
          {score}
        </motion.div>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-[200px]">
        <Button 
          variant="outline" 
          size="icon"
          className="h-12 w-12 rounded-full hover:bg-destructive/20 hover:text-destructive hover:border-destructive transition-colors"
          onClick={() => onUpdateScore(-1)}
          disabled={score <= 0 || isWinner}
        >
          <Minus className="w-5 h-5" />
        </Button>
        
        <Button 
          variant="outline" 
          className={cn(
            "h-12 col-span-1 rounded-full font-bold text-lg border-2",
            color === "primary" ? "hover:bg-primary/20 hover:border-primary text-primary" : "hover:bg-secondary/20 hover:border-secondary text-secondary"
          )}
          onClick={() => onUpdateScore(1)}
          disabled={isWinner}
        >
          +1
        </Button>

        <Button 
          variant="outline" 
          size="icon"
          className={cn(
            "h-12 w-12 rounded-full transition-colors",
             color === "primary" ? "hover:bg-primary/20 hover:border-primary text-primary" : "hover:bg-secondary/20 hover:border-secondary text-secondary"
          )}
          onClick={() => onUpdateScore(5)}
          disabled={isWinner}
        >
          <span className="font-bold text-xs">+5</span>
        </Button>
      </div>
    </motion.div>
  );
}
