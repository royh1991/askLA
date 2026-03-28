export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;
export const MAP_COLS = 120;
export const MAP_ROWS = 100;

export enum TileType {
  WATER = 0,
  GRASS = 1,
  DIRT = 2,
  ROAD_NS = 3,
  ROAD_EW = 4,
  ROAD_CROSS = 5,
  HIGHWAY = 6,
  MOUNTAIN = 7,
  SAND = 8,
}

export enum BuildingType {
  NONE = 0,
  HOUSE_SMALL = 10,
  HOUSE_MEDIUM = 11,
  APARTMENT_LOW = 12,
  APARTMENT_MID = 13,
  APARTMENT_HIGH = 14,
  OFFICE_LOW = 15,
  OFFICE_MID = 16,
  SKYSCRAPER = 17,
  SKYSCRAPER_TALL = 18,
  COMMERCIAL = 20,
  INDUSTRIAL = 21,
  PARK = 22,
  CITY_HALL = 30,
  AIRPORT = 31,
  PORT_CRANE = 33,
  HOLLYWOOD_SIGN = 35,
  OBSERVATORY = 36,
  STADIUM = 37,
}

export interface TileData {
  terrain: TileType;
  building: BuildingType;
  district: number; // 0 = outside city, 1-15 = council district
  elevation: number; // 0 = sea level, 1-3 = hills/mountains
}

export interface District {
  id: number;
  name: string;
  member: string;
  color: string;
  neighborhoods: string[];
  hotTopics: string[];
  meetings: number;
  population: string;
  recentAction: string;
}

// Isometric coordinate conversions
export function gridToScreen(gx: number, gy: number): { x: number; y: number } {
  return {
    x: (gx - gy) * (TILE_WIDTH / 2),
    y: (gx + gy) * (TILE_HEIGHT / 2),
  };
}

export function screenToGrid(sx: number, sy: number): { gx: number; gy: number } {
  return {
    gx: Math.floor((sx / (TILE_WIDTH / 2) + sy / (TILE_HEIGHT / 2)) / 2),
    gy: Math.floor((sy / (TILE_HEIGHT / 2) - sx / (TILE_WIDTH / 2)) / 2),
  };
}
