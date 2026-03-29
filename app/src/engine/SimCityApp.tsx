'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DISTRICTS as DISTRICTS_DATA } from './Game';
import type { DistrictData } from './Game';

const DISTRICTS_INFO = DISTRICTS_DATA;
function hexColor(n: number) { return '#' + n.toString(16).padStart(6, '0'); }

export default function SimCityApp() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<any>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictData | null>(null);
  const [showDistricts, setShowDistricts] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    let destroyed = false;

    (async () => {
      // Dynamic import to avoid SSR issues with Pixi.js
      const { Game } = await import('./Game');
      if (destroyed) return;

      const game = new Game();
      gameRef.current = game;

      await game.init(canvasRef.current!, canvasRef.current!.clientWidth, canvasRef.current!.clientHeight);
      if (destroyed) return;

      game.setDistrictSelectCallback((id: number | null) => {
        setSelectedDistrict(id ? DISTRICTS_INFO.find(d => d.id === id) || null : null);
      });

      setLoading(false);
    })();

    return () => {
      destroyed = true;
      gameRef.current?.destroy();
    };
  }, []);

  const handleDistrictClick = useCallback((d: DistrictData) => {
    setSelectedDistrict(d);
    gameRef.current?.selectDistrict(d.id);
  }, []);

  return (
    <div className="h-full flex flex-col bg-[#1A2A3A]">
      {/* SimCity toolbar */}
      <div style={{
        background: 'linear-gradient(180deg, #4A6A8A 0%, #2A4A6A 100%)',
        borderBottom: '2px solid #1A3A5A',
        padding: '3px 8px',
        display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: 'var(--font-mono)', fontSize: 10, color: '#D0E0F0',
      }}>
        <span style={{ fontWeight: 'bold', color: '#FFD700', fontSize: 11 }}>SimCity LA</span>
        <span style={{ color: '#4A6A8A' }}>|</span>
        <button className="xp-button text-[9px] !px-2 !min-h-[18px]" onClick={() => gameRef.current?.zoomIn()}>🔍+</button>
        <button className="xp-button text-[9px] !px-2 !min-h-[18px]" onClick={() => gameRef.current?.zoomOut()}>🔍-</button>
        <button className="xp-button text-[9px] !px-2 !min-h-[18px]" onClick={() => gameRef.current?.resetView()}>Reset</button>
        <span style={{ color: '#4A6A8A' }}>|</span>
        <label className="flex items-center gap-1 cursor-pointer text-[10px]">
          <input type="checkbox" checked={showDistricts} onChange={() => {
            setShowDistricts(!showDistricts);
            gameRef.current?.toggleDistricts(!showDistricts);
          }} />
          Districts
        </label>
        <div style={{ flex: 1 }} />
        <span style={{ color: '#8AB' }}>Pop: ~4M</span>
        <span style={{ color: '#4A6A8A' }}>|</span>
        <span style={{ color: '#8AB' }}>12,000 tiles</span>
        <span style={{ color: '#4A6A8A' }}>|</span>
        <span style={{ color: '#8AB' }}>15 Districts</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Pixi.js canvas */}
        <div className="flex-1 relative" ref={canvasRef} style={{ cursor: 'grab' }}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#1A2A3A] z-10">
              <div className="text-center">
                <motion.div
                  className="text-[32px] mb-3"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >🏗️</motion.div>
                <div className="text-[#8AABB0] font-mono text-[12px]">Building SimCity LA...</div>
                <div className="text-[#5A7A8A] font-mono text-[10px] mt-1">Generating 12,000 tiles</div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-[240px] border-l border-[#2A4A6A] bg-[#1A2A3A] overflow-auto shrink-0">
          <AnimatePresence mode="wait">
            {selectedDistrict ? (
              <motion.div key={selectedDistrict.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="p-3 text-[11px]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded" style={{ backgroundColor: hexColor(selectedDistrict.color), boxShadow: `0 0 8px ${hexColor(selectedDistrict.color)}` }} />
                  <div>
                    <div className="text-[15px] font-bold text-white">{selectedDistrict.name}</div>
                    <div className="text-[10px] text-[#8AA]">{selectedDistrict.population} residents</div>
                  </div>
                </div>
                <div className="bg-[#2A3A4A] rounded-lg p-2.5 mb-3 border border-[#3A5A7A]">
                  <div className="text-[9px] text-[#6A8A] uppercase tracking-wider mb-1">Council Member</div>
                  <div className="text-[13px] font-bold text-[#E0F0FF]" style={{ fontFamily: 'Georgia, serif' }}>
                    {selectedDistrict.member}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-[#2A3A4A] rounded p-2 text-center border border-[#3A5A7A]">
                    <div className="text-[16px] font-bold text-[#4CAF50]">{selectedDistrict.meetings}</div>
                    <div className="text-[8px] text-[#8AA] uppercase">meetings/yr</div>
                  </div>
                  <div className="bg-[#2A3A4A] rounded p-2 text-center border border-[#3A5A7A]">
                    <div className="text-[16px] font-bold text-[#FFD700]">{selectedDistrict.population}</div>
                    <div className="text-[8px] text-[#8AA] uppercase">population</div>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="text-[9px] text-[#6A8A] uppercase tracking-wider mb-1 font-mono">[■] Neighborhoods</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedDistrict.neighborhoods.map(n => (
                      <span key={n} className="text-[9px] px-2 py-0.5 rounded bg-[#2A3A4A] text-[#C0D0E0] border border-[#3A5A7A]">{n}</span>
                    ))}
                  </div>
                </div>
                <div className="mb-3">
                  <div className="text-[9px] text-[#6A8A] uppercase tracking-wider mb-1 font-mono">[◆] Hot Topics</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedDistrict.hotTopics.map(t => (
                      <span key={t} className="text-[9px] px-2 py-0.5 rounded text-white border"
                        style={{ backgroundColor: hexColor(selectedDistrict.color) + '33', borderColor: hexColor(selectedDistrict.color) + '66' }}>{t}</span>
                    ))}
                  </div>
                </div>
                <div className="mb-3">
                  <div className="text-[9px] text-[#6A8A] uppercase tracking-wider mb-1 font-mono">[~] Recent</div>
                  <p className="text-[10px] text-[#B0C8E0] leading-[14px] bg-[#2A3A4A] rounded p-2 border border-[#3A5A7A]">
                    {selectedDistrict.recentAction}
                  </p>
                </div>
                <button className="xp-button text-[10px] w-full" onClick={() => { setSelectedDistrict(null); gameRef.current?.selectDistrict(null); }}>
                  Deselect
                </button>
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="p-2 text-[10px]">
                <div className="text-[12px] font-bold text-[#B0C8E0] mb-2 px-1">Council Districts</div>
                {DISTRICTS_INFO.map(d => (
                  <div key={d.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-[#2A3A4A] transition-colors"
                    onClick={() => handleDistrictClick(d)}>
                    <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: hexColor(d.color) }} />
                    <span className="font-mono text-[9px] text-[#8AA] w-8">{d.name}</span>
                    <span className="text-[9px] text-[#B0C8E0] truncate flex-1">{d.member}</span>
                    <span className="text-[8px] text-[#5A7A8A]">{d.meetings}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        background: 'linear-gradient(180deg, #3A5A7A 0%, #2A4A6A 100%)',
        borderTop: '1px solid #4A6A8A',
        padding: '2px 8px',
        display: 'flex', alignItems: 'center', gap: 12,
        fontFamily: 'var(--font-mono)', fontSize: 9, color: '#8AABB0',
      }}>
        <span>🏛️ Los Angeles</span>
        <span style={{ color: '#4A6A8A' }}>|</span>
        <span>Pixi.js WebGL</span>
        <span style={{ color: '#4A6A8A' }}>|</span>
        <span>Drag to pan · Scroll to zoom · Click district</span>
        <div style={{ flex: 1 }} />
        <span style={{ color: '#4CAF50' }}>● 60fps</span>
      </div>
    </div>
  );
}
