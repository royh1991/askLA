import { Application, Container, Graphics, Text, TextStyle, FederatedPointerEvent } from 'pixi.js';
import { TileType, BuildingType, TileData, TILE_WIDTH, TILE_HEIGHT, MAP_COLS, MAP_ROWS, gridToScreen, screenToGrid } from './types';
import { generateMapData } from './MapData';

// Color palettes for terrain
const TERRAIN_COLORS: Record<number, number> = {
  [TileType.WATER]: 0x2A6496,
  [TileType.GRASS]: 0x4A8C38,
  [TileType.DIRT]: 0x8B7355,
  [TileType.ROAD_NS]: 0x606060,
  [TileType.ROAD_EW]: 0x606060,
  [TileType.ROAD_CROSS]: 0x555555,
  [TileType.HIGHWAY]: 0x707070,
  [TileType.MOUNTAIN]: 0x6B7B4F,
  [TileType.SAND]: 0xD4C090,
};

const BUILDING_COLORS: Record<number, { color: number; height: number }> = {
  [BuildingType.HOUSE_SMALL]: { color: 0xC4956A, height: 8 },
  [BuildingType.HOUSE_MEDIUM]: { color: 0xB88B60, height: 10 },
  [BuildingType.APARTMENT_LOW]: { color: 0xA08070, height: 16 },
  [BuildingType.APARTMENT_MID]: { color: 0x908878, height: 24 },
  [BuildingType.APARTMENT_HIGH]: { color: 0x8898A8, height: 36 },
  [BuildingType.OFFICE_LOW]: { color: 0x7090B0, height: 20 },
  [BuildingType.OFFICE_MID]: { color: 0x6888A8, height: 32 },
  [BuildingType.SKYSCRAPER]: { color: 0x5878A0, height: 48 },
  [BuildingType.SKYSCRAPER_TALL]: { color: 0x4870A8, height: 64 },
  [BuildingType.COMMERCIAL]: { color: 0xC0A060, height: 12 },
  [BuildingType.INDUSTRIAL]: { color: 0x889080, height: 18 },
  [BuildingType.PARK]: { color: 0x2D8A29, height: 6 },
  [BuildingType.CITY_HALL]: { color: 0xE8E0D0, height: 50 },
  [BuildingType.AIRPORT]: { color: 0x909090, height: 14 },
  [BuildingType.PORT_CRANE]: { color: 0xC04040, height: 30 },
  [BuildingType.HOLLYWOOD_SIGN]: { color: 0xFFFFFF, height: 10 },
  [BuildingType.OBSERVATORY]: { color: 0xD0C8B0, height: 20 },
  [BuildingType.STADIUM]: { color: 0x4060C0, height: 22 },
};

const DISTRICT_COLORS: Record<number, number> = {
  1: 0x4CAF50, 2: 0x2196F3, 3: 0xFF9800, 4: 0x9C27B0,
  5: 0xE91E63, 6: 0x00BCD4, 7: 0x795548, 8: 0xF44336,
  9: 0x3F51B5, 10: 0x607D8B, 11: 0x009688, 12: 0xCDDC39,
  13: 0xFF5722, 14: 0x8BC34A, 15: 0xFFC107,
};

export type DistrictSelectCallback = (districtId: number | null) => void;

export class Game {
  private app: Application;
  private worldContainer: Container;
  private terrainLayer: Container;
  private buildingLayer: Container;
  private overlayLayer: Container;
  private labelLayer: Container;
  private mapData: TileData[][];

  // Camera
  private cameraX = 0;
  private cameraY = 0;
  private cameraZoom = 0.6;
  private targetCameraX = 0;
  private targetCameraY = 0;
  private targetCameraZoom = 0.6;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragCamStartX = 0;
  private dragCamStartY = 0;

  // State
  private hoveredDistrict: number | null = null;
  private selectedDistrict: number | null = null;
  private onDistrictSelect: DistrictSelectCallback | null = null;
  private showDistricts = true;
  private animTime = 0;
  private tileGraphicsCache: Map<string, boolean> = new Map();

  constructor() {
    this.app = new Application();
    this.worldContainer = new Container();
    this.terrainLayer = new Container();
    this.buildingLayer = new Container();
    this.overlayLayer = new Container();
    this.labelLayer = new Container();
    this.mapData = generateMapData();
  }

  async init(canvas: HTMLElement, width: number, height: number) {
    await this.app.init({
      background: 0x1A2A3A,
      resizeTo: canvas,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    canvas.appendChild(this.app.canvas);

    // Layer hierarchy
    this.worldContainer.addChild(this.terrainLayer);
    this.worldContainer.addChild(this.buildingLayer);
    this.worldContainer.addChild(this.overlayLayer);
    this.worldContainer.addChild(this.labelLayer);
    this.app.stage.addChild(this.worldContainer);

    // Center camera on downtown LA
    const downtown = gridToScreen(70, 42);
    this.cameraX = this.targetCameraX = -downtown.x + width / 2;
    this.cameraY = this.targetCameraY = -downtown.y + height / 2;

    // Input handling
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;

    this.app.stage.on('pointerdown', (e: FederatedPointerEvent) => this.onPointerDown(e));
    this.app.stage.on('pointermove', (e: FederatedPointerEvent) => this.onPointerMove(e));
    this.app.stage.on('pointerup', () => this.onPointerUp());
    this.app.stage.on('wheel', (e: any) => this.onWheel(e));

    // Render map
    this.renderTerrain();
    this.renderBuildings();

    // Game loop
    this.app.ticker.add((ticker) => this.update(ticker.deltaTime));
  }

  private renderTerrain() {
    const g = new Graphics();

    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const tile = this.mapData[row][col];
        const { x, y } = gridToScreen(col, row);
        const color = TERRAIN_COLORS[tile.terrain] ?? 0x4A8C38;

        // Add slight variation
        const variation = ((col * 7 + row * 13) % 20) - 10;
        const r = ((color >> 16) & 0xFF) + variation;
        const gr = ((color >> 8) & 0xFF) + variation;
        const b = (color & 0xFF) + variation;
        const variedColor = (Math.max(0, Math.min(255, r)) << 16) |
                           (Math.max(0, Math.min(255, gr)) << 8) |
                           Math.max(0, Math.min(255, b));

        // Draw isometric diamond
        g.fill({ color: variedColor });
        g.moveTo(x, y);
        g.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
        g.lineTo(x, y + TILE_HEIGHT);
        g.lineTo(x - TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
        g.closePath();
        g.fill();

        // Water shimmer effect (drawn later in update)
        // Road lane markings
        if (tile.terrain === TileType.ROAD_NS || tile.terrain === TileType.ROAD_EW || tile.terrain === TileType.HIGHWAY) {
          g.fill({ color: 0xFFFF00, alpha: 0.3 });
          g.circle(x, y + TILE_HEIGHT / 2, 1);
          g.fill();
        }
      }
    }

    this.terrainLayer.addChild(g);
  }

  private renderBuildings() {
    const g = new Graphics();

    for (let row = MAP_ROWS - 1; row >= 0; row--) {
      for (let col = 0; col < MAP_COLS; col++) {
        const tile = this.mapData[row][col];
        if (tile.building === BuildingType.NONE) continue;

        const config = BUILDING_COLORS[tile.building];
        if (!config) continue;

        const { x, y } = gridToScreen(col, row);
        const h = config.height + tile.elevation * 8;
        const color = config.color;

        // Building footprint width (isometric)
        const bw = TILE_WIDTH * 0.35;
        const bh = TILE_HEIGHT * 0.35;

        // Front face (darker)
        const darkColor = ((((color >> 16) & 0xFF) * 0.7) << 16) |
                         ((((color >> 8) & 0xFF) * 0.7) << 8) |
                         (((color & 0xFF) * 0.7));
        g.fill({ color: darkColor });
        g.moveTo(x, y + TILE_HEIGHT / 2);
        g.lineTo(x + bw, y + TILE_HEIGHT / 2 + bh);
        g.lineTo(x + bw, y + TILE_HEIGHT / 2 + bh - h);
        g.lineTo(x, y + TILE_HEIGHT / 2 - h);
        g.closePath();
        g.fill();

        // Side face (slightly lighter)
        g.fill({ color: color });
        g.moveTo(x, y + TILE_HEIGHT / 2);
        g.lineTo(x - bw, y + TILE_HEIGHT / 2 + bh);
        g.lineTo(x - bw, y + TILE_HEIGHT / 2 + bh - h);
        g.lineTo(x, y + TILE_HEIGHT / 2 - h);
        g.closePath();
        g.fill();

        // Top face (lightest)
        const lightColor = Math.min(0xFFFFFF, color + 0x202020);
        g.fill({ color: lightColor });
        g.moveTo(x, y + TILE_HEIGHT / 2 - h);
        g.lineTo(x + bw, y + TILE_HEIGHT / 2 + bh - h);
        g.lineTo(x, y + TILE_HEIGHT / 2 + 2 * bh - h);
        g.lineTo(x - bw, y + TILE_HEIGHT / 2 + bh - h);
        g.closePath();
        g.fill();

        // Windows for tall buildings
        if (h > 20) {
          const windowCount = Math.floor(h / 8);
          for (let w = 0; w < windowCount; w++) {
            const wy = y + TILE_HEIGHT / 2 - h + w * 8 + 4;
            const lit = ((col * 3 + row * 7 + w * 11) % 5) > 2;
            g.fill({ color: lit ? 0xFFE082 : 0x404050, alpha: 0.7 });
            g.rect(x - bw + 3, wy, 3, 3);
            g.fill();
            g.rect(x + 2, wy, 3, 3);
            g.fill();
          }
        }
      }
    }

    this.buildingLayer.addChild(g);
  }

  renderDistrictOverlay() {
    this.overlayLayer.removeChildren();
    this.labelLayer.removeChildren();

    if (!this.showDistricts) return;

    // For each district, find the bounding tiles and draw overlay
    for (let distId = 1; distId <= 15; distId++) {
      const g = new Graphics();
      const isSelected = this.selectedDistrict === distId;
      const isHovered = this.hoveredDistrict === distId;
      const color = DISTRICT_COLORS[distId] ?? 0x808080;
      const alpha = isSelected ? 0.35 : isHovered ? 0.25 : 0.08;

      g.fill({ color, alpha });

      for (let row = 0; row < MAP_ROWS; row++) {
        for (let col = 0; col < MAP_COLS; col++) {
          if (this.mapData[row][col].district !== distId) continue;

          const { x, y } = gridToScreen(col, row);
          g.moveTo(x, y);
          g.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
          g.lineTo(x, y + TILE_HEIGHT);
          g.lineTo(x - TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
          g.closePath();
        }
      }
      g.fill();

      // District border
      if (isSelected || isHovered) {
        g.setStrokeStyle({ width: isSelected ? 2 : 1, color: 0xFFFFFF, alpha: isSelected ? 0.8 : 0.5 });
        // Find border tiles (tiles where neighbor has different district)
        for (let row = 0; row < MAP_ROWS; row++) {
          for (let col = 0; col < MAP_COLS; col++) {
            if (this.mapData[row][col].district !== distId) continue;
            const neighbors = [
              [row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1],
            ];
            const isBorder = neighbors.some(([r, c]) =>
              r < 0 || r >= MAP_ROWS || c < 0 || c >= MAP_COLS ||
              this.mapData[r][c].district !== distId
            );
            if (isBorder) {
              const { x, y } = gridToScreen(col, row);
              g.moveTo(x, y);
              g.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
              g.lineTo(x, y + TILE_HEIGHT);
              g.lineTo(x - TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
              g.closePath();
              g.stroke();
            }
          }
        }
      }

      this.overlayLayer.addChild(g);
    }

    // District labels
    const labelStyle = new TextStyle({
      fontFamily: 'Consolas, monospace',
      fontSize: 11,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      stroke: { color: 0x000000, width: 3 },
      align: 'center',
    });

    for (let distId = 1; distId <= 15; distId++) {
      // Find center of district tiles
      let sumX = 0, sumY = 0, count = 0;
      for (let row = 0; row < MAP_ROWS; row++) {
        for (let col = 0; col < MAP_COLS; col++) {
          if (this.mapData[row][col].district === distId) {
            const { x, y } = gridToScreen(col, row);
            sumX += x; sumY += y; count++;
          }
        }
      }
      if (count === 0) continue;
      const cx = sumX / count;
      const cy = sumY / count;

      const label = new Text({ text: `CD-${distId}`, style: labelStyle });
      label.anchor.set(0.5);
      label.x = cx;
      label.y = cy;
      this.labelLayer.addChild(label);
    }
  }

  private update(dt: number) {
    this.animTime += dt * 0.016;

    // Smooth camera
    this.cameraX += (this.targetCameraX - this.cameraX) * 0.15;
    this.cameraY += (this.targetCameraY - this.cameraY) * 0.15;
    this.cameraZoom += (this.targetCameraZoom - this.cameraZoom) * 0.15;

    this.worldContainer.x = this.cameraX;
    this.worldContainer.y = this.cameraY;
    this.worldContainer.scale.set(this.cameraZoom);
  }

  // Input handlers
  private onPointerDown(e: FederatedPointerEvent) {
    this.isDragging = true;
    this.dragStartX = e.globalX;
    this.dragStartY = e.globalY;
    this.dragCamStartX = this.targetCameraX;
    this.dragCamStartY = this.targetCameraY;
  }

  private onPointerMove(e: FederatedPointerEvent) {
    if (this.isDragging) {
      this.targetCameraX = this.dragCamStartX + (e.globalX - this.dragStartX);
      this.targetCameraY = this.dragCamStartY + (e.globalY - this.dragStartY);
    }

    // Hover detection
    const worldX = (e.globalX - this.cameraX) / this.cameraZoom;
    const worldY = (e.globalY - this.cameraY) / this.cameraZoom;
    const { gx, gy } = screenToGrid(worldX, worldY);

    if (gx >= 0 && gx < MAP_COLS && gy >= 0 && gy < MAP_ROWS) {
      const newHovered = this.mapData[gy][gx].district || null;
      if (newHovered !== this.hoveredDistrict) {
        this.hoveredDistrict = newHovered;
        this.renderDistrictOverlay();
      }
    }
  }

  private onPointerUp() {
    if (this.isDragging) {
      // Check if it was a click (not a drag)
      const moved = Math.abs(this.targetCameraX - this.dragCamStartX) + Math.abs(this.targetCameraY - this.dragCamStartY);
      if (moved < 5 && this.hoveredDistrict) {
        this.selectedDistrict = this.selectedDistrict === this.hoveredDistrict ? null : this.hoveredDistrict;
        this.renderDistrictOverlay();
        this.onDistrictSelect?.(this.selectedDistrict);
      }
    }
    this.isDragging = false;
  }

  private onWheel(e: WheelEvent) {
    const zoomDelta = e.deltaY > 0 ? -0.05 : 0.05;
    this.targetCameraZoom = Math.max(0.2, Math.min(2.5, this.targetCameraZoom + zoomDelta));
  }

  // Public API
  setDistrictSelectCallback(cb: DistrictSelectCallback) {
    this.onDistrictSelect = cb;
  }

  selectDistrict(id: number | null) {
    this.selectedDistrict = id;
    this.renderDistrictOverlay();

    // Pan camera to district center
    if (id) {
      let sumX = 0, sumY = 0, count = 0;
      for (let row = 0; row < MAP_ROWS; row++) {
        for (let col = 0; col < MAP_COLS; col++) {
          if (this.mapData[row][col].district === id) {
            const { x, y } = gridToScreen(col, row);
            sumX += x; sumY += y; count++;
          }
        }
      }
      if (count > 0) {
        const cx = sumX / count;
        const cy = sumY / count;
        this.targetCameraX = -cx * this.cameraZoom + this.app.screen.width / 2;
        this.targetCameraY = -cy * this.cameraZoom + this.app.screen.height / 2;
      }
    }
  }

  toggleDistricts(show: boolean) {
    this.showDistricts = show;
    this.renderDistrictOverlay();
  }

  zoomIn() { this.targetCameraZoom = Math.min(2.5, this.targetCameraZoom + 0.2); }
  zoomOut() { this.targetCameraZoom = Math.max(0.2, this.targetCameraZoom - 0.2); }
  resetView() {
    const downtown = gridToScreen(70, 42);
    this.targetCameraX = -downtown.x * this.cameraZoom + this.app.screen.width / 2;
    this.targetCameraY = -downtown.y * this.cameraZoom + this.app.screen.height / 2;
    this.targetCameraZoom = 0.6;
  }

  destroy() {
    this.app.destroy(true);
  }
}
