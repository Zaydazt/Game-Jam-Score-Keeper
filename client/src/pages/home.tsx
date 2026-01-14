import { useState, useEffect } from "react";
import { ScoreCard } from "@/components/game/ScoreCard";
import { GameSetup } from "@/components/game/GameSetup";
import { HistoryLog } from "@/components/game/HistoryLog";
import { PressureGauge } from "@/components/game/PressureGauge";
import { Button } from "@/components/ui/button";
import { RotateCcw, Trophy, AlertTriangle } from "lucide-react";
import confetti from "canvas-confetti";
import bgImage from "@assets/generated_images/dark_digital_hexagon_grid_background_texture.png";
import { motion, useAnimation } from "framer-motion";

type GameState = "setup" | "playing" | "finished" | "exploded";

interface LogEntry {
  id: number;
  player: string;
  action: string;
  timestamp: string;
  color: "primary" | "secondary";
}

export default function Home() {
  const [gameState, setGameState] = useState<GameState>("setup");
  const [p1Name, setP1Name] = useState("Player 1");
  const [p2Name, setP2Name] = useState("Player 2");
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [targetScore, setTargetScore] = useState(10);
  const [history, setHistory] = useState<LogEntry[]>([]);
  const controls = useAnimation();

  // Pressure is derived from total points relative to target
  const pressure = Math.min(100, ((p1Score + p2Score) / (targetScore * 1.5)) * 100);

  useEffect(() => {
    if (pressure >= 100 && gameState === "playing") {
      handleExplosion();
    } else if (pressure >= 80 && gameState === "playing") {
      controls.start({
        x: [0, -2, 2, -2, 2, 0],
        transition: { duration: 0.1, repeat: Infinity }
      });
    } else {
      controls.stop();
      controls.set({ x: 0 });
    }
  }, [pressure, gameState, controls]);

  const handleExplosion = () => {
    setGameState("exploded");
    
    // Massive explosion confetti
    const end = Date.now() + 2000;
    const colors = ['#ff0000', '#ff8800', '#ffff00', '#ffffff'];

    (function frame() {
      confetti({
        particleCount: 15,
        angle: Math.random() * 360,
        spread: 360,
        origin: { x: Math.random(), y: Math.random() },
        colors: colors,
        startVelocity: 60,
        gravity: 0.5
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  const startGame = (p1: string, p2: string, max: number) => {
    setP1Name(p1);
    setP2Name(p2);
    setTargetScore(max);
    setP1Score(0);
    setP2Score(0);
    setHistory([]);
    setGameState("playing");
  };

  const addLog = (player: string, scoreChange: number, color: "primary" | "secondary") => {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const action = scoreChange > 0 ? `+${scoreChange} PTS` : `${scoreChange} PTS`;
    const newLog: LogEntry = {
      id: Date.now(),
      player,
      action,
      timestamp,
      color
    };
    setHistory(prev => [newLog, ...prev]);
  };

  const updateScore = (player: 1 | 2, amount: number) => {
    if (gameState !== "playing") return;

    if (player === 1) {
      const newScore = Math.max(0, p1Score + amount);
      setP1Score(newScore);
      addLog(p1Name, amount, "primary");
      if (newScore >= targetScore) handleWin(1);
    } else {
      const newScore = Math.max(0, p2Score + amount);
      setP2Score(newScore);
      addLog(p2Name, amount, "secondary");
      if (newScore >= targetScore) handleWin(2);
    }
  };

  const handleWin = (winner: 1 | 2) => {
    setGameState("finished");
    const color = winner === 1 ? "#00f3ff" : "#ff00ff";
    
    // Confetti effect
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: [color, "#ffffff"]
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: [color, "#ffffff"]
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  const resetGame = () => {
    setGameState("setup");
    setP1Score(0);
    setP2Score(0);
    setHistory([]);
  };

  const playAgain = () => {
    setP1Score(0);
    setP2Score(0);
    setHistory([]);
    setGameState("playing");
  };

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 font-body overflow-hidden relative"
      style={{ 
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <AnimatePresence>
        {gameState === "exploded" && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-destructive/20 backdrop-blur-xl"
          >
            <div className="text-center p-12 glass-panel rounded-3xl border-destructive box-glow border-4 max-w-lg mx-4">
              <AlertTriangle className="w-24 h-24 text-destructive mx-auto mb-6 animate-bounce" />
              <h2 className="text-6xl font-black font-display text-destructive mb-4 tracking-tighter">TOTAL_CRITICAL_FAILURE</h2>
              <p className="text-xl font-mono text-destructive/80 mb-8 uppercase tracking-widest">Pressure exceeded safety limits</p>
              <Button onClick={resetGame} size="lg" variant="destructive" className="h-16 px-12 text-xl font-display font-bold shadow-[0_0_30px_rgba(255,0,0,0.5)]">
                REBOOT SYSTEM
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 bg-background/80 pointer-events-none" />

      <motion.div 
        animate={controls}
        className="relative z-10 w-full max-w-6xl mx-auto flex flex-col h-full max-h-[90vh]"
      >
        
        <header className="mb-8 text-center">
          <h1 className="text-4xl md:text-6xl font-black font-display tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-secondary drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            NEON_SCORE
          </h1>
          {gameState !== "setup" && (
             <div className="inline-block mt-2 px-4 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent font-mono text-xs tracking-[0.2em]">
               TARGET: {targetScore}
             </div>
          )}
        </header>

        {gameState === "setup" && (
          <GameSetup onStart={startGame} />
        )}

        {gameState !== "setup" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full flex-1">
            
            <div className="lg:col-span-4 flex justify-center items-center">
              <ScoreCard 
                name={p1Name} 
                score={p1Score} 
                color="primary" 
                isActive={p1Score > p2Score}
                isWinner={gameState === "finished" && p1Score >= targetScore}
                onUpdateScore={(amt) => updateScore(1, amt)}
              />
            </div>

            <div className="lg:col-span-4 flex flex-col gap-4 h-[400px] lg:h-auto">
              <PressureGauge pressure={pressure} />
              
              <div className="flex-1 min-h-0">
                <HistoryLog logs={history} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 {gameState === "finished" ? (
                   <Button onClick={playAgain} className="h-12 bg-accent text-accent-foreground font-bold font-display hover:bg-accent/90">
                     <RotateCcw className="mr-2 h-4 w-4" /> REMATCH
                   </Button>
                 ) : (
                    <div className="col-span-2 flex justify-center items-center p-4 glass-panel rounded-xl text-muted-foreground font-mono text-xs">
                      {gameState === "exploded" ? "SYSTEM_FAILURE" : `FIRST TO ${targetScore} WINS`}
                    </div>
                 )}
                 {gameState === "finished" && (
                    <Button onClick={resetGame} variant="outline" className="h-12 border-white/20 hover:bg-white/10">
                      NEW SETUP
                    </Button>
                 )}
                  {gameState === "playing" && (
                    <Button onClick={resetGame} variant="ghost" className="col-span-2 text-muted-foreground hover:text-white">
                      ABORT MATCH
                    </Button>
                 )}
              </div>
            </div>

            <div className="lg:col-span-4 flex justify-center items-center">
              <ScoreCard 
                name={p2Name} 
                score={p2Score} 
                color="secondary" 
                isActive={p2Score > p1Score}
                isWinner={gameState === "finished" && p2Score >= targetScore}
                onUpdateScore={(amt) => updateScore(2, amt)}
              />
            </div>
            
          </div>
        )}
      </motion.div>

      <div className="absolute bottom-4 left-0 w-full text-center text-[10px] text-white/10 font-mono pointer-events-none">
        SYS.VER.2.0.4 // NEON_ENGINE ONLINE
      </div>
    </div>
  );
}
