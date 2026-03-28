'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ClippyPose = 'idle' | 'wave' | 'thinking' | 'excited' | 'reading' | 'sleeping' | 'gavel' | 'pointing';

interface ClippyProps {
  message?: string;
  pose?: ClippyPose;
  onAsk?: (question: string) => void;
}

const POSE_FILES: Record<ClippyPose, string> = {
  idle: '/sprites/clippy-idle.png',
  wave: '/sprites/clippy-wave.png',
  thinking: '/sprites/clippy-thinking.png',
  excited: '/sprites/clippy-excited.png',
  reading: '/sprites/clippy-reading.png',
  sleeping: '/sprites/clippy-sleeping.png',
  gavel: '/sprites/clippy-gavel.png',
  pointing: '/sprites/clippy-pointing.png',
};

// Fallback SVG Clippy if sprites haven't loaded
function ClippySVG({ pose }: { pose: ClippyPose }) {
  const eyeY = pose === 'sleeping' ? 18 : 16;
  const eyeOpen = pose !== 'sleeping';
  const bodyTilt = pose === 'thinking' ? -5 : pose === 'excited' ? 0 : pose === 'wave' ? 3 : 0;
  const jumpY = pose === 'excited' ? -5 : 0;

  return (
    <motion.svg
      width="80"
      height="100"
      viewBox="0 0 80 100"
      animate={{ y: jumpY, rotate: bodyTilt }}
      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
    >
      {/* Paperclip body */}
      <motion.path
        d="M25 85 L25 30 Q25 15 40 15 Q55 15 55 30 L55 70 Q55 80 45 80 Q35 80 35 70 L35 35 Q35 28 40 28 Q45 28 45 35 L45 65"
        fill="none"
        stroke="#808080"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Shine */}
      <path
        d="M28 85 L28 32 Q28 18 40 18"
        fill="none"
        stroke="#D0D0D0"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Left eye */}
      {eyeOpen ? (
        <g>
          <ellipse cx="35" cy={eyeY} rx="4" ry="5" fill="white" stroke="#404040" strokeWidth="1" />
          <circle cx="36" cy={eyeY} r="2" fill="#1A1A1A" />
          <circle cx="37" cy={eyeY - 1} r="0.7" fill="white" />
        </g>
      ) : (
        <line x1="31" y1={eyeY} x2="39" y2={eyeY} stroke="#404040" strokeWidth="1.5" strokeLinecap="round" />
      )}
      {/* Right eye */}
      {eyeOpen ? (
        <g>
          <ellipse cx="47" cy={eyeY} rx="4" ry="5" fill="white" stroke="#404040" strokeWidth="1" />
          <circle cx="48" cy={eyeY} r="2" fill="#1A1A1A" />
          <circle cx="49" cy={eyeY - 1} r="0.7" fill="white" />
        </g>
      ) : (
        <line x1="43" y1={eyeY} x2="51" y2={eyeY} stroke="#404040" strokeWidth="1.5" strokeLinecap="round" />
      )}
      {/* Eyebrows */}
      {pose === 'thinking' && (
        <>
          <line x1="31" y1="10" x2="38" y2="11" stroke="#404040" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="44" y1="9" x2="51" y2="12" stroke="#404040" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
      {pose === 'excited' && (
        <>
          <line x1="32" y1="8" x2="38" y2="10" stroke="#404040" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="44" y1="10" x2="50" y2="8" stroke="#404040" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
      {/* Wave arm */}
      {pose === 'wave' && (
        <motion.path
          d="M55 30 L65 20 L68 10"
          fill="none"
          stroke="#808080"
          strokeWidth="3"
          strokeLinecap="round"
          animate={{ rotate: [0, 15, 0, 15, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ transformOrigin: '55px 30px' }}
        />
      )}
      {/* Gavel */}
      {pose === 'gavel' && (
        <g>
          <line x1="55" y1="35" x2="70" y2="20" stroke="#8B4513" strokeWidth="2" strokeLinecap="round" />
          <rect x="65" y="12" width="12" height="8" rx="1" fill="#8B4513" stroke="#5C2D00" strokeWidth="0.5" />
        </g>
      )}
      {/* Reading paper */}
      {pose === 'reading' && (
        <g>
          <rect x="28" y="55" width="24" height="18" rx="1" fill="white" stroke="#808080" strokeWidth="0.5" />
          <line x1="31" y1="59" x2="49" y2="59" stroke="#C0C0C0" strokeWidth="0.5" />
          <line x1="31" y1="62" x2="49" y2="62" stroke="#C0C0C0" strokeWidth="0.5" />
          <line x1="31" y1="65" x2="42" y2="65" stroke="#C0C0C0" strokeWidth="0.5" />
          <line x1="31" y1="68" x2="46" y2="68" stroke="#C0C0C0" strokeWidth="0.5" />
        </g>
      )}
      {/* Sleeping Z */}
      {pose === 'sleeping' && (
        <motion.text
          x="55" y="8"
          fontSize="12"
          fill="#808080"
          fontWeight="bold"
          animate={{ opacity: [0, 1, 0], y: [8, 2, -4] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Z
        </motion.text>
      )}
    </motion.svg>
  );
}

export default function Clippy({ message, pose: externalPose, onAsk }: ClippyProps) {
  const [pos, setPos] = useState({ x: -1, y: -1 });
  const [currentPose, setCurrentPose] = useState<ClippyPose>(externalPose || 'idle');
  const [showBubble, setShowBubble] = useState(!!message);
  const [bubbleText, setBubbleText] = useState(message || '');
  const [showInput, setShowInput] = useState(false);
  const [inputText, setInputText] = useState('');
  const [spriteExists, setSpriteExists] = useState<Record<string, boolean>>({});
  const [idleTimer, setIdleTimer] = useState(0);
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);

  // Initialize position on mount
  useEffect(() => {
    setPos({ x: window.innerWidth - 120, y: window.innerHeight - 180 });
  }, []);

  // Check which sprites exist
  useEffect(() => {
    Object.entries(POSE_FILES).forEach(([pose, src]) => {
      const img = new Image();
      img.onload = () => setSpriteExists(prev => ({ ...prev, [pose]: true }));
      img.onerror = () => setSpriteExists(prev => ({ ...prev, [pose]: false }));
      img.src = src;
    });
  }, []);

  // Idle animation cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setIdleTimer(t => t + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (externalPose) {
      setCurrentPose(externalPose);
      return;
    }
    // Auto-cycle through idle poses
    const poses: ClippyPose[] = ['idle', 'idle', 'idle', 'thinking', 'idle', 'reading', 'idle'];
    if (idleTimer > 12) {
      setCurrentPose('sleeping');
    } else {
      setCurrentPose(poses[idleTimer % poses.length]);
    }
  }, [idleTimer, externalPose]);

  useEffect(() => {
    if (message) {
      setBubbleText(message);
      setShowBubble(true);
      setCurrentPose('wave');
      setIdleTimer(0);
    }
  }, [message]);

  // Reset idle timer on mouse move
  useEffect(() => {
    const handleMove = () => {
      if (currentPose === 'sleeping') {
        setCurrentPose('excited');
        setTimeout(() => setCurrentPose('idle'), 1000);
      }
      setIdleTimer(0);
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [currentPose]);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, posX: pos.x, posY: pos.y };

    const handleMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      setPos({
        x: dragRef.current.posX + (e.clientX - dragRef.current.startX),
        y: dragRef.current.posY + (e.clientY - dragRef.current.startY),
      });
    };

    const handleUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [pos]);

  const handleClick = () => {
    if (showBubble && !showInput) {
      setShowBubble(false);
    } else if (!showBubble) {
      setBubbleText("It looks like you're exploring LA city government! Need help finding something?");
      setShowBubble(true);
      setShowInput(true);
      setCurrentPose('wave');
      setIdleTimer(0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && onAsk) {
      onAsk(inputText.trim());
      setInputText('');
      setShowInput(false);
      setBubbleText('Let me look that up...');
      setCurrentPose('thinking');
    }
  };

  if (pos.x === -1) return null;

  return (
    <div
      className="fixed select-none"
      style={{ left: pos.x, top: pos.y, zIndex: 9999 }}
    >
      {/* Speech bubble */}
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="clippy-bubble mb-2"
            style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: 8 }}
          >
            <p className="text-[11px] text-[#1A1A1A] leading-[15px]">{bubbleText}</p>
            {showInput && (
              <form onSubmit={handleSubmit} className="mt-2 flex gap-1">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  className="win-border-sunken-deep bg-white px-1 py-0.5 text-[11px] flex-1 outline-none"
                  placeholder="Ask me anything..."
                  autoFocus
                />
                <button type="submit" className="win-button text-[10px]">Ask</button>
              </form>
            )}
            <button
              className="absolute top-1 right-1 text-[9px] text-[#808080] hover:text-[#1A1A1A] leading-none"
              onClick={(e) => { e.stopPropagation(); setShowBubble(false); setShowInput(false); }}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clippy character */}
      <div
        className="cursor-pointer"
        onMouseDown={handleDragStart}
        onClick={handleClick}
        title="Click me for help!"
      >
        {spriteExists[currentPose] ? (
          <motion.img
            src={POSE_FILES[currentPose]}
            alt={`Clippy ${currentPose}`}
            width={80}
            height={100}
            className="drop-shadow-lg"
            animate={currentPose === 'excited' ? { y: [0, -8, 0] } : {}}
            transition={currentPose === 'excited' ? { duration: 0.4, repeat: 2 } : {}}
            draggable={false}
          />
        ) : (
          <ClippySVG pose={currentPose} />
        )}
      </div>
    </div>
  );
}
