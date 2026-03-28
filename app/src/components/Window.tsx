'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
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
  const windowRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (isMaximized) return;
    e.preventDefault();
    onFocus?.();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: pos.x,
      startPosY: pos.y,
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
      startX: e.clientX,
      startY: e.clientY,
      startW: size.w,
      startH: size.h,
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
      ref={windowRef}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="absolute"
      style={{
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: size.h,
        zIndex,
      }}
      onMouseDown={onFocus}
    >
      <div className="win-border-raised bg-[#C0C0C0] flex flex-col h-full">
        {/* Title bar */}
        <div
          className={`${isActive ? 'win-titlebar' : 'win-titlebar win-titlebar-inactive'}`}
          onMouseDown={handleDragStart}
          onDoubleClick={handleMaximize}
        >
          {icon && <span className="text-[14px]">{icon}</span>}
          <span className="flex-1 truncate">{title}</span>
          <div className="flex gap-[2px]">
            <button className="win-button !p-0 !min-w-[16px] !min-h-[14px] text-[10px] leading-none" onClick={onMinimize}>
              _
            </button>
            <button className="win-button !p-0 !min-w-[16px] !min-h-[14px] text-[10px] leading-none" onClick={handleMaximize}>
              {isMaximized ? '❐' : '□'}
            </button>
            <button className="win-button !p-0 !min-w-[16px] !min-h-[14px] text-[10px] leading-none font-bold" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-auto bg-white win-border-sunken-deep m-[2px]">
          {children}
        </div>

        {/* Resize handle */}
        {!isMaximized && (
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
            onMouseDown={handleResizeStart}
            style={{
              background: 'linear-gradient(135deg, transparent 50%, #808080 50%, #808080 60%, transparent 60%, transparent 70%, #808080 70%, #808080 80%, transparent 80%)',
            }}
          />
        )}
      </div>
    </motion.div>
  );
}
