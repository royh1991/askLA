import { Application, Container, Graphics, Sprite, Assets, Text, TextStyle, FederatedPointerEvent } from 'pixi.js';

export type DistrictSelectCallback = (districtId: number | null) => void;

// Base map dimensions (Gemini 16:9)
const MAP_W = 1408;
const MAP_H = 768;

// Neighborhood sprites overlaid on the terrain
interface HoodSprite {
  name: string;
  src: string;
  x: number; y: number; // pixel position on the 5120x3584 canvas
  scale: number;
  district: number;
}

// Positions on 1408x768 base map
const HOOD_SPRITES: HoodSprite[] = [
  { name: 'Downtown', src: '/sprites/hoods/downtown.png', x: 850, y: 460, scale: 0.42, district: 9 },
  { name: 'Hollywood', src: '/sprites/hoods/hollywood.png', x: 620, y: 250, scale: 0.35, district: 13 },
  { name: 'Beverly Hills', src: '/sprites/hoods/beverly-hills.png', x: 480, y: 280, scale: 0.3, district: 5 },
  { name: 'Venice Beach', src: '/sprites/hoods/venice-beach.png', x: 250, y: 430, scale: 0.3, district: 11 },
  { name: 'LAX', src: '/sprites/hoods/lax-airport.png', x: 350, y: 560, scale: 0.38, district: 11 },
  { name: 'San Fernando Valley', src: '/sprites/hoods/valley-suburban.png', x: 480, y: 130, scale: 0.4, district: 3 },
  { name: 'Koreatown', src: '/sprites/hoods/koreatown.png', x: 700, y: 380, scale: 0.25, district: 4 },
  { name: 'Port of LA', src: '/sprites/hoods/port-la.png', x: 820, y: 680, scale: 0.35, district: 15 },
  { name: 'Santa Monica', src: '/sprites/hoods/santa-monica.png', x: 240, y: 340, scale: 0.28, district: 11 },
  { name: 'Highland Park', src: '/sprites/hoods/highland-park.png', x: 950, y: 300, scale: 0.25, district: 1 },
  { name: 'South LA', src: '/sprites/hoods/south-la.png', x: 750, y: 550, scale: 0.35, district: 8 },
  { name: 'Arts District', src: '/sprites/hoods/arts-district.png', x: 930, y: 430, scale: 0.22, district: 14 },
];

// 50 landmarks with positions on 1408x768 base map
interface LandmarkSprite {
  name: string; src: string; x: number; y: number; scale: number;
}
const LANDMARK_SPRITES: LandmarkSprite[] = [
  { name: 'City Hall', src: '/sprites/landmarks/city-hall.png', x: 840, y: 420, scale: 0.35 },
  { name: 'Capitol Records', src: '/sprites/landmarks/capitol-records.png', x: 630, y: 260, scale: 0.2 },
  { name: 'US Bank Tower', src: '/sprites/landmarks/us-bank-tower.png', x: 860, y: 440, scale: 0.3 },
  { name: 'Disney Concert Hall', src: '/sprites/landmarks/disney-concert-hall.png', x: 830, y: 430, scale: 0.25 },
  { name: 'The Broad', src: '/sprites/landmarks/the-broad.png', x: 845, y: 425, scale: 0.18 },
  { name: 'LACMA', src: '/sprites/landmarks/lacma.png', x: 580, y: 350, scale: 0.2 },
  { name: 'Watts Towers', src: '/sprites/landmarks/watts-towers.png', x: 800, y: 600, scale: 0.2 },
  { name: 'Union Station', src: '/sprites/landmarks/union-station.png', x: 870, y: 400, scale: 0.22 },
  { name: 'Dodger Stadium', src: '/sprites/landmarks/dodger-stadium.png', x: 890, y: 350, scale: 0.35 },
  { name: 'SoFi Stadium', src: '/sprites/landmarks/sofi-stadium.png', x: 500, y: 570, scale: 0.3 },
  { name: 'Crypto Arena', src: '/sprites/landmarks/crypto-arena.png', x: 810, y: 470, scale: 0.22 },
  { name: 'Hollywood Bowl', src: '/sprites/landmarks/hollywood-bowl.png', x: 590, y: 230, scale: 0.22 },
  { name: 'Greek Theatre', src: '/sprites/landmarks/greek-theatre.png', x: 660, y: 220, scale: 0.2 },
  { name: 'Hollywood Sign', src: '/sprites/landmarks/hollywood-sign.png', x: 620, y: 190, scale: 0.3 },
  { name: 'Griffith Observatory', src: '/sprites/landmarks/griffith-observatory.png', x: 680, y: 210, scale: 0.25 },
  { name: 'Chinese Theatre', src: '/sprites/landmarks/chinese-theatre.png', x: 610, y: 270, scale: 0.18 },
  { name: 'Getty Center', src: '/sprites/landmarks/getty-center.png', x: 380, y: 250, scale: 0.25 },
  { name: 'Beverly Center', src: '/sprites/landmarks/beverly-center.png', x: 530, y: 340, scale: 0.18 },
  { name: 'The Grove', src: '/sprites/landmarks/the-grove.png', x: 560, y: 360, scale: 0.18 },
  { name: 'Santa Monica Pier', src: '/sprites/landmarks/santa-monica-pier.png', x: 210, y: 370, scale: 0.25 },
  { name: 'Venice Canals', src: '/sprites/landmarks/venice-canals.png', x: 260, y: 450, scale: 0.2 },
  { name: 'Echo Park Lake', src: '/sprites/landmarks/echo-park-lake.png', x: 790, y: 340, scale: 0.2 },
  { name: 'UCLA', src: '/sprites/landmarks/ucla-royce-hall.png', x: 420, y: 320, scale: 0.22 },
  { name: 'USC', src: '/sprites/landmarks/usc-tommy-trojan.png', x: 780, y: 490, scale: 0.2 },
  { name: 'Bradbury Building', src: '/sprites/landmarks/bradbury-building.png', x: 855, y: 445, scale: 0.15 },
  { name: 'Central Library', src: '/sprites/landmarks/central-library.png', x: 835, y: 450, scale: 0.18 },
  { name: 'Rose Bowl', src: '/sprites/landmarks/rose-bowl.png', x: 980, y: 230, scale: 0.28 },
  { name: 'Memorial Coliseum', src: '/sprites/landmarks/memorial-coliseum.png', x: 790, y: 500, scale: 0.25 },
  { name: 'Angels Flight', src: '/sprites/landmarks/angels-flight.png', x: 845, y: 435, scale: 0.12 },
  { name: 'La Brea Tar Pits', src: '/sprites/landmarks/la-brea-tar-pits.png', x: 570, y: 355, scale: 0.2 },
  { name: 'The Wiltern', src: '/sprites/landmarks/the-wiltern.png', x: 640, y: 370, scale: 0.15 },
  { name: 'Pantages Theatre', src: '/sprites/landmarks/pantages-theatre.png', x: 640, y: 275, scale: 0.15 },
  { name: 'El Capitan', src: '/sprites/landmarks/el-capitan-theatre.png', x: 615, y: 275, scale: 0.15 },
  { name: 'Convention Center', src: '/sprites/landmarks/convention-center.png', x: 820, y: 480, scale: 0.22 },
  { name: 'Olvera Street', src: '/sprites/landmarks/olvera-street.png', x: 865, y: 405, scale: 0.15 },
  { name: 'Pershing Square', src: '/sprites/landmarks/pershing-square.png', x: 850, y: 450, scale: 0.15 },
  { name: 'Runyon Canyon', src: '/sprites/landmarks/runyon-canyon.png', x: 580, y: 230, scale: 0.2 },
  { name: 'Mulholland', src: '/sprites/landmarks/mulholland-overlook.png', x: 500, y: 200, scale: 0.2 },
  { name: 'Santa Monica Place', src: '/sprites/landmarks/santa-monica-place.png', x: 225, y: 360, scale: 0.18 },
  { name: '3rd St Promenade', src: '/sprites/landmarks/third-street-promenade.png', x: 230, y: 350, scale: 0.15 },
  { name: 'LAX Theme Bldg', src: '/sprites/landmarks/lax-theme-building.png', x: 340, y: 555, scale: 0.2 },
  { name: 'The Forum', src: '/sprites/landmarks/forum-inglewood.png', x: 480, y: 560, scale: 0.22 },
  { name: 'Cathedral', src: '/sprites/landmarks/cathedral-our-lady.png', x: 840, y: 410, scale: 0.18 },
  { name: 'Chateau Marmont', src: '/sprites/landmarks/chateau-marmont.png', x: 570, y: 280, scale: 0.15 },
  { name: 'Roosevelt Hotel', src: '/sprites/landmarks/roosevelt-hotel.png', x: 625, y: 268, scale: 0.15 },
  { name: 'Grand Central Mkt', src: '/sprites/landmarks/grand-central-market.png', x: 850, y: 440, scale: 0.15 },
  { name: 'Griffith Park', src: '/sprites/landmarks/griffith-park-ranger.png', x: 700, y: 200, scale: 0.2 },
  { name: 'Crenshaw Mall', src: '/sprites/landmarks/crenshaw-mall.png', x: 680, y: 510, scale: 0.18 },
  { name: 'LAX Full', src: '/sprites/landmarks/lax-airport-full.png', x: 360, y: 570, scale: 0.35 },
  { name: 'Port of LA', src: '/sprites/landmarks/port-of-la.png', x: 830, y: 690, scale: 0.3 },
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

  private camX = 0; private camY = 0; private camZ = 0.85;
  private tgtX = 0; private tgtY = 0; private tgtZ = 0.85;
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

    // Load base topographical map (Gemini-generated, no buildings)
    try {
      const baseTex = await Assets.load('/map-base.png');
      const baseSprite = new Sprite(baseTex);
      this.terrainLayer.addChild(baseSprite);
    } catch { console.warn('Base map not loaded'); }

    // Load neighborhood sprites on top
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

    // Load landmark sprites on top
    const landmarkLayer = new Container();
    this.world.addChildAt(landmarkLayer, 2); // between hoods and overlay
    for (const lm of LANDMARK_SPRITES) {
      try {
        const tex = await Assets.load(lm.src);
        const sprite = new Sprite(tex);
        sprite.anchor.set(0.5, 0.9);
        sprite.x = lm.x;
        sprite.y = lm.y;
        sprite.scale.set(lm.scale);
        this.hoodLayer.addChild(sprite);
      } catch { /* not generated yet */ }
    }

    // Center on downtown
    this.tgtX = this.camX = w / 2 - 850 * this.camZ;
    this.tgtY = this.camY = h / 2 - 460 * this.camZ;

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
      fontFamily: 'Segoe UI, Tahoma, sans-serif', fontSize: 11,
      fill: 0x1A1A1A, fontWeight: 'bold',
    });

    for (const h of HOOD_SPRITES) {
      const textWidth = h.name.length * 6.5 + 14;
      const signY = h.y - h.scale * 280 - 16;
      const bg = new Graphics();
      bg.fill({ color: 0xD0E0E8, alpha: 0.9 });
      bg.roundRect(h.x - textWidth / 2, signY, textWidth, 16, 3);
      bg.fill();
      bg.setStrokeStyle({ width: 1, color: 0x8090A0, alpha: 0.5 });
      bg.roundRect(h.x - textWidth / 2, signY, textWidth, 16, 3);
      bg.stroke();
      bg.setStrokeStyle({ width: 1, color: 0x808080 });
      bg.moveTo(h.x, signY + 16); bg.lineTo(h.x, h.y - h.scale * 120);
      bg.stroke();
      this.labelLayer.addChild(bg);

      const t = new Text({ text: h.name, style: hoodStyle });
      t.anchor.set(0.5); t.x = h.x; t.y = signY + 8;
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
    this.tgtX = (this.w - MAP_W * 0.85) / 2;
    this.tgtY = (this.h - MAP_H * 0.85) / 2;
    this.tgtZ = 0.85;
  }
  destroy() { this.app.destroy(true); }
}
