'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BootSequenceProps {
  onComplete: () => void;
}

const BOOT_LINES = [
  { text: 'CityOS v1.0 — Los Angeles Civic Intelligence Platform', delay: 0 },
  { text: 'Copyright (c) 2026 askLA Project', delay: 200 },
  { text: '', delay: 400 },
  { text: 'Initializing civic database...', delay: 600 },
  { text: '  [OK] PrimeGov API connection established', delay: 1000 },
  { text: '  [OK] 10,698 meetings indexed', delay: 1400 },
  { text: '  [OK] 1,590 transcripts loaded (20.9M words)', delay: 1800 },
  { text: '  [OK] 10,672 agenda documents available', delay: 2200 },
  { text: '  [OK] Vector search engine ready', delay: 2600 },
  { text: '', delay: 2800 },
  { text: 'Loading council member profiles...', delay: 3000 },
  { text: '  [OK] 15 active council districts mapped', delay: 3300 },
  { text: '  [OK] Voting alignment matrix computed', delay: 3600 },
  { text: '', delay: 3800 },
  { text: 'Activating civic assistant (Clippy v2.0)...', delay: 4000 },
  { text: '  [OK] LLM backend connected', delay: 4300 },
  { text: '  [OK] Sprite animations loaded', delay: 4600 },
  { text: '', delay: 4800 },
  { text: 'Starting CityOS desktop environment...', delay: 5000 },
];

export default function BootSequence({ onComplete }: BootSequenceProps) {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [phase, setPhase] = useState<'boot' | 'splash' | 'done'>('boot');
  const [skipHint, setSkipHint] = useState(false);

  useEffect(() => {
    const showSkipTimer = setTimeout(() => setSkipHint(true), 1500);

    BOOT_LINES.forEach((line, i) => {
      setTimeout(() => {
        setVisibleLines(i + 1);
        if (i === BOOT_LINES.length - 1) {
          setTimeout(() => setPhase('splash'), 800);
        }
      }, line.delay);
    });

    return () => clearTimeout(showSkipTimer);
  }, []);

  useEffect(() => {
    if (phase === 'splash') {
      setTimeout(() => {
        setPhase('done');
        onComplete();
      }, 2000);
    }
  }, [phase, onComplete]);

  const handleSkip = () => {
    setPhase('done');
    onComplete();
  };

  if (phase === 'done') return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden"
        style={{ zIndex: 99999 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {phase === 'boot' && (
          <div className="w-full max-w-2xl p-8 font-mono text-[#33FF33] text-[13px] leading-[20px] crt-flicker">
            {/* Scan line overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.1) 2px, rgba(0,255,0,0.1) 4px)',
              }}
            />

            {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
              <div key={i}>
                {line.text === '' ? (
                  <br />
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.1 }}
                  >
                    {line.text.startsWith('  [OK]') ? (
                      <span>
                        <span className="text-[#00FF00]">  [OK]</span>
                        <span className="text-[#33FF33]">{line.text.slice(5)}</span>
                      </span>
                    ) : (
                      <span>{line.text}</span>
                    )}
                  </motion.div>
                )}
              </div>
            ))}

            {/* Blinking cursor */}
            {visibleLines < BOOT_LINES.length && (
              <span className="cursor-blink">_</span>
            )}

            {/* Skip hint */}
            {skipHint && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                className="absolute bottom-8 right-8 text-[#33FF33] text-[11px] cursor-pointer hover:opacity-100"
                onClick={handleSkip}
              >
                Press any key or click to skip...
              </motion.div>
            )}
          </div>
        )}

        {phase === 'splash' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.h1
              className="text-[64px] font-bold text-[#F5F1EB] tracking-tight"
              style={{ fontFamily: 'Georgia, serif' }}
              initial={{ y: 20 }}
              animate={{ y: 0 }}
            >
              ask<span className="text-[#40916C]">LA</span>
            </motion.h1>
            <motion.p
              className="text-[#808080] text-[14px] mt-2 tracking-widest uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              The City&apos;s Memory, Made Accessible
            </motion.p>
            <motion.div
              className="mt-8 w-48 h-1 bg-[#333] mx-auto rounded overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                className="h-full bg-[#40916C]"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
              />
            </motion.div>
          </motion.div>
        )}

        {/* Click anywhere to skip */}
        <div className="absolute inset-0" onClick={handleSkip} onKeyDown={handleSkip} />
      </motion.div>
    </AnimatePresence>
  );
}
