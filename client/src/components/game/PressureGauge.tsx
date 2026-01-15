import { motion } from "framer-motion";

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

  const radius = 80;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  // Semi-circle gauge (240 degrees)
  const arcLength = 240; // degrees
  const arcFraction = arcLength / 360;

  // Correct strokeDashoffset to start at -210deg (top-left-ish)
  const dashArray = circumference * arcFraction;
  const dashOffset = dashArray * (1 - percentage / 100);

  return (
    <div className="relative flex flex-col items-center justify-center glass-panel p-6 rounded-2xl border-white/5 bg-black/40 box-glow overflow-hidden h-full">
      <div className="absolute top-2 left-2 flex items-center gap-1 opacity-50">
        <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
        <span className="text-[8px] font-mono uppercase tracking-tighter">Live_Telemetry</span>
      </div>

      <div className="relative w-48 h-48">
        {/* SVG Gauge */}
        <svg
          height="192"
          width="192"
          viewBox="0 0 192 192"
        >
          {/* Rotate the group so -210° matches the start */}
          <g transform="rotate(-210 96 96)">
            {/* Background Track */}
            <circle
              stroke="hsl(var(--muted) / 0.3)"
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashArray} ${circumference}`}
              strokeLinecap="round"
              r={normalizedRadius}
              cx="96"
              cy="96"
            />
            {/* Progress Bar */}
            <motion.circle
              stroke={getColor()}
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashArray} ${circumference}`}
              strokeLinecap="round"
              animate={{
                strokeDashoffset: dashOffset,
                stroke: getColor(),
              }}
              transition={{ type: "spring", stiffness: 80, damping: 20 }}
              r={normalizedRadius}
              cx="96"
              cy="96"
              style={{ filter: `drop-shadow(0 0 8px ${getColor()}66)` }}
            />
          </g>

          {/* Tick Marks */}
          {[...Array(9)].map((_, i) => {
            const angle = (i * (arcLength / 8)) - 30; // -30 to 210
            const x1 = 96 + (normalizedRadius - 15) * Math.cos((angle * Math.PI) / 180);
            const y1 = 96 + (normalizedRadius - 15) * Math.sin((angle * Math.PI) / 180);
            const x2 = 96 + (normalizedRadius - 5) * Math.cos((angle * Math.PI) / 180);
            const y2 = 96 + (normalizedRadius - 5) * Math.sin((angle * Math.PI) / 180);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="white"
                strokeOpacity={0.2}
                strokeWidth="1"
              />
            );
          })}
        </svg>

        {/* Center Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={Math.round(percentage)}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-black font-display tracking-tighter"
            style={{ color: getColor() }}
          >
            {Math.round(percentage)}
          </motion.span>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest -mt-1">PSI_LNK</span>
        </div>
      </div>

      <div className="w-full mt-4 flex justify-between items-center px-4">
        <div className="flex flex-col">
          <span className="text-[8px] font-mono text-muted-foreground uppercase">Stability</span>
          <span className={percentage > 80 ? "text-destructive font-bold text-xs" : "text-primary text-xs"}>
            {percentage > 80 ? "CRITICAL" : "STABLE"}
          </span>
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div className="flex flex-col items-end">
          <span className="text-[8px] font-mono text-muted-foreground uppercase">Load_Factor</span>
          <span className="text-white text-xs font-bold">{(percentage * 0.42).toFixed(1)} G</span>
        </div>
      </div>

      {percentage >= 90 && (
        <motion.div 
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 0.1, repeat: Infinity }}
          className="absolute inset-0 border-2 border-destructive/50 rounded-2xl pointer-events-none"
        />
      )}
    </div>
  );
}

