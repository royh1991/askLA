import { Application, Container, Graphics, Sprite, Texture, Assets, Text, TextStyle, FederatedPointerEvent } from 'pixi.js';
import { TileType, BuildingType, TileData, TILE_WIDTH, TILE_HEIGHT, MAP_COLS, MAP_ROWS, gridToScreen, screenToGrid } from './types';
import { generateMapData } from './MapData';

const TERRAIN_COLORS: Record<number, number> = {
  [TileType.WATER]: 0x1A5276,
  [TileType.GRASS]: 0x3D8B37,
  [TileType.DIRT]: 0x8B7355,
  [TileType.ROAD_NS]: 0x505050,
  [TileType.ROAD_EW]: 0x505050,
  [TileType.ROAD_CROSS]: 0x454545,
  [TileType.HIGHWAY]: 0x606060,
  [TileType.MOUNTAIN]: 0x5A6B3F,
  [TileType.SAND]: 0xD4C090,
};

const DISTRICT_COLORS: Record<number, number> = {
  1: 0x4CAF50, 2: 0x2196F3, 3: 0xFF9800, 4: 0x9C27B0,
  5: 0xE91E63, 6: 0x00BCD4, 7: 0x795548, 8: 0xF44336,
  9: 0x3F51B5, 10: 0x607D8B, 11: 0x009688, 12: 0xCDDC39,
  13: 0xFF5722, 14: 0x8BC34A, 15: 0xFFC107,
};

// Building sprite config: which image to use and scale
const BUILDING_SPRITES: Record<number, { src: string; scale: number; anchorY: number }> = {
  [BuildingType.HOUSE_SMALL]: { src: '/sprites/bld-house.png', scale: 0.7, anchorY: 0.9 },
  [BuildingType.HOUSE_MEDIUM]: { src: '/sprites/bld-house.png', scale: 0.85, anchorY: 0.9 },
  [BuildingType.APARTMENT_LOW]: { src: '/sprites/bld-apartment.png', scale: 0.6, anchorY: 0.9 },
  [BuildingType.APARTMENT_MID]: { src: '/sprites/bld-apartment.png', scale: 0.8, anchorY: 0.9 },
  [BuildingType.APARTMENT_HIGH]: { src: '/sprites/bld-apartment.png', scale: 1.0, anchorY: 0.9 },
  [BuildingType.OFFICE_LOW]: { src: '/sprites/bld-skyscraper.png', scale: 0.5, anchorY: 0.9 },
  [BuildingType.OFFICE_MID]: { src: '/sprites/bld-skyscraper.png', scale: 0.7, anchorY: 0.9 },
  [BuildingType.SKYSCRAPER]: { src: '/sprites/bld-skyscraper.png', scale: 0.9, anchorY: 0.9 },
  [BuildingType.SKYSCRAPER_TALL]: { src: '/sprites/bld-skyscraper-tall.png', scale: 0.8, anchorY: 0.92 },
  [BuildingType.COMMERCIAL]: { src: '/sprites/bld-commercial.png', scale: 0.8, anchorY: 0.9 },
  [BuildingType.INDUSTRIAL]: { src: '/sprites/bld-industrial.png', scale: 0.8, anchorY: 0.9 },
  [BuildingType.PARK]: { src: '/sprites/bld-park.png', scale: 0.9, anchorY: 0.85 },
  [BuildingType.CITY_HALL]: { src: '/sprites/bld-cityhall.png', scale: 0.7, anchorY: 0.92 },
  [BuildingType.AIRPORT]: { src: '/sprites/bld-industrial.png', scale: 1.0, anchorY: 0.9 },
  [BuildingType.PORT_CRANE]: { src: '/sprites/bld-industrial.png', scale: 0.9, anchorY: 0.9 },
  [BuildingType.HOLLYWOOD_SIGN]: { src: '/sprites/bld-park.png', scale: 0.7, anchorY: 0.85 },
  [BuildingType.OBSERVATORY]: { src: '/sprites/bld-cityhall.png', scale: 0.45, anchorY: 0.9 },
  [BuildingType.STADIUM]: { src: '/sprites/bld-commercial.png', scale: 1.1, anchorY: 0.85 },
};

export type DistrictSelectCallback = (districtId: number | null) => void;

export class Game {
  private app!: Application;
  private worldContainer!: Container;
  private terrainLayer!: Container;
  private buildingLayer!: Container;
  private overlayLayer!: Container;
  private labelLayer!: Container;
  private waterOverlay!: Container;
  private mapData: TileData[][];
  private textures: Map<string, Texture> = new Map();

  // Camera
  private cameraX = 0;
  private cameraY = 0;
  private cameraZoom = 0.55;
  private targetCameraX = 0;
  private targetCameraY = 0;
  private targetCameraZoom = 0.55;
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
  private width = 0;
  private height = 0;

  constructor() {
    this.mapData = generateMapData();
  }

  async init(canvas: HTMLElement, width: number, height: number) {
    this.width = width;
    this.height = height;
    this.app = new Application();

    await this.app.init({
      background: 0x0D1B2A,
      resizeTo: canvas,
      antialias: false, // pixel art looks better without AA
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    canvas.appendChild(this.app.canvas);

    this.worldContainer = new Container();
    this.terrainLayer = new Container();
    this.buildingLayer = new Container();
    this.overlayLayer = new Container();
    this.labelLayer = new Container();
    this.waterOverlay = new Container();

    this.worldContainer.addChild(this.terrainLayer);
    this.worldContainer.addChild(this.buildingLayer);
    this.worldContainer.addChild(this.waterOverlay);
    this.worldContainer.addChild(this.overlayLayer);
    this.worldContainer.addChild(this.labelLayer);
    this.app.stage.addChild(this.worldContainer);

    // Load building textures
    await this.loadTextures();

    // Center on downtown
    const downtown = gridToScreen(70, 42);
    this.cameraX = this.targetCameraX = -downtown.x * this.cameraZoom + width / 2;
    this.cameraY = this.targetCameraY = -downtown.y * this.cameraZoom + height / 2;

    // Input
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;
    this.app.stage.on('pointerdown', (e: FederatedPointerEvent) => this.onPointerDown(e));
    this.app.stage.on('pointermove', (e: FederatedPointerEvent) => this.onPointerMove(e));
    this.app.stage.on('pointerup', () => this.onPointerUp());
    this.app.stage.on('pointerupoutside', () => this.onPointerUp());
    this.app.stage.on('wheel', (e: any) => this.onWheel(e));

    // Render
    this.renderTerrain();
    this.renderBuildings();
    this.renderDistrictOverlay();

    // Game loop
    this.app.ticker.add((ticker) => this.update(ticker.deltaTime));
  }

  private async loadTextures() {
    const srcs = new Set<string>();
    for (const config of Object.values(BUILDING_SPRITES)) {
      srcs.add(config.src);
    }
    for (const src of srcs) {
      try {
        const texture = await Assets.load(src);
        this.textures.set(src, texture);
      } catch (e) {
        console.warn('Failed to load texture:', src);
      }
    }
  }

  private renderTerrain() {
    // Draw terrain as colored isometric diamonds using Graphics
    // We batch all terrain into one Graphics object for performance
    const g = new Graphics();

    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const tile = this.mapData[row][col];
        const { x, y } = gridToScreen(col, row);
        let color = TERRAIN_COLORS[tile.terrain] ?? 0x3D8B37;

        // Add variation for natural look
        const hash = ((col * 7919 + row * 6271) & 0xFFFF) / 0xFFFF;
        const variation = Math.floor(hash * 20) - 10;
        const r = Math.max(0, Math.min(255, ((color >> 16) & 0xFF) + variation));
        const gr = Math.max(0, Math.min(255, ((color >> 8) & 0xFF) + variation));
        const b = Math.max(0, Math.min(255, (color & 0xFF) + variation));
        color = (r << 16) | (gr << 8) | b;

        // Water gets animated later, draw base color
        if (tile.terrain === TileType.WATER) {
          const waterVar = Math.floor(hash * 30) - 15;
          const wr = Math.max(0, Math.min(255, 0x1A + waterVar));
          const wg = Math.max(0, Math.min(255, 0x52 + waterVar));
          const wb = Math.max(0, Math.min(255, 0x76 + waterVar));
          color = (wr << 16) | (wg << 8) | wb;
        }

        // Elevation effect for mountains
        if (tile.elevation > 0) {
          const elevBright = tile.elevation * 8;
          const er = Math.min(255, ((color >> 16) & 0xFF) + elevBright);
          const eg = Math.min(255, ((color >> 8) & 0xFF) + elevBright);
          const eb = Math.min(255, (color & 0xFF) - elevBright);
          color = (er << 16) | (eg << 8) | eb;
        }

        // Isometric diamond
        g.fill({ color });
        g.moveTo(x, y);
        g.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
        g.lineTo(x, y + TILE_HEIGHT);
        g.lineTo(x - TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
        g.closePath();
        g.fill();

        // Road markings
        if (tile.terrain >= TileType.ROAD_NS && tile.terrain <= TileType.HIGHWAY) {
          g.fill({ color: 0xFFFF00, alpha: 0.2 });
          if (tile.terrain === TileType.ROAD_NS || tile.terrain === TileType.ROAD_CROSS) {
            g.rect(x - 1, y + TILE_HEIGHT / 4, 2, TILE_HEIGHT / 2);
          }
          if (tile.terrain === TileType.ROAD_EW || tile.terrain === TileType.ROAD_CROSS) {
            g.rect(x - TILE_WIDTH / 4, y + TILE_HEIGHT / 2 - 1, TILE_WIDTH / 2, 2);
          }
          g.fill();
        }
      }
    }

    this.terrainLayer.addChild(g);
  }

  private renderBuildings() {
    // Sort buildings by row (back to front) for proper depth
    const buildingsToRender: { col: number; row: number; tile: TileData }[] = [];

    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const tile = this.mapData[row][col];
        if (tile.building !== BuildingType.NONE) {
          buildingsToRender.push({ col, row, tile });
        }
      }
    }

    // Render back to front (lower row = further away = render first)
    for (const { col, row, tile } of buildingsToRender) {
      const config = BUILDING_SPRITES[tile.building];
      if (!config) continue;

      const texture = this.textures.get(config.src);
      const { x, y } = gridToScreen(col, row);

      if (texture) {
        // Use actual Gemini-generated sprite
        const sprite = new Sprite(texture);
        sprite.scale.set(config.scale);
        sprite.anchor.set(0.5, config.anchorY);
        sprite.x = x;
        sprite.y = y + TILE_HEIGHT / 2;
        // Sort by depth (row position)
        sprite.zIndex = row * MAP_COLS + col;
        this.buildingLayer.addChild(sprite);
      } else {
        // Fallback: draw colored isometric box
        const g = new Graphics();
        const bConfig = { color: 0x808080, height: 20 };
        const h = bConfig.height;
        const bw = TILE_WIDTH * 0.3;
        const bh = TILE_HEIGHT * 0.3;

        // Simple 3D box
        g.fill({ color: bConfig.color });
        g.moveTo(x - bw, y + TILE_HEIGHT / 2 + bh - h);
        g.lineTo(x, y + TILE_HEIGHT / 2 - h);
        g.lineTo(x + bw, y + TILE_HEIGHT / 2 + bh - h);
        g.lineTo(x + bw, y + TILE_HEIGHT / 2 + bh);
        g.lineTo(x, y + TILE_HEIGHT);
        g.lineTo(x - bw, y + TILE_HEIGHT / 2 + bh);
        g.closePath();
        g.fill();

        g.zIndex = row * MAP_COLS + col;
        this.buildingLayer.addChild(g);
      }
    }

    this.buildingLayer.sortableChildren = true;
  }

  renderDistrictOverlay() {
    this.overlayLayer.removeChildren();
    this.labelLayer.removeChildren();
    if (!this.showDistricts) return;

    for (let distId = 1; distId <= 15; distId++) {
      const isSelected = this.selectedDistrict === distId;
      const isHovered = this.hoveredDistrict === distId;
      if (!isSelected && !isHovered) continue; // Only draw highlighted districts

      const g = new Graphics();
      const color = DISTRICT_COLORS[distId] ?? 0x808080;
      const alpha = isSelected ? 0.3 : 0.2;

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
      this.overlayLayer.addChild(g);
    }

    // Always show district labels
    const labelStyle = new TextStyle({
      fontFamily: 'Consolas, monospace',
      fontSize: 10,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      stroke: { color: 0x000000, width: 3 },
    });

    for (let distId = 1; distId <= 15; distId++) {
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
      const label = new Text({ text: `CD-${distId}`, style: labelStyle });
      label.anchor.set(0.5);
      label.x = sumX / count;
      label.y = sumY / count;
      this.labelLayer.addChild(label);
    }
  }

  private update(dt: number) {
    this.animTime += dt * 0.02;

    // Smooth camera interpolation
    this.cameraX += (this.targetCameraX - this.cameraX) * 0.12;
    this.cameraY += (this.targetCameraY - this.cameraY) * 0.12;
    this.cameraZoom += (this.targetCameraZoom - this.cameraZoom) * 0.12;

    this.worldContainer.x = this.cameraX;
    this.worldContainer.y = this.cameraY;
    this.worldContainer.scale.set(this.cameraZoom);
  }

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

    // Hover
    const worldX = (e.globalX - this.cameraX) / this.cameraZoom;
    const worldY = (e.globalY - this.cameraY) / this.cameraZoom;
    const { gx, gy } = screenToGrid(worldX, worldY);

    if (gx >= 0 && gx < MAP_COLS && gy >= 0 && gy < MAP_ROWS) {
      const newHovered = this.mapData[gy]?.[gx]?.district || null;
      if (newHovered !== this.hoveredDistrict) {
        this.hoveredDistrict = newHovered;
        this.renderDistrictOverlay();
      }
    }
  }

  private onPointerUp() {
    if (this.isDragging) {
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
    this.targetCameraZoom = Math.max(0.15, Math.min(2.5, this.targetCameraZoom + (e.deltaY > 0 ? -0.05 : 0.05)));
  }

  setDistrictSelectCallback(cb: DistrictSelectCallback) { this.onDistrictSelect = cb; }
  selectDistrict(id: number | null) {
    this.selectedDistrict = id;
    this.renderDistrictOverlay();
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
        this.targetCameraX = -(sumX / count) * this.cameraZoom + this.width / 2;
        this.targetCameraY = -(sumY / count) * this.cameraZoom + this.height / 2;
      }
    }
  }
  toggleDistricts(show: boolean) { this.showDistricts = show; this.renderDistrictOverlay(); }
  zoomIn() { this.targetCameraZoom = Math.min(2.5, this.targetCameraZoom + 0.15); }
  zoomOut() { this.targetCameraZoom = Math.max(0.15, this.targetCameraZoom - 0.15); }
  resetView() {
    const downtown = gridToScreen(70, 42);
    this.targetCameraX = -downtown.x * this.cameraZoom + this.width / 2;
    this.targetCameraY = -downtown.y * this.cameraZoom + this.height / 2;
    this.targetCameraZoom = 0.55;
  }
  destroy() { this.app.destroy(true); }
}
