import { TileType, BuildingType, TileData, MAP_COLS, MAP_ROWS } from './types';

// ============================================================
// LA Geographic Reference
// ============================================================
// Grid: 120 cols x 100 rows
// Real bounds: lon [-118.67, -118.15], lat [33.70, 34.34]
// Each tile ≈ 0.25 sq miles
//
// Orientation:
//   col 0 = far west (Pacific), col 119 = far east
//   row 0 = far north (mountains), row 99 = far south (harbor)
// ============================================================

// Named neighborhoods with their approximate grid positions and building density
interface Neighborhood {
  name: string;
  col: number; // center col
  row: number; // center row
  radius: number; // tiles from center
  density: 'suburban' | 'urban' | 'dense' | 'downtown' | 'industrial' | 'campus' | 'park' | 'beach' | 'airport' | 'port';
  district: number;
}

const NEIGHBORHOODS: Neighborhood[] = [
  // San Fernando Valley (north)
  { name: 'Chatsworth', col: 18, row: 20, radius: 8, density: 'suburban', district: 12 },
  { name: 'Granada Hills', col: 30, row: 18, radius: 7, density: 'suburban', district: 12 },
  { name: 'Porter Ranch', col: 22, row: 14, radius: 5, density: 'suburban', district: 12 },
  { name: 'Northridge', col: 25, row: 24, radius: 6, density: 'suburban', district: 12 },
  { name: 'Sylmar', col: 45, row: 12, radius: 6, density: 'suburban', district: 7 },
  { name: 'Pacoima', col: 45, row: 22, radius: 5, density: 'urban', district: 6 },
  { name: 'Sun Valley', col: 50, row: 24, radius: 5, density: 'industrial', district: 6 },
  { name: 'Van Nuys', col: 38, row: 26, radius: 6, density: 'urban', district: 6 },
  { name: 'Reseda', col: 30, row: 28, radius: 5, density: 'suburban', district: 3 },
  { name: 'Encino', col: 32, row: 32, radius: 5, density: 'suburban', district: 3 },
  { name: 'Tarzana', col: 26, row: 32, radius: 5, density: 'suburban', district: 3 },
  { name: 'Woodland Hills', col: 20, row: 30, radius: 6, density: 'suburban', district: 3 },
  { name: 'Sherman Oaks', col: 40, row: 30, radius: 5, density: 'urban', district: 2 },
  { name: 'Studio City', col: 48, row: 30, radius: 4, density: 'urban', district: 2 },
  { name: 'North Hollywood', col: 52, row: 28, radius: 5, density: 'urban', district: 2 },
  { name: 'Burbank adj.', col: 58, row: 25, radius: 4, density: 'urban', district: 2 },

  // Hollywood Hills / Central
  { name: 'Hollywood', col: 56, row: 36, radius: 5, density: 'urban', district: 13 },
  { name: 'West Hollywood', col: 52, row: 38, radius: 3, density: 'dense', district: 4 },
  { name: 'Los Feliz', col: 62, row: 34, radius: 3, density: 'urban', district: 4 },
  { name: 'Silver Lake', col: 66, row: 36, radius: 3, density: 'urban', district: 13 },
  { name: 'Echo Park', col: 68, row: 38, radius: 3, density: 'urban', district: 1 },
  { name: 'Atwater Village', col: 66, row: 32, radius: 3, density: 'urban', district: 13 },

  // Westside
  { name: 'Beverly Hills', col: 46, row: 40, radius: 4, density: 'dense', district: 5 },
  { name: 'Bel Air', col: 42, row: 36, radius: 4, density: 'suburban', district: 5 },
  { name: 'Brentwood', col: 36, row: 40, radius: 4, density: 'suburban', district: 11 },
  { name: 'Westwood', col: 40, row: 44, radius: 4, density: 'urban', district: 5 },
  { name: 'Century City', col: 46, row: 44, radius: 3, density: 'dense', district: 5 },
  { name: 'Cheviot Hills', col: 42, row: 48, radius: 3, density: 'suburban', district: 5 },
  { name: 'Culver City adj.', col: 40, row: 52, radius: 4, density: 'urban', district: 10 },

  // Mid-City / Central
  { name: 'Hancock Park', col: 52, row: 42, radius: 3, density: 'urban', district: 4 },
  { name: 'Koreatown', col: 58, row: 44, radius: 4, density: 'dense', district: 4 },
  { name: 'Mid-Wilshire', col: 54, row: 44, radius: 3, density: 'dense', district: 4 },
  { name: 'Mid-City', col: 52, row: 50, radius: 4, density: 'urban', district: 10 },
  { name: 'Crenshaw', col: 56, row: 52, radius: 4, density: 'urban', district: 10 },
  { name: 'Leimert Park', col: 58, row: 54, radius: 3, density: 'urban', district: 10 },
  { name: 'West Adams', col: 56, row: 48, radius: 3, density: 'urban', district: 10 },

  // Downtown core
  { name: 'Downtown', col: 68, row: 44, radius: 5, density: 'downtown', district: 9 },
  { name: 'Arts District', col: 74, row: 44, radius: 3, density: 'dense', district: 14 },
  { name: 'Little Tokyo', col: 70, row: 42, radius: 2, density: 'dense', district: 9 },
  { name: 'Chinatown', col: 70, row: 38, radius: 2, density: 'urban', district: 1 },

  // Eastside
  { name: 'Boyle Heights', col: 76, row: 46, radius: 4, density: 'urban', district: 14 },
  { name: 'Lincoln Heights', col: 74, row: 38, radius: 3, density: 'urban', district: 1 },
  { name: 'Highland Park', col: 76, row: 34, radius: 4, density: 'urban', district: 1 },
  { name: 'Eagle Rock', col: 78, row: 30, radius: 3, density: 'suburban', district: 14 },
  { name: 'El Sereno', col: 80, row: 40, radius: 3, density: 'urban', district: 14 },
  { name: 'Glassell Park', col: 72, row: 34, radius: 3, density: 'urban', district: 1 },
  { name: 'Mt. Washington', col: 72, row: 36, radius: 2, density: 'suburban', district: 1 },

  // South LA
  { name: 'Exposition Park', col: 64, row: 52, radius: 3, density: 'urban', district: 8 },
  { name: 'Vermont Square', col: 62, row: 56, radius: 3, density: 'urban', district: 8 },
  { name: 'South LA', col: 60, row: 60, radius: 6, density: 'urban', district: 8 },
  { name: 'Watts', col: 64, row: 70, radius: 4, density: 'urban', district: 15 },

  // Coastal
  { name: 'Santa Monica', col: 24, row: 48, radius: 5, density: 'urban', district: 11 },
  { name: 'Venice', col: 24, row: 54, radius: 4, density: 'urban', district: 11 },
  { name: 'Mar Vista', col: 30, row: 54, radius: 4, density: 'suburban', district: 11 },
  { name: 'Playa del Rey', col: 26, row: 60, radius: 3, density: 'suburban', district: 11 },
  { name: 'Westchester', col: 32, row: 62, radius: 4, density: 'suburban', district: 11 },
  { name: 'Pacific Palisades', col: 22, row: 40, radius: 5, density: 'suburban', district: 11 },

  // South Bay / Harbor
  { name: 'Harbor City', col: 56, row: 78, radius: 4, density: 'industrial', district: 15 },
  { name: 'Wilmington', col: 60, row: 82, radius: 4, density: 'industrial', district: 15 },
  { name: 'San Pedro', col: 62, row: 88, radius: 5, density: 'urban', district: 15 },
];

// Landmark placements
interface Landmark {
  name: string;
  col: number;
  row: number;
  building: BuildingType;
  sprite?: string; // Gemini sprite name
  size: number; // tiles to occupy
}

export const LANDMARKS: Landmark[] = [
  { name: 'City Hall', col: 69, row: 42, building: BuildingType.CITY_HALL, sprite: 'lm-dodger-stadium', size: 2 },
  { name: 'Dodger Stadium', col: 72, row: 37, building: BuildingType.STADIUM, sprite: 'lm-dodger-stadium', size: 3 },
  { name: 'Hollywood Sign', col: 54, row: 28, building: BuildingType.HOLLYWOOD_SIGN, sprite: 'lm-hollywood-sign', size: 3 },
  { name: 'Griffith Observatory', col: 60, row: 28, building: BuildingType.OBSERVATORY, sprite: 'lm-griffith-obs', size: 2 },
  { name: 'UCLA', col: 40, row: 42, building: BuildingType.PARK, sprite: 'lm-ucla', size: 3 },
  { name: 'USC', col: 64, row: 50, building: BuildingType.PARK, sprite: 'lm-usc', size: 3 },
  { name: 'LAX', col: 30, row: 64, building: BuildingType.AIRPORT, sprite: 'lm-lax-airport', size: 5 },
  { name: 'Santa Monica Pier', col: 20, row: 50, building: BuildingType.COMMERCIAL, sprite: 'lm-santa-monica-pier', size: 2 },
  { name: 'Venice Boardwalk', col: 20, row: 55, building: BuildingType.COMMERCIAL, sprite: 'lm-venice-boardwalk', size: 2 },
  { name: 'Crypto.com Arena', col: 66, row: 48, building: BuildingType.STADIUM, sprite: 'lm-staples-center', size: 2 },
  { name: 'Port of LA', col: 62, row: 88, building: BuildingType.PORT_CRANE, sprite: 'lm-port-la', size: 4 },
];

// Freeway definitions — thick multi-tile paths
interface Freeway {
  name: string;
  points: [number, number][]; // [col, row] waypoints
  width: number; // tiles wide
}

const FREEWAYS: Freeway[] = [
  { name: 'I-5', width: 2, points: [[56,8],[58,15],[62,22],[66,28],[70,34],[72,40],[72,46],[70,52],[68,58],[66,64],[64,70],[62,78],[60,86],[60,92]] },
  { name: 'US-101', width: 2, points: [[20,30],[28,30],[36,32],[42,33],[48,34],[52,35],[56,36],[60,37],[64,38],[68,40],[70,42],[72,44]] },
  { name: 'I-405', width: 2, points: [[30,16],[30,22],[30,28],[32,34],[34,38],[36,44],[38,50],[38,56],[36,62],[34,68],[34,74],[36,80]] },
  { name: 'I-10', width: 2, points: [[20,50],[28,50],[36,48],[42,46],[48,46],[54,46],[60,46],[66,46],[72,46],[78,46],[84,46],[90,46]] },
  { name: 'I-110', width: 2, points: [[62,42],[62,48],[62,54],[62,60],[62,66],[62,72],[62,78],[62,84],[62,90]] },
  { name: 'SR-2', width: 1, points: [[56,36],[60,34],[64,32],[68,30],[72,28],[76,26]] },
  { name: 'I-210', width: 1, points: [[50,14],[56,12],[62,12],[68,14],[74,16],[80,18],[86,20],[92,22]] },
];

// Coastline definition (west and south edges of land)
// Points define the boundary: everything to the LEFT/BELOW is ocean
const COASTLINE: [number, number][] = [
  [18, 0], // NW coast
  [16, 10],
  [16, 20],
  [18, 30],
  [18, 38],
  [16, 42],
  [16, 48], // Santa Monica
  [16, 52],
  [18, 56], // Venice
  [20, 58],
  [22, 60],
  [24, 62], // Marina del Rey
  [26, 64],
  [28, 66], // Playa Vista
  [28, 68],
  [30, 70],
  [34, 72],
  [40, 74],
  [46, 76],
  [50, 78],
  [54, 80],
  [58, 82],
  [56, 86],
  [54, 88], // Palos Verdes
  [56, 90],
  [60, 92], // San Pedro
  [66, 94],
  [70, 96],
  [74, 94],
  [78, 92],
  [80, 88], // East of port
  [82, 84],
  [84, 82],
  [90, 80],
  [96, 78],
  [100, 76],
  [110, 74],
  [120, 72],
];

function isOcean(col: number, row: number): boolean {
  // Left of coastline = ocean
  for (let i = 0; i < COASTLINE.length - 1; i++) {
    const [c1, r1] = COASTLINE[i];
    const [c2, r2] = COASTLINE[i + 1];
    if (row >= r1 && row <= r2) {
      const t = (row - r1) / (r2 - r1);
      const boundaryCol = c1 + t * (c2 - c1);
      if (col < boundaryCol) return true;
    }
  }
  // Far south ocean
  if (row > 96) return true;
  // Far east ocean (beyond city)
  if (col > 100 && row > 74) return true;
  return false;
}

// Mountain elevation based on row (north = mountains)
function getElevation(col: number, row: number): number {
  // Santa Monica Mountains (runs east-west through Hollywood Hills)
  const smMountainRow = 30 + Math.sin(col * 0.08) * 3;
  if (row < smMountainRow && row > 10 && col > 30 && col < 80) {
    const dist = smMountainRow - row;
    return Math.min(4, Math.floor(dist * 0.6));
  }

  // San Gabriel Mountains (far north)
  if (row < 10) {
    return Math.min(5, Math.floor((10 - row) * 0.8));
  }

  // Hollywood Hills specific bump
  if (col >= 48 && col <= 64 && row >= 26 && row <= 34) {
    const centerDist = Math.sqrt((col - 56) ** 2 + (row - 30) ** 2);
    if (centerDist < 8) return Math.max(1, Math.floor(3 - centerDist * 0.3));
  }

  // Palos Verdes hills (south peninsula)
  if (col >= 48 && col <= 58 && row >= 84 && row <= 92) {
    return 2;
  }

  return 0;
}

function isOnFreeway(col: number, row: number): boolean {
  for (const fw of FREEWAYS) {
    for (let i = 0; i < fw.points.length - 1; i++) {
      const [c1, r1] = fw.points[i];
      const [c2, r2] = fw.points[i + 1];
      // Distance from point to line segment
      const dx = c2 - c1, dy = r2 - r1;
      const len2 = dx * dx + dy * dy;
      let t = Math.max(0, Math.min(1, ((col - c1) * dx + (row - r1) * dy) / len2));
      const nearCol = c1 + t * dx, nearRow = r1 + t * dy;
      const dist = Math.sqrt((col - nearCol) ** 2 + (row - nearRow) ** 2);
      if (dist <= fw.width) return true;
    }
  }
  return false;
}

function getNeighborhood(col: number, row: number): Neighborhood | null {
  let closest: Neighborhood | null = null;
  let minDist = Infinity;
  for (const n of NEIGHBORHOODS) {
    const dist = Math.sqrt((col - n.col) ** 2 + (row - n.row) ** 2);
    if (dist < n.radius && dist < minDist) {
      minDist = dist;
      closest = n;
    }
  }
  return closest;
}

function getBuildingForDensity(density: string, hash: number): BuildingType {
  switch (density) {
    case 'downtown':
      if (hash < 25) return BuildingType.SKYSCRAPER_TALL;
      if (hash < 55) return BuildingType.SKYSCRAPER;
      if (hash < 75) return BuildingType.OFFICE_MID;
      if (hash < 88) return BuildingType.OFFICE_LOW;
      return BuildingType.COMMERCIAL;
    case 'dense':
      if (hash < 15) return BuildingType.SKYSCRAPER;
      if (hash < 35) return BuildingType.OFFICE_MID;
      if (hash < 55) return BuildingType.APARTMENT_HIGH;
      if (hash < 70) return BuildingType.APARTMENT_MID;
      if (hash < 82) return BuildingType.COMMERCIAL;
      return BuildingType.NONE;
    case 'urban':
      if (hash < 10) return BuildingType.APARTMENT_MID;
      if (hash < 25) return BuildingType.APARTMENT_LOW;
      if (hash < 45) return BuildingType.HOUSE_MEDIUM;
      if (hash < 55) return BuildingType.COMMERCIAL;
      if (hash < 60) return BuildingType.PARK;
      return BuildingType.NONE;
    case 'suburban':
      if (hash < 30) return BuildingType.HOUSE_SMALL;
      if (hash < 45) return BuildingType.HOUSE_MEDIUM;
      if (hash < 50) return BuildingType.PARK;
      return BuildingType.NONE;
    case 'industrial':
      if (hash < 35) return BuildingType.INDUSTRIAL;
      if (hash < 50) return BuildingType.COMMERCIAL;
      return BuildingType.NONE;
    case 'campus':
      if (hash < 20) return BuildingType.OFFICE_LOW;
      if (hash < 40) return BuildingType.PARK;
      return BuildingType.NONE;
    case 'beach':
      if (hash < 15) return BuildingType.COMMERCIAL;
      return BuildingType.NONE;
    case 'airport':
      if (hash < 30) return BuildingType.AIRPORT;
      if (hash < 45) return BuildingType.INDUSTRIAL;
      return BuildingType.NONE;
    case 'port':
      if (hash < 30) return BuildingType.PORT_CRANE;
      if (hash < 50) return BuildingType.INDUSTRIAL;
      return BuildingType.NONE;
    default:
      return BuildingType.NONE;
  }
}

export function generateMapData(): TileData[][] {
  const map: TileData[][] = [];

  for (let row = 0; row < MAP_ROWS; row++) {
    map[row] = [];
    for (let col = 0; col < MAP_COLS; col++) {
      const hash = ((col * 7919 + row * 6271 + col * row * 13) & 0xFFFF) % 100;
      const elevation = getElevation(col, row);
      const ocean = isOcean(col, row);
      const freeway = isOnFreeway(col, row);
      const neighborhood = getNeighborhood(col, row);

      let terrain = TileType.GRASS;
      let building = BuildingType.NONE;
      let district = neighborhood?.district ?? 0;

      if (ocean) {
        terrain = TileType.WATER;
        district = 0;
      } else if (elevation >= 3) {
        terrain = TileType.MOUNTAIN;
      } else if (elevation >= 1 && !neighborhood) {
        terrain = TileType.MOUNTAIN;
      } else if (freeway) {
        terrain = TileType.HIGHWAY;
      } else if (neighborhood) {
        // Roads on grid pattern
        const roadSpacing = neighborhood.density === 'downtown' ? 3 : neighborhood.density === 'dense' ? 4 : 6;
        if (col % roadSpacing === 0 || row % roadSpacing === 0) {
          if (col % roadSpacing === 0 && row % roadSpacing === 0) terrain = TileType.ROAD_CROSS;
          else if (col % roadSpacing === 0) terrain = TileType.ROAD_NS;
          else terrain = TileType.ROAD_EW;
        } else {
          // Buildings
          building = getBuildingForDensity(neighborhood.density, hash);
          // Beach tiles near coast
          if (col < 24 && ocean === false && col > 16) {
            terrain = TileType.SAND;
            if (hash > 80) building = BuildingType.NONE;
          }
        }
      } else if (col > 16 && col < 22 && !ocean) {
        // Coastal sand strip
        terrain = TileType.SAND;
      } else {
        // Undeveloped land
        if (hash < 5) building = BuildingType.PARK;
        terrain = elevation > 0 ? TileType.MOUNTAIN : TileType.GRASS;
      }

      map[row][col] = { terrain, building, district, elevation };
    }
  }

  // Place landmarks (override tiles)
  for (const lm of LANDMARKS) {
    for (let dr = 0; dr < lm.size; dr++) {
      for (let dc = 0; dc < lm.size; dc++) {
        const r = lm.row + dr, c = lm.col + dc;
        if (r >= 0 && r < MAP_ROWS && c >= 0 && c < MAP_COLS) {
          map[r][c].building = dc === 0 && dr === 0 ? lm.building : BuildingType.NONE;
          map[r][c].terrain = TileType.GRASS;
        }
      }
    }
  }

  return map;
}

// Export for labels
export { NEIGHBORHOODS, FREEWAYS };
export type { Neighborhood };
