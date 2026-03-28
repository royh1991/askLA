'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { District } from './types';

const DISTRICTS_INFO: District[] = [
  { id: 1, name: "CD-1", member: "Eunisses Hernandez", color: "#4CAF50", neighborhoods: ["Glassell Park", "Lincoln Heights", "Highland Park"], hotTopics: ["Housing", "Immigration", "Parks"], meetings: 42, population: "262K", recentAction: "Community land trust expansion" },
  { id: 2, name: "CD-2", member: "Paul Krekorian", color: "#2196F3", neighborhoods: ["Studio City", "North Hollywood", "Sun Valley"], hotTopics: ["Budget", "Entertainment", "Transit"], meetings: 38, population: "268K", recentAction: "Budget surplus allocation" },
  { id: 3, name: "CD-3", member: "Bob Blumenfield", color: "#FF9800", neighborhoods: ["Woodland Hills", "Tarzana", "Encino"], hotTopics: ["Public Safety", "Homelessness", "Valley"], meetings: 35, population: "272K", recentAction: "RV parking restrictions" },
  { id: 4, name: "CD-4", member: "Nithya Raman", color: "#9C27B0", neighborhoods: ["Silver Lake", "Los Feliz", "Hancock Park"], hotTopics: ["Housing", "Homelessness", "CEQA"], meetings: 48, population: "259K", recentAction: "Rent stabilization extension" },
  { id: 5, name: "CD-5", member: "Katy Young", color: "#E91E63", neighborhoods: ["Bel Air", "Westwood", "Century City"], hotTopics: ["Development", "Transit", "Westside"], meetings: 36, population: "271K", recentAction: "Expo Line corridor plan" },
  { id: 6, name: "CD-6", member: "Imelda Padilla", color: "#00BCD4", neighborhoods: ["Van Nuys", "Pacoima", "Arleta"], hotTopics: ["Infrastructure", "Sun Valley", "Community"], meetings: 32, population: "275K", recentAction: "Street improvement bonds" },
  { id: 7, name: "CD-7", member: "Monica Rodriguez", color: "#795548", neighborhoods: ["Sylmar", "Sunland-Tujunga", "Shadow Hills"], hotTopics: ["Fire Safety", "Rural Issues", "Wildlife"], meetings: 30, population: "263K", recentAction: "Fire evacuation routes" },
  { id: 8, name: "CD-8", member: "Marqueece Harris-Dawson", color: "#F44336", neighborhoods: ["South LA", "Vermont Square", "Exposition Park"], hotTopics: ["Economic Dev.", "South LA", "Jobs"], meetings: 40, population: "266K", recentAction: "Workforce development center" },
  { id: 9, name: "CD-9", member: "Curren Price", color: "#3F51B5", neighborhoods: ["Downtown", "South Park", "Historic Core"], hotTopics: ["Downtown", "Arts District", "Transit"], meetings: 37, population: "269K", recentAction: "Arts District zoning overhaul" },
  { id: 10, name: "CD-10", member: "Heather Hutt", color: "#607D8B", neighborhoods: ["Mid-City", "Crenshaw", "West Adams"], hotTopics: ["Transportation", "Mid-City", "Crenshaw"], meetings: 44, population: "258K", recentAction: "Venice Mobility Hub study" },
  { id: 11, name: "CD-11", member: "Traci Park", color: "#009688", neighborhoods: ["Venice", "Mar Vista", "Brentwood"], hotTopics: ["Venice", "Coastal", "LAX"], meetings: 39, population: "273K", recentAction: "Venice alfresco dining permits" },
  { id: 12, name: "CD-12", member: "John Lee", color: "#CDDC39", neighborhoods: ["Chatsworth", "Granada Hills", "Porter Ranch"], hotTopics: ["Parks", "Granada Hills", "Public Safety"], meetings: 33, population: "274K", recentAction: "Oversized vehicle restrictions" },
  { id: 13, name: "CD-13", member: "Hugo Soto-Martinez", color: "#FF5722", neighborhoods: ["Hollywood", "East Hollywood", "Atwater Village"], hotTopics: ["Rent Control", "Hollywood", "Nightlife"], meetings: 46, population: "256K", recentAction: "Tenant anti-harassment ordinance" },
  { id: 14, name: "CD-14", member: "Kevin de León", color: "#8BC34A", neighborhoods: ["Boyle Heights", "Eagle Rock", "El Sereno"], hotTopics: ["Boyle Heights", "Eagle Rock", "Encampments"], meetings: 41, population: "261K", recentAction: "Encampment clearance protocol" },
  { id: 15, name: "CD-15", member: "Tim McOsker", color: "#FFC107", neighborhoods: ["San Pedro", "Watts", "Harbor City"], hotTopics: ["Port", "San Pedro", "Watts"], meetings: 34, population: "270K", recentAction: "Port community benefits agreement" },
];

export default function SimCityApp() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<any>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
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

      game.setDistrictSelectCallback((id) => {
        setSelectedDistrict(id ? DISTRICTS_INFO.find(d => d.id === id) || null : null);
      });

      game.renderDistrictOverlay();
      setLoading(false);
    })();

    return () => {
      destroyed = true;
      gameRef.current?.destroy();
    };
  }, []);

  const handleDistrictClick = useCallback((d: District) => {
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
                  <div className="w-5 h-5 rounded" style={{ backgroundColor: selectedDistrict.color, boxShadow: `0 0 8px ${selectedDistrict.color}` }} />
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
                        style={{ backgroundColor: selectedDistrict.color + '33', borderColor: selectedDistrict.color + '66' }}>{t}</span>
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
                    <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
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
