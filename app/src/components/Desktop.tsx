'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Window from './Window';
import Clippy from './Clippy';
import MeetingViewer from './apps/MeetingViewer';
import CouncilFiles from './apps/CouncilFiles';
import Terminal from './apps/Terminal';
import DistrictMap from './apps/DistrictMap';

interface OpenWindow {
  id: string;
  title: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
}

const DESKTOP_ICONS = [
  { id: 'meetings', label: 'Meeting Viewer', icon: '/sprites/icon-meetings.png', fallback: '📋' },
  { id: 'files', label: 'Council Files', icon: '/sprites/icon-files.png', fallback: '📁' },
  { id: 'terminal', label: 'Ask the Record', icon: '/sprites/icon-terminal.png', fallback: '💻' },
  { id: 'map', label: 'District Map', icon: '/sprites/icon-map.png', fallback: '🗺️' },
  { id: 'recycle', label: 'Killed Motions', icon: '/sprites/icon-recycle.png', fallback: '🗑️' },
  { id: 'spec', label: 'Project Spec', icon: '/sprites/icon-spec.png', fallback: '📄' },
];

const WINDOW_CONFIGS: Record<string, { title: string; icon: string; width: number; height: number }> = {
  meetings: { title: 'Meeting Viewer — Transportation Committee 3/11/26', icon: '/sprites/icon-meetings.png', width: 720, height: 560 },
  files: { title: 'Council Files Explorer', icon: '/sprites/icon-files.png', width: 760, height: 520 },
  terminal: { title: 'askLA Terminal — Ask the Public Record', icon: '/sprites/icon-terminal.png', width: 700, height: 460 },
  map: { title: 'LA District Map — CityOS', icon: '/sprites/icon-map.png', width: 850, height: 600 },
  recycle: { title: 'Killed Motions', icon: '/sprites/icon-recycle.png', width: 420, height: 360 },
  spec: { title: 'Project Specification — askLA', icon: '/sprites/icon-spec.png', width: 660, height: 510 },
};

export default function Desktop() {
  const [openWindows, setOpenWindows] = useState<OpenWindow[]>([]);
  const [activeWindow, setActiveWindow] = useState<string | null>(null);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [windowCounter, setWindowCounter] = useState(0);
  const [clippyMessage, setClippyMessage] = useState<string | undefined>(
    "Welcome to CityOS! I'm Clippy, your civic data assistant. Double-click any icon to get started!"
  );

  const openApp = useCallback((id: string) => {
    const existing = openWindows.find(w => w.id === id);
    if (existing) {
      if (existing.minimized) {
        setOpenWindows(prev => prev.map(w => w.id === id ? { ...w, minimized: false } : w));
      }
      setActiveWindow(id);
      return;
    }
    const config = WINDOW_CONFIGS[id];
    if (!config) return;
    const offset = (windowCounter % 5) * 30;
    setOpenWindows(prev => [...prev, {
      id, title: config.title, icon: config.icon,
      x: 130 + offset, y: 40 + offset,
      width: config.width, height: config.height, minimized: false,
    }]);
    setActiveWindow(id);
    setWindowCounter(c => c + 1);
    setStartMenuOpen(false);

    const messages: Record<string, string> = {
      meetings: "This is a real meeting transcript from the LA Transportation Committee. Click agenda items to see votes!",
      terminal: 'Try typing "rent stabilization" or "stats" to search the record!',
      files: "Browse council files and track legislation through the timeline!",
      map: "Explore LA's 15 council districts! Click a district to see its council member and activity.",
    };
    if (messages[id]) setClippyMessage(messages[id]);
  }, [openWindows, windowCounter]);

  const closeWindow = (id: string) => {
    setOpenWindows(prev => prev.filter(w => w.id !== id));
    if (activeWindow === id) {
      const remaining = openWindows.filter(w => w.id !== id);
      setActiveWindow(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
    }
  };

  const minimizeWindow = (id: string) => {
    setOpenWindows(prev => prev.map(w => w.id === id ? { ...w, minimized: true } : w));
    if (activeWindow === id) setActiveWindow(null);
  };

  const getZIndex = (id: string) => {
    if (id === activeWindow) return 100;
    return 10 + openWindows.findIndex(w => w.id === id);
  };

  const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Desktop area */}
      <div className="flex-1 relative desktop-pattern overflow-hidden" onClick={() => setStartMenuOpen(false)}>
        {/* Desktop icons — XP grid layout */}
        <div className="absolute top-4 left-4 flex flex-col gap-5">
          {DESKTOP_ICONS.map((icon) => (
            <motion.div
              key={icon.id}
              className="flex flex-col items-center w-[80px] cursor-pointer group select-none"
              onDoubleClick={() => openApp(icon.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <DesktopIcon src={icon.icon} fallback={icon.fallback} />
              <span className="text-white text-[11px] text-center leading-[14px] mt-1 px-1 rounded-sm group-hover:bg-[rgba(0,80,210,0.5)]"
                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9), -1px -1px 2px rgba(0,0,0,0.5)' }}
              >
                {icon.label}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Windows */}
        <AnimatePresence>
          {openWindows.filter(w => !w.minimized).map((win) => (
            <Window
              key={win.id}
              id={win.id}
              title={win.title}
              icon={win.icon}
              initialX={win.x}
              initialY={win.y}
              initialWidth={win.width}
              initialHeight={win.height}
              isActive={activeWindow === win.id}
              onFocus={() => setActiveWindow(win.id)}
              onClose={() => closeWindow(win.id)}
              onMinimize={() => minimizeWindow(win.id)}
              zIndex={getZIndex(win.id)}
            >
              {win.id === 'meetings' && <MeetingViewer />}
              {win.id === 'files' && <CouncilFiles />}
              {win.id === 'terminal' && <Terminal />}
              {win.id === 'map' && <DistrictMap />}
              {win.id === 'recycle' && <RecycleBin />}
              {win.id === 'spec' && <SpecViewer />}
            </Window>
          ))}
        </AnimatePresence>

        {/* Clippy */}
        <Clippy
          message={clippyMessage}
          onAsk={(q) => {
            setClippyMessage(`Let me search for "${q}"... Open the Terminal for full results!`);
            openApp('terminal');
          }}
        />
      </div>

      {/* XP Taskbar */}
      <div className="h-[38px] xp-taskbar flex items-center px-0 gap-1 shrink-0">
        {/* Start button */}
        <button
          className={`xp-start-button ${startMenuOpen ? 'brightness-90' : ''}`}
          onClick={(e) => { e.stopPropagation(); setStartMenuOpen(!startMenuOpen); }}
        >
          <span className="text-[18px]">🏛️</span>
          <span>start</span>
        </button>

        {/* Quick launch area */}
        <div className="flex items-center gap-0.5 px-2 border-l border-[rgba(255,255,255,0.15)] ml-1">
          <button className="xp-taskbar-button !p-1 !min-h-[22px] !max-w-[28px]" onClick={() => openApp('terminal')} title="Ask the Record">
            <span className="text-[14px]">💻</span>
          </button>
          <button className="xp-taskbar-button !p-1 !min-h-[22px] !max-w-[28px]" onClick={() => openApp('meetings')} title="Meeting Viewer">
            <span className="text-[14px]">📋</span>
          </button>
          <button className="xp-taskbar-button !p-1 !min-h-[22px] !max-w-[28px]" onClick={() => openApp('map')} title="District Map">
            <span className="text-[14px]">🗺️</span>
          </button>
        </div>

        {/* Separator */}
        <div className="w-px h-[24px] bg-[rgba(255,255,255,0.15)] mx-1" />

        {/* Open window buttons */}
        <div className="flex-1 flex gap-1 overflow-hidden px-1">
          {openWindows.map((win) => (
            <button
              key={win.id}
              className={`xp-taskbar-button truncate ${activeWindow === win.id && !win.minimized ? 'xp-taskbar-button-active' : ''}`}
              onClick={() => {
                if (win.minimized) {
                  setOpenWindows(prev => prev.map(w => w.id === win.id ? { ...w, minimized: false } : w));
                }
                setActiveWindow(win.id);
              }}
            >
              <span className="truncate text-[11px]">{win.title.split(' — ')[0]}</span>
            </button>
          ))}
        </div>

        {/* System tray */}
        <div className="xp-system-tray">
          <span className="text-[13px]" title="Clippy is active">📎</span>
          <span className="text-[13px]" title="Sound off">🔇</span>
          <span>{currentTime}</span>
        </div>
      </div>

      {/* XP Start Menu */}
      <AnimatePresence>
        {startMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: 10, scaleY: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-[38px] left-0 xp-start-menu w-[340px]"
            style={{ zIndex: 9998, transformOrigin: 'bottom left' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="xp-start-menu-header">
              <div className="w-[40px] h-[40px] rounded-full bg-[rgba(255,255,255,0.2)] flex items-center justify-center text-[22px]">
                🏛️
              </div>
              <div>
                <div className="text-[14px]">CityOS</div>
                <div className="text-[10px] font-normal opacity-80">Los Angeles Civic Intelligence</div>
              </div>
            </div>

            {/* Two-column body */}
            <div className="flex">
              {/* Left column — apps */}
              <div className="flex-1 py-2 bg-white">
                {[
                  { id: 'meetings', icon: '📋', label: 'Meeting Viewer', desc: 'Browse meeting transcripts' },
                  { id: 'files', icon: '📁', label: 'Council Files', desc: 'Track legislation lifecycle' },
                  { id: 'terminal', icon: '💻', label: 'Ask the Record', desc: 'Search 20.9M words' },
                  { id: 'map', icon: '🗺️', label: 'District Map', desc: 'Explore 15 council districts' },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="px-3 py-2 flex items-center gap-3 hover:bg-[#2B5FCB] hover:text-white cursor-pointer group"
                    onClick={() => openApp(item.id)}
                  >
                    <span className="text-[24px]">{item.icon}</span>
                    <div>
                      <div className="text-[12px] font-bold">{item.label}</div>
                      <div className="text-[10px] text-[#808080] group-hover:text-[rgba(255,255,255,0.8)]">{item.desc}</div>
                    </div>
                  </div>
                ))}

                <div className="h-px bg-[#D0D0D0] mx-3 my-1" />

                <div
                  className="px-3 py-2 flex items-center gap-3 hover:bg-[#2B5FCB] hover:text-white cursor-pointer group"
                  onClick={() => openApp('spec')}
                >
                  <span className="text-[24px]">📄</span>
                  <div>
                    <div className="text-[12px] font-bold">Project Spec</div>
                    <div className="text-[10px] text-[#808080] group-hover:text-[rgba(255,255,255,0.8)]">View documentation</div>
                  </div>
                </div>
              </div>

              {/* Right column — XP blue sidebar */}
              <div className="w-[140px] py-2 text-[11px]" style={{ background: 'linear-gradient(180deg, #6B9CD6 0%, #4A80C8 100%)' }}>
                {[
                  { label: '10,698 meetings', icon: '📊' },
                  { label: '20.9M words', icon: '📝' },
                  { label: '1,590 transcripts', icon: '🎙️' },
                  { label: '18 years', icon: '📅' },
                ].map((stat) => (
                  <div key={stat.label} className="px-3 py-1.5 text-white flex items-center gap-2 opacity-90">
                    <span className="text-[12px]">{stat.icon}</span>
                    <span>{stat.label}</span>
                  </div>
                ))}

                <div className="h-px bg-[rgba(255,255,255,0.2)] mx-2 my-1" />

                <div className="px-3 py-1.5 text-white flex items-center gap-2 opacity-70 text-[10px]">
                  <span>Updated: Today</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end px-3 py-1.5 bg-gradient-to-r from-[#3C72D0] to-[#2456C8]">
              <div
                className="flex items-center gap-1 text-white text-[11px] cursor-pointer hover:underline opacity-80 hover:opacity-100"
                onClick={() => openApp('recycle')}
              >
                <span>🗑️</span>
                <span>Killed Motions</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DesktopIcon({ src, fallback }: { src: string; fallback: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <div className="text-[48px] drop-shadow-lg">{fallback}</div>;
  }
  return (
    <img
      src={src}
      alt=""
      className="w-[48px] h-[48px] object-contain drop-shadow-lg"
      onError={() => setFailed(true)}
      draggable={false}
    />
  );
}

function RecycleBin() {
  const killedMotions = [
    { cf: '24-0892', title: 'Street Racing Penalty Increase', reason: 'Died in committee', date: '2024-06-15' },
    { cf: '23-0341', title: 'E-Scooter Speed Reduction Mandate', reason: 'Failed 4-11', date: '2023-09-22' },
    { cf: '24-0117', title: 'Sidewalk Vendor Permit Fee Waiver', reason: 'Withdrawn by author', date: '2024-03-01' },
  ];
  return (
    <div className="h-full bg-white p-2 text-[11px]">
      <div className="bracket-header">[!] KILLED MOTIONS</div>
      <p className="text-[10px] text-[#808080] mb-2">Council files that failed, were withdrawn, or died in committee.</p>
      {killedMotions.map((m) => (
        <div key={m.cf} className="border border-[#D4D7CD] rounded p-2 mb-2 bg-[#FAFAF5]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-[#C1292E] font-bold">CF {m.cf}</span>
            <span className="text-[9px] bg-[#FFEBEE] text-[#C1292E] px-1 rounded border border-[#C1292E]">{m.reason}</span>
          </div>
          <div className="text-[11px] mt-0.5">{m.title}</div>
          <div className="text-[9px] text-[#808080] mt-0.5">{m.date}</div>
        </div>
      ))}
    </div>
  );
}

function SpecViewer() {
  return (
    <div className="h-full bg-white p-3 text-[11px] overflow-auto">
      <div className="bracket-header">[?] PROJECT SPECIFICATION</div>
      <div className="bg-[#F5F1EB] border border-[#D4D7CD] rounded p-3 mb-3">
        <h3 className="text-[14px] font-bold text-[#1B4332] mb-1" style={{ fontFamily: 'Georgia, serif' }}>
          askLA — LA Civic Intelligence Platform
        </h3>
        <p className="text-[11px] text-[#404040] leading-[16px]">
          A civic intelligence platform for Los Angeles. Transforms 18 years of city council proceedings
          — 10,000+ meetings, millions of words of testimony, thousands of votes — into a searchable,
          understandable, actionable public resource.
        </p>
      </div>
      <div className="bracket-header">[■] TECH STACK</div>
      <div className="font-mono text-[10px] space-y-1 mb-3">
        <div><span className="text-[#2D6A4F]">Framework:</span> Next.js 16 (App Router)</div>
        <div><span className="text-[#2D6A4F]">Language:</span>  TypeScript</div>
        <div><span className="text-[#2D6A4F]">Styling:</span>   Tailwind CSS</div>
        <div><span className="text-[#2D6A4F]">Animation:</span> Framer Motion</div>
        <div><span className="text-[#2D6A4F]">Database:</span>  Neon Postgres (serverless)</div>
        <div><span className="text-[#2D6A4F]">Vector DB:</span> Chroma Cloud</div>
        <div><span className="text-[#2D6A4F]">LLM:</span>       Gemini Flash</div>
        <div><span className="text-[#2D6A4F]">Sprites:</span>   Imagen 4.0 (Gemini)</div>
        <div><span className="text-[#2D6A4F]">Hosting:</span>   Vercel</div>
      </div>
      <div className="bracket-header">[~] DATA PIPELINE</div>
      <div className="font-mono text-[10px] space-y-0.5 text-[#404040]">
        <div>10,698 meetings (2008-2026)</div>
        <div>10,672 agenda documents (5.7 GB)</div>
        <div> 1,590 transcripts (20.9M words)</div>
        <div>    98 audio files (6.5 GB)</div>
      </div>
    </div>
  );
}
