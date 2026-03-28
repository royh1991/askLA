'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface District {
  id: number;
  name: string;
  member: string;
  color: string;
  neighborhoods: string[];
  hotTopics: string[];
  cx: number;
  cy: number;
  path: string;
  meetings: number;
  population: string;
  recentAction: string;
}

// Real LA Council District boundaries from ArcGIS GeoJSON
const DISTRICTS: District[] = [
  { id: 1, name: "CD-1", member: "Eunisses Hernandez", color: "#4CAF50", neighborhoods: ["Glassell Park", "Lincoln Heights", "Highland Park", "Mt. Washington"], hotTopics: ["Housing", "Immigration", "Parks"], cx: 651.8, cy: 292.9, meetings: 42, population: "262K", recentAction: "Community land trust expansion approved", path: "M612.3,323.2 L607.6,325.7 L604.8,329.8 L603.5,338.0 L589.1,333.3 L565.2,331.1 L565.7,320.7 L579.0,317.0 L578.6,310.7 L591.9,306.3 L594.3,301.9 L606.2,306.2 L623.6,300.8 L635.7,293.9 L641.2,295.1 L640.0,293.5 L639.5,291.0 L639.3,288.6 L640.9,286.2 L643.2,285.4 L645.1,283.1 L648.2,282.2 L657.9,279.0 L670.2,284.4 L669.2,276.6 L651.4,268.3 L648.0,260.4 L640.8,258.1 L650.7,252.7 L682.0,242.8 L718.4,247.8 L736.4,250.9 L734.0,253.5 L729.0,266.7 L724.2,282.2 L716.2,284.7 L715.3,290.4 L719.0,294.8 L720.8,300.7 L707.9,303.4 L690.5,305.7 L668.4,307.3 L654.3,310.8 L643.6,308.4 L626.5,316.6 L612.3,323.2 Z" },
  { id: 2, name: "CD-2", member: "Paul Krekorian", color: "#2196F3", neighborhoods: ["Studio City", "North Hollywood", "Sun Valley", "Valley Village"], hotTopics: ["Budget", "Entertainment", "Transit"], cx: 437.7, cy: 209.3, meetings: 38, population: "268K", recentAction: "City budget surplus allocation", path: "M510.3,141.3 L509.7,151.5 L493.4,156.3 L463.6,162.1 L461.7,162.2 L467.9,167.8 L479.9,191.6 L474.5,203.6 L452.6,207.4 L450.0,210.0 L458.1,216.8 L473.2,222.7 L471.1,229.2 L466.4,230.6 L468.9,237.4 L460.3,236.2 L459.8,239.3 L455.0,241.5 L450.8,244.3 L444.7,244.2 L439.2,244.6 L435.3,243.2 L431.5,244.3 L425.6,246.7 L420.1,246.6 L417.3,243.3 L412.6,240.5 L409.7,238.7 L404.1,236.6 L394.2,237.1 L391.3,226.6 L384.1,219.0 L389.8,217.3 L397.0,209.3 L401.2,205.1 L384.5,192.3 L358.2,183.6 L358.2,176.1 L345.2,162.0 L379.4,151.6 L383.9,140.6 L420.9,140.6 L427.5,154.4 L446.9,154.4 L472.5,140.4 L483.4,133.5 L510.3,141.3 Z" },
  { id: 3, name: "CD-3", member: "Bob Blumenfield", color: "#FF9800", neighborhoods: ["Woodland Hills", "Tarzana", "Encino", "Reseda"], hotTopics: ["Public Safety", "Homelessness", "Valley Issues"], cx: 152.0, cy: 193.7, meetings: 35, population: "272K", recentAction: "RV parking restrictions in Woodland Hills", path: "M241.7,154.5 L241.8,176.1 L228.8,179.5 L228.8,198.5 L222.4,213.8 L222.4,229.9 L210.9,236.1 L203.0,239.7 L196.0,239.9 L190.1,240.4 L188.5,238.1 L184.9,239.3 L180.5,237.0 L174.4,235.1 L144.2,228.3 L100.0,216.4 L76.5,215.6 L63.8,207.4 L54.2,202.9 L34.2,195.0 L20.0,187.5 L20.0,179.0 L35.7,179.4 L54.3,177.3 L86.4,177.4 L99.3,169.8 L99.3,154.6 L99.2,143.8 L112.3,136.1 L116.6,132.8 L115.0,127.6 L145.6,126.2 L148.8,129.7 L163.9,130.0 L176.9,141.2 L201.2,144.1 L215.8,148.8 L222.3,154.5 L241.7,154.5 Z" },
  { id: 4, name: "CD-4", member: "Nithya Raman", color: "#9C27B0", neighborhoods: ["Silver Lake", "Los Feliz", "Hancock Park", "Mid-Wilshire"], hotTopics: ["Housing", "Homelessness", "CEQA Reform"], cx: 431.2, cy: 253.0, meetings: 48, population: "259K", recentAction: "Rent stabilization extension (CF 25-1026)", path: "M358.2,184.7 L399.8,203.8 L389.8,217.3 L390.3,225.8 L397.6,237.4 L410.4,238.6 L420.1,246.7 L435.1,243.3 L450.4,244.4 L455.2,241.3 L462.8,237.1 L466.9,230.0 L473.5,223.7 L448.9,208.7 L476.1,196.0 L507.9,220.3 L552.7,203.5 L598.0,215.6 L615.7,254.3 L602.7,272.4 L564.8,261.9 L510.1,262.1 L521.7,272.0 L552.1,284.7 L547.6,309.6 L519.2,313.2 L472.6,311.5 L494.5,299.5 L501.3,275.4 L464.6,269.9 L441.8,274.1 L429.4,276.9 L429.0,261.2 L422.5,255.3 L415.6,273.9 L404.4,267.0 L403.9,269.9 L399.5,275.4 L392.1,268.1 L384.2,247.6 L387.7,241.5 L377.7,235.0 L356.7,234.9 L320.5,236.0 L307.9,239.8 L314.6,205.8 L317.0,188.7 L358.2,184.7 Z" },
  { id: 5, name: "CD-5", member: "Katy Young", color: "#E91E63", neighborhoods: ["Bel Air", "Westwood", "Century City", "Beverlywood"], hotTopics: ["Development", "Transit", "Westside"], cx: 358.2, cy: 267.0, meetings: 36, population: "271K", recentAction: "Expo Line corridor development plan", path: "M241.8,177.2 L312.5,202.8 L315.5,216.1 L312.5,236.2 L341.7,234.4 L365.6,235.6 L385.6,236.3 L390.9,239.3 L384.3,247.6 L384.7,254.6 L393.9,270.0 L383.4,277.3 L383.7,285.2 L384.0,293.3 L409.2,316.6 L413.8,312.3 L432.0,312.3 L451.3,309.8 L451.1,299.5 L454.2,286.4 L458.2,282.7 L472.6,280.1 L504.0,281.0 L486.8,292.4 L471.4,310.6 L434.0,333.5 L420.4,348.4 L392.0,358.5 L361.3,334.7 L336.5,303.2 L305.7,279.4 L295.0,249.1 L282.8,235.0 L268.0,237.2 L254.2,235.5 L238.7,237.4 L220.5,235.2 L213.8,235.7 L222.4,216.0 L228.8,186.8 L241.8,177.2 Z" },
  { id: 6, name: "CD-6", member: "Imelda Padilla", color: "#00BCD4", neighborhoods: ["Van Nuys", "Pacoima", "Arleta", "Panorama City"], hotTopics: ["Infrastructure", "Sun Valley", "Community"], cx: 355.6, cy: 151.3, meetings: 32, population: "275K", recentAction: "Street improvement bond allocation", path: "M468.8,133.3 L477.3,140.6 L463.6,143.1 L454.9,154.4 L432.3,154.4 L422.6,143.0 L405.7,140.6 L383.1,142.5 L378.3,154.4 L345.2,157.0 L348.9,162.0 L358.2,178.2 L355.0,184.7 L314.9,185.4 L316.9,195.2 L314.5,201.9 L312.3,202.6 L303.3,199.3 L281.1,199.3 L271.7,193.7 L253.8,183.9 L241.8,176.1 L241.7,161.9 L254.6,146.9 L268.1,141.2 L297.7,141.0 L309.2,137.2 L327.0,128.1 L334.7,118.3 L341.4,111.0 L355.0,95.8 L369.9,107.2 L388.8,119.8 L405.3,116.7 L431.5,103.3 L449.7,105.9 L448.4,111.9 L458.6,114.1 L465.2,121.1 L466.2,127.5 L468.8,133.3 Z" },
  { id: 7, name: "CD-7", member: "Monica Rodriguez", color: "#795548", neighborhoods: ["Sylmar", "Sunland-Tujunga", "Lake View Terrace", "Shadow Hills"], hotTopics: ["Fire Safety", "Rural Issues", "Wildlife"], cx: 415.6, cy: 74.6, meetings: 30, population: "263K", recentAction: "Fire evacuation route improvements", path: "M510.3,141.3 L479.0,133.4 L466.2,127.5 L459.8,116.3 L449.4,108.8 L431.5,103.3 L397.9,120.6 L380.2,114.0 L356.7,97.8 L340.7,109.0 L334.9,118.2 L309.8,129.9 L310.5,108.1 L311.1,87.2 L317.5,70.8 L290.4,48.9 L276.8,38.0 L256.7,23.7 L263.6,20.0 L301.9,27.4 L389.3,27.7 L397.3,33.2 L410.2,35.3 L422.6,40.7 L415.8,60.3 L408.0,73.4 L416.2,70.7 L422.3,62.1 L442.8,62.1 L452.4,76.2 L461.7,74.0 L463.5,76.4 L489.0,81.0 L525.8,73.5 L577.1,66.0 L597.5,81.7 L651.7,93.2 L614.9,120.9 L614.9,128.8 L510.3,141.3 Z" },
  { id: 8, name: "CD-8", member: "Marqueece Harris-Dawson", color: "#F44336", neighborhoods: ["South LA", "Vermont Square", "Chesterfield Sq.", "Exposition Park"], hotTopics: ["Economic Dev.", "South LA", "Jobs"], cx: 518.5, cy: 376.5, meetings: 40, population: "266K", recentAction: "Workforce development center approved", path: "M565.2,333.3 L589.4,338.8 L578.2,352.9 L565.3,385.7 L585.7,390.3 L594.2,405.4 L634.1,422.8 L632.5,439.1 L578.0,432.4 L565.3,424.0 L545.8,434.1 L539.4,402.3 L516.6,405.5 L507.0,391.0 L478.8,390.6 L488.5,383.0 L510.4,383.6 L518.6,369.4 L515.7,367.3 L510.2,364.6 L505.1,366.6 L496.8,367.0 L487.2,368.3 L481.3,373.8 L479.0,372.6 L477.7,370.0 L480.0,363.0 L485.4,359.2 L502.5,362.8 L514.6,365.3 L538.6,360.6 L552.3,333.7 L565.2,333.3 Z" },
  { id: 9, name: "CD-9", member: "Curren Price", color: "#3F51B5", neighborhoods: ["Downtown", "South Park", "Historic Core", "Fashion District"], hotTopics: ["Downtown", "Arts District", "Transit"], cx: 616.4, cy: 359.2, meetings: 37, population: "269K", recentAction: "Arts District zoning overhaul", path: "M654.9,356.4 L655.7,367.4 L657.6,382.9 L636.8,382.8 L630.4,393.1 L630.5,413.4 L633.7,422.9 L607.6,413.5 L594.2,406.4 L594.2,390.2 L585.7,390.3 L578.2,352.7 L582.3,342.2 L589.4,338.8 L603.6,339.3 L604.3,332.2 L605.7,327.7 L608.3,325.2 L611.9,323.4 L618.7,325.2 L610.8,331.9 L610.6,334.7 L612.7,337.7 L626.3,342.1 L639.1,346.3 L650.5,350.4 L655.1,353.1 L654.9,356.4 Z" },
  { id: 10, name: "CD-10", member: "Heather Hutt", color: "#607D8B", neighborhoods: ["Mid-City", "Crenshaw", "West Adams", "Leimert Park"], hotTopics: ["Transportation", "Mid-City", "Crenshaw"], cx: 498.4, cy: 342.2, meetings: 44, population: "258K", recentAction: "Venice Mobility Hub feasibility study", path: "M588.9,305.4 L578.7,313.1 L565.7,318.8 L565.2,332.7 L552.3,334.0 L538.6,366.1 L514.6,365.3 L502.5,362.8 L485.6,359.2 L480.7,361.4 L474.6,363.2 L466.1,364.5 L457.2,359.4 L455.8,355.8 L456.1,355.0 L452.7,353.0 L445.1,350.4 L451.5,344.1 L456.5,340.1 L440.8,340.3 L430.9,339.3 L452.8,322.7 L471.1,311.2 L490.2,316.8 L515.4,312.4 L540.2,317.0 L551.4,311.2 L548.5,305.6 L552.1,288.5 L565.1,296.0 L575.9,299.3 L588.9,305.4 Z" },
  { id: 11, name: "CD-11", member: "Traci Park", color: "#009688", neighborhoods: ["Venice", "Mar Vista", "Brentwood", "Pacific Palisades"], hotTopics: ["Venice", "Coastal", "LAX"], cx: 326.8, cy: 348.8, meetings: 39, population: "273K", recentAction: "Venice alfresco dining permits", path: "M329.2,303.6 L322.2,312.8 L361.3,334.7 L386.4,361.6 L387.5,373.1 L375.5,370.5 L369.4,380.7 L389.0,374.1 L416.1,370.7 L415.6,385.9 L438.3,396.1 L459.2,395.3 L475.0,389.6 L452.5,412.3 L461.7,425.6 L454.1,445.7 L380.7,443.6 L372.6,458.6 L365.1,447.3 L351.9,431.0 L335.7,413.3 L325.6,410.6 L327.9,404.7 L307.5,387.3 L296.1,375.5 L334.2,361.5 L329.5,339.2 L293.2,328.5 L258.0,330.1 L249.1,341.5 L222.0,337.7 L187.5,332.4 L172.3,329.0 L175.3,235.5 L184.9,239.3 L189.0,240.0 L207.0,238.7 L217.9,234.6 L232.5,237.6 L253.0,236.2 L264.7,237.2 L276.6,236.3 L298.1,236.7 L295.1,248.1 L302.3,264.7 L306.8,284.8 L329.2,303.6 Z" },
  { id: 12, name: "CD-12", member: "John Lee", color: "#CDDC39", neighborhoods: ["Chatsworth", "Granada Hills", "Porter Ranch", "Northridge"], hotTopics: ["Parks", "Granada Hills", "Public Safety"], cx: 158.8, cy: 115.5, meetings: 33, population: "274K", recentAction: "Oversized vehicle restrictions", path: "M309.3,129.9 L306.4,140.9 L279.0,141.2 L261.1,141.1 L253.8,154.5 L220.6,154.5 L203.5,146.0 L200.9,141.8 L163.9,132.8 L148.6,129.6 L134.8,126.2 L115.2,126.3 L116.8,132.6 L112.9,135.1 L112.3,137.9 L99.2,146.2 L99.4,177.4 L54.6,177.2 L35.4,179.5 L25.2,180.0 L20.1,172.3 L34.3,174.2 L37.1,166.8 L20.6,153.5 L35.6,149.7 L42.1,134.9 L76.1,123.4 L72.5,95.6 L82.0,85.3 L110.1,82.0 L125.7,85.1 L131.9,72.2 L162.9,60.4 L184.2,59.7 L207.7,58.7 L201.8,42.6 L219.0,43.7 L245.3,29.7 L261.1,29.1 L278.0,38.5 L284.8,43.6 L317.4,69.2 L314.2,80.7 L310.7,92.7 L310.4,112.1 L309.3,129.9 Z" },
  { id: 13, name: "CD-13", member: "Hugo Soto-Martinez", color: "#FF5722", neighborhoods: ["Hollywood", "East Hollywood", "Atwater Village", "Elysian Valley"], hotTopics: ["Rent Control", "Hollywood", "Nightlife"], cx: 613.3, cy: 269.7, meetings: 46, population: "256K", recentAction: "Tenant anti-harassment ordinance", path: "M656.4,240.2 L669.3,245.2 L648.3,253.7 L643.2,259.0 L651.0,267.1 L668.4,276.0 L672.8,284.6 L653.9,278.8 L644.7,283.8 L643.2,285.4 L640.6,286.1 L639.5,288.2 L638.2,289.7 L639.9,291.6 L640.7,294.7 L625.6,299.3 L622.6,311.0 L603.0,305.0 L594.3,301.9 L571.5,299.4 L562.8,292.3 L550.8,284.7 L529.7,284.8 L519.7,282.9 L521.7,272.0 L510.1,262.3 L534.1,262.1 L564.8,261.9 L590.8,271.9 L607.4,272.5 L626.1,262.9 L616.7,253.5 L602.5,229.0 L597.7,212.0 L617.0,232.8 L627.3,244.0 L634.7,242.4 L656.4,240.2 Z" },
  { id: 14, name: "CD-14", member: "Kevin de León", color: "#8BC34A", neighborhoods: ["Boyle Heights", "Eagle Rock", "El Sereno", "Northeast LA"], hotTopics: ["Boyle Heights", "Eagle Rock", "Encampments"], cx: 728.1, cy: 273.1, meetings: 41, population: "261K", recentAction: "Encampment clearance protocol update", path: "M654.9,356.4 L648.4,349.9 L609.8,336.8 L618.7,325.2 L643.5,308.3 L665.3,307.5 L711.1,303.6 L723.1,292.8 L716.7,285.1 L724.2,282.2 L732.2,254.6 L714.2,247.1 L667.6,243.6 L660.0,242.0 L670.6,230.4 L687.2,218.0 L740.1,222.2 L742.8,224.8 L734.4,232.4 L746.7,239.7 L756.4,240.0 L759.6,239.9 L764.3,240.5 L748.3,254.7 L754.1,269.0 L779.8,270.0 L774.1,273.4 L772.4,290.1 L770.5,296.7 L769.2,299.0 L765.3,306.6 L724.8,313.5 L725.3,358.4 L690.7,356.2 L654.9,356.4 Z" },
  { id: 15, name: "CD-15", member: "Tim McOsker", color: "#FFC107", neighborhoods: ["San Pedro", "Watts", "Harbor City", "Wilmington"], hotTopics: ["Port", "San Pedro", "Watts"], cx: 581.2, cy: 608.3, meetings: 34, population: "270K", recentAction: "Port community benefits agreement", path: "M578.0,446.4 L632.2,438.3 L650.2,420.6 L665.9,425.8 L669.0,446.0 L598.4,452.6 L593.1,514.0 L567.5,571.2 L629.8,575.5 L677.4,576.0 L671.6,555.1 L668.1,606.7 L652.1,649.6 L610.6,647.3 L603.5,646.8 L637.9,615.1 L619.5,617.1 L599.1,615.3 L582.8,628.0 L600.6,650.7 L589.4,659.7 L591.4,674.2 L587.8,676.1 L578.9,679.8 L573.2,679.1 L569.2,675.0 L557.4,672.4 L542.8,669.6 L539.3,669.2 L533.3,666.6 L522.9,664.0 L534.5,652.6 L536.2,651.6 L537.6,644.9 L536.0,641.5 L552.2,621.7 L552.6,608.7 L552.5,573.0 L566.6,511.9 L578.0,479.8 L578.0,446.4 Z" },
];

export default function DistrictMap() {
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showDistricts, setShowDistricts] = useState(true);
  const panRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);

  const handlePanStart = (e: React.MouseEvent) => {
    if ((e.target as Element).closest('.district-click')) return;
    panRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
    const move = (ev: MouseEvent) => {
      if (!panRef.current) return;
      setPan({ x: panRef.current.panX + (ev.clientX - panRef.current.startX), y: panRef.current.panY + (ev.clientY - panRef.current.startY) });
    };
    const up = () => { panRef.current = null; window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  return (
    <div className="h-full flex flex-col bg-[#1a2232]">
      {/* SimCity-style toolbar */}
      <div style={{
        background: 'linear-gradient(180deg, #4A6A8A 0%, #3A5A7A 50%, #2A4A6A 100%)',
        borderBottom: '2px solid #1A3A5A',
        padding: '3px 8px',
        display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: 'var(--font-mono)', fontSize: 10, color: '#D0E0F0',
      }}>
        <span style={{ fontWeight: 'bold', color: '#FFD700', fontSize: 11 }}>SimCity LA</span>
        <span style={{ color: '#8AA' }}>|</span>
        <button className="xp-button text-[9px] !px-2 !min-h-[18px]" onClick={() => setZoom(z => Math.min(2.5, z + 0.2))}>🔍+</button>
        <button className="xp-button text-[9px] !px-2 !min-h-[18px]" onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}>🔍-</button>
        <button className="xp-button text-[9px] !px-2 !min-h-[18px]" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>Reset</button>
        <span style={{ color: '#8AA' }}>|</span>
        <label className="flex items-center gap-1 cursor-pointer text-[10px]">
          <input type="checkbox" checked={showDistricts} onChange={() => setShowDistricts(!showDistricts)} />
          <span>Districts</span>
        </label>
        <div style={{ flex: 1 }} />
        <span style={{ color: '#8AB' }}>Population: ~4M</span>
        <span style={{ color: '#8AA' }}>|</span>
        <span style={{ color: '#8AB' }}>15 Districts</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Map area with SimCity base image */}
        <div className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseDown={handlePanStart}
          onWheel={e => { e.preventDefault(); setZoom(z => Math.max(0.5, Math.min(2.5, z - e.deltaY * 0.001))); }}>

          {/* SimCity base map (Gemini-generated) */}
          <div style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: 'center center',
            width: '100%', height: '100%',
            position: 'relative',
          }}>
            <img
              src="/map-la-simcity.png"
              alt="SimCity LA"
              style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
              draggable={false}
            />

            {/* GeoJSON district overlay */}
            {showDistricts && (
              <svg viewBox="0 0 800 700"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                {DISTRICTS.map((d) => {
                  const isSelected = selectedDistrict?.id === d.id;
                  const isHovered = hoveredDistrict === d.id;
                  return (
                    <g key={d.id} className="district-click">
                      <path
                        d={d.path}
                        fill={d.color}
                        fillOpacity={isSelected ? 0.45 : isHovered ? 0.35 : 0.15}
                        stroke={isSelected ? '#FFFFFF' : isHovered ? '#FFFFFF' : d.color}
                        strokeWidth={isSelected ? 3 : isHovered ? 2.5 : 1.5}
                        strokeOpacity={isSelected ? 1 : isHovered ? 0.9 : 0.6}
                        cursor="pointer"
                        onClick={() => setSelectedDistrict(d)}
                        onMouseEnter={() => setHoveredDistrict(d.id)}
                        onMouseLeave={() => setHoveredDistrict(null)}
                        style={{ transition: 'fill-opacity 0.15s, stroke-width 0.15s' }}
                      />
                      {/* District label */}
                      <text x={d.cx} y={d.cy - 4} textAnchor="middle" dominantBaseline="middle"
                        fontSize="10" fontWeight="bold" fill="white"
                        stroke="rgba(0,0,0,0.8)" strokeWidth="3" paintOrder="stroke"
                        style={{ pointerEvents: 'none', fontFamily: 'var(--font-mono)' }}>
                        {d.name}
                      </text>
                      <text x={d.cx} y={d.cy + 8} textAnchor="middle" dominantBaseline="middle"
                        fontSize="7" fill="rgba(255,255,255,0.9)"
                        stroke="rgba(0,0,0,0.7)" strokeWidth="2.5" paintOrder="stroke"
                        style={{ pointerEvents: 'none', fontFamily: 'var(--font-body)' }}>
                        {d.member.split(' ').pop()}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className="w-[250px] border-l border-[#2A4A6A] bg-[#1A2A3A] overflow-auto shrink-0">
          <AnimatePresence mode="wait">
            {selectedDistrict ? (
              <motion.div key={selectedDistrict.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="p-3 text-[11px]">
                {/* District header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: selectedDistrict.color, boxShadow: `0 0 8px ${selectedDistrict.color}` }} />
                  <div>
                    <div className="text-[16px] font-bold text-white">{selectedDistrict.name}</div>
                    <div className="text-[10px] text-[#8AA]">{selectedDistrict.population} residents</div>
                  </div>
                </div>

                {/* Council member */}
                <div className="bg-[#2A3A4A] rounded-lg p-2.5 mb-3 border border-[#3A5A7A]">
                  <div className="text-[9px] text-[#6A8A] uppercase tracking-wider mb-1">Council Member</div>
                  <div className="text-[14px] font-bold text-[#E0F0FF]" style={{ fontFamily: 'Georgia, serif' }}>
                    {selectedDistrict.member}
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-[#2A3A4A] rounded p-2 text-center border border-[#3A5A7A]">
                    <div className="text-[18px] font-bold text-[#4CAF50]">{selectedDistrict.meetings}</div>
                    <div className="text-[8px] text-[#8AA] uppercase">meetings/yr</div>
                  </div>
                  <div className="bg-[#2A3A4A] rounded p-2 text-center border border-[#3A5A7A]">
                    <div className="text-[18px] font-bold text-[#FFD700]">{selectedDistrict.population}</div>
                    <div className="text-[8px] text-[#8AA] uppercase">population</div>
                  </div>
                </div>

                {/* Neighborhoods */}
                <div className="mb-3">
                  <div className="text-[9px] text-[#6A8A] uppercase tracking-wider mb-1.5 font-bold font-mono">[■] Neighborhoods</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedDistrict.neighborhoods.map(n => (
                      <span key={n} className="text-[9px] px-2 py-0.5 rounded bg-[#2A3A4A] text-[#C0D0E0] border border-[#3A5A7A]">{n}</span>
                    ))}
                  </div>
                </div>

                {/* Hot Topics */}
                <div className="mb-3">
                  <div className="text-[9px] text-[#6A8A] uppercase tracking-wider mb-1.5 font-bold font-mono">[◆] Hot Topics</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedDistrict.hotTopics.map(t => (
                      <span key={t} className="text-[9px] px-2 py-0.5 rounded text-white border"
                        style={{ backgroundColor: selectedDistrict.color + '33', borderColor: selectedDistrict.color + '66' }}>{t}</span>
                    ))}
                  </div>
                </div>

                {/* Recent Action */}
                <div className="mb-3">
                  <div className="text-[9px] text-[#6A8A] uppercase tracking-wider mb-1.5 font-bold font-mono">[~] Recent Action</div>
                  <p className="text-[10px] text-[#B0C8E0] leading-[15px] bg-[#2A3A4A] rounded p-2 border border-[#3A5A7A]">
                    {selectedDistrict.recentAction}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5">
                  <button className="xp-button text-[10px] w-full">View Meetings</button>
                  <button className="xp-button text-[10px] w-full">Search Transcripts</button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="p-3 text-center text-[11px] text-[#6A8AAA] mt-4">
                <img src="/sprites/map-city-hall.png" alt="" className="w-16 h-16 mx-auto mb-3 opacity-60" />
                <p className="font-bold text-[#B0C8E0] mb-1 text-[13px]">LA Council Districts</p>
                <p className="leading-[15px] mb-4">Click a district on the SimCity map to see council member info and activity.</p>

                {/* Mini district list */}
                <div className="text-left space-y-0.5">
                  {DISTRICTS.map(d => (
                    <div key={d.id}
                      className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-[#2A3A4A] transition-colors"
                      onClick={() => setSelectedDistrict(d)}>
                      <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="font-mono text-[9px] text-[#8AA] w-8">{d.name}</span>
                      <span className="text-[9px] text-[#B0C8E0] truncate">{d.member}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* SimCity status bar */}
      <div style={{
        background: 'linear-gradient(180deg, #3A5A7A 0%, #2A4A6A 100%)',
        borderTop: '1px solid #4A6A8A',
        padding: '2px 8px',
        display: 'flex', alignItems: 'center', gap: 12,
        fontFamily: 'var(--font-mono)', fontSize: 9, color: '#8AABB0',
      }}>
        <span>🏛️ Los Angeles, CA</span>
        <span style={{ color: '#4A6A' }}>|</span>
        <span>15 council districts</span>
        <span style={{ color: '#4A6A' }}>|</span>
        <span>{hoveredDistrict ? `${DISTRICTS.find(d => d.id === hoveredDistrict)?.name} — ${DISTRICTS.find(d => d.id === hoveredDistrict)?.member}` : 'Map: Gemini Imagen 4.0 · Boundaries: LA City GeoHub'}</span>
        <div style={{ flex: 1 }} />
        <span style={{ color: '#4CAF50' }}>● {zoom.toFixed(1)}x</span>
      </div>
    </div>
  );
}
