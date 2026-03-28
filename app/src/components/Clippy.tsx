'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ClippyState = 'idle' | 'wave' | 'think' | 'static';

interface ClippyProps {
  message?: string;
  onAsk?: (question: string) => void;
}

// Sprite strip configs: each strip is a horizontal sequence of 200x200 frames
const ANIM_STRIPS: Record<string, { src: string; frames: number; frameW: number; frameH: number; fps: number }> = {
  idle: { src: '/sprites/clippy-anim-idle.png', frames: 4, frameW: 200, frameH: 200, fps: 3 },
  wave: { src: '/sprites/clippy-anim-wave.png', frames: 4, frameW: 200, frameH: 200, fps: 4 },
  think: { src: '/sprites/clippy-anim-think.png', frames: 4, frameW: 200, frameH: 200, fps: 2 },
};

// Fallback static sprites
const STATIC_SPRITES: Record<string, string> = {
  idle: '/sprites/clippy-idle.png',
  wave: '/sprites/clippy-wave.png',
  think: '/sprites/clippy-thinking.png',
};

function SpriteAnimator({ animation, size = 100 }: { animation: string; size?: number }) {
  const config = ANIM_STRIPS[animation];
  const [stripLoaded, setStripLoaded] = useState<Record<string, boolean>>({});
  const [frame, setFrame] = useState(0);

  // Check if strip is available
  useEffect(() => {
    if (!config) return;
    const img = new Image();
    img.onload = () => setStripLoaded(prev => ({ ...prev, [animation]: true }));
    img.onerror = () => setStripLoaded(prev => ({ ...prev, [animation]: false }));
    img.src = config.src;
  }, [animation, config]);

  // Animate frames
  useEffect(() => {
    if (!config || !stripLoaded[animation]) return;
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % config.frames);
    }, 1000 / config.fps);
    return () => clearInterval(interval);
  }, [animation, config, stripLoaded]);

  // Use sprite strip animation if available
  if (config && stripLoaded[animation]) {
    const scale = size / config.frameH;
    const fw = config.frameW * scale;
    const totalW = config.frames * fw;
    return (
      <div
        style={{
          width: fw,
          height: size,
          backgroundImage: `url(${config.src})`,
          backgroundSize: `${totalW}px ${size}px`,
          backgroundPosition: `-${frame * fw}px 0`,
          backgroundRepeat: 'no-repeat',
        }}
      />
    );
  }

  // Fallback to static sprite
  const staticSrc = STATIC_SPRITES[animation] || STATIC_SPRITES.idle;
  return (
    <img
      src={staticSrc}
      alt="Clippy"
      style={{ width: size * 0.7, height: size, objectFit: 'contain' }}
      draggable={false}
    />
  );
}

export default function Clippy({ message, onAsk }: ClippyProps) {
  const [pos, setPos] = useState({ x: -1, y: -1 });
  const [currentAnim, setCurrentAnim] = useState<ClippyState>('idle');
  const [showBubble, setShowBubble] = useState(!!message);
  const [bubbleText, setBubbleText] = useState(message || '');
  const [showInput, setShowInput] = useState(false);
  const [inputText, setInputText] = useState('');
  const [idleTimer, setIdleTimer] = useState(0);
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);
  const isDragging = useRef(false);

  // Initialize position
  useEffect(() => {
    setPos({ x: window.innerWidth - 140, y: window.innerHeight - 200 });
  }, []);

  // Idle cycle
  useEffect(() => {
    const interval = setInterval(() => setIdleTimer(t => t + 1), 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showBubble) return; // Don't auto-cycle when showing bubble
    const cycle: ClippyState[] = ['idle', 'idle', 'idle', 'wave', 'idle', 'think', 'idle', 'idle'];
    setCurrentAnim(cycle[idleTimer % cycle.length]);
  }, [idleTimer, showBubble]);

  // Handle external messages
  useEffect(() => {
    if (message) {
      setBubbleText(message);
      setShowBubble(true);
      setCurrentAnim('wave');
      setIdleTimer(0);
      // Auto-hide after 8 seconds
      const timeout = setTimeout(() => {
        setShowBubble(false);
        setShowInput(false);
      }, 8000);
      return () => clearTimeout(timeout);
    }
  }, [message]);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = false;
    dragRef.current = { startX: e.clientX, startY: e.clientY, posX: pos.x, posY: pos.y };
    const handleMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) isDragging.current = true;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 100, dragRef.current.posX + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 140, dragRef.current.posY + dy)),
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
    if (isDragging.current) return;
    if (showBubble && showInput) {
      // Already showing input, close
      setShowBubble(false);
      setShowInput(false);
    } else {
      // Show prominent ask interface
      setBubbleText("It looks like you're exploring LA city government! What would you like to know?");
      setShowBubble(true);
      setShowInput(true);
      setCurrentAnim('wave');
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
      setCurrentAnim('think');
    }
  };

  if (pos.x === -1) return null;

  return (
    <div className="fixed select-none" style={{ left: pos.x, top: pos.y, zIndex: 9999 }}>
      {/* Speech bubble — prominent XP-style dialog */}
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{
              position: 'absolute',
              bottom: '100%',
              right: -20,
              marginBottom: 12,
              minWidth: 280,
              maxWidth: 340,
            }}
          >
            <div className="relative"
              style={{
                background: 'linear-gradient(180deg, #FFFFF0 0%, #FFFFCC 100%)',
                border: '2px solid #B8860B',
                borderRadius: 12,
                boxShadow: '3px 4px 12px rgba(0,0,0,0.35), 0 0 0 1px rgba(184,134,11,0.3)',
                padding: '12px 14px',
              }}>
              {/* Title bar */}
              <div className="flex items-center gap-2 mb-2 pb-2" style={{ borderBottom: '1px solid rgba(184,134,11,0.2)' }}>
                <span className="text-[16px]">📎</span>
                <span className="text-[12px] font-bold text-[#5C4000]">Clippy — Civic Assistant</span>
                <div className="flex-1" />
                <button
                  className="w-[18px] h-[18px] rounded-sm flex items-center justify-center text-[10px] text-[#8B7000] hover:bg-[rgba(184,134,11,0.15)] transition-colors"
                  onClick={(e) => { e.stopPropagation(); setShowBubble(false); setShowInput(false); }}
                >
                  ✕
                </button>
              </div>

              {/* Message */}
              <p className="text-[12px] text-[#333] leading-[17px] mb-1">{bubbleText}</p>

              {/* Ask input */}
              {showInput && (
                <form onSubmit={handleSubmit} className="mt-3">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      className="flex-1 px-2 py-1.5 text-[12px] rounded border-2 outline-none transition-colors"
                      style={{
                        borderColor: '#B0C0D0',
                        background: 'white',
                      }}
                      onFocus={e => (e.target.style.borderColor = '#3168D5')}
                      onBlur={e => (e.target.style.borderColor = '#B0C0D0')}
                      placeholder="Ask about LA city government..."
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-1.5 mt-2 justify-end">
                    <button type="submit" className="xp-button text-[11px] font-bold px-4">
                      Search
                    </button>
                    <button type="button" className="xp-button text-[11px] px-3"
                      onClick={() => { setShowBubble(false); setShowInput(false); }}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Quick suggestions when input is shown */}
              {showInput && (
                <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(184,134,11,0.15)' }}>
                  <div className="text-[9px] text-[#999] mb-1 uppercase tracking-wider">Try asking:</div>
                  <div className="flex flex-wrap gap-1">
                    {['rent stabilization', 'transit signal priority', 'who represents Venice?'].map(q => (
                      <button
                        key={q}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(184,134,11,0.08)] text-[#6B5000] hover:bg-[rgba(184,134,11,0.18)] transition-colors cursor-pointer border border-[rgba(184,134,11,0.15)]"
                        onClick={() => { setInputText(q); }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Speech bubble pointer */}
            <div style={{
              position: 'absolute',
              bottom: -12,
              right: 35,
              width: 0,
              height: 0,
              borderLeft: '12px solid transparent',
              borderRight: '12px solid transparent',
              borderTop: '12px solid #B8860B',
            }} />
            <div style={{
              position: 'absolute',
              bottom: -9,
              right: 37,
              width: 0,
              height: 0,
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderTop: '10px solid #FFFFCC',
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clippy character — animated sprite */}
      <motion.div
        className="cursor-pointer"
        onMouseDown={handleDragStart}
        onClick={handleClick}
        title="Click me for help!"
        whileHover={{ scale: 1.05 }}
        animate={currentAnim === 'wave' ? { y: [0, -5, 0] } : {}}
        transition={{ duration: 0.3 }}
        style={{ filter: 'drop-shadow(2px 3px 4px rgba(0,0,0,0.3))' }}
      >
        <SpriteAnimator animation={currentAnim === 'static' ? 'idle' : currentAnim} size={110} />
      </motion.div>
    </div>
  );
}
