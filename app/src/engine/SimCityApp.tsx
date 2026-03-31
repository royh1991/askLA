'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { DISTRICTS, type DistrictInfo } from '../mapbox/districtData';

// MapLibre accesses window/document — must be client-only
const SimCityMap = dynamic(() => import('../mapbox/SimCityMap'), { ssr: false });

export default function SimCityApp() {
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictInfo | null>(null);
  const [hoveredDistrictId, setHoveredDistrictId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleDistrictSelect = useCallback((district: DistrictInfo | null) => {
    setSelectedDistrict(district);
  }, []);

  return (
    <div className="h-full flex flex-col bg-[#1A2A3A]">
      {/* Toolbar */}
      <div style={{
        background: 'linear-gradient(180deg, #4A6A8A 0%, #2A4A6A 100%)',
        borderBottom: '2px solid #1A3A5A',
        padding: '3px 8px',
        display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: 'var(--font-mono)', fontSize: 10, color: '#D0E0F0',
      }}>
        <span style={{ fontWeight: 'bold', color: '#FFD700', fontSize: 11 }}>SimCity LA</span>
        <span style={{ color: '#4A6A8A' }}>|</span>
        <span style={{ color: '#8AB' }}>MapLibre GL + deck.gl</span>
        <span style={{ color: '#4A6A8A' }}>|</span>
        <span style={{ color: '#8AB' }}>15 Districts</span>
        <div style={{ flex: 1 }} />
        <span style={{ color: '#8AB' }}>Scroll to zoom · Drag to pan · Click district</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          <SimCityMap
            selectedDistrictId={selectedDistrict?.id ?? null}
            hoveredDistrictId={hoveredDistrictId}
            onDistrictSelect={handleDistrictSelect}
            onDistrictHover={setHoveredDistrictId}
          />
        </div>

        {/* Sidebar — collapsible panel with accordion district list */}
        <div className={`${sidebarOpen ? 'w-[260px]' : 'w-[28px]'} border-l border-[#2A4A6A] bg-[#1A2A3A] overflow-hidden shrink-0 transition-all duration-200 flex flex-col`}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full text-[10px] text-[#8AB] py-1.5 px-2 hover:bg-[#2A3A4A] border-b border-[#2A4A6A] shrink-0 text-left"
            title={sidebarOpen ? 'Collapse' : 'Expand'}
          >
            {sidebarOpen ? '◀ Council Districts' : '▶'}
          </button>
          {sidebarOpen && <div className="flex-1 overflow-auto p-1">
            {DISTRICTS.map(d => {
              const isSelected = selectedDistrict?.id === d.id;
              const isHovered = hoveredDistrictId === d.id;
              return (
                <div key={d.id}>
                  {/* District row — always visible */}
                  <div
                    className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors"
                    style={{
                      backgroundColor: isSelected ? d.color + '25' : isHovered ? d.color + '18' : 'transparent',
                      borderLeft: isSelected ? `3px solid ${d.color}` : '3px solid transparent',
                    }}
                    onClick={() => handleDistrictSelect(isSelected ? null : d)}
                    onMouseEnter={() => setHoveredDistrictId(d.id)}
                    onMouseLeave={() => setHoveredDistrictId(null)}
                  >
                    <div className="w-3 h-3 rounded-sm shrink-0" style={{
                      backgroundColor: d.color,
                      boxShadow: isHovered || isSelected ? `0 0 6px ${d.color}` : 'none',
                    }} />
                    <span className={`text-[9px] truncate flex-1 ${isSelected ? 'text-white font-bold' : isHovered ? 'text-white' : 'text-[#B0C8E0]'}`}>
                      {d.member}
                    </span>
                    <span className="text-[9px] text-[#5A7A8A]">{isSelected ? '▾' : '▸'}</span>
                  </div>

                  {/* Expanded detail — accordion */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-4 pr-2 pb-2 pt-1 text-[10px]">
                          {/* Header */}
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: d.color, boxShadow: `0 0 8px ${d.color}` }} />
                            <div>
                              <div className="text-[13px] font-bold text-white">{d.name}</div>
                              <div className="text-[9px] text-[#8AA]">{d.population} residents</div>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-1.5 mb-2">
                            <div className="bg-[#2A3A4A] rounded p-1.5 text-center border border-[#3A5A7A]">
                              <div className="text-[14px] font-bold text-[#4CAF50]">{d.meetings}</div>
                              <div className="text-[7px] text-[#8AA] uppercase">meetings/yr</div>
                            </div>
                            <div className="bg-[#2A3A4A] rounded p-1.5 text-center border border-[#3A5A7A]">
                              <div className="text-[14px] font-bold text-[#FFD700]">{d.population}</div>
                              <div className="text-[7px] text-[#8AA] uppercase">population</div>
                            </div>
                          </div>

                          {/* Neighborhoods */}
                          <div className="mb-2">
                            <div className="text-[8px] text-[#6A8A] uppercase tracking-wider mb-1 font-mono">[■] Neighborhoods</div>
                            <div className="flex flex-wrap gap-0.5">
                              {d.neighborhoods.map(n => (
                                <span key={n} className="text-[8px] px-1.5 py-0.5 rounded bg-[#2A3A4A] text-[#C0D0E0] border border-[#3A5A7A]">{n}</span>
                              ))}
                            </div>
                          </div>

                          {/* Hot Topics */}
                          <div className="mb-2">
                            <div className="text-[8px] text-[#6A8A] uppercase tracking-wider mb-1 font-mono">[◆] Hot Topics</div>
                            <div className="flex flex-wrap gap-0.5">
                              {d.hotTopics.map(t => (
                                <span key={t} className="text-[8px] px-1.5 py-0.5 rounded text-white border"
                                  style={{ backgroundColor: d.color + '33', borderColor: d.color + '66' }}>{t}</span>
                              ))}
                            </div>
                          </div>

                          {/* Recent Action */}
                          <div>
                            <div className="text-[8px] text-[#6A8A] uppercase tracking-wider mb-1 font-mono">[~] Recent</div>
                            <p className="text-[9px] text-[#B0C8E0] leading-[12px] bg-[#2A3A4A] rounded p-1.5 border border-[#3A5A7A]">
                              {d.recentAction}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>}
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
        <span>MapLibre GL + OpenFreeMap</span>
        <span style={{ color: '#4A6A8A' }}>|</span>
        <span>3D Buildings at zoom 13+</span>
        <div style={{ flex: 1 }} />
        <span style={{ color: '#4CAF50' }}>● Free · No API Key</span>
      </div>
    </div>
  );
}
