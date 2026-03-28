import { TileType, BuildingType, TileData, MAP_COLS, MAP_ROWS } from './types';

// LA geographic bounds (from our GeoJSON data)
const LA_BOUNDS = {
  minLon: -118.6682,
  maxLon: -118.1554,
  minLat: 33.7046,
  maxLat: 34.3373,
};

// Convert grid position to approximate lat/lng
function gridToGeo(col: number, row: number): { lat: number; lng: number } {
  return {
    lng: LA_BOUNDS.minLon + (col / MAP_COLS) * (LA_BOUNDS.maxLon - LA_BOUNDS.minLon),
    lat: LA_BOUNDS.maxLat - (row / MAP_ROWS) * (LA_BOUNDS.maxLat - LA_BOUNDS.minLat),
  };
}

// Simple point-in-polygon test (ray casting)
function pointInPolygon(px: number, py: number, polygon: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// District boundary polygons (simplified from GeoJSON)
// These are [lng, lat] coordinate arrays for each district
const DISTRICT_POLYGONS: Record<number, number[][]> = {};

// We'll populate this at build time from the GeoJSON
// For now, use a simplified approach: map grid positions to districts
// based on approximate geographic centroids

const DISTRICT_CENTERS: { id: number; lat: number; lng: number; radius: number }[] = [
  { id: 1, lat: 34.075, lng: -118.215, radius: 0.04 },
  { id: 2, lat: 34.17, lng: -118.38, radius: 0.06 },
  { id: 3, lat: 34.17, lng: -118.55, radius: 0.07 },
  { id: 4, lat: 34.09, lng: -118.31, radius: 0.05 },
  { id: 5, lat: 34.06, lng: -118.40, radius: 0.06 },
  { id: 6, lat: 34.22, lng: -118.42, radius: 0.06 },
  { id: 7, lat: 34.29, lng: -118.35, radius: 0.07 },
  { id: 8, lat: 33.97, lng: -118.30, radius: 0.04 },
  { id: 9, lat: 33.98, lng: -118.24, radius: 0.03 },
  { id: 10, lat: 34.01, lng: -118.32, radius: 0.04 },
  { id: 11, lat: 34.01, lng: -118.45, radius: 0.07 },
  { id: 12, lat: 34.26, lng: -118.55, radius: 0.07 },
  { id: 13, lat: 34.08, lng: -118.27, radius: 0.04 },
  { id: 14, lat: 34.07, lng: -118.17, radius: 0.05 },
  { id: 15, lat: 33.80, lng: -118.28, radius: 0.08 },
];

function getDistrict(lat: number, lng: number): number {
  // Find closest district center
  let closest = 0;
  let minDist = Infinity;
  for (const d of DISTRICT_CENTERS) {
    const dist = Math.sqrt((lat - d.lat) ** 2 + (lng - d.lng) ** 2);
    if (dist < d.radius && dist < minDist) {
      minDist = dist;
      closest = d.id;
    }
  }
  return closest;
}

// Major freeway paths as grid coordinate ranges
const FREEWAYS: { cols: number[]; rows: number[]; dir: 'ns' | 'ew' }[] = [
  // I-5 (north-south, center-east)
  { cols: [75, 78], rows: [0, 80], dir: 'ns' },
  // I-405 (north-south, west side)
  { cols: [35, 38], rows: [10, 75], dir: 'ns' },
  // I-10 (east-west, mid-city)
  { cols: [20, 100], rows: [48, 50], dir: 'ew' },
  // I-110 (north-south, downtown to port)
  { cols: [62, 65], rows: [35, 90], dir: 'ns' },
  // US-101 (diagonal, NW to SE through Hollywood)
  { cols: [40, 80], rows: [25, 45], dir: 'ew' },
];

function isOnFreeway(col: number, row: number): { on: boolean; dir: 'ns' | 'ew' } {
  for (const fw of FREEWAYS) {
    if (col >= fw.cols[0] && col <= fw.cols[1] && row >= fw.rows[0] && row <= fw.rows[1]) {
      return { on: true, dir: fw.dir };
    }
  }
  return { on: false, dir: 'ns' };
}

// Downtown area (dense skyscrapers)
function isDowntown(col: number, row: number): boolean {
  return col >= 65 && col <= 80 && row >= 38 && row <= 48;
}

// Hollywood area
function isHollywood(col: number, row: number): boolean {
  return col >= 50 && col <= 65 && row >= 22 && row <= 32;
}

// LAX area
function isLAX(col: number, row: number): boolean {
  return col >= 25 && col <= 40 && row >= 58 && row <= 68;
}

// Port area
function isPort(col: number, row: number): boolean {
  return col >= 55 && col <= 75 && row >= 82 && row <= 95;
}

// Mountain range (north edge)
function isMountain(col: number, row: number): boolean {
  // Santa Monica mountains and San Gabriel foothills
  const mountainLine = 15 + Math.sin(col * 0.1) * 5;
  return row < mountainLine && row > 3;
}

// Ocean (west and south edges, plus areas outside city boundary)
function isOcean(col: number, row: number): boolean {
  // West coast
  if (col < 15) return true;
  // South coast (curves)
  const coastLine = 70 + Math.sin(col * 0.05) * 8;
  if (row > coastLine && col < 55) return true;
  // Santa Monica Bay
  if (col < 30 && row > 55) return true;
  // Far south (except port peninsula)
  if (row > 85 && (col < 50 || col > 80)) return true;
  return false;
}

// Generate the full map
export function generateMapData(): TileData[][] {
  const map: TileData[][] = [];

  for (let row = 0; row < MAP_ROWS; row++) {
    map[row] = [];
    for (let col = 0; col < MAP_COLS; col++) {
      const { lat, lng } = gridToGeo(col, row);
      const district = getDistrict(lat, lng);
      const freeway = isOnFreeway(col, row);

      let terrain = TileType.GRASS;
      let building = BuildingType.NONE;
      let elevation = 0;

      // Ocean
      if (isOcean(col, row)) {
        terrain = TileType.WATER;
      }
      // Mountains
      else if (isMountain(col, row)) {
        terrain = TileType.MOUNTAIN;
        elevation = 2 + Math.floor(Math.random() * 2);
      }
      // Beach/sand (between ocean and land)
      else if (col < 20 && !isOcean(col, row)) {
        terrain = TileType.SAND;
      }
      // Freeways
      else if (freeway.on) {
        terrain = TileType.HIGHWAY;
      }
      // Roads (grid pattern in developed areas)
      else if (district > 0 && (col % 6 === 0 || row % 6 === 0)) {
        terrain = col % 6 === 0 && row % 6 === 0 ? TileType.ROAD_CROSS :
                  col % 6 === 0 ? TileType.ROAD_NS : TileType.ROAD_EW;
      }
      // Developed land
      else if (district > 0) {
        terrain = TileType.GRASS;

        // Place buildings based on area
        const rng = ((col * 7 + row * 13 + col * row) % 100);

        if (isDowntown(col, row)) {
          // Dense downtown
          if (rng < 60) building = rng < 20 ? BuildingType.SKYSCRAPER_TALL : rng < 40 ? BuildingType.SKYSCRAPER : BuildingType.OFFICE_MID;
          else if (rng < 80) building = BuildingType.OFFICE_LOW;
        } else if (isHollywood(col, row)) {
          if (rng < 40) building = rng < 15 ? BuildingType.APARTMENT_HIGH : BuildingType.APARTMENT_MID;
          else if (rng < 55) building = BuildingType.COMMERCIAL;
        } else if (isLAX(col, row)) {
          if (rng < 30) building = BuildingType.AIRPORT;
          else if (rng < 50) building = BuildingType.INDUSTRIAL;
        } else if (isPort(col, row)) {
          if (rng < 25) building = BuildingType.PORT_CRANE;
          else if (rng < 45) building = BuildingType.INDUSTRIAL;
        } else {
          // General residential/commercial
          if (rng < 25) building = BuildingType.HOUSE_SMALL;
          else if (rng < 40) building = BuildingType.HOUSE_MEDIUM;
          else if (rng < 50) building = BuildingType.APARTMENT_LOW;
          else if (rng < 55) building = BuildingType.COMMERCIAL;
          else if (rng < 58) building = BuildingType.PARK;
        }
      }

      map[row][col] = { terrain, building, district, elevation };
    }
  }

  // Place specific landmarks
  // City Hall (roughly grid 70, 42)
  if (map[42]?.[70]) { map[42][70].building = BuildingType.CITY_HALL; map[42][70].terrain = TileType.GRASS; }
  // Hollywood Sign (roughly grid 55, 18)
  if (map[18]?.[55]) { map[18][55].building = BuildingType.HOLLYWOOD_SIGN; }
  // Griffith Observatory (roughly grid 60, 20)
  if (map[20]?.[60]) { map[20][60].building = BuildingType.OBSERVATORY; }
  // Dodger Stadium (roughly grid 72, 38)
  if (map[38]?.[72]) { map[38][72].building = BuildingType.STADIUM; }

  return map;
}
