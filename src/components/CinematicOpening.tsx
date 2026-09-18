import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

interface CinematicOpeningProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

export const CinematicOpening: React.FC<CinematicOpeningProps> = ({
  onComplete,
  autoPlay = true,
}) => {
  // Animation timeline phases:
  // "init" -> "emblem-assemble" -> "split-doors" -> "complete"
  const [phase, setPhase] = useState<"init" | "emblem-assemble" | "split-doors" | "complete">("init");
  const [isMounted, setIsMounted] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // High-fidelity Web Audio Synth for Hospital-Grade acoustic branding
  const getAudioContext = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  };

  const playCinematicAudio = (type: "assemble" | "whoosh") => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      if (type === "assemble") {
        // Lush harmonic major chord (C4, G4, C5, E5, B5, C6) with soft attack and warm decay
        const frequencies = [261.63, 392.00, 523.25, 659.25, 987.77, 1046.50];
        
        // Deep sub-harmonic warmth
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = "sine";
        subOsc.frequency.setValueAtTime(130.81, now); // C3
        subGain.gain.setValueAtTime(0.001, now);
        subGain.gain.linearRampToValueAtTime(0.06, now + 0.3);
        subGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
        subOsc.connect(subGain);
        subGain.connect(ctx.destination);
        subOsc.start(now);
        subOsc.stop(now + 1.4);

        // Shimmering chimes
        frequencies.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + i * 0.05);

          const startTime = now + i * 0.05;
          gain.gain.setValueAtTime(0.0001, startTime);
          gain.gain.linearRampToValueAtTime(0.05 / (i * 0.4 + 1), startTime + 0.08);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.2);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 1.2);
        });
      } else if (type === "whoosh") {
        // Smooth soothing air sweep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.6);
        
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.07, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.6);
      }
    } catch {
      // AudioContext unavailable or restricted
    }
  };

  useEffect(() => {
    // Unlock Web Audio on any initial interaction if browser suspended it
    const unlockAudio = () => {
      getAudioContext();
    };
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  useEffect(() => {
    if (!autoPlay) return;

    // 0.15s — Emblem Assembles with lush harmonic acoustic chime
    const t1 = setTimeout(() => {
      setPhase("emblem-assemble");
      playCinematicAudio("assemble");
    }, 150);

    // 1.8s — Seamless Light Split Doors Parting with soft whoosh
    const t2 = setTimeout(() => {
      setPhase("split-doors");
      playCinematicAudio("whoosh");
    }, 1800);

    // 2.4s — Completion callback
    const t3 = setTimeout(() => {
      setPhase("complete");
      if (onComplete) onComplete();
    }, 2400);

    // 2.7s — Unmount
    const t4 = setTimeout(() => {
      setIsMounted(false);
    }, 2700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [autoPlay]);

  if (!isMounted) return null;

  const isSplitting = phase === "split-doors" || phase === "complete";

  return (
    <motion.div 
      className={`fixed inset-0 z-[99999] select-none overflow-hidden font-sans ${isSplitting ? "pointer-events-none" : ""}`}
      id="cinematic-opening-stage"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      {/* ─── LEFT PRISTINE LIGHT VAULT DOOR PANEL ─── */}
      <motion.div
        className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-br from-white via-slate-50 to-blue-50/80 border-r border-blue-200/70 shadow-[20px_0_50px_rgba(37,99,235,0.08)] overflow-hidden flex items-center justify-end z-20"
        initial={{ x: "0%" }}
        animate={{ x: isSplitting ? "-102%" : "0%" }}
        transition={{
          duration: 0.65,
          ease: [0.16, 1, 0.3, 1], // Smooth Apple-grade deceleration curve
        }}
      >
        {/* Subtle Architectural Dot Matrix Grid */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#3b82f6_0.75px,transparent_0.75px)] [background-size:20px_20px]" />
        
        {/* Soft Ambient Light Halo */}
        <div className="absolute -right-24 top-1/2 -translate-y-1/2 w-80 h-80 bg-blue-400/10 rounded-full blur-[80px] pointer-events-none" />
        
        {/* Elegant Center Seam Highlight */}
        <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-blue-500/30 to-transparent" />
      </motion.div>

      {/* ─── RIGHT PRISTINE LIGHT VAULT DOOR PANEL ─── */}
      <motion.div
        className="absolute top-0 bottom-0 right-0 w-1/2 bg-gradient-to-bl from-white via-slate-50 to-sky-50/80 border-l border-blue-200/70 shadow-[-20px_0_50px_rgba(37,99,235,0.08)] overflow-hidden flex items-center justify-start z-20"
        initial={{ x: "0%" }}
        animate={{ x: isSplitting ? "102%" : "0%" }}
        transition={{
          duration: 0.65,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        {/* Subtle Architectural Dot Matrix Grid */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#3b82f6_0.75px,transparent_0.75px)] [background-size:20px_20px]" />
        
        {/* Soft Ambient Light Halo */}
        <div className="absolute -left-24 top-1/2 -translate-y-1/2 w-80 h-80 bg-sky-400/10 rounded-full blur-[80px] pointer-events-none" />
        
        {/* Elegant Center Seam Highlight */}
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-blue-500/30 to-transparent" />
      </motion.div>

      {/* ─── CENTER HOSPYN EMBLEM & BRANDING (PURE CLEAN PRESENTATION) ─── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30 px-4">
        <AnimatePresence>
          {!isSplitting && (
            <motion.div
              key="hospyn-light-nexus"
              className="flex flex-col items-center justify-center text-center relative max-w-md w-full"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={
                phase === "init"
                  ? { opacity: 0, scale: 0.92 }
                  : { opacity: 1, scale: 1.0 }
              }
              exit={{
                opacity: 0,
                scale: 1.15,
                filter: "blur(8px)",
                transition: { duration: 0.4, ease: "easeOut" }
              }}
              transition={{
                duration: 0.55,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {/* Soft Luminous Medical Aura (Blue & Cyan) */}
              <motion.div
                className="absolute w-64 h-64 rounded-full bg-gradient-to-tr from-blue-400/20 via-sky-300/20 to-indigo-300/20 blur-3xl -z-10"
                animate={{
                  scale: [1, 1.12, 1],
                  opacity: [0.6, 0.85, 0.6],
                }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Pulsing Concentric Rings */}
              <motion.div 
                className="absolute w-44 h-44 rounded-full border border-blue-300/40 -z-10"
                animate={{ scale: [0.85, 1.3], opacity: [0.5, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
              />
              <motion.div 
                className="absolute w-56 h-56 rounded-full border border-sky-400/30 -z-10"
                animate={{ scale: [0.9, 1.45], opacity: [0.4, 0] }}
                transition={{ duration: 1.8, delay: 0.5, repeat: Infinity, ease: "easeOut" }}
              />

              {/* ─── THE 4-PETAL RADIANT EMBLEM (CRISP MEDICAL PALETTE) ─── */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 mb-4">
                <svg
                  className="w-full h-full drop-shadow-[0_10px_25px_rgba(37,99,235,0.25)]"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="lightPetalTop" x1="50" y1="7" x2="50" y2="43" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#2563eb" />
                    </linearGradient>
                    <linearGradient id="lightPetalBottom" x1="50" y1="57" x2="50" y2="93" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                    <linearGradient id="lightPetalLeft" x1="7" y1="50" x2="43" y2="50" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#2563eb" />
                    </linearGradient>
                    <linearGradient id="lightPetalRight" x1="57" y1="50" x2="93" y2="50" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#2563eb" />
                    </linearGradient>
                  </defs>

                  {/* 4 Radial Petals with Staggered Scale Animation */}
                  <motion.ellipse 
                    cx="50" cy="25" rx="13" ry="18" fill="url(#lightPetalTop)"
                    initial={{ y: -12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
                  />
                  <motion.ellipse 
                    cx="50" cy="75" rx="13" ry="18" fill="url(#lightPetalBottom)"
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.45, delay: 0.18, ease: "easeOut" }}
                  />
                  <motion.ellipse 
                    cx="25" cy="50" rx="18" ry="13" fill="url(#lightPetalLeft)"
                    initial={{ x: -12, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.45, delay: 0.26, ease: "easeOut" }}
                  />
                  <motion.ellipse 
                    cx="75" cy="50" rx="18" ry="13" fill="url(#lightPetalRight)"
                    initial={{ x: 12, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.45, delay: 0.34, ease: "easeOut" }}
                  />
                </svg>
              </div>

              {/* Hospyn Typography & Motto in High-Contrast Deep Navy */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="flex flex-col items-center"
              >
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 font-sans leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                  Hospyn
                </h1>
                <p className="text-[12px] sm:text-[13px] font-extrabold tracking-[0.22em] uppercase text-blue-600 mt-2">
                  Where Every Hospital Becomes One
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── VERTICAL SEAM SOFT BLUE LIGHT BURST ON DOOR SEPARATION ─── */}
      <AnimatePresence>
        {isSplitting && (
          <motion.div
            key="cine-light-seam"
            className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-gradient-to-b from-transparent via-blue-400 to-transparent z-40"
            initial={{ opacity: 0.8, scaleY: 0.3 }}
            animate={{ opacity: 0, scaleY: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
