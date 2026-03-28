'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface District {
  id: number;
  name: string;
  member: string;
  color: string;
  // SVG path for district shape (simplified LA council district boundaries)
  path: string;
  // Center point for label
  cx: number;
  cy: number;
  // Sim-style stats
  population: string;
  meetings: number;
  hotTopics: string[];
  recentAction: string;
}

const DISTRICTS: District[] = [
  {
    id: 1, name: 'CD-1', member: 'Eunisses Hernandez',
    color: '#4CAF50', cx: 340, cy: 190,
    path: 'M310,140 L370,140 L380,160 L375,200 L360,220 L320,230 L300,210 L300,170 Z',
    population: '262K', meetings: 42, hotTopics: ['Housing', 'Immigration', 'Parks'],
    recentAction: 'Approved community land trust expansion',
  },
  {
    id: 2, name: 'CD-2', member: 'Paul Krekorian',
    color: '#2196F3', cx: 310, cy: 100,
    path: 'M240,60 L340,55 L370,70 L370,140 L310,140 L270,130 L240,110 Z',
    population: '268K', meetings: 38, hotTopics: ['Budget', 'Entertainment', 'Transit'],
    recentAction: 'Authored city budget surplus allocation',
  },
  {
    id: 3, name: 'CD-3', member: 'Bob Blumenfield',
    color: '#FF9800', cx: 165, cy: 88,
    path: 'M60,50 L240,60 L240,110 L200,130 L140,130 L80,120 L60,90 Z',
    population: '272K', meetings: 35, hotTopics: ['Public Safety', 'Homelessness', 'Valley'],
    recentAction: 'RV parking restrictions in Woodland Hills',
  },
  {
    id: 4, name: 'CD-4', member: 'Nithya Raman',
    color: '#9C27B0', cx: 360, cy: 270,
    path: 'M320,230 L360,220 L400,240 L420,280 L400,310 L360,320 L330,290 Z',
    population: '259K', meetings: 48, hotTopics: ['Housing', 'Homelessness', 'CEQA'],
    recentAction: 'Rent stabilization extension (CF 25-1026)',
  },
  {
    id: 5, name: 'CD-5', member: 'Katy Young',
    color: '#E91E63', cx: 280, cy: 270,
    path: 'M240,230 L320,230 L330,290 L310,320 L270,330 L240,300 L230,260 Z',
    population: '271K', meetings: 36, hotTopics: ['Development', 'Transit', 'Westside'],
    recentAction: 'Expo Line corridor development plan',
  },
  {
    id: 6, name: 'CD-6', member: 'Imelda Padilla',
    color: '#00BCD4', cx: 150, cy: 150,
    path: 'M80,120 L140,130 L200,130 L220,160 L200,200 L140,200 L90,180 L80,140 Z',
    population: '275K', meetings: 32, hotTopics: ['Pacoima', 'Sun Valley', 'Infrastructure'],
    recentAction: 'Street improvement bond allocation',
  },
  {
    id: 7, name: 'CD-7', member: 'Monica Rodriguez',
    color: '#795548', cx: 200, cy: 50,
    path: 'M100,20 L280,10 L300,40 L240,60 L60,50 L80,30 Z',
    population: '263K', meetings: 30, hotTopics: ['Sylmar', 'Fire Safety', 'Rural'],
    recentAction: 'Fire evacuation route improvements',
  },
  {
    id: 8, name: 'CD-8', member: 'Marqueece Harris-Dawson',
    color: '#F44336', cx: 340, cy: 370,
    path: 'M300,340 L360,320 L400,350 L400,400 L360,420 L310,400 L290,370 Z',
    population: '266K', meetings: 40, hotTopics: ['South LA', 'Jobs', 'Development'],
    recentAction: 'Workforce development center approved',
  },
  {
    id: 9, name: 'CD-9', member: 'Curren Price',
    color: '#3F51B5', cx: 370, cy: 340,
    path: 'M360,320 L400,310 L430,330 L430,370 L400,400 L400,350 Z',
    population: '269K', meetings: 37, hotTopics: ['Downtown', 'Arts District', 'Transit'],
    recentAction: 'Arts District zoning overhaul',
  },
  {
    id: 10, name: 'CD-10', member: 'Heather Hutt',
    color: '#607D8B', cx: 290, cy: 320,
    path: 'M240,300 L270,330 L310,320 L300,340 L290,370 L260,380 L230,350 L230,310 Z',
    population: '258K', meetings: 44, hotTopics: ['Mid-City', 'Crenshaw', 'Transportation'],
    recentAction: 'Venice Mobility Hub feasibility study',
  },
  {
    id: 11, name: 'CD-11', member: 'Traci Park',
    color: '#009688', cx: 160, cy: 340,
    path: 'M60,280 L230,260 L240,300 L230,350 L200,400 L100,420 L50,380 L50,300 Z',
    population: '273K', meetings: 39, hotTopics: ['Venice', 'LAX', 'Coastal'],
    recentAction: 'Venice alfresco dining permits resolution',
  },
  {
    id: 12, name: 'CD-12', member: 'John Lee',
    color: '#CDDC39', cx: 100, cy: 55,
    path: 'M20,20 L100,20 L80,30 L60,50 L60,90 L30,80 L10,50 Z',
    population: '274K', meetings: 33, hotTopics: ['Chatsworth', 'Granada Hills', 'Parks'],
    recentAction: 'Oversized vehicle restrictions (CD-12)',
  },
  {
    id: 13, name: 'CD-13', member: 'Hugo Soto-Martinez',
    color: '#FF5722', cx: 370, cy: 220,
    path: 'M375,200 L420,190 L440,220 L420,280 L400,240 L360,220 Z',
    population: '256K', meetings: 46, hotTopics: ['Hollywood', 'Rent Control', 'Nightlife'],
    recentAction: 'Tenant anti-harassment ordinance',
  },
  {
    id: 14, name: 'CD-14', member: 'Kevin de León',
    color: '#8BC34A', cx: 430, cy: 310,
    path: 'M420,280 L460,270 L480,310 L470,370 L430,370 L430,330 Z',
    population: '261K', meetings: 41, hotTopics: ['Boyle Heights', 'Eagle Rock', 'Encampments'],
    recentAction: 'Encampment clearance protocol update',
  },
  {
    id: 15, name: 'CD-15', member: 'Tim McOsker',
    color: '#FFC107', cx: 380, cy: 440,
    path: 'M310,400 L360,420 L400,400 L470,370 L490,430 L450,470 L350,480 L290,450 Z',
    population: '270K', meetings: 34, hotTopics: ['San Pedro', 'Watts', 'Port'],
    recentAction: 'Port community benefits agreement',
  },
];

// Sim-style building sprites drawn via SVG
function SimBuildings({ cx, cy, density }: { cx: number; cy: number; density: number }) {
  const buildings = [];
  const rng = (cx * 7 + cy * 13) % 100; // deterministic "random"
  for (let i = 0; i < Math.min(density, 6); i++) {
    const bx = cx - 15 + ((rng + i * 17) % 30);
    const by = cy - 20 + ((rng + i * 23) % 20);
    const bw = 4 + ((rng + i * 7) % 5);
    const bh = 8 + ((rng + i * 11) % 16);
    const shade = 160 + ((rng + i * 31) % 60);
    buildings.push(
      <g key={i}>
        {/* Building body */}
        <rect x={bx} y={by - bh} width={bw} height={bh}
          fill={`rgb(${shade},${shade - 20},${shade - 40})`}
          stroke={`rgb(${shade - 40},${shade - 60},${shade - 80})`}
          strokeWidth="0.5"
        />
        {/* Windows */}
        {Array.from({ length: Math.floor(bh / 5) }).map((_, wi) => (
          <rect key={wi} x={bx + 1} y={by - bh + 2 + wi * 5} width={bw - 2} height={2}
            fill={(rng + wi) % 3 === 0 ? '#FFE082' : '#B0BEC5'}
            opacity={0.7}
          />
        ))}
      </g>
    );
  }
  return <>{buildings}</>;
}

// Small tree sprites
function SimTrees({ cx, cy, count }: { cx: number; cy: number; count: number }) {
  const trees = [];
  const rng = (cx * 11 + cy * 7) % 100;
  for (let i = 0; i < count; i++) {
    const tx = cx + 15 + ((rng + i * 19) % 25);
    const ty = cy + ((rng + i * 13) % 15);
    trees.push(
      <g key={i}>
        <rect x={tx} y={ty - 2} width={1.5} height={4} fill="#5D4037" />
        <circle cx={tx + 0.75} cy={ty - 4} r={3} fill={`hsl(${110 + (rng + i * 7) % 30}, 60%, ${35 + (rng + i) % 15}%)`} />
      </g>
    );
  }
  return <>{trees}</>;
}

export default function DistrictMap() {
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const panRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);

  const handlePanStart = (e: React.MouseEvent) => {
    if ((e.target as Element).closest('.district-shape')) return;
    panRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
    const move = (e: MouseEvent) => {
      if (!panRef.current) return;
      setPan({
        x: panRef.current.panX + (e.clientX - panRef.current.startX),
        y: panRef.current.panY + (e.clientY - panRef.current.startY),
      });
    };
    const up = () => {
      panRef.current = null;
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.5, Math.min(3, z - e.deltaY * 0.001)));
  };

  return (
    <div className="h-full flex flex-col bg-[#E8F0E8]">
      {/* Toolbar */}
      <div className="bg-[#ECF0F8] border-b border-[#B0C0D0] px-2 py-1 flex items-center gap-2 text-[11px] shrink-0">
        <button className="xp-button text-[10px]" onClick={() => setZoom(z => Math.min(3, z + 0.2))}>+ Zoom In</button>
        <button className="xp-button text-[10px]" onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}>- Zoom Out</button>
        <button className="xp-button text-[10px]" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>Reset</button>
        <div className="flex-1" />
        <span className="text-[10px] text-[#808080] font-mono">15 Districts | {zoom.toFixed(1)}x</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Map area */}
        <div className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseDown={handlePanStart}
          onWheel={handleWheel}
        >
          <svg
            ref={svgRef}
            viewBox="0 0 520 500"
            className="w-full h-full"
            style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` }}
          >
            {/* Ocean */}
            <defs>
              <pattern id="water" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect width="20" height="20" fill="#5B9BD5" />
                <path d="M0 10 Q5 8 10 10 Q15 12 20 10" fill="none" stroke="#4A8AC4" strokeWidth="0.5" opacity="0.5" />
                <path d="M0 15 Q5 13 10 15 Q15 17 20 15" fill="none" stroke="#4A8AC4" strokeWidth="0.3" opacity="0.3" />
              </pattern>
              <pattern id="grass" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                <rect width="8" height="8" fill="#7CB342" />
                <circle cx="2" cy="3" r="0.5" fill="#689F38" opacity="0.3" />
                <circle cx="6" cy="7" r="0.5" fill="#8BC34A" opacity="0.3" />
              </pattern>
              {/* Road pattern */}
              <pattern id="road" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
                <rect width="6" height="6" fill="#9E9E9E" />
                <line x1="3" y1="0" x2="3" y2="6" stroke="#FFF" strokeWidth="0.3" strokeDasharray="1 2" />
              </pattern>
            </defs>

            {/* Background terrain */}
            <rect x="0" y="0" width="520" height="500" fill="url(#grass)" />

            {/* Pacific Ocean (left/bottom) */}
            <path d="M0,200 L60,280 L50,300 L50,380 L50,420 L100,420 L290,450 L350,480 L450,470 L490,430 L520,450 L520,500 L0,500 Z"
              fill="url(#water)" opacity="0.4" />
            <path d="M0,200 L0,500" fill="none" stroke="#5B9BD5" strokeWidth="2" />

            {/* Major roads */}
            <line x1="50" y1="250" x2="480" y2="250" stroke="#BDBDBD" strokeWidth="2" opacity="0.5" />
            <line x1="250" y1="10" x2="250" y2="470" stroke="#BDBDBD" strokeWidth="2" opacity="0.5" />
            <line x1="100" y1="100" x2="450" y2="400" stroke="#BDBDBD" strokeWidth="1.5" opacity="0.4" />
            {/* I-10 */}
            <path d="M50,300 L200,280 L300,290 L430,340" fill="none" stroke="#E0E0E0" strokeWidth="3" opacity="0.6" />
            {/* I-405 */}
            <path d="M200,50 L180,150 L160,250 L180,350 L250,450" fill="none" stroke="#E0E0E0" strokeWidth="3" opacity="0.6" />
            {/* I-110 */}
            <path d="M330,200 L340,300 L350,400 L360,470" fill="none" stroke="#E0E0E0" strokeWidth="3" opacity="0.6" />

            {/* Highway labels */}
            <text x="420" y="345" fontSize="7" fill="#757575" fontWeight="bold" opacity="0.6">I-10</text>
            <text x="170" y="260" fontSize="7" fill="#757575" fontWeight="bold" opacity="0.6">I-405</text>
            <text x="345" y="410" fontSize="7" fill="#757575" fontWeight="bold" opacity="0.6">I-110</text>

            {/* District shapes */}
            {DISTRICTS.map((d) => (
              <g key={d.id} className="district-shape">
                <motion.path
                  d={d.path}
                  fill={d.color}
                  fillOpacity={hoveredDistrict === d.id ? 0.7 : selectedDistrict?.id === d.id ? 0.65 : 0.45}
                  stroke={selectedDistrict?.id === d.id ? '#FFFFFF' : hoveredDistrict === d.id ? '#FFFFFF' : '#2E7D32'}
                  strokeWidth={selectedDistrict?.id === d.id ? 2.5 : hoveredDistrict === d.id ? 2 : 1}
                  cursor="pointer"
                  onClick={() => setSelectedDistrict(d)}
                  onMouseEnter={() => setHoveredDistrict(d.id)}
                  onMouseLeave={() => setHoveredDistrict(null)}
                  whileHover={{ fillOpacity: 0.7 }}
                />
                {/* Sim buildings */}
                <SimBuildings cx={d.cx} cy={d.cy} density={Math.ceil(d.meetings / 10)} />
                {/* Trees */}
                <SimTrees cx={d.cx} cy={d.cy} count={2} />
                {/* District label */}
                <text
                  x={d.cx} y={d.cy + 18}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="bold"
                  fill="white"
                  stroke="rgba(0,0,0,0.6)"
                  strokeWidth="2"
                  paintOrder="stroke"
                  style={{ pointerEvents: 'none' }}
                >
                  {d.name}
                </text>
              </g>
            ))}

            {/* Landmarks */}
            <g opacity="0.7">
              {/* City Hall */}
              <rect x="355" y="230" width="6" height="14" fill="#D4A017" stroke="#B8860B" strokeWidth="0.5" />
              <polygon points="355,230 358,222 361,230" fill="#D4A017" stroke="#B8860B" strokeWidth="0.5" />
              <text x="358" y="220" textAnchor="middle" fontSize="5" fill="#8B7500" fontWeight="bold">CITY HALL</text>

              {/* LAX */}
              <rect x="130" y="385" width="20" height="8" rx="2" fill="#90A4AE" stroke="#607D8B" strokeWidth="0.5" />
              <text x="140" y="400" textAnchor="middle" fontSize="5" fill="#455A64" fontWeight="bold">LAX</text>

              {/* Hollywood sign */}
              <text x="380" y="185" fontSize="4" fill="#A1887F" fontWeight="bold" letterSpacing="0.5">HOLLYWOOD</text>

              {/* Port of LA */}
              <rect x="410" y="455" width="15" height="10" fill="#78909C" stroke="#546E7A" strokeWidth="0.5" />
              <text x="418" y="470" textAnchor="middle" fontSize="5" fill="#37474F" fontWeight="bold">PORT</text>

              {/* Griffith Observatory */}
              <circle cx="370" cy="170" r="3" fill="#FFD54F" stroke="#FFA000" strokeWidth="0.5" />
            </g>

            {/* Compass */}
            <g transform="translate(480, 40)">
              <circle cx="0" cy="0" r="14" fill="rgba(255,255,255,0.8)" stroke="#607D8B" strokeWidth="1" />
              <text x="0" y="-5" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#37474F">N</text>
              <polygon points="0,-12 -2,-6 2,-6" fill="#F44336" />
              <polygon points="0,12 -2,6 2,6" fill="#607D8B" />
            </g>
          </svg>

          {/* Zoom indicator */}
          <div className="absolute bottom-2 left-2 bg-white/80 rounded px-2 py-1 text-[9px] font-mono text-[#606060] border border-[#D0D0D0]">
            Population: ~4M | 15 Districts | Drag to pan, scroll to zoom
          </div>
        </div>

        {/* Detail panel */}
        <div className="w-[220px] bg-white border-l border-[#B0C0D0] overflow-auto shrink-0">
          <AnimatePresence mode="wait">
            {selectedDistrict ? (
              <motion.div
                key={selectedDistrict.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: selectedDistrict.color }} />
                  <h3 className="text-[14px] font-bold text-[#1A1A1A]">{selectedDistrict.name}</h3>
                </div>

                <div className="text-[12px] font-bold text-[#2D6A4F] mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                  {selectedDistrict.member}
                </div>

                <div className="grid grid-cols-2 gap-1 mb-3 text-[10px]">
                  <div className="bg-[#F5F5F5] rounded p-1.5 text-center">
                    <div className="font-bold text-[13px] text-[#1A1A1A]">{selectedDistrict.population}</div>
                    <div className="text-[#808080]">population</div>
                  </div>
                  <div className="bg-[#F5F5F5] rounded p-1.5 text-center">
                    <div className="font-bold text-[13px] text-[#1A1A1A]">{selectedDistrict.meetings}</div>
                    <div className="text-[#808080]">meetings/yr</div>
                  </div>
                </div>

                <div className="bracket-header text-[10px]">[◆] HOT TOPICS</div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {selectedDistrict.hotTopics.map((t) => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-[#E8F5E9] text-[#2D6A4F] border border-[#A5D6A7]">
                      {t}
                    </span>
                  ))}
                </div>

                <div className="bracket-header text-[10px]">[~] RECENT ACTION</div>
                <p className="text-[10px] text-[#404040] leading-[14px]">
                  {selectedDistrict.recentAction}
                </p>

                <div className="mt-3">
                  <button className="xp-button text-[10px] w-full">View Full District Profile</button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 text-center text-[11px] text-[#808080] mt-8"
              >
                <div className="text-[32px] mb-3">🏛️</div>
                <p className="font-bold text-[#1A1A1A] mb-1">LA Council Districts</p>
                <p>Click a district on the map to view details about its council member, hot topics, and recent activity.</p>
                <div className="mt-4 text-[9px] space-y-1">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-[#4CAF50]" /> More meetings
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-[#2196F3]" /> Fewer meetings
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Status bar */}
      <div className="bg-[#ECF0F8] border-t border-[#B0C0D0] px-2 py-0.5 text-[10px] text-[#606060] flex gap-4 shrink-0">
        <span>15 council districts</span>
        <span>~4M residents</span>
        <span>{hoveredDistrict ? `${DISTRICTS.find(d => d.id === hoveredDistrict)?.name} — ${DISTRICTS.find(d => d.id === hoveredDistrict)?.member}` : 'Click a district for details'}</span>
      </div>
    </div>
  );
}
