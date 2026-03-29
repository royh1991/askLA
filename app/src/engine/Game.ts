import { Application, Container, Graphics, Sprite, Assets, Text, TextStyle, FederatedPointerEvent } from 'pixi.js';

export type DistrictSelectCallback = (districtId: number | null) => void;

// Terrain grid: 10 cols x 7 rows of 512x512 tiles
const TILE_SIZE = 512;
const GRID_COLS = 10;
const GRID_ROWS = 7;
const MAP_PX_W = GRID_COLS * TILE_SIZE; // 5120
const MAP_PX_H = GRID_ROWS * TILE_SIZE; // 3584

// Neighborhood sprites overlaid on the terrain
interface HoodSprite {
  name: string;
  src: string;
  x: number; y: number; // pixel position on the 5120x3584 canvas
  scale: number;
  district: number;
}

// Positions mapped to the 10x7 terrain grid (5120x3584 total)
const HOOD_SPRITES: HoodSprite[] = [
  // Downtown — center-right, row 3-4 area
  { name: 'Downtown', src: '/sprites/hoods/downtown.png', x: 3100, y: 1700, scale: 0.7, district: 9 },
  // Hollywood — center, row 2 area
  { name: 'Hollywood', src: '/sprites/hoods/hollywood.png', x: 2500, y: 1100, scale: 0.6, district: 13 },
  // Beverly Hills — left-center, row 2-3
  { name: 'Beverly Hills', src: '/sprites/hoods/beverly-hills.png', x: 1900, y: 1200, scale: 0.5, district: 5 },
  // Venice Beach — far left, row 4
  { name: 'Venice Beach', src: '/sprites/hoods/venice-beach.png', x: 900, y: 2000, scale: 0.5, district: 11 },
  // LAX — left, row 5
  { name: 'LAX', src: '/sprites/hoods/lax-airport.png', x: 1200, y: 2600, scale: 0.7, district: 11 },
  // San Fernando Valley — center, row 1
  { name: 'San Fernando Valley', src: '/sprites/hoods/valley-suburban.png', x: 2000, y: 600, scale: 0.7, district: 3 },
  // Koreatown — center, row 3
  { name: 'Koreatown', src: '/sprites/hoods/koreatown.png', x: 2600, y: 1500, scale: 0.45, district: 4 },
  // Port of LA — center-right, row 6
  { name: 'Port of LA', src: '/sprites/hoods/port-la.png', x: 2900, y: 3100, scale: 0.65, district: 15 },
  // Santa Monica — left, row 3-4
  { name: 'Santa Monica', src: '/sprites/hoods/santa-monica.png', x: 800, y: 1600, scale: 0.5, district: 11 },
  // Highland Park — right, row 2
  { name: 'Highland Park', src: '/sprites/hoods/highland-park.png', x: 3500, y: 1200, scale: 0.45, district: 1 },
  // South LA — center, row 4-5
  { name: 'South LA', src: '/sprites/hoods/south-la.png', x: 2700, y: 2200, scale: 0.6, district: 8 },
  // Arts District — right of downtown, row 3
  { name: 'Arts District', src: '/sprites/hoods/arts-district.png', x: 3500, y: 1650, scale: 0.4, district: 14 },
];

// District data for sidebar
export interface DistrictData {
  id: number; name: string; color: number;
  member: string; population: string; meetings: number;
  neighborhoods: string[]; hotTopics: string[];
  recentAction: string;
}

export const DISTRICTS: DistrictData[] = [
  { id: 1, name: 'CD-1', color: 0x4CAF50, member: 'Eunisses Hernandez', population: '262K', meetings: 42, neighborhoods: ['Highland Park', 'Lincoln Heights', 'Glassell Park'], hotTopics: ['Housing', 'Immigration'], recentAction: 'Community land trust expansion' },
  { id: 2, name: 'CD-2', color: 0x2196F3, member: 'Paul Krekorian', population: '268K', meetings: 38, neighborhoods: ['Studio City', 'North Hollywood', 'Valley Village'], hotTopics: ['Budget', 'Transit'], recentAction: 'Budget surplus allocation' },
  { id: 3, name: 'CD-3', color: 0xFF9800, member: 'Bob Blumenfield', population: '272K', meetings: 35, neighborhoods: ['Woodland Hills', 'Tarzana', 'Encino'], hotTopics: ['Public Safety', 'Homelessness'], recentAction: 'RV parking restrictions' },
  { id: 4, name: 'CD-4', color: 0x9C27B0, member: 'Nithya Raman', population: '259K', meetings: 48, neighborhoods: ['Silver Lake', 'Los Feliz', 'Hancock Park'], hotTopics: ['Housing', 'CEQA Reform'], recentAction: 'Rent stabilization extension' },
  { id: 5, name: 'CD-5', color: 0xE91E63, member: 'Katy Young', population: '271K', meetings: 36, neighborhoods: ['Bel Air', 'Westwood', 'Century City'], hotTopics: ['Development', 'Transit'], recentAction: 'Expo Line corridor plan' },
  { id: 6, name: 'CD-6', color: 0x00BCD4, member: 'Imelda Padilla', population: '275K', meetings: 32, neighborhoods: ['Van Nuys', 'Pacoima', 'Arleta'], hotTopics: ['Infrastructure', 'Community'], recentAction: 'Street improvement bonds' },
  { id: 7, name: 'CD-7', color: 0x795548, member: 'Monica Rodriguez', population: '263K', meetings: 30, neighborhoods: ['Sylmar', 'Sunland-Tujunga'], hotTopics: ['Fire Safety', 'Wildlife'], recentAction: 'Fire evacuation routes' },
  { id: 8, name: 'CD-8', color: 0xF44336, member: 'Marqueece Harris-Dawson', population: '266K', meetings: 40, neighborhoods: ['South LA', 'Exposition Park'], hotTopics: ['Economic Dev.', 'Jobs'], recentAction: 'Workforce development center' },
  { id: 9, name: 'CD-9', color: 0x3F51B5, member: 'Curren Price', population: '269K', meetings: 37, neighborhoods: ['Downtown', 'South Park'], hotTopics: ['Downtown', 'Transit'], recentAction: 'Arts District zoning overhaul' },
  { id: 10, name: 'CD-10', color: 0x607D8B, member: 'Heather Hutt', population: '258K', meetings: 44, neighborhoods: ['Mid-City', 'Crenshaw', 'West Adams'], hotTopics: ['Transportation', 'Crenshaw'], recentAction: 'Mobility Hub study' },
  { id: 11, name: 'CD-11', color: 0x009688, member: 'Traci Park', population: '273K', meetings: 39, neighborhoods: ['Venice', 'Mar Vista', 'Brentwood'], hotTopics: ['Venice', 'Coastal', 'LAX'], recentAction: 'Venice alfresco dining' },
  { id: 12, name: 'CD-12', color: 0xCDDC39, member: 'John Lee', population: '274K', meetings: 33, neighborhoods: ['Chatsworth', 'Granada Hills', 'Porter Ranch'], hotTopics: ['Parks', 'Public Safety'], recentAction: 'Vehicle restrictions' },
  { id: 13, name: 'CD-13', color: 0xFF5722, member: 'Hugo Soto-Martinez', population: '256K', meetings: 46, neighborhoods: ['Hollywood', 'East Hollywood'], hotTopics: ['Rent Control', 'Nightlife'], recentAction: 'Tenant anti-harassment' },
  { id: 14, name: 'CD-14', color: 0x8BC34A, member: 'Kevin de León', population: '261K', meetings: 41, neighborhoods: ['Boyle Heights', 'Eagle Rock'], hotTopics: ['Eagle Rock', 'Encampments'], recentAction: 'Encampment protocol' },
  { id: 15, name: 'CD-15', color: 0xFFC107, member: 'Tim McOsker', population: '270K', meetings: 34, neighborhoods: ['San Pedro', 'Watts', 'Wilmington'], hotTopics: ['Port', 'San Pedro'], recentAction: 'Port benefits agreement' },
];

export class Game {
  private app!: Application;
  private world!: Container;
  private terrainLayer!: Container;
  private hoodLayer!: Container;
  private overlayLayer!: Container;
  private labelLayer!: Container;

  private camX = 0; private camY = 0; private camZ = 0.22;
  private tgtX = 0; private tgtY = 0; private tgtZ = 0.22;
  private dragging = false; private dragSX = 0; private dragSY = 0;
  private dragCX = 0; private dragCY = 0; private dragMoved = false;

  private hovered: number | null = null;
  private selected: number | null = null;
  private onSelect: DistrictSelectCallback | null = null;
  private showDist = true;
  private w = 0; private h = 0;

  async init(el: HTMLElement, w: number, h: number) {
    this.w = w; this.h = h;
    this.app = new Application();
    await this.app.init({
      background: 0x1A3050, resizeTo: el, antialias: true,
      resolution: window.devicePixelRatio || 1, autoDensity: true,
    });
    el.appendChild(this.app.canvas);

    this.world = new Container();
    this.terrainLayer = new Container();
    this.hoodLayer = new Container();
    this.overlayLayer = new Container();
    this.labelLayer = new Container();
    this.world.addChild(this.terrainLayer);
    this.world.addChild(this.hoodLayer);
    this.world.addChild(this.overlayLayer);
    this.world.addChild(this.labelLayer);
    this.app.stage.addChild(this.world);

    // Load terrain grid tiles
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const src = `/sprites/terrain/t-${col}-${row}.png`;
        try {
          const tex = await Assets.load(src);
          const sprite = new Sprite(tex);
          sprite.x = col * TILE_SIZE;
          sprite.y = row * TILE_SIZE;
          sprite.width = TILE_SIZE;
          sprite.height = TILE_SIZE;
          this.terrainLayer.addChild(sprite);
        } catch {
          // Missing tile — draw placeholder
          const g = new Graphics();
          const placeholderColor = row < 1 ? 0x5A6B3F : row >= 5 ? 0x1A5276 : 0x3D8B37;
          g.fill({ color: placeholderColor });
          g.rect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          g.fill();
          this.terrainLayer.addChild(g);
        }
      }
    }

    // Load neighborhood sprites
    for (const hood of HOOD_SPRITES) {
      try {
        const tex = await Assets.load(hood.src);
        const sprite = new Sprite(tex);
        sprite.anchor.set(0.5);
        sprite.x = hood.x;
        sprite.y = hood.y;
        sprite.scale.set(hood.scale);
        this.hoodLayer.addChild(sprite);
      } catch { /* not available */ }
    }

    // Center on downtown area
    this.tgtX = this.camX = w / 2 - 3100 * this.camZ;
    this.tgtY = this.camY = h / 2 - 1700 * this.camZ;

    // Input handlers
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;

    this.app.stage.on('pointerdown', (e: FederatedPointerEvent) => {
      this.dragging = true; this.dragMoved = false;
      this.dragSX = e.globalX; this.dragSY = e.globalY;
      this.dragCX = this.tgtX; this.dragCY = this.tgtY;
    });
    this.app.stage.on('pointermove', (e: FederatedPointerEvent) => {
      if (this.dragging) {
        const dx = e.globalX - this.dragSX, dy = e.globalY - this.dragSY;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) this.dragMoved = true;
        this.tgtX = this.dragCX + dx; this.tgtY = this.dragCY + dy;
      }
    });
    this.app.stage.on('pointerup', () => {
      if (this.dragging && !this.dragMoved) {
        // Click — no district detection yet since we don't have polygon hotspots
        // for the new coordinate system. Will add later.
      }
      this.dragging = false;
    });
    this.app.stage.on('pointerupoutside', () => { this.dragging = false; });
    this.app.stage.on('wheel', (e: any) => {
      const oz = this.tgtZ;
      this.tgtZ = Math.max(0.08, Math.min(1.5, this.tgtZ + (e.deltaY > 0 ? -0.02 : 0.02)));
      const r = this.tgtZ / oz;
      this.tgtX = e.clientX - (e.clientX - this.tgtX) * r;
      this.tgtY = e.clientY - (e.clientY - this.tgtY) * r;
    });

    this.renderLabels();

    // Game loop
    this.app.ticker.add(() => {
      this.camX += (this.tgtX - this.camX) * 0.12;
      this.camY += (this.tgtY - this.camY) * 0.12;
      this.camZ += (this.tgtZ - this.camZ) * 0.12;
      this.world.x = this.camX; this.world.y = this.camY;
      this.world.scale.set(this.camZ);
    });
  }

  private renderLabels() {
    // Neighborhood labels — SimCity 4 style floating signs
    const hoodStyle = new TextStyle({
      fontFamily: 'Segoe UI, Tahoma, sans-serif', fontSize: 28,
      fill: 0x1A1A1A, fontWeight: 'bold',
    });

    for (const h of HOOD_SPRITES) {
      // Sign background
      const textWidth = h.name.length * 16 + 30;
      const signY = h.y - h.scale * 300 - 40;
      const bg = new Graphics();
      bg.fill({ color: 0xD0E0E8, alpha: 0.9 });
      bg.roundRect(h.x - textWidth / 2, signY, textWidth, 36, 6);
      bg.fill();
      bg.setStrokeStyle({ width: 1.5, color: 0x8090A0, alpha: 0.6 });
      bg.roundRect(h.x - textWidth / 2, signY, textWidth, 36, 6);
      bg.stroke();
      // Pole
      bg.setStrokeStyle({ width: 2, color: 0x808080 });
      bg.moveTo(h.x, signY + 36); bg.lineTo(h.x, h.y - h.scale * 200);
      bg.stroke();
      this.labelLayer.addChild(bg);

      const t = new Text({ text: h.name, style: hoodStyle });
      t.anchor.set(0.5); t.x = h.x; t.y = signY + 18;
      this.labelLayer.addChild(t);
    }
  }

  // Public API
  setDistrictSelectCallback(cb: DistrictSelectCallback) { this.onSelect = cb; }
  selectDistrict(id: number | null) { this.selected = id; }
  toggleDistricts(show: boolean) { this.showDist = show; }
  zoomIn() { this.tgtZ = Math.min(1.5, this.tgtZ + 0.05); }
  zoomOut() { this.tgtZ = Math.max(0.08, this.tgtZ - 0.05); }
  resetView() {
    this.tgtX = this.w / 2 - 3100 * 0.22;
    this.tgtY = this.h / 2 - 1700 * 0.22;
    this.tgtZ = 0.22;
  }
  destroy() { this.app.destroy(true); }
}
