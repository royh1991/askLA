'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface WindowProps {
  id: string;
  title: string;
  icon?: string;
  children: React.ReactNode;
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
  isActive?: boolean;
  onFocus?: () => void;
  onClose?: () => void;
  onMinimize?: () => void;
  zIndex?: number;
}

export default function Window({
  id,
  title,
  icon,
  children,
  initialX = 100,
  initialY = 80,
  initialWidth = 640,
  initialHeight = 480,
  isActive = true,
  onFocus,
  onClose,
  onMinimize,
  zIndex = 10,
}: WindowProps) {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ w: initialWidth, h: initialHeight });
  const [isMaximized, setIsMaximized] = useState(false);
  const [prevState, setPrevState] = useState({ x: initialX, y: initialY, w: initialWidth, h: initialHeight });
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (isMaximized) return;
    e.preventDefault();
    onFocus?.();
    dragRef.current = {
      startX: e.clientX, startY: e.clientY,
      startPosX: pos.x, startPosY: pos.y,
    };
    const handleMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      setPos({
        x: dragRef.current.startPosX + (e.clientX - dragRef.current.startX),
        y: Math.max(0, dragRef.current.startPosY + (e.clientY - dragRef.current.startY)),
      });
    };
    const handleUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [pos, isMaximized, onFocus]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    if (isMaximized) return;
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = {
      startX: e.clientX, startY: e.clientY,
      startW: size.w, startH: size.h,
    };
    const handleMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      setSize({
        w: Math.max(300, resizeRef.current.startW + (e.clientX - resizeRef.current.startX)),
        h: Math.max(200, resizeRef.current.startH + (e.clientY - resizeRef.current.startY)),
      });
    };
    const handleUp = () => {
      resizeRef.current = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [size, isMaximized]);

  const handleMaximize = () => {
    if (isMaximized) {
      setPos({ x: prevState.x, y: prevState.y });
      setSize({ w: prevState.w, h: prevState.h });
      setIsMaximized(false);
    } else {
      setPrevState({ x: pos.x, y: pos.y, w: size.w, h: size.h });
      setPos({ x: 0, y: 0 });
      setSize({ w: window.innerWidth, h: window.innerHeight - 36 });
      setIsMaximized(true);
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
      className="absolute"
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h, zIndex }}
      onMouseDown={onFocus}
    >
      <div className={`flex flex-col h-full ${isActive ? 'xp-window xp-window-active' : 'xp-window'}`}>
        {/* XP Title bar */}
        <div
          className={isActive ? 'xp-titlebar' : 'xp-titlebar xp-titlebar-inactive'}
          onMouseDown={handleDragStart}
          onDoubleClick={handleMaximize}
        >
          {icon && <img src={icon} alt="" className="w-[16px] h-[16px] object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
          <span className="flex-1 truncate">{title}</span>
          <div className="flex gap-[2px] items-center">
            <button className="xp-btn-minimize" onClick={onMinimize} title="Minimize">
              <svg width="9" height="9" viewBox="0 0 9 9"><rect x="1" y="7" width="7" height="2" fill="white"/></svg>
            </button>
            <button className="xp-btn-maximize" onClick={handleMaximize} title={isMaximized ? 'Restore' : 'Maximize'}>
              {isMaximized ? (
                <svg width="9" height="9" viewBox="0 0 9 9">
                  <rect x="2" y="0" width="7" height="7" fill="none" stroke="white" strokeWidth="1.5"/>
                  <rect x="0" y="2" width="7" height="7" fill="none" stroke="white" strokeWidth="1.5"/>
                </svg>
              ) : (
                <svg width="9" height="9" viewBox="0 0 9 9">
                  <rect x="0" y="0" width="9" height="9" fill="none" stroke="white" strokeWidth="1.5"/>
                </svg>
              )}
            </button>
            <button className="xp-btn-close" onClick={onClose} title="Close">
              <svg width="9" height="9" viewBox="0 0 9 9">
                <line x1="1" y1="1" x2="8" y2="8" stroke="white" strokeWidth="2"/>
                <line x1="8" y1="1" x2="1" y2="8" stroke="white" strokeWidth="2"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-auto bg-white border-x-[3px] border-b-[3px] border-[#0054E3]" style={{ borderColor: isActive ? '#0054E3' : '#7A96DF' }}>
          {children}
        </div>

        {/* Resize handle */}
        {!isMaximized && (
          <div
            className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize"
            onMouseDown={handleResizeStart}
          />
        )}
      </div>
    </motion.div>
  );
}
