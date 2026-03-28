import { Application, Container, Graphics, Sprite, Assets, Text, TextStyle, FederatedPointerEvent } from 'pixi.js';

export type DistrictSelectCallback = (districtId: number | null) => void;

// Neighborhood sprites positioned on the base map
// Coordinates are pixel positions on the 1408x768 base image
interface HoodSprite {
  name: string;
  src: string;
  x: number; y: number; // center position on base map
  scale: number;
  district: number;
}

const HOOD_SPRITES: HoodSprite[] = [
  { name: 'Downtown', src: '/sprites/hoods/downtown.png', x: 850, y: 460, scale: 0.45, district: 9 },
  { name: 'Hollywood', src: '/sprites/hoods/hollywood.png', x: 640, y: 240, scale: 0.38, district: 13 },
  { name: 'Beverly Hills', src: '/sprites/hoods/beverly-hills.png', x: 480, y: 280, scale: 0.32, district: 5 },
  { name: 'Venice Beach', src: '/sprites/hoods/venice-beach.png', x: 260, y: 380, scale: 0.30, district: 11 },
  { name: 'LAX', src: '/sprites/hoods/lax-airport.png', x: 340, y: 540, scale: 0.42, district: 11 },
  { name: 'San Fernando Valley', src: '/sprites/hoods/valley-suburban.png', x: 400, y: 140, scale: 0.45, district: 3 },
  { name: 'Koreatown', src: '/sprites/hoods/koreatown.png', x: 700, y: 350, scale: 0.28, district: 4 },
  { name: 'Port of LA', src: '/sprites/hoods/port-la.png', x: 780, y: 650, scale: 0.38, district: 15 },
  { name: 'Santa Monica', src: '/sprites/hoods/santa-monica.png', x: 240, y: 310, scale: 0.30, district: 11 },
  { name: 'Highland Park', src: '/sprites/hoods/highland-park.png', x: 920, y: 300, scale: 0.28, district: 1 },
  { name: 'South LA', src: '/sprites/hoods/south-la.png', x: 720, y: 540, scale: 0.38, district: 8 },
  { name: 'Arts District', src: '/sprites/hoods/arts-district.png', x: 920, y: 420, scale: 0.25, district: 14 },
];

// District hotspot polygons on the base image for click detection
interface DistrictHotspot {
  id: number; name: string; color: number;
  cx: number; cy: number;
  polygon: number[];
  member: string; population: string; meetings: number;
  neighborhoods: string[]; hotTopics: string[];
  recentAction: string;
}

const DISTRICTS: DistrictHotspot[] = [
  { id: 1, name: 'CD-1', color: 0x4CAF50, cx: 870, cy: 340, polygon: [830,290, 910,290, 930,340, 910,390, 850,400, 810,370, 810,320], member: 'Eunisses Hernandez', population: '262K', meetings: 42, neighborhoods: ['Highland Park', 'Lincoln Heights', 'Glassell Park'], hotTopics: ['Housing', 'Immigration'], recentAction: 'Community land trust expansion' },
  { id: 2, name: 'CD-2', color: 0x2196F3, cx: 580, cy: 200, polygon: [480,160, 680,160, 700,200, 680,250, 560,260, 460,240, 460,190], member: 'Paul Krekorian', population: '268K', meetings: 38, neighborhoods: ['Studio City', 'North Hollywood', 'Valley Village'], hotTopics: ['Budget', 'Transit'], recentAction: 'Budget surplus allocation' },
  { id: 3, name: 'CD-3', color: 0xFF9800, cx: 300, cy: 180, polygon: [140,130, 460,130, 460,220, 380,250, 200,250, 140,220], member: 'Bob Blumenfield', population: '272K', meetings: 35, neighborhoods: ['Woodland Hills', 'Tarzana', 'Encino'], hotTopics: ['Public Safety', 'Homelessness'], recentAction: 'RV parking restrictions' },
  { id: 4, name: 'CD-4', color: 0x9C27B0, cx: 650, cy: 310, polygon: [580,260, 780,260, 800,310, 780,360, 680,380, 580,360, 560,310], member: 'Nithya Raman', population: '259K', meetings: 48, neighborhoods: ['Silver Lake', 'Los Feliz', 'Hancock Park'], hotTopics: ['Housing', 'CEQA Reform'], recentAction: 'Rent stabilization extension' },
  { id: 5, name: 'CD-5', color: 0xE91E63, cx: 470, cy: 320, polygon: [380,270, 560,270, 580,320, 550,380, 460,400, 380,370, 360,320], member: 'Katy Young', population: '271K', meetings: 36, neighborhoods: ['Bel Air', 'Westwood', 'Century City'], hotTopics: ['Development', 'Transit'], recentAction: 'Expo Line corridor plan' },
  { id: 6, name: 'CD-6', color: 0x00BCD4, cx: 500, cy: 150, polygon: [380,100, 620,100, 640,140, 620,200, 480,210, 380,190, 360,140], member: 'Imelda Padilla', population: '275K', meetings: 32, neighborhoods: ['Van Nuys', 'Pacoima', 'Arleta'], hotTopics: ['Infrastructure', 'Community'], recentAction: 'Street improvement bonds' },
  { id: 7, name: 'CD-7', color: 0x795548, cx: 600, cy: 80, polygon: [400,40, 830,40, 840,80, 780,130, 620,140, 400,130, 380,80], member: 'Monica Rodriguez', population: '263K', meetings: 30, neighborhoods: ['Sylmar', 'Sunland-Tujunga'], hotTopics: ['Fire Safety', 'Wildlife'], recentAction: 'Fire evacuation routes' },
  { id: 8, name: 'CD-8', color: 0xF44336, cx: 700, cy: 500, polygon: [620,440, 790,440, 820,500, 800,560, 720,580, 620,560, 600,500], member: 'Marqueece Harris-Dawson', population: '266K', meetings: 40, neighborhoods: ['South LA', 'Exposition Park'], hotTopics: ['Economic Dev.', 'Jobs'], recentAction: 'Workforce development center' },
  { id: 9, name: 'CD-9', color: 0x3F51B5, cx: 830, cy: 440, polygon: [790,400, 880,400, 900,440, 890,490, 840,510, 790,490, 780,440], member: 'Curren Price', population: '269K', meetings: 37, neighborhoods: ['Downtown', 'South Park'], hotTopics: ['Downtown', 'Transit'], recentAction: 'Arts District zoning overhaul' },
  { id: 10, name: 'CD-10', color: 0x607D8B, cx: 620, cy: 430, polygon: [550,390, 740,390, 760,430, 740,480, 630,500, 550,470, 530,430], member: 'Heather Hutt', population: '258K', meetings: 44, neighborhoods: ['Mid-City', 'Crenshaw', 'West Adams'], hotTopics: ['Transportation', 'Crenshaw'], recentAction: 'Mobility Hub study' },
  { id: 11, name: 'CD-11', color: 0x009688, cx: 280, cy: 420, polygon: [120,330, 380,310, 420,380, 400,480, 320,540, 140,520, 100,440], member: 'Traci Park', population: '273K', meetings: 39, neighborhoods: ['Venice', 'Mar Vista', 'Brentwood'], hotTopics: ['Venice', 'Coastal', 'LAX'], recentAction: 'Venice alfresco dining' },
  { id: 12, name: 'CD-12', color: 0xCDDC39, cx: 240, cy: 120, polygon: [80,70, 360,70, 380,100, 360,170, 200,190, 80,170, 60,120], member: 'John Lee', population: '274K', meetings: 33, neighborhoods: ['Chatsworth', 'Granada Hills', 'Porter Ranch'], hotTopics: ['Parks', 'Public Safety'], recentAction: 'Vehicle restrictions' },
  { id: 13, name: 'CD-13', color: 0xFF5722, cx: 720, cy: 280, polygon: [660,240, 820,240, 840,280, 830,320, 760,340, 660,320, 640,280], member: 'Hugo Soto-Martinez', population: '256K', meetings: 46, neighborhoods: ['Hollywood', 'East Hollywood'], hotTopics: ['Rent Control', 'Nightlife'], recentAction: 'Tenant anti-harassment' },
  { id: 14, name: 'CD-14', color: 0x8BC34A, cx: 950, cy: 320, polygon: [880,260, 1040,260, 1060,320, 1040,400, 960,420, 880,400, 860,340], member: 'Kevin de León', population: '261K', meetings: 41, neighborhoods: ['Boyle Heights', 'Eagle Rock'], hotTopics: ['Eagle Rock', 'Encampments'], recentAction: 'Encampment protocol' },
  { id: 15, name: 'CD-15', color: 0xFFC107, cx: 740, cy: 620, polygon: [600,560, 860,550, 900,610, 880,690, 760, 720, 620,700, 560,640], member: 'Tim McOsker', population: '270K', meetings: 34, neighborhoods: ['San Pedro', 'Watts', 'Wilmington'], hotTopics: ['Port', 'San Pedro'], recentAction: 'Port benefits agreement' },
];

export { DISTRICTS };
export type { DistrictHotspot };

export class Game {
  private app!: Application;
  private world!: Container;
  private baseLayer!: Container;
  private hoodLayer!: Container;
  private overlayLayer!: Container;
  private labelLayer!: Container;

  private camX = 0; private camY = 0; private camZ = 0.82;
  private tgtX = 0; private tgtY = 0; private tgtZ = 0.82;
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
    this.baseLayer = new Container();
    this.hoodLayer = new Container();
    this.overlayLayer = new Container();
    this.labelLayer = new Container();
    this.world.addChild(this.baseLayer);
    this.world.addChild(this.hoodLayer);
    this.world.addChild(this.overlayLayer);
    this.world.addChild(this.labelLayer);
    this.app.stage.addChild(this.world);

    // Load base SimCity map
    try {
      const baseTex = await Assets.load('/map-la-simcity.png');
      const baseSprite = new Sprite(baseTex);
      this.baseLayer.addChild(baseSprite);
    } catch (e) {
      console.warn('Base map not loaded');
    }

    // Load neighborhood detail images
    for (const hood of HOOD_SPRITES) {
      try {
        const tex = await Assets.load(hood.src);
        const sprite = new Sprite(tex);
        sprite.anchor.set(0.5);
        sprite.x = hood.x;
        sprite.y = hood.y;
        sprite.scale.set(hood.scale);
        sprite.alpha = 0.85; // slight blend with base
        this.hoodLayer.addChild(sprite);
      } catch (e) {
        // Neighborhood sprite not available yet
      }
    }

    // Center on map
    this.tgtX = this.camX = (w - 1408 * this.camZ) / 2;
    this.tgtY = this.camY = (h - 768 * this.camZ) / 2;

    // Input
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
      const imgX = (e.globalX - this.camX) / this.camZ;
      const imgY = (e.globalY - this.camY) / this.camZ;
      const hit = this.hitTest(imgX, imgY);
      if (hit !== this.hovered) { this.hovered = hit; this.renderOverlay(); }
    });
    this.app.stage.on('pointerup', () => {
      if (this.dragging && !this.dragMoved) {
        this.selected = this.hovered ? (this.selected === this.hovered ? null : this.hovered) : null;
        this.renderOverlay();
        this.onSelect?.(this.selected);
      }
      this.dragging = false;
    });
    this.app.stage.on('pointerupoutside', () => { this.dragging = false; });
    this.app.stage.on('wheel', (e: any) => {
      const oz = this.tgtZ;
      this.tgtZ = Math.max(0.3, Math.min(3, this.tgtZ + (e.deltaY > 0 ? -0.08 : 0.08)));
      const r = this.tgtZ / oz;
      this.tgtX = e.clientX - (e.clientX - this.tgtX) * r;
      this.tgtY = e.clientY - (e.clientY - this.tgtY) * r;
    });

    this.renderOverlay();
    this.renderLabels();

    this.app.ticker.add(() => {
      this.camX += (this.tgtX - this.camX) * 0.12;
      this.camY += (this.tgtY - this.camY) * 0.12;
      this.camZ += (this.tgtZ - this.camZ) * 0.12;
      this.world.x = this.camX; this.world.y = this.camY;
      this.world.scale.set(this.camZ);
    });
  }

  private hitTest(px: number, py: number): number | null {
    for (const d of DISTRICTS) {
      if (this.pip(px, py, d.polygon)) return d.id;
    }
    return null;
  }

  private pip(px: number, py: number, poly: number[]): boolean {
    let inside = false;
    const n = poly.length / 2;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = poly[i*2], yi = poly[i*2+1], xj = poly[j*2], yj = poly[j*2+1];
      if ((yi > py) !== (yj > py) && px < ((xj-xi)*(py-yi))/(yj-yi) + xi) inside = !inside;
    }
    return inside;
  }

  private renderOverlay() {
    this.overlayLayer.removeChildren();
    if (!this.showDist) return;

    for (const d of DISTRICTS) {
      const isSel = this.selected === d.id;
      const isHov = this.hovered === d.id;
      const g = new Graphics();

      // Always show thin district borders
      g.setStrokeStyle({ width: isSel ? 3 : isHov ? 2.5 : 1, color: isSel || isHov ? 0xFFFFFF : d.color, alpha: isSel ? 0.9 : isHov ? 0.7 : 0.35 });
      g.poly(d.polygon); g.stroke();

      if (isSel || isHov) {
        g.fill({ color: d.color, alpha: isSel ? 0.25 : 0.15 });
        g.poly(d.polygon); g.fill();
      }
      this.overlayLayer.addChild(g);
    }
  }

  private renderLabels() {
    // District labels
    const style = new TextStyle({
      fontFamily: 'Consolas, monospace', fontSize: 12, fontWeight: 'bold',
      fill: 0xFFFFFF, stroke: { color: 0x000000, width: 3.5 },
    });
    for (const d of DISTRICTS) {
      const t = new Text({ text: d.name, style });
      t.anchor.set(0.5); t.x = d.cx; t.y = d.cy;
      this.labelLayer.addChild(t);
    }

    // Neighborhood name labels (SimCity 4 style floating signs)
    const hoodStyle = new TextStyle({
      fontFamily: 'Segoe UI, Tahoma, sans-serif', fontSize: 9,
      fill: 0x1A1A1A, fontWeight: 'bold',
    });
    for (const h of HOOD_SPRITES) {
      // Sign background
      const bg = new Graphics();
      const textWidth = h.name.length * 5.5 + 12;
      bg.fill({ color: 0xD0E0E8, alpha: 0.88 });
      bg.roundRect(h.x - textWidth/2, h.y - h.scale * 260 - 14, textWidth, 16, 3);
      bg.fill();
      bg.setStrokeStyle({ width: 1, color: 0x8090A0, alpha: 0.5 });
      bg.roundRect(h.x - textWidth/2, h.y - h.scale * 260 - 14, textWidth, 16, 3);
      bg.stroke();
      // Pole
      bg.setStrokeStyle({ width: 1, color: 0x808080 });
      bg.moveTo(h.x, h.y - h.scale * 260 + 2); bg.lineTo(h.x, h.y - h.scale * 200);
      bg.stroke();
      this.labelLayer.addChild(bg);

      const t = new Text({ text: h.name, style: hoodStyle });
      t.anchor.set(0.5); t.x = h.x; t.y = h.y - h.scale * 260 - 6;
      this.labelLayer.addChild(t);
    }
  }

  setDistrictSelectCallback(cb: DistrictSelectCallback) { this.onSelect = cb; }
  selectDistrict(id: number | null) {
    this.selected = id; this.renderOverlay();
    if (id) {
      const d = DISTRICTS.find(d => d.id === id);
      if (d) { this.tgtX = this.w/2 - d.cx * this.camZ; this.tgtY = this.h/2 - d.cy * this.camZ; }
    }
  }
  toggleDistricts(show: boolean) { this.showDist = show; this.renderOverlay(); }
  zoomIn() { this.tgtZ = Math.min(3, this.tgtZ + 0.2); }
  zoomOut() { this.tgtZ = Math.max(0.3, this.tgtZ - 0.2); }
  resetView() { this.tgtX = (this.w - 1408 * 0.82) / 2; this.tgtY = (this.h - 768 * 0.82) / 2; this.tgtZ = 0.82; }
  destroy() { this.app.destroy(true); }
}
