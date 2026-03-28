'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Window from './Window';
import Clippy from './Clippy';
import MeetingViewer from './apps/MeetingViewer';
import CouncilFiles from './apps/CouncilFiles';
import Terminal from './apps/Terminal';

interface DesktopIcon {
  id: string;
  label: string;
  icon: string;
  x: number;
  y: number;
}

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

const DESKTOP_ICONS: DesktopIcon[] = [
  { id: 'meetings', label: 'Meeting\nViewer', icon: '📋', x: 20, y: 20 },
  { id: 'files', label: 'Council\nFiles', icon: '📁', x: 20, y: 110 },
  { id: 'terminal', label: 'Ask the\nRecord', icon: '💻', x: 20, y: 200 },
  { id: 'map', label: 'District\nMap', icon: '🗺️', x: 20, y: 290 },
  { id: 'recycle', label: 'Killed\nMotions', icon: '🗑️', x: 20, y: 380 },
  { id: 'spec', label: 'Project\nSpec', icon: '📄', x: 20, y: 470 },
];

const WINDOW_CONFIGS: Record<string, { title: string; icon: string; width: number; height: number }> = {
  meetings: { title: 'Meeting Viewer — Transportation Committee 3/11/26', icon: '📋', width: 700, height: 550 },
  files: { title: 'Council Files Explorer', icon: '📁', width: 750, height: 500 },
  terminal: { title: 'askLA Terminal — Ask the Public Record', icon: '💻', width: 680, height: 450 },
  map: { title: 'LA District Map', icon: '🗺️', width: 600, height: 450 },
  recycle: { title: 'Killed Motions', icon: '🗑️', width: 400, height: 350 },
  spec: { title: 'Project Specification — askLA', icon: '📄', width: 650, height: 500 },
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
    // If already open, bring to front
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
      id,
      title: config.title,
      icon: config.icon,
      x: 120 + offset,
      y: 40 + offset,
      width: config.width,
      height: config.height,
      minimized: false,
    }]);
    setActiveWindow(id);
    setWindowCounter(c => c + 1);
    setStartMenuOpen(false);

    // Clippy reactions
    if (id === 'meetings') {
      setClippyMessage("This is a real meeting transcript from the LA Transportation Committee. Click agenda items to see votes!");
    } else if (id === 'terminal') {
      setClippyMessage('Try typing "rent stabilization" or "stats" to search the record!');
    } else if (id === 'files') {
      setClippyMessage("Browse council files and track legislation through the timeline!");
    }
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
    if (activeWindow === id) {
      setActiveWindow(null);
    }
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
        {/* Desktop icons */}
        {DESKTOP_ICONS.map((icon) => (
          <motion.div
            key={icon.id}
            className="absolute flex flex-col items-center w-[70px] cursor-pointer group"
            style={{ left: icon.x, top: icon.y }}
            onDoubleClick={() => openApp(icon.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="text-[32px] mb-1 drop-shadow-md group-hover:drop-shadow-lg transition-all">
              {icon.icon}
            </div>
            <span className="text-white text-[11px] text-center leading-[13px] px-0.5 select-none"
              style={{
                textShadow: '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)',
              }}
            >
              {icon.label}
            </span>
          </motion.div>
        ))}

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
              {win.id === 'map' && <MapPlaceholder />}
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

      {/* Taskbar */}
      <div className="h-[36px] bg-[#C0C0C0] win-border-raised flex items-center px-1 gap-1 shrink-0">
        {/* Start button */}
        <button
          className={`win-button font-bold text-[11px] flex items-center gap-1 ${startMenuOpen ? '!border-[#808080_#FFFFFF_#FFFFFF_#808080]' : ''}`}
          onClick={(e) => { e.stopPropagation(); setStartMenuOpen(!startMenuOpen); }}
        >
          <span className="text-[14px]">🏛️</span>
          <span>Start</span>
        </button>

        {/* Divider */}
        <div className="w-px h-[24px] bg-[#808080] mx-0.5" />

        {/* Quick launch */}
        <button className="win-button !p-0 !min-w-[24px] text-[14px]" onClick={() => openApp('terminal')} title="Ask the Record">
          💻
        </button>
        <button className="win-button !p-0 !min-w-[24px] text-[14px]" onClick={() => openApp('meetings')} title="Meeting Viewer">
          📋
        </button>

        {/* Divider */}
        <div className="w-px h-[24px] bg-[#808080] mx-0.5" />

        {/* Open window buttons */}
        <div className="flex-1 flex gap-1 overflow-hidden">
          {openWindows.map((win) => (
            <button
              key={win.id}
              className={`win-button text-[11px] truncate max-w-[160px] flex items-center gap-1 ${
                activeWindow === win.id && !win.minimized ? '!border-[#808080_#FFFFFF_#FFFFFF_#808080] !bg-[#DFDFDF]' : ''
              }`}
              onClick={() => {
                if (win.minimized) {
                  setOpenWindows(prev => prev.map(w => w.id === win.id ? { ...w, minimized: false } : w));
                }
                setActiveWindow(win.id);
              }}
            >
              <span className="text-[12px]">{win.icon}</span>
              <span className="truncate">{win.title.split(' — ')[0]}</span>
            </button>
          ))}
        </div>

        {/* System tray */}
        <div className="win-border-sunken px-2 py-0.5 flex items-center gap-2 text-[11px]">
          <span className="text-[12px]" title="Clippy is active">📎</span>
          <span className="text-[12px]" title="Sound off">🔇</span>
          <span className="text-[#404040]">{currentTime}</span>
        </div>
      </div>

      {/* Start Menu */}
      <AnimatePresence>
        {startMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.1 }}
            className="absolute bottom-[36px] left-[2px] start-menu bg-[#C0C0C0] win-border-raised"
            style={{ zIndex: 9998 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex">
              {/* Side banner */}
              <div className="w-[24px] bg-gradient-to-t from-[#000080] to-[#1084D0] flex items-end justify-center pb-2">
                <span className="text-white text-[10px] font-bold [writing-mode:vertical-lr] rotate-180 tracking-wider">
                  CityOS
                </span>
              </div>

              {/* Menu items */}
              <div className="py-1 min-w-[200px]">
                {[
                  { id: 'meetings', icon: '📋', label: 'Meeting Viewer' },
                  { id: 'files', icon: '📁', label: 'Council Files' },
                  { id: 'terminal', icon: '💻', label: 'Ask the Record' },
                  { id: 'map', icon: '🗺️', label: 'District Map' },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="px-3 py-1.5 flex items-center gap-2 hover:bg-[#000080] hover:text-white cursor-pointer text-[11px]"
                    onClick={() => openApp(item.id)}
                  >
                    <span className="text-[16px]">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}

                <div className="h-px bg-[#808080] mx-2 my-1" />

                <div
                  className="px-3 py-1.5 flex items-center gap-2 hover:bg-[#000080] hover:text-white cursor-pointer text-[11px]"
                  onClick={() => openApp('spec')}
                >
                  <span className="text-[16px]">📄</span>
                  <span>Project Spec</span>
                </div>
                <div
                  className="px-3 py-1.5 flex items-center gap-2 hover:bg-[#000080] hover:text-white cursor-pointer text-[11px]"
                  onClick={() => openApp('recycle')}
                >
                  <span className="text-[16px]">🗑️</span>
                  <span>Killed Motions</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Placeholder components for apps not yet fully built

function MapPlaceholder() {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-[#F5F1EB] p-4 text-center">
      <div className="text-[48px] mb-4">🗺️</div>
      <h3 className="text-[14px] font-bold text-[#1B4332] mb-2" style={{ fontFamily: 'Georgia, serif' }}>
        LA District Map
      </h3>
      <p className="text-[11px] text-[#808080] max-w-[300px]">
        Interactive Mapbox-powered district map coming soon. Will show all 15 council districts,
        activity heatmaps, development pins, and public comment origins.
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-[10px]">
        {['CD-1 Hernandez', 'CD-2 Krekorian', 'CD-3 Blumenfield',
          'CD-4 Raman', 'CD-5 Young', 'CD-6 Martinez',
          'CD-7 Rodriguez', 'CD-8 Harris', 'CD-9 Price'].map(d => (
          <div key={d} className="bg-white border border-[#D4D7CD] rounded px-2 py-1">
            {d}
          </div>
        ))}
      </div>
    </div>
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
      <p className="text-[10px] text-[#808080] mb-2">
        Council files that failed, were withdrawn, or died in committee.
      </p>
      {killedMotions.map((m) => (
        <div key={m.cf} className="border border-[#D4D7CD] rounded p-2 mb-2 bg-[#FAFAF5]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-[#C1292E] font-bold">CF {m.cf}</span>
            <span className="text-[9px] bg-[#FFEBEE] text-[#C1292E] px-1 rounded border border-[#C1292E]">
              {m.reason}
            </span>
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
        <div><span className="text-[#2D6A4F]">Framework:</span> Next.js 15 (App Router)</div>
        <div><span className="text-[#2D6A4F]">Language:</span>  TypeScript</div>
        <div><span className="text-[#2D6A4F]">Styling:</span>   Tailwind CSS + CSS Modules</div>
        <div><span className="text-[#2D6A4F]">Animation:</span> Framer Motion</div>
        <div><span className="text-[#2D6A4F]">Database:</span>  Neon Postgres (serverless)</div>
        <div><span className="text-[#2D6A4F]">Vector DB:</span> Chroma Cloud</div>
        <div><span className="text-[#2D6A4F]">LLM:</span>       Gemini Flash</div>
        <div><span className="text-[#2D6A4F]">Hosting:</span>   Vercel</div>
      </div>

      <div className="bracket-header">[~] DATA PIPELINE</div>
      <div className="font-mono text-[10px] space-y-0.5 text-[#404040]">
        <div>10,698 meetings (2008-2026)</div>
        <div>10,672 agenda documents (5.7 GB)</div>
        <div> 1,590 transcripts (20.9M words)</div>
        <div>    98 audio files (6.5 GB)</div>
        <div>Full spec: <span className="text-[#2D6A4F] underline cursor-pointer">project_spec.md</span></div>
      </div>
    </div>
  );
}
