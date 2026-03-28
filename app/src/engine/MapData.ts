import { Terrain, Zone, Cell, MAP_W, MAP_H } from './types';

// ═══════════════════════════════════════════════
// LA Geography — 160 x 140 grid
// Cols: west(0) → east(159)
// Rows: north(0) → south(139)
// ═══════════════════════════════════════════════

// Neighborhoods define zones and districts
interface Hood {
  name: string;
  col: number; row: number; r: number;
  zone: Zone; district: number;
  label?: boolean; // show floating label
}

export const HOODS: Hood[] = [
  // === SAN FERNANDO VALLEY ===
  { name: 'Chatsworth', col: 24, row: 22, r: 9, zone: Zone.RESIDENTIAL_LOW, district: 12, label: true },
  { name: 'Granada Hills', col: 38, row: 20, r: 8, zone: Zone.RESIDENTIAL_LOW, district: 12 },
  { name: 'Porter Ranch', col: 28, row: 16, r: 6, zone: Zone.RESIDENTIAL_LOW, district: 12 },
  { name: 'Northridge', col: 32, row: 28, r: 7, zone: Zone.RESIDENTIAL_LOW, district: 12, label: true },
  { name: 'Sylmar', col: 56, row: 14, r: 7, zone: Zone.RESIDENTIAL_LOW, district: 7, label: true },
  { name: 'Pacoima', col: 56, row: 26, r: 6, zone: Zone.RESIDENTIAL_MED, district: 6 },
  { name: 'Sun Valley', col: 64, row: 28, r: 6, zone: Zone.INDUSTRIAL, district: 6, label: true },
  { name: 'Van Nuys', col: 46, row: 32, r: 7, zone: Zone.RESIDENTIAL_MED, district: 6, label: true },
  { name: 'Reseda', col: 36, row: 34, r: 6, zone: Zone.RESIDENTIAL_MED, district: 3 },
  { name: 'Encino', col: 40, row: 40, r: 6, zone: Zone.RESIDENTIAL_LOW, district: 3, label: true },
  { name: 'Tarzana', col: 32, row: 38, r: 6, zone: Zone.RESIDENTIAL_LOW, district: 3, label: true },
  { name: 'Woodland Hills', col: 24, row: 36, r: 7, zone: Zone.RESIDENTIAL_LOW, district: 3, label: true },
  { name: 'Sherman Oaks', col: 50, row: 38, r: 6, zone: Zone.RESIDENTIAL_MED, district: 2, label: true },
  { name: 'Studio City', col: 60, row: 36, r: 5, zone: Zone.RESIDENTIAL_MED, district: 2, label: true },
  { name: 'North Hollywood', col: 66, row: 32, r: 6, zone: Zone.RESIDENTIAL_MED, district: 2, label: true },
  { name: 'Burbank adj.', col: 74, row: 28, r: 5, zone: Zone.COMMERCIAL, district: 2 },

  // === HOLLYWOOD / CENTRAL ===
  { name: 'Hollywood', col: 72, row: 48, r: 7, zone: Zone.COMMERCIAL, district: 13, label: true },
  { name: 'West Hollywood', col: 66, row: 50, r: 4, zone: Zone.RESIDENTIAL_HIGH, district: 4, label: true },
  { name: 'Los Feliz', col: 80, row: 44, r: 4, zone: Zone.RESIDENTIAL_MED, district: 4, label: true },
  { name: 'Silver Lake', col: 84, row: 48, r: 4, zone: Zone.RESIDENTIAL_MED, district: 13 },
  { name: 'Echo Park', col: 86, row: 50, r: 4, zone: Zone.RESIDENTIAL_MED, district: 1, label: true },
  { name: 'Atwater Village', col: 84, row: 42, r: 4, zone: Zone.RESIDENTIAL_MED, district: 13 },

  // === WESTSIDE ===
  { name: 'Beverly Hills', col: 58, row: 54, r: 5, zone: Zone.RESIDENTIAL_HIGH, district: 5, label: true },
  { name: 'Bel Air', col: 52, row: 48, r: 5, zone: Zone.RESIDENTIAL_LOW, district: 5, label: true },
  { name: 'Brentwood', col: 44, row: 52, r: 5, zone: Zone.RESIDENTIAL_LOW, district: 11, label: true },
  { name: 'Westwood', col: 50, row: 58, r: 5, zone: Zone.RESIDENTIAL_MED, district: 5, label: true },
  { name: 'Century City', col: 58, row: 58, r: 4, zone: Zone.OFFICE, district: 5, label: true },
  { name: 'Cheviot Hills', col: 52, row: 64, r: 4, zone: Zone.RESIDENTIAL_LOW, district: 5 },
  { name: 'Culver City adj.', col: 50, row: 68, r: 5, zone: Zone.COMMERCIAL, district: 10 },

  // === MID-CITY ===
  { name: 'Hancock Park', col: 68, row: 56, r: 4, zone: Zone.RESIDENTIAL_MED, district: 4 },
  { name: 'Koreatown', col: 76, row: 58, r: 5, zone: Zone.RESIDENTIAL_HIGH, district: 4, label: true },
  { name: 'Mid-Wilshire', col: 70, row: 58, r: 4, zone: Zone.OFFICE, district: 4, label: true },
  { name: 'Mid-City', col: 66, row: 66, r: 5, zone: Zone.RESIDENTIAL_MED, district: 10, label: true },
  { name: 'Crenshaw', col: 72, row: 70, r: 5, zone: Zone.RESIDENTIAL_MED, district: 10, label: true },
  { name: 'West Adams', col: 72, row: 64, r: 4, zone: Zone.RESIDENTIAL_MED, district: 10 },

  // === DOWNTOWN ===
  { name: 'Downtown', col: 90, row: 58, r: 7, zone: Zone.DOWNTOWN, district: 9, label: true },
  { name: 'Arts District', col: 96, row: 58, r: 4, zone: Zone.OFFICE, district: 14, label: true },
  { name: 'Little Tokyo', col: 90, row: 54, r: 3, zone: Zone.COMMERCIAL, district: 9 },
  { name: 'Chinatown', col: 90, row: 50, r: 3, zone: Zone.COMMERCIAL, district: 1, label: true },

  // === EASTSIDE ===
  { name: 'Boyle Heights', col: 98, row: 62, r: 5, zone: Zone.RESIDENTIAL_MED, district: 14, label: true },
  { name: 'Lincoln Heights', col: 94, row: 48, r: 4, zone: Zone.RESIDENTIAL_MED, district: 1 },
  { name: 'Highland Park', col: 98, row: 42, r: 5, zone: Zone.RESIDENTIAL_MED, district: 1, label: true },
  { name: 'Eagle Rock', col: 102, row: 38, r: 4, zone: Zone.RESIDENTIAL_LOW, district: 14, label: true },
  { name: 'El Sereno', col: 104, row: 52, r: 4, zone: Zone.RESIDENTIAL_MED, district: 14 },
  { name: 'Glassell Park', col: 92, row: 44, r: 4, zone: Zone.RESIDENTIAL_MED, district: 1 },

  // === SOUTH LA ===
  { name: 'Exposition Park', col: 82, row: 68, r: 4, zone: Zone.CAMPUS, district: 8 },
  { name: 'South LA', col: 78, row: 78, r: 7, zone: Zone.RESIDENTIAL_MED, district: 8, label: true },
  { name: 'Watts', col: 84, row: 92, r: 5, zone: Zone.RESIDENTIAL_MED, district: 15, label: true },
  { name: 'Compton adj.', col: 82, row: 100, r: 5, zone: Zone.RESIDENTIAL_MED, district: 15 },

  // === COASTAL ===
  { name: 'Santa Monica', col: 30, row: 62, r: 6, zone: Zone.COMMERCIAL, district: 11, label: true },
  { name: 'Venice', col: 30, row: 70, r: 5, zone: Zone.RESIDENTIAL_MED, district: 11, label: true },
  { name: 'Mar Vista', col: 38, row: 72, r: 5, zone: Zone.RESIDENTIAL_LOW, district: 11 },
  { name: 'Marina del Rey', col: 34, row: 76, r: 4, zone: Zone.COMMERCIAL, district: 11, label: true },
  { name: 'Playa del Rey', col: 34, row: 80, r: 4, zone: Zone.RESIDENTIAL_LOW, district: 11 },
  { name: 'Westchester', col: 40, row: 82, r: 5, zone: Zone.RESIDENTIAL_LOW, district: 11, label: true },
  { name: 'Pacific Palisades', col: 28, row: 52, r: 6, zone: Zone.RESIDENTIAL_LOW, district: 11, label: true },

  // === SOUTH BAY / HARBOR ===
  { name: 'Inglewood adj.', col: 56, row: 82, r: 5, zone: Zone.RESIDENTIAL_MED, district: 8 },
  { name: 'Hawthorne adj.', col: 50, row: 90, r: 5, zone: Zone.RESIDENTIAL_MED, district: 15 },
  { name: 'Harbor City', col: 68, row: 104, r: 5, zone: Zone.INDUSTRIAL, district: 15 },
  { name: 'Wilmington', col: 76, row: 108, r: 5, zone: Zone.INDUSTRIAL, district: 15, label: true },
  { name: 'San Pedro', col: 78, row: 118, r: 6, zone: Zone.RESIDENTIAL_MED, district: 15, label: true },
  { name: 'Long Beach adj.', col: 96, row: 110, r: 6, zone: Zone.COMMERCIAL, district: 15, label: true },
];

export interface Landmark {
  name: string; col: number; row: number; size: number;
}

export const LANDMARKS: Landmark[] = [
  { name: 'City Hall', col: 90, row: 56, size: 3 },
  { name: 'Dodger Stadium', col: 92, row: 46, size: 5 },
  { name: 'Hollywood Sign', col: 70, row: 38, size: 5 },
  { name: 'Griffith Observatory', col: 78, row: 38, size: 3 },
  { name: 'UCLA', col: 50, row: 56, size: 6 },
  { name: 'USC', col: 82, row: 66, size: 5 },
  { name: 'LAX', col: 38, row: 84, size: 8 },
  { name: 'Santa Monica Pier', col: 26, row: 64, size: 3 },
  { name: 'Venice Beach', col: 26, row: 72, size: 3 },
  { name: 'Crypto.com Arena', col: 86, row: 64, size: 3 },
  { name: 'Port of LA', col: 76, row: 120, size: 6 },
  { name: 'The Getty', col: 44, row: 48, size: 3 },
  { name: 'LACMA', col: 66, row: 56, size: 2 },
];

// Freeways as thick polylines [col, row] waypoints
export const FREEWAYS: { name: string; pts: [number,number][]; w: number }[] = [
  { name: 'I-5', w: 3, pts: [[72,8],[76,16],[80,24],[84,32],[88,40],[90,48],[90,56],[88,64],[86,72],[84,80],[82,90],[80,100],[78,110],[76,120]] },
  { name: 'US-101', w: 3, pts: [[24,38],[32,38],[40,40],[48,42],[56,44],[64,46],[70,48],[76,50],[82,52],[88,54],[92,56]] },
  { name: 'I-405', w: 3, pts: [[38,18],[38,26],[38,34],[40,42],[42,50],[44,58],[44,66],[42,74],[40,82],[40,90],[42,98],[44,106]] },
  { name: 'I-10', w: 3, pts: [[26,64],[34,64],[42,62],[50,60],[58,60],[66,60],[74,60],[82,60],[90,60],[98,60],[106,60],[114,60]] },
  { name: 'I-110', w: 3, pts: [[82,54],[82,62],[82,70],[82,78],[80,86],[80,94],[78,102],[78,110],[78,118]] },
  { name: 'SR-2', w: 2, pts: [[72,48],[76,46],[80,44],[86,42],[92,40],[98,38]] },
  { name: 'I-210', w: 2, pts: [[62,16],[70,14],[78,14],[86,16],[94,18],[102,20],[110,22],[118,24]] },
  { name: 'I-105', w: 2, pts: [[40,90],[50,88],[60,86],[70,86],[80,86],[90,86]] },
];

// Coastline: [col, row] pairs — left of this line is ocean
const COAST: [number,number][] = [
  [14,44],[16,48],[18,52],[20,56],[22,60],[24,64],[24,68],[26,72],[26,76],[28,80],[30,84],[34,88],[38,92],[42,96],[46,100],[50,104],[54,108],[58,112],[56,116],[52,120],[50,124],[54,128],[60,130],[68,132],[76,134],[84,134],[92,132],[100,130],[110,128],[120,126],[130,124],[140,122],[150,120],[160,118],
];

function isOcean(c: number, r: number): boolean {
  if (r < 44) return false; // nothing north of Malibu is ocean
  for (let i = 0; i < COAST.length - 1; i++) {
    const [c1,r1] = COAST[i], [c2,r2] = COAST[i+1];
    if (r >= r1 && r <= r2) {
      const t = (r - r1) / (r2 - r1 || 1);
      if (c < c1 + t * (c2 - c1)) return true;
    }
  }
  if (r > 134) return true;
  return false;
}

function elevation(c: number, r: number): number {
  // San Gabriel Mountains (far north)
  if (r < 12) return Math.min(6, Math.round((12 - r) * 0.7));
  // Santa Monica Mountains (east-west band through Hollywood Hills)
  if (r >= 34 && r <= 46 && c >= 40 && c <= 100) {
    const center = 40 + Math.sin(c * 0.06) * 2;
    const dist = Math.abs(r - center);
    if (dist < 6) return Math.max(0, Math.round(4 - dist * 0.7));
  }
  // Verdugo Mountains (near Burbank/Glendale)
  if (c >= 78 && c <= 100 && r >= 20 && r <= 34) {
    const dist = Math.sqrt((c - 88) ** 2 + (r - 26) ** 2);
    if (dist < 8) return Math.max(0, Math.round(3 - dist * 0.3));
  }
  // Palos Verdes
  if (c >= 48 && c <= 64 && r >= 110 && r <= 126) return 2;
  // General slight hills
  const noise = Math.sin(c * 0.15) * Math.cos(r * 0.12) * 1.5;
  return Math.max(0, Math.round(noise));
}

function nearFreeway(c: number, r: number): number {
  for (const fw of FREEWAYS) {
    for (let i = 0; i < fw.pts.length - 1; i++) {
      const [c1,r1] = fw.pts[i], [c2,r2] = fw.pts[i+1];
      const dx = c2-c1, dy = r2-r1;
      const len2 = dx*dx + dy*dy;
      const t = Math.max(0, Math.min(1, ((c-c1)*dx + (r-r1)*dy) / (len2||1)));
      const dist = Math.sqrt((c - c1 - t*dx)**2 + (r - r1 - t*dy)**2);
      if (dist <= fw.w) return fw.w;
    }
  }
  return 0;
}

// Seeded pseudo-random for deterministic map
function hash(a: number, b: number): number {
  let h = (a * 374761393 + b * 668265263 + 1013904223) & 0xFFFFFFFF;
  h = ((h >> 13) ^ h) * 1274126177;
  return ((h >> 16) ^ h) & 0xFFFF;
}

// Building color palettes
const ROOF_COLORS = [
  0xB85C3A, 0xC4704A, 0xA0522D, 0x8B4513, // terracotta/brown
  0x6B8EAD, 0x5B7B9D, 0x4A6A8C, 0x3A5A7C, // blue/gray
  0xB8A88A, 0xC8B89A, 0xA8987A, 0xD8C8AA, // beige/tan
  0xE8E0D0, 0xD0D0D0, 0xC0C0C0, 0xF0E8E0, // white/light
  0x708060, 0x607050, 0x809070, 0x506040, // green
];

const WALL_COLORS = [
  0xD0C8B8, 0xC8C0B0, 0xB8B0A0, 0xE0D8C8, // beige
  0xA0B0C0, 0x90A0B0, 0x80A0C0, 0x70A0D0, // glass blue
  0xC0C0C0, 0xB0B0B0, 0xA0A0A0, 0xD0D0D0, // gray
  0xD8C8A8, 0xC8B898, 0xE8D8B8, 0xB8A888, // sand
];

export function generateMap(): Cell[][] {
  const map: Cell[][] = [];

  for (let r = 0; r < MAP_H; r++) {
    map[r] = [];
    for (let c = 0; c < MAP_W; c++) {
      const h = hash(c, r);
      const h100 = h % 100;
      const elev = elevation(c, r);
      const ocean = isOcean(c, r);
      const fwDist = nearFreeway(c, r);

      let terrain = Terrain.GRASS;
      let zone = Zone.NONE;
      let district = 0;
      let buildingH = 0;
      let buildingColor = ROOF_COLORS[h % ROOF_COLORS.length];
      let buildingStyle = h % 6;
      let hasTree = false;

      if (ocean) {
        terrain = Terrain.OCEAN;
      } else if (elev >= 4) {
        terrain = Terrain.MOUNTAIN;
      } else if (elev >= 2) {
        terrain = Terrain.HILL;
        if (h100 < 15) hasTree = true;
      } else if (fwDist > 0) {
        terrain = fwDist >= 3 ? Terrain.FREEWAY : Terrain.ROAD_MAJOR;
      } else {
        // Check if near coast (beach)
        if (!ocean && r >= 44) {
          const beachCheck = isOcean(c - 1, r) || isOcean(c - 2, r) || isOcean(c, r + 1) || isOcean(c, r + 2);
          if (beachCheck) terrain = Terrain.BEACH;
        }

        // Find neighborhood
        let bestHood: Hood | null = null;
        let bestDist = Infinity;
        for (const hood of HOODS) {
          const d = Math.sqrt((c - hood.col) ** 2 + (r - hood.row) ** 2);
          if (d < hood.r && d < bestDist) { bestDist = d; bestHood = hood; }
        }

        if (bestHood) {
          zone = bestHood.zone;
          district = bestHood.district;

          // Road grid
          const roadSpacing = zone === Zone.DOWNTOWN ? 3 : zone === Zone.OFFICE ? 4 : zone === Zone.RESIDENTIAL_HIGH ? 4 : 5;
          if (c % roadSpacing === 0 || r % roadSpacing === 0) {
            terrain = (c % roadSpacing === 0 && r % roadSpacing === 0) ? Terrain.ROAD_MAJOR : Terrain.ROAD;
          } else if (terrain !== Terrain.BEACH) {
            // Place buildings based on zone
            const wallColor = WALL_COLORS[h % WALL_COLORS.length];
            buildingColor = h100 < 50 ? ROOF_COLORS[h % ROOF_COLORS.length] : wallColor;

            switch (zone) {
              case Zone.DOWNTOWN:
                if (h100 < 75) { buildingH = 30 + (h % 50); buildingColor = WALL_COLORS[(h >> 4) % WALL_COLORS.length]; }
                else if (h100 < 90) buildingH = 15 + (h % 20);
                break;
              case Zone.OFFICE:
                if (h100 < 50) buildingH = 20 + (h % 25);
                else if (h100 < 70) buildingH = 10 + (h % 15);
                break;
              case Zone.RESIDENTIAL_HIGH:
                if (h100 < 35) buildingH = 15 + (h % 20);
                else if (h100 < 60) buildingH = 8 + (h % 10);
                break;
              case Zone.RESIDENTIAL_MED:
                if (h100 < 40) buildingH = 6 + (h % 8);
                else if (h100 < 55) buildingH = 4 + (h % 5);
                else if (h100 < 65) hasTree = true;
                break;
              case Zone.RESIDENTIAL_LOW:
                if (h100 < 35) buildingH = 3 + (h % 4);
                else if (h100 < 55) hasTree = true;
                break;
              case Zone.COMMERCIAL:
                if (h100 < 40) buildingH = 6 + (h % 10);
                else if (h100 < 55) buildingH = 3 + (h % 5);
                break;
              case Zone.INDUSTRIAL:
                if (h100 < 35) { buildingH = 5 + (h % 8); buildingColor = 0x808080; }
                break;
              case Zone.CAMPUS:
                if (h100 < 25) buildingH = 4 + (h % 6);
                else if (h100 < 50) hasTree = true;
                break;
              case Zone.PARK:
                hasTree = h100 < 70;
                break;
              case Zone.AIRPORT:
                if (h100 < 20) { buildingH = 4 + (h % 6); buildingColor = 0xC0C0C0; }
                break;
              case Zone.PORT:
                if (h100 < 30) { buildingH = 8 + (h % 15); buildingColor = 0xC04040; }
                break;
            }
          }
        } else {
          // Undeveloped land
          if (h100 < 20 && terrain === Terrain.GRASS) hasTree = true;
        }
      }

      map[r][c] = { terrain, zone, elevation: elev, district, buildingH, buildingColor, buildingStyle, hasTree };
    }
  }
  return map;
}
