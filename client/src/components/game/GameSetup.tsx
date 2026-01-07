import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Play, Settings2 } from "lucide-react";

interface GameSetupProps {
  onStart: (p1Name: string, p2Name: string, maxScore: number) => void;
}

export function GameSetup({ onStart }: GameSetupProps) {
  const [p1, setP1] = useState("Player 1");
  const [p2, setP2] = useState("Player 2");
  const [max, setMax] = useState("10");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(p1 || "Player 1", p2 || "Player 2", parseInt(max) || 10);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto p-8 glass-panel rounded-2xl box-glow"
    >
      <div className="flex items-center gap-3 mb-8">
        <Settings2 className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-display font-bold text-foreground">INITIALIZE_MATCH</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label className="text-primary font-mono uppercase text-xs tracking-widest">Player 1 Name</Label>
          <Input 
            value={p1} 
            onChange={(e) => setP1(e.target.value)} 
            className="bg-background/50 border-primary/30 focus-visible:ring-primary h-12 text-lg font-display"
            placeholder="CYBER_NINJA"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-secondary font-mono uppercase text-xs tracking-widest">Player 2 Name</Label>
          <Input 
            value={p2} 
            onChange={(e) => setP2(e.target.value)} 
            className="bg-background/50 border-secondary/30 focus-visible:ring-secondary h-12 text-lg font-display"
            placeholder="NEON_SAMURAI"
          />
        </div>

        <div className="space-y-2 pt-4">
          <Label className="text-accent font-mono uppercase text-xs tracking-widest">Target Score</Label>
          <div className="flex gap-4">
            {[5, 10, 21].map((val) => (
              <button
                type="button"
                key={val}
                onClick={() => setMax(val.toString())}
                className={`flex-1 py-2 rounded border border-accent/20 font-display font-bold transition-all ${
                  max === val.toString() ? "bg-accent text-accent-foreground" : "hover:bg-accent/10 text-accent"
                }`}
              >
                {val}
              </button>
            ))}
            <Input 
              type="number" 
              value={max} 
              onChange={(e) => setMax(e.target.value)}
              className="w-20 bg-background/50 border-accent/30 focus-visible:ring-accent font-display text-center"
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-14 mt-8 text-lg font-display tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
          <Play className="mr-2 w-5 h-5 fill-current" /> START MATCH
        </Button>
      </form>
    </motion.div>
  );
}
