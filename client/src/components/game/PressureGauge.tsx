import { motion, AnimatePresence } from "framer-motion";

interface PressureGaugeProps {
  pressure: number;
}

export function PressureGauge({ pressure }: PressureGaugeProps) {
  const percentage = Math.min(100, Math.max(0, pressure));
  
  // Color based on pressure
  const getColor = () => {
    if (percentage < 30) return "hsl(var(--primary))";
    if (percentage < 70) return "hsl(var(--accent))";
    return "hsl(var(--destructive))";
  };

  return (
    <div className="w-full space-y-2 glass-panel p-4 rounded-xl border-white/5 bg-black/40">
      <div className="flex justify-between items-end mb-1">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em]">Pressure_Status</span>
        <span className="text-xl font-black font-display tracking-tighter" style={{ color: getColor() }}>
          {percentage.toFixed(0)}%
        </span>
      </div>
      
      <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ 
            width: `${percentage}%`,
            backgroundColor: getColor(),
            boxShadow: `0 0 20px ${getColor()}44`
          }}
          transition={{ type: "spring", stiffness: 50, damping: 15 }}
          className="h-full relative"
        >
          {/* Animated glow overlay */}
          <motion.div 
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-white/20"
          />
        </motion.div>
        
        {/* Critical markers */}
        <div className="absolute inset-0 flex justify-between px-2 pointer-events-none">
          {[20, 40, 60, 80].map(m => (
            <div key={m} className="h-full w-px bg-white/10" />
          ))}
        </div>
      </div>
      
      {percentage >= 80 && (
        <motion.div 
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.2, repeat: Infinity }}
          className="text-center text-[10px] font-mono text-destructive font-bold uppercase mt-2 tracking-widest"
        >
          Critical Pressure Detected
        </motion.div>
      )}
    </div>
  );
}
