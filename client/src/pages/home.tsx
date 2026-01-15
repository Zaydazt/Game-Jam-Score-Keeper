import { useState, useEffect } from "react";
import { ScoreCard } from "@/components/game/ScoreCard";
import { PressureGauge } from "@/components/game/PressureGauge";
import { HistoryLog } from "@/components/game/HistoryLog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import confetti from "canvas-confetti";

const successAudio = new Audio("/sounds/success.wav");
const failAudio = new Audio("/sounds/fail.wav");
const explosionAudio = new Audio("/sounds/explosion.wav");

const bgAudio = new Audio("/sounds/bg.wav");
bgAudio.loop = true;
bgAudio.volume = 0.2;

export default function Home() {
  // -----------------------------
  // Helper Functions
  const getPressureZone = (pressureValue: number) => {
    if (pressureValue <= 40) return "Green";
    if (pressureValue <= 75) return "Yellow";
    return "Red";
  };

  // -----------------------------
  // Core Game State
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [pressure, setPressure] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [comboTimer, setComboTimer] = useState(0);
  const [isExploding, setIsExploding] = useState(false);
  const [zonePopping, setZonePopping] = useState(false);
  const [lastZone, setLastZone] = useState(getPressureZone(0));
  const [history, setHistory] = useState<{ id: number; action: string }[]>([]);
  const [highScore, setHighScore] = useState(0);
  const controls = useAnimation();
  const [isMuted, setIsMuted] = useState(false);

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

  const WARNING_PRESSURE = 80;
  const CRITICAL_PRESSURE = 90;

  const COMBO_MAX_TIME = 5;
  const COMBO_MULTIPLIER_INCREMENT = 0.1;

  // -----------------------------
  // Effects

  // Pressure bleed bonus & natural loss
  useEffect(() => {
    const interval = setInterval(() => {
      setPressure((prev) => Math.max(prev - PRESSURE_LOSS, 0));

      // Pressure bleed bonus adds score over time
      setScore((prev) => {
        const bleedBonus = Math.round(pressure * 0.01); // 1% of pressure per second
        const newScore = prev + bleedBonus;
        if (newScore > highScore) setHighScore(newScore);
        return newScore;
      });
    }, PRESSURE_LOSS_INTERVAL);
    return () => clearInterval(interval);
  }, [pressure]);

  //background music
  useEffect(() => {
    if (isMuted) {
      bgAudio.pause();
    } else {
      bgAudio.play().catch(() => {
        // Browser blocks autoplay until user interacts
      });
    }

    return () => {
      bgAudio.pause();
    };
  }, [isMuted]);

  // Combo timer effect
  useEffect(() => {
    if (combo === 0) {
      setComboTimer(0);
      setComboMultiplier(1);
      return;
    }

    const timer = setInterval(() => {
      setComboTimer((prev) => {
        if (prev >= COMBO_MAX_TIME) {
          setCombo(0);
          setComboMultiplier(1);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [combo]);

  // Pressure shaking & zone pop animation
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

    const currentZone = getPressureZone(pressure);
    if (currentZone !== lastZone) {
      setZonePopping(true);
      setTimeout(() => setZonePopping(false), 200);
      setLastZone(currentZone);
    }
  }, [pressure]);

  // -----------------------------
  // Game Actions
  const addLog = (player: string, action: string) => {
    setHistory((prev) => [
      { id: Date.now(), action: `${player}: ${action}` },
      ...prev,
    ]);
  };

  const handleSuccess = () => {
    successAudio.currentTime = 0;
    successAudio.play();

    setComboTimer(0);

    const zone = getPressureZone(pressure);

    let scoreMultiplier = 1;
    let pressureMultiplier = 1;

    if (zone === "Yellow") {
      scoreMultiplier = YELLOW_MULTIPLIER;
      pressureMultiplier = YELLOW_MULTIPLIER;
    } else if (zone === "Red") {
      scoreMultiplier = RED_MULTIPLIER;
      pressureMultiplier = RED_MULTIPLIER;
    }

    setCombo((prev) => prev + 1);
    setComboMultiplier((prev) =>
      Math.min(prev + COMBO_MULTIPLIER_INCREMENT, 3),
    );

    const totalScoreMultiplier = scoreMultiplier * comboMultiplier;
    setScore((prev) => {
      const newScore = prev + BASE_POINTS * totalScoreMultiplier;
      if (newScore > highScore) setHighScore(newScore);
      return newScore;
    });

    setPressure((prev) =>
      Math.min(prev + PRESSURE_GAIN * pressureMultiplier, PRESSURE_MAX),
    );

    addLog(
      "PLAYER",
      `SUCCESS +${Math.round(BASE_POINTS * totalScoreMultiplier)} PTS`,
    );
  };

  const handleFail = () => {
    failAudio.currentTime = 0;
    failAudio.play();

    setCombo(0);
    setComboTimer(0);
    setComboMultiplier(1);

    setPressure((prev) => Math.max(prev - FAIL_PRESSURE_RELEASE, 0));
    addLog("PLAYER", "FAIL - PRESSURE RELEASED");
  };

  const handleReleasePressure = () => {
    setPressure((prev) => Math.max(prev - PRESSURE_RELEASE, 0));

    setCombo(0);
    setComboTimer(0);
    setComboMultiplier(1);

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

  const isWarning =
    pressure >= WARNING_PRESSURE && pressure < CRITICAL_PRESSURE;
  const isCritical = pressure >= CRITICAL_PRESSURE && pressure < PRESSURE_MAX;

  const handleExplosion = () => {
    explosionAudio.currentTime = 0;
    explosionAudio.play();
    setIsExploding(true);
    setTimeout(() => setIsExploding(false), 2000);
    setPressure(0);
    setCombo(0);
    setComboMultiplier(1);
    setComboTimer(0);

    addLog("SYSTEM", "AIR PRESSURE OVERLOAD!");

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
              <h2 className="text-4xl font-bold text-red-500 mb-2">
                AIR PRESSURE OVERLOAD!
              </h2>
              <Button
                onClick={handleReset}
                variant="destructive"
                className="mt-4"
              >
                RESET SYSTEM
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={controls}
        className="w-full max-w-xl flex flex-col items-center gap-6"
      >
        {/* Score & High Score */}
        <div className="text-center">
          <div className="text-3xl font-bold text-white">
            Score: {Math.round(score)}
          </div>
          <div className="text-xl text-white/70">
            High Score: {Math.round(highScore)}
          </div>
        </div>

        <PressureGauge pressure={pressure} />

        {/* System Alert */}
        {(isWarning || isCritical) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`w-full max-w-xl text-center px-4 py-2 rounded-lg border ${
              isCritical
                ? "bg-red-900/40 border-red-500 text-red-400"
                : "bg-yellow-900/40 border-yellow-400 text-yellow-300"
            }`}
          >
            <motion.div
              animate={{ opacity: isCritical ? [1, 0.4, 1] : 1 }}
              transition={{ duration: 0.8, repeat: isCritical ? Infinity : 0 }}
              className="font-mono text-sm tracking-widest"
            >
              {isCritical
                ? "⚠ CRITICAL PRESSURE — IMMINENT OVERLOAD"
                : "⚠ PRESSURE RISING — SYSTEM UNSTABLE"}
            </motion.div>
          </motion.div>
        )}

        {/* Pressure Bar */}
        <div
          className={`w-full h-6 rounded-full ${
            getPressureZone(pressure) === "Green"
              ? "bg-green-500"
              : getPressureZone(pressure) === "Yellow"
                ? "bg-yellow-500"
                : "bg-red-500"
          } transition-all`}
          style={{ width: `${(pressure / PRESSURE_MAX) * 100}%` }}
        />

        {/* Combo & Multiplier */}
        <div className="mt-2 text-center w-full max-w-xs">
          <motion.div
            className="flex justify-center items-baseline gap-2"
            animate={{
              scale: combo > 0 ? [1, 1.1, 1] : 1,
            }}
            transition={{ duration: 0.5, repeat: combo > 0 ? Infinity : 0 }}
          >
            <div className="text-2xl font-semibold text-white">
              Combo {combo}
            </div>
            <div className="text-xl font-bold text-glow-secondary">
              x{comboMultiplier.toFixed(1)}
            </div>
          </motion.div>

          {/* Combo Timer Bar */}
          {combo > 0 && (
            <div className="mt-1 h-5 w-full bg-gray-700 rounded-full overflow-hidden relative">
              <div
                className={`h-full transition-all ${
                  comboTimer < COMBO_MAX_TIME * 0.3
                    ? "bg-red-500"
                    : comboTimer < COMBO_MAX_TIME * 0.6
                      ? "bg-yellow-400"
                      : "bg-green-500"
                }`}
                style={{
                  width: `${((COMBO_MAX_TIME - comboTimer) / COMBO_MAX_TIME) * 100}%`,
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                {Math.max(COMBO_MAX_TIME - comboTimer, 0)}s
              </span>
            </div>
          )}
        </div>

        {/* Zone Multiplier */}
        <motion.div
          className={`mt-2 text-center zone-label ${zonePopping ? "zone-pop" : ""}`}
          animate={{
            scale: getPressureZone(pressure) !== "Green" ? [1, 1.1, 1] : 1,
          }}
          transition={{
            duration: 0.5,
            repeat: getPressureZone(pressure) !== "Green" ? Infinity : 0,
          }}
        >
          <div className="text-2xl font-bold text-white">
            Zone: {getPressureZone(pressure)} (
            {getPressureZone(pressure) === "Green"
              ? GREEN_MULTIPLIER.toFixed(1)
              : getPressureZone(pressure) === "Yellow"
                ? YELLOW_MULTIPLIER.toFixed(1)
                : RED_MULTIPLIER.toFixed(1)}
            )
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-4 flex-wrap justify-center">
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

        <Button variant="secondary" onClick={() => setIsMuted((prev) => !prev)}>
          {isMuted ? "🔇 Muted" : "🔊 Sound On"}
        </Button>

        {/* History Log */}
        <div className="w-full max-h-60 overflow-y-auto mt-4">
          <HistoryLog logs={history} />
        </div>
      </motion.div>
    </div>
  );
}
