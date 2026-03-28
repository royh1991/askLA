import { Application, Container, Graphics, Sprite, Assets, Text, TextStyle, FederatedPointerEvent } from 'pixi.js';

export type DistrictSelectCallback = (districtId: number | null) => void;

// District hotspots mapped to approximate pixel positions on the Gemini SimCity image
// The image is 1408x768 (16:9), these are pixel coordinates on the image
interface DistrictHotspot {
  id: number;
  name: string;
  // Polygon points on the source image (approximate district shapes)
  polygon: number[];
  // Center for label
  cx: number;
  cy: number;
  color: number;
}

// These map to the Gemini-generated SimCity image at /map-la-simcity.png
// The image has: mountains top, ocean bottom-left and right,
// downtown skyscrapers center-right, LAX bottom-left, port bottom-right,
// Hollywood sign top-center, valley area upper portion
const HOTSPOTS: DistrictHotspot[] = [
  { id: 1, name: 'CD-1', cx: 820, cy: 380, color: 0x4CAF50,
    polygon: [780,340, 860,340, 880,370, 870,420, 830,440, 780,430, 760,400, 770,360] },
  { id: 2, name: 'CD-2', cx: 580, cy: 250, color: 0x2196F3,
    polygon: [480,200, 680,200, 700,240, 680,300, 580,310, 480,290, 460,250] },
  { id: 3, name: 'CD-3', cx: 300, cy: 250, color: 0xFF9800,
    polygon: [140,200, 460,200, 460,280, 380,310, 260,310, 140,290] },
  { id: 4, name: 'CD-4', cx: 650, cy: 340, color: 0x9C27B0,
    polygon: [580,300, 760,300, 780,340, 760,380, 680,400, 600,390, 570,360, 570,320] },
  { id: 5, name: 'CD-5', cx: 480, cy: 370, color: 0xE91E63,
    polygon: [380,310, 570,310, 580,370, 560,420, 480,440, 380,420, 360,370] },
  { id: 6, name: 'CD-6', cx: 500, cy: 200, color: 0x00BCD4,
    polygon: [380,140, 620,140, 640,180, 620,230, 480,240, 380,230, 360,180] },
  { id: 7, name: 'CD-7', cx: 600, cy: 120, color: 0x795548,
    polygon: [380,60, 820,60, 840,100, 780,160, 620,170, 400,160, 360,100] },
  { id: 8, name: 'CD-8', cx: 700, cy: 480, color: 0xF44336,
    polygon: [620,430, 780,430, 810,470, 800,530, 720,550, 620,530, 600,470] },
  { id: 9, name: 'CD-9', cx: 780, cy: 440, color: 0x3F51B5,
    polygon: [740,400, 830,400, 860,430, 850,480, 790,500, 740,480, 730,440] },
  { id: 10, name: 'CD-10', cx: 620, cy: 440, color: 0x607D8B,
    polygon: [560,400, 700,400, 720,440, 700,490, 620,500, 560,480, 540,440] },
  { id: 11, name: 'CD-11', cx: 340, cy: 460, color: 0x009688,
    polygon: [160,380, 380,370, 400,420, 380,500, 300,560, 180,540, 120,480, 120,420] },
  { id: 12, name: 'CD-12', cx: 240, cy: 170, color: 0xCDDC39,
    polygon: [100,100, 360,100, 380,140, 360,200, 240,220, 100,200, 80,150] },
  { id: 13, name: 'CD-13', cx: 730, cy: 320, color: 0xFF5722,
    polygon: [680,280, 800,280, 830,310, 820,350, 760,370, 680,360, 660,330] },
  { id: 14, name: 'CD-14', cx: 880, cy: 340, color: 0x8BC34A,
    polygon: [830,270, 980,270, 1010,310, 1000,380, 920,400, 840,390, 810,340] },
  { id: 15, name: 'CD-15', cx: 740, cy: 600, color: 0xFFC107,
    polygon: [600,540, 840,530, 880,580, 860,660, 760,700, 620,680, 560,620, 570,560] },
];

export class Game {
  private app!: Application;
  private worldContainer!: Container;
  private imageSprite!: Sprite;
  private overlayLayer!: Container;
  private labelLayer!: Container;

  // Camera
  private cameraX = 0;
  private cameraY = 0;
  private cameraZoom = 0.85;
  private targetCameraX = 0;
  private targetCameraY = 0;
  private targetCameraZoom = 0.85;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragCamStartX = 0;
  private dragCamStartY = 0;
  private dragMoved = false;

  private hoveredDistrict: number | null = null;
  private selectedDistrict: number | null = null;
  private onDistrictSelect: DistrictSelectCallback | null = null;
  private showDistricts = true;
  private width = 0;
  private height = 0;

  // Image dimensions
  private imgW = 1408;
  private imgH = 768;

  async init(canvas: HTMLElement, width: number, height: number) {
    this.width = width;
    this.height = height;
    this.app = new Application();

    await this.app.init({
      background: 0x0D1B2A,
      resizeTo: canvas,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    canvas.appendChild(this.app.canvas);

    this.worldContainer = new Container();
    this.overlayLayer = new Container();
    this.labelLayer = new Container();

    // Load the Gemini SimCity image
    const texture = await Assets.load('/map-la-simcity.png');
    this.imageSprite = new Sprite(texture);
    this.imgW = texture.width;
    this.imgH = texture.height;

    this.worldContainer.addChild(this.imageSprite);
    this.worldContainer.addChild(this.overlayLayer);
    this.worldContainer.addChild(this.labelLayer);
    this.app.stage.addChild(this.worldContainer);

    // Center camera
    this.targetCameraX = this.cameraX = (width - this.imgW * this.cameraZoom) / 2;
    this.targetCameraY = this.cameraY = (height - this.imgH * this.cameraZoom) / 2;

    // Input
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;
    this.app.stage.on('pointerdown', (e: FederatedPointerEvent) => this.onPointerDown(e));
    this.app.stage.on('pointermove', (e: FederatedPointerEvent) => this.onPointerMove(e));
    this.app.stage.on('pointerup', () => this.onPointerUp());
    this.app.stage.on('pointerupoutside', () => this.onPointerUp());
    this.app.stage.on('wheel', (e: any) => this.onWheel(e));

    this.renderOverlays();
    this.app.ticker.add((ticker) => this.update(ticker.deltaTime));
  }

  private renderOverlays() {
    this.overlayLayer.removeChildren();
    this.labelLayer.removeChildren();
    if (!this.showDistricts) return;

    for (const hs of HOTSPOTS) {
      const isSelected = this.selectedDistrict === hs.id;
      const isHovered = this.hoveredDistrict === hs.id;

      // District polygon fill
      const g = new Graphics();
      const alpha = isSelected ? 0.35 : isHovered ? 0.25 : 0.05;
      g.fill({ color: hs.color, alpha });
      g.poly(hs.polygon);
      g.fill();

      // Border
      if (isSelected || isHovered) {
        g.setStrokeStyle({ width: isSelected ? 3 : 2, color: 0xFFFFFF, alpha: isSelected ? 0.9 : 0.6 });
        g.poly(hs.polygon);
        g.stroke();
      } else {
        g.setStrokeStyle({ width: 1, color: hs.color, alpha: 0.4 });
        g.poly(hs.polygon);
        g.stroke();
      }

      this.overlayLayer.addChild(g);

      // Label
      const style = new TextStyle({
        fontFamily: 'Consolas, monospace',
        fontSize: isSelected || isHovered ? 14 : 11,
        fontWeight: 'bold',
        fill: 0xFFFFFF,
        stroke: { color: 0x000000, width: isSelected || isHovered ? 4 : 3 },
      });
      const label = new Text({ text: hs.name, style });
      label.anchor.set(0.5);
      label.x = hs.cx;
      label.y = hs.cy;
      this.labelLayer.addChild(label);
    }
  }

  private hitTestDistrict(imgX: number, imgY: number): number | null {
    for (const hs of HOTSPOTS) {
      if (this.pointInPolygon(imgX, imgY, hs.polygon)) return hs.id;
    }
    return null;
  }

  private pointInPolygon(px: number, py: number, polygon: number[]): boolean {
    let inside = false;
    const n = polygon.length / 2;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = polygon[i * 2], yi = polygon[i * 2 + 1];
      const xj = polygon[j * 2], yj = polygon[j * 2 + 1];
      if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  }

  private update(_dt: number) {
    this.cameraX += (this.targetCameraX - this.cameraX) * 0.12;
    this.cameraY += (this.targetCameraY - this.cameraY) * 0.12;
    this.cameraZoom += (this.targetCameraZoom - this.cameraZoom) * 0.12;
    this.worldContainer.x = this.cameraX;
    this.worldContainer.y = this.cameraY;
    this.worldContainer.scale.set(this.cameraZoom);
  }

  private onPointerDown(e: FederatedPointerEvent) {
    this.isDragging = true;
    this.dragMoved = false;
    this.dragStartX = e.globalX;
    this.dragStartY = e.globalY;
    this.dragCamStartX = this.targetCameraX;
    this.dragCamStartY = this.targetCameraY;
  }

  private onPointerMove(e: FederatedPointerEvent) {
    if (this.isDragging) {
      const dx = e.globalX - this.dragStartX;
      const dy = e.globalY - this.dragStartY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) this.dragMoved = true;
      this.targetCameraX = this.dragCamStartX + dx;
      this.targetCameraY = this.dragCamStartY + dy;
    }

    // Hover detection
    const imgX = (e.globalX - this.cameraX) / this.cameraZoom;
    const imgY = (e.globalY - this.cameraY) / this.cameraZoom;
    const hit = this.hitTestDistrict(imgX, imgY);
    if (hit !== this.hoveredDistrict) {
      this.hoveredDistrict = hit;
      this.renderOverlays();
    }
  }

  private onPointerUp() {
    if (this.isDragging && !this.dragMoved) {
      // It was a click
      if (this.hoveredDistrict) {
        this.selectedDistrict = this.selectedDistrict === this.hoveredDistrict ? null : this.hoveredDistrict;
      } else {
        this.selectedDistrict = null;
      }
      this.renderOverlays();
      this.onDistrictSelect?.(this.selectedDistrict);
    }
    this.isDragging = false;
  }

  private onWheel(e: WheelEvent) {
    // Zoom toward mouse position
    const oldZoom = this.targetCameraZoom;
    this.targetCameraZoom = Math.max(0.3, Math.min(3, this.targetCameraZoom + (e.deltaY > 0 ? -0.08 : 0.08)));
    // Adjust camera to zoom toward cursor
    const zoomRatio = this.targetCameraZoom / oldZoom;
    this.targetCameraX = e.clientX - (e.clientX - this.targetCameraX) * zoomRatio;
    this.targetCameraY = e.clientY - (e.clientY - this.targetCameraY) * zoomRatio;
  }

  setDistrictSelectCallback(cb: DistrictSelectCallback) { this.onDistrictSelect = cb; }

  selectDistrict(id: number | null) {
    this.selectedDistrict = id;
    this.renderOverlays();
    if (id) {
      const hs = HOTSPOTS.find(h => h.id === id);
      if (hs) {
        this.targetCameraX = this.width / 2 - hs.cx * this.cameraZoom;
        this.targetCameraY = this.height / 2 - hs.cy * this.cameraZoom;
      }
    }
  }

  toggleDistricts(show: boolean) { this.showDistricts = show; this.renderOverlays(); }
  zoomIn() { this.targetCameraZoom = Math.min(3, this.targetCameraZoom + 0.2); }
  zoomOut() { this.targetCameraZoom = Math.max(0.3, this.targetCameraZoom - 0.2); }
  resetView() {
    this.targetCameraX = (this.width - this.imgW * 0.85) / 2;
    this.targetCameraY = (this.height - this.imgH * 0.85) / 2;
    this.targetCameraZoom = 0.85;
  }
  destroy() { this.app.destroy(true); }
}
