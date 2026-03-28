export const TILE_W = 32;
export const TILE_H = 16;
export const MAP_W = 160;
export const MAP_H = 140;

export const enum Terrain {
  OCEAN, BEACH, GRASS, HILL, MOUNTAIN, ROAD, ROAD_MAJOR, FREEWAY,
}

export const enum Zone {
  NONE, RESIDENTIAL_LOW, RESIDENTIAL_MED, RESIDENTIAL_HIGH,
  COMMERCIAL, OFFICE, DOWNTOWN, INDUSTRIAL, PARK, AIRPORT, PORT, CAMPUS,
}

export interface Cell {
  terrain: Terrain;
  zone: Zone;
  elevation: number;   // 0-8
  district: number;    // 0-15
  buildingH: number;   // building height in pixels (0 = no building)
  buildingColor: number; // roof/wall color
  buildingStyle: number; // 0-5 variation index
  hasTree: boolean;
}

export function isoX(col: number, row: number) {
  return (col - row) * (TILE_W / 2);
}
export function isoY(col: number, row: number) {
  return (col + row) * (TILE_H / 2);
}
export function screenToGrid(sx: number, sy: number) {
  return {
    col: Math.floor((sx / (TILE_W / 2) + sy / (TILE_H / 2)) / 2),
    row: Math.floor((sy / (TILE_H / 2) - sx / (TILE_W / 2)) / 2),
  };
}
