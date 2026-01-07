import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock } from "lucide-react";

interface LogEntry {
  id: number;
  player: string;
  action: string;
  timestamp: string;
  color: "primary" | "secondary";
}

interface HistoryLogProps {
  logs: LogEntry[];
}

export function HistoryLog({ logs }: HistoryLogProps) {
  return (
    <div className="w-full h-full flex flex-col glass-panel rounded-xl overflow-hidden border-white/5">
      <div className="p-4 border-b border-white/5 flex items-center gap-2 bg-black/20">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-mono text-sm text-muted-foreground uppercase tracking-wider">Match Log</h3>
      </div>
      <ScrollArea className="flex-1 p-4 h-[200px] sm:h-auto">
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {logs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between text-sm font-mono border-l-2 pl-3 py-1 bg-gradient-to-r from-white/5 to-transparent"
                style={{ borderLeftColor: log.color === "primary" ? "hsl(var(--primary))" : "hsl(var(--secondary))" }}
              >
                <div className="flex flex-col">
                  <span className={log.color === "primary" ? "text-primary font-bold" : "text-secondary font-bold"}>
                    {log.player}
                  </span>
                  <span className="text-muted-foreground text-xs">{log.timestamp}</span>
                </div>
                <span className="text-white font-bold tracking-wider">{log.action}</span>
              </motion.div>
            ))}
          </AnimatePresence>
          {logs.length === 0 && (
            <div className="text-center text-muted-foreground/50 py-8 text-xs font-mono">
              WAITING FOR INPUT...
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
