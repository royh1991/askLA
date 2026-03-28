'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ClippyProps {
  message?: string;
  onAsk?: (question: string) => void;
}

export default function Clippy({ message, onAsk }: ClippyProps) {
  const [pos, setPos] = useState({ x: -1, y: -1 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [showBubble, setShowBubble] = useState(!!message);
  const [bubbleText, setBubbleText] = useState(message || '');
  const [showInput, setShowInput] = useState(false);
  const [inputText, setInputText] = useState('');
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);
  const isDragging = useRef(false);

  // Initialize position
  useEffect(() => {
    setPos({ x: window.innerWidth - 160, y: window.innerHeight - 210 });
  }, []);

  // Blink loop — blink every 3-6 seconds, eyes closed for 150ms
  useEffect(() => {
    const scheduleBlink = () => {
      const delay = 2500 + Math.random() * 3500;
      return setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 150);
        timerId = scheduleBlink();
      }, delay);
    };
    let timerId = scheduleBlink();
    return () => clearTimeout(timerId);
  }, []);

  // Handle external messages
  useEffect(() => {
    if (message) {
      setBubbleText(message);
      setShowBubble(true);
      const timeout = setTimeout(() => {
        if (!showInput) { setShowBubble(false); }
      }, 10000);
      return () => clearTimeout(timeout);
    }
  }, [message]);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = false;
    dragRef.current = { startX: e.clientX, startY: e.clientY, posX: pos.x, posY: pos.y };
    const move = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) isDragging.current = true;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 120, dragRef.current.posX + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 160, dragRef.current.posY + dy)),
      });
    };
    const up = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }, [pos]);

  const handleClick = () => {
    if (isDragging.current) return;
    if (showBubble && showInput) {
      setShowBubble(false);
      setShowInput(false);
    } else {
      setBubbleText("It looks like you're exploring LA city government! What would you like to know?");
      setShowBubble(true);
      setShowInput(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && onAsk) {
      onAsk(inputText.trim());
      setInputText('');
      setShowInput(false);
      setBubbleText('Let me look that up...');
    }
  };

  if (pos.x === -1) return null;

  return (
    <div className="fixed select-none" style={{ left: pos.x, top: pos.y, zIndex: 9999 }}>
      {/* Speech bubble */}
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
              right: -30,
              marginBottom: 14,
              minWidth: 290,
              maxWidth: 350,
            }}
          >
            <div style={{
              background: 'linear-gradient(180deg, #FFFFF0 0%, #FFFFCC 100%)',
              border: '2px solid #B8860B',
              borderRadius: 12,
              boxShadow: '3px 4px 12px rgba(0,0,0,0.35), 0 0 0 1px rgba(184,134,11,0.3)',
              padding: '12px 14px',
            }}>
              {/* Header */}
              <div className="flex items-center gap-2 mb-2 pb-2" style={{ borderBottom: '1px solid rgba(184,134,11,0.2)' }}>
                <span className="text-[15px]">📎</span>
                <span className="text-[12px] font-bold text-[#5C4000]">Clippy — Civic Assistant</span>
                <div className="flex-1" />
                <button
                  className="w-[18px] h-[18px] rounded-sm flex items-center justify-center text-[10px] text-[#8B7000] hover:bg-[rgba(184,134,11,0.15)]"
                  onClick={(e) => { e.stopPropagation(); setShowBubble(false); setShowInput(false); }}
                >
                  ✕
                </button>
              </div>

              <p className="text-[12px] text-[#333] leading-[17px]">{bubbleText}</p>

              {showInput && (
                <form onSubmit={handleSubmit} className="mt-3">
                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    className="w-full px-2 py-1.5 text-[12px] rounded border-2 outline-none"
                    style={{ borderColor: '#B0C0D0', background: 'white' }}
                    onFocus={e => (e.target.style.borderColor = '#3168D5')}
                    onBlur={e => (e.target.style.borderColor = '#B0C0D0')}
                    placeholder="Ask about LA city government..."
                    autoFocus
                  />
                  <div className="flex gap-1.5 mt-2 justify-end">
                    <button type="submit" className="xp-button text-[11px] font-bold px-4">Search</button>
                    <button type="button" className="xp-button text-[11px] px-3"
                      onClick={() => { setShowBubble(false); setShowInput(false); }}>Cancel</button>
                  </div>
                  <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(184,134,11,0.15)' }}>
                    <div className="text-[9px] text-[#999] mb-1 uppercase tracking-wider">Try asking:</div>
                    <div className="flex flex-wrap gap-1">
                      {['rent stabilization', 'transit signal priority', 'who represents Venice?'].map(q => (
                        <button key={q} type="button"
                          className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(184,134,11,0.08)] text-[#6B5000] hover:bg-[rgba(184,134,11,0.18)] border border-[rgba(184,134,11,0.15)] cursor-pointer"
                          onClick={() => setInputText(q)}>{q}</button>
                      ))}
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Pointer triangle */}
            <div style={{ position: 'absolute', bottom: -12, right: 45, width: 0, height: 0,
              borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '12px solid #B8860B' }} />
            <div style={{ position: 'absolute', bottom: -9, right: 47, width: 0, height: 0,
              borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '10px solid #FFFFCC' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clippy character — single image with code-driven animation */}
      <motion.div
        className="cursor-pointer"
        onMouseDown={handleDragStart}
        onClick={handleClick}
        title="Click me for help!"
        // Gentle idle bobbing — like the original Clippy "breathing"
        animate={{
          y: [0, -3, 0, -1, 0],
          rotate: [0, 0.5, 0, -0.5, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        whileHover={{ scale: 1.08 }}
        style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.9)) drop-shadow(0 0 3px rgba(255,255,255,0.7)) drop-shadow(2px 3px 6px rgba(0,0,0,0.3))' }}
      >
        {/* Layer both open and blink images, crossfade for blink */}
        <div style={{ position: 'relative', width: 140, height: 140 }}>
          <motion.img
            src="/sprites/clippy-main.png"
            alt="Clippy"
            width={140}
            height={140}
            style={{ position: 'absolute', top: 0, left: 0 }}
            animate={{ opacity: isBlinking ? 0 : 1 }}
            transition={{ duration: 0.06 }}
            draggable={false}
          />
          <motion.img
            src="/sprites/clippy-blink.png"
            alt="Clippy blinking"
            width={140}
            height={140}
            style={{ position: 'absolute', top: 0, left: 0 }}
            animate={{ opacity: isBlinking ? 1 : 0 }}
            transition={{ duration: 0.06 }}
            draggable={false}
          />
        </div>
      </motion.div>
    </div>
  );
}
