'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { DISTRICTS, type DistrictInfo } from '../mapbox/districtData';

// MapLibre accesses window/document — must be client-only
const SimCityMap = dynamic(() => import('../mapbox/SimCityMap'), { ssr: false });

export default function SimCityApp() {
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictInfo | null>(null);

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
            onDistrictSelect={handleDistrictSelect}
          />
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
                <button className="xp-button text-[10px] w-full" onClick={() => setSelectedDistrict(null)}>
                  Deselect
                </button>
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-2 text-[10px]">
                <div className="text-[12px] font-bold text-[#B0C8E0] mb-2 px-1">Council Districts</div>
                {DISTRICTS.map(d => (
                  <div key={d.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-[#2A3A4A] transition-colors"
                    onClick={() => handleDistrictSelect(d)}>
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
        <span>MapLibre GL + OpenFreeMap</span>
        <span style={{ color: '#4A6A8A' }}>|</span>
        <span>3D Buildings at zoom 13+</span>
        <div style={{ flex: 1 }} />
        <span style={{ color: '#4CAF50' }}>● Free · No API Key</span>
      </div>
    </div>
  );
}
