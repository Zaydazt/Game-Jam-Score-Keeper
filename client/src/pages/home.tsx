import { useState, useEffect } from "react";
import { ScoreCard } from "@/components/game/ScoreCard";
import { PressureGauge } from "@/components/game/PressureGauge";
import { HistoryLog } from "@/components/game/HistoryLog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import confetti from "canvas-confetti";

const successAudio = new Audio("/sounds/success.wav");
const failAudio = new Audio("/sounds/fail.wav");
const explosionAudio = new Audio("/sounds/explosion.wav");

export default function Home() {
  // -----------------------------
  // Core Game State
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [pressure, setPressure] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [comboTimer, setComboTimer] = useState(0);
  const [isExploding, setIsExploding] = useState(false);
  const [zonePopping, setZonePopping] = useState(false);
  const [lastZone, setLastZone] = useState(getPressureZone());
  const [history, setHistory] = useState<{ id: number; action: string }[]>([]);
  const controls = useAnimation();

  // -----------------------------
  // Tuning Constants
  const BASE_POINTS = 1;
  const PRESSURE_GAIN = 10;
  const PRESSURE_MAX = 100;
  const PRESSURE_LOSS = 0.5;
  const PRESSURE_LOSS_INTERVAL = 1000;
  const FAIL_PRESSURE_RELEASE = 15;
  const PRESSURE_RELEASE = 10;

  const GREEN_MAX = 40;
  const YELLOW_MAX = 75;

  const GREEN_MULTIPLIER = 1;
  const YELLOW_MULTIPLIER = 1.5;
  const RED_MULTIPLIER = 2;

  const COMBO_MAX_TIME = 5;
  const COMBO_MULTIPLIER_INCREMENT = 0.1;

  // -----------------------------
  // Effects
  // Pressure decay
  useEffect(() => {
    const interval = setInterval(() => {
      setPressure((prev) => Math.max(prev - PRESSURE_LOSS, 0));
    }, PRESSURE_LOSS_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Combo timer effect
  useEffect(() => {
    if (combo === 0) {
      setComboTimer(0);
      return;
    }

    const timer = setInterval(() => {
      setComboTimer((prev) => {
        if (prev >= COMBO_MAX_TIME) {
          setCombo(0); // reset combo
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [combo]);

  // Explosion + shake
  useEffect(() => {
    if (pressure >= PRESSURE_MAX) {
      handleExplosion();
    } else if (pressure >= YELLOW_MAX) {
      controls.start({
        x: [0, -2, 2, -2, 2, 0],
        transition: { duration: 0.1, repeat: Infinity },
      });
    } else {
      controls.stop();
      controls.set({ x: 0 });
    }
  }, [pressure]);

  const handleExplosion = () => {
    explosionAudio.currentTime = 0;
    explosionAudio.play();

    setIsExploding(true);
    setTimeout(() => setIsExploding(false), 2000);
    setPressure(0);
    setCombo(0);
    setComboMultiplier(1);
    setComboTimer(0);

    useEffect(() => {
      const currentZone = getPressureZone();

      if (currentZone !== lastZone) {
        setZonePopping(true);
        setTimeout(() => setZonePopping(false), 200);
        setLastZone(currentZone);
      }
    }, [pressure]);


    // Confetti effect
    const end = Date.now() + 2000;
    const colors = ["#ff0000", "#ff8800", "#ffff00", "#ffffff"];

    (function frame() {
      confetti({
        particleCount: 15,
        angle: Math.random() * 360,
        spread: 360,
        origin: { x: Math.random(), y: Math.random() },
        colors: colors,
        startVelocity: 60,
        gravity: 0.5,
      });

      if (Date.now() < end) requestAnimationFrame(frame);
    })();

    addLog("SYSTEM", "AIR PRESSURE OVERLOAD!");
  };

  // -----------------------------
  // Helper Functions
  const getPressureZone = () => {
    if (pressure <= GREEN_MAX) return "Green";
    if (pressure <= YELLOW_MAX) return "Yellow";
    return "Red";
  };

  const getZoneMultiplier = () => {
    const zone = getPressureZone();
    if (zone === "Green") return GREEN_MULTIPLIER;
    if (zone === "Yellow") return YELLOW_MULTIPLIER;
    return RED_MULTIPLIER;
  };

  const getZoneColor = () => {
    const zone = getPressureZone();
    if (zone === "Green") return "bg-green-500";
    if (zone === "Yellow") return "bg-yellow-500";
    return "bg-red-500";
  };

  const addLog = (player: string, action: string) => {
    setHistory((prev) => [
      { id: Date.now(), action: `${player}: ${action}` },
      ...prev,
    ]);
  };

  // -----------------------------
  // Game Actions
  const handleSuccess = () => {
    successAudio.currentTime = 0;
    successAudio.play();

    setComboTimer(0); // reset combo timer whenever the player scores

    const zone = getPressureZone();

    let scoreMultiplier = 1;
    let pressureMultiplier = 1;

    if (zone === "Yellow") {
      scoreMultiplier = YELLOW_MULTIPLIER;
      pressureMultiplier = YELLOW_MULTIPLIER;
    } else if (zone === "Red") {
      scoreMultiplier = RED_MULTIPLIER;
      pressureMultiplier = RED_MULTIPLIER;
    }

    // Update combo
    setCombo((prev) => prev + 1);
    setComboMultiplier((prev) => Math.min(prev + COMBO_MULTIPLIER_INCREMENT, 3));

    // Apply score & pressure with multipliers
    const totalScoreMultiplier = scoreMultiplier * comboMultiplier;
    setScore((prev) => prev + BASE_POINTS * totalScoreMultiplier);
    setPressure((prev) => Math.min(prev + PRESSURE_GAIN * pressureMultiplier, PRESSURE_MAX));

    addLog("PLAYER", `SUCCESS +${Math.round(BASE_POINTS * totalScoreMultiplier)} PTS`);
  };

  const handleFail = () => {
    failAudio.currentTime = 0;
    failAudio.play();

    setCombo(0);
    setPressure((prev) => Math.max(prev - FAIL_PRESSURE_RELEASE, 0));
    addLog("PLAYER", "FAIL - PRESSURE RELEASED");
  };

  const handleReleasePressure = () => {
    setPressure((prev) => Math.max(prev - PRESSURE_RELEASE, 0));
    setCombo(0);
    addLog("PLAYER", "MANUAL PRESSURE RELEASE");
  };

  const handleReset = () => {
    setScore(0);
    setCombo(0);
    setPressure(0);
    setComboMultiplier(1);
    setComboTimer(0);
    setHistory([]);
  };

  // -----------------------------
  // UI
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-900 relative">
      <AnimatePresence>
        {isExploding && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/50 backdrop-blur-sm"
          >
            <div className="text-center p-8 bg-gray-800/80 rounded-2xl border-4 border-red-600">
              <AlertTriangle className="mx-auto mb-4 w-16 h-16 text-red-500 animate-bounce" />
              <h2 className="text-4xl font-bold text-red-500 mb-2">AIR PRESSURE OVERLOAD!</h2>
              <Button onClick={handleReset} variant="destructive" className="mt-4">
                RESET SYSTEM
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div animate={controls} className="w-full max-w-xl flex flex-col items-center gap-6">
        {/* Score */}
        <div className="text-6xl font-bold text-white">{Math.round(score)}</div>

        {/* Pressure Gauge */}
        <PressureGauge pressure={pressure} />

        {/* Zone */}
        <div
          className={`w-full h-6 rounded-full ${getZoneColor()} transition-all`}
          style={{ width: `${(pressure / PRESSURE_MAX) * 100}%` }}
        />

        {/* Combo & Multiplier */}
        <div className="mt-2 text-center">
          <div className="combo-value text-glow-primary">
            Combo {combo}
          </div>
          <div className="multiplier-value text-glow-secondary">
            x{comboMultiplier.toFixed(1)}
          </div>

        </div>

        {/* Zone Multiplier */}
        <div className={`mt-2 text-center zone-label ${zonePopping ? "zone-pop" : ""}`}>
          Zone: {getPressureZone()} (x{getZoneMultiplier().toFixed(1)})
        </div>



        {/* Action Buttons */}
        <div className="flex gap-4 mt-4">
          <Button onClick={handleSuccess}>SUCCESS</Button>
          <Button onClick={handleFail} variant="destructive">
            FAIL
          </Button>
          <Button onClick={handleReleasePressure} variant="secondary">
            RELEASE PRESSURE
          </Button>
          <Button onClick={handleReset} variant="outline">
            RESET
          </Button>
        </div>

        <div className="text-xs text-white/60 mt-2">
          🔊 Sound effects enabled
        </div>

        {/* History Log */}
        <div className="w-full max-h-60 overflow-y-auto mt-4">
          <HistoryLog logs={history} />
        </div>
      </motion.div>
    </div>
  );
}
