import { Application, Container, Graphics, Text, TextStyle, FederatedPointerEvent } from 'pixi.js';
import { Terrain, Zone, Cell, TILE_W, TILE_H, MAP_W, MAP_H, isoX, isoY, screenToGrid } from './types';
import { generateMap, HOODS, LANDMARKS, FREEWAYS } from './MapData';

export type DistrictSelectCallback = (districtId: number | null) => void;

const DIST_COL: Record<number, number> = {
  1:0x4CAF50, 2:0x2196F3, 3:0xFF9800, 4:0x9C27B0, 5:0xE91E63,
  6:0x00BCD4, 7:0x795548, 8:0xF44336, 9:0x3F51B5, 10:0x607D8B,
  11:0x009688, 12:0xCDDC39, 13:0xFF5722, 14:0x8BC34A, 15:0xFFC107,
};

function darken(c: number, f: number) {
  return (Math.max(0, ((c>>16)&0xFF)*f|0)<<16) | (Math.max(0, ((c>>8)&0xFF)*f|0)<<8) | Math.max(0, (c&0xFF)*f|0);
}
function lighten(c: number, a: number) {
  return (Math.min(255, ((c>>16)&0xFF)+a)<<16) | (Math.min(255, ((c>>8)&0xFF)+a)<<8) | Math.min(255, (c&0xFF)+a);
}

export class Game {
  private app!: Application;
  private world!: Container;
  private overlayLayer!: Container;
  private labelLayer!: Container;
  private map: Cell[][];
  private camX = 0; private camY = 0; private camZ = 0.45;
  private tgtX = 0; private tgtY = 0; private tgtZ = 0.45;
  private dragging = false; private dragSX = 0; private dragSY = 0; private dragCX = 0; private dragCY = 0; private dragMoved = false;
  private hovered: number | null = null;
  private selected: number | null = null;
  private onSelect: DistrictSelectCallback | null = null;
  private showDist = true;
  private w = 0; private h = 0;

  constructor() { this.map = generateMap(); }

  async init(el: HTMLElement, w: number, h: number) {
    this.w = w; this.h = h;
    this.app = new Application();
    await this.app.init({ background: 0x1A3050, resizeTo: el, antialias: false, resolution: window.devicePixelRatio || 1, autoDensity: true });
    el.appendChild(this.app.canvas);

    this.world = new Container();
    this.overlayLayer = new Container();
    this.labelLayer = new Container();
    this.app.stage.addChild(this.world);
    this.app.stage.addChild(this.overlayLayer);
    this.app.stage.addChild(this.labelLayer);

    // Center on downtown
    const dx = isoX(90, 58), dy = isoY(90, 58);
    this.camX = this.tgtX = w / 2 - dx * this.camZ;
    this.camY = this.tgtY = h / 2 - dy * this.camZ;

    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;
    this.app.stage.on('pointerdown', (e: FederatedPointerEvent) => { this.dragging = true; this.dragMoved = false; this.dragSX = e.globalX; this.dragSY = e.globalY; this.dragCX = this.tgtX; this.dragCY = this.tgtY; });
    this.app.stage.on('pointermove', (e: FederatedPointerEvent) => {
      if (this.dragging) { const dx = e.globalX - this.dragSX, dy = e.globalY - this.dragSY; if (Math.abs(dx) > 2 || Math.abs(dy) > 2) this.dragMoved = true; this.tgtX = this.dragCX + dx; this.tgtY = this.dragCY + dy; }
      const ix = (e.globalX - this.camX) / this.camZ, iy = (e.globalY - this.camY) / this.camZ;
      const { col, row } = screenToGrid(ix, iy);
      if (col >= 0 && col < MAP_W && row >= 0 && row < MAP_H) { const d = this.map[row]?.[col]?.district; if (d !== this.hovered) { this.hovered = d || null; this.renderOverlay(); } }
    });
    this.app.stage.on('pointerup', () => { if (this.dragging && !this.dragMoved && this.hovered) { this.selected = this.selected === this.hovered ? null : this.hovered; this.renderOverlay(); this.onSelect?.(this.selected); } else if (!this.dragMoved) { this.selected = null; this.renderOverlay(); this.onSelect?.(null); } this.dragging = false; });
    this.app.stage.on('pointerupoutside', () => { this.dragging = false; });
    this.app.stage.on('wheel', (e: any) => { const oz = this.tgtZ; this.tgtZ = Math.max(0.15, Math.min(2.5, this.tgtZ + (e.deltaY > 0 ? -0.06 : 0.06))); const r = this.tgtZ / oz; this.tgtX = e.clientX - (e.clientX - this.tgtX) * r; this.tgtY = e.clientY - (e.clientY - this.tgtY) * r; });

    this.renderCity();
    this.renderOverlay();
    this.renderLabels();
    this.app.ticker.add(() => {
      this.camX += (this.tgtX - this.camX) * 0.12;
      this.camY += (this.tgtY - this.camY) * 0.12;
      this.camZ += (this.tgtZ - this.camZ) * 0.12;
      this.world.x = this.camX; this.world.y = this.camY; this.world.scale.set(this.camZ);
      this.overlayLayer.x = this.camX; this.overlayLayer.y = this.camY; this.overlayLayer.scale.set(this.camZ);
      this.labelLayer.x = this.camX; this.labelLayer.y = this.camY; this.labelLayer.scale.set(this.camZ);
    });
  }

  private renderCity() {
    const g = new Graphics();
    const tw = TILE_W, th = TILE_H;

    for (let r = 0; r < MAP_H; r++) {
      for (let c = 0; c < MAP_W; c++) {
        const cell = this.map[r][c];
        const x = isoX(c, r), y = isoY(c, r);
        const elev = cell.elevation * 4;

        // === TERRAIN ===
        let tColor: number;
        switch (cell.terrain) {
          case Terrain.OCEAN: {
            const wave = ((c * 3 + r * 7) % 30);
            tColor = 0x1A4A70 + (wave << 8); break;
          }
          case Terrain.BEACH: tColor = 0xD4C090 + (((c+r) % 3) * 0x040404); break;
          case Terrain.HILL: tColor = 0x4A7A3A + (((c*7+r*3) % 20) * 0x010100); break;
          case Terrain.MOUNTAIN: tColor = 0x6A7A5A + (((c+r) % 15) * 0x010101); break;
          case Terrain.ROAD: tColor = 0x484848; break;
          case Terrain.ROAD_MAJOR: tColor = 0x3C3C3C; break;
          case Terrain.FREEWAY: tColor = 0x505050; break;
          default: tColor = 0x3D8B37 + (((c*11+r*17) % 25) * 0x010100);
        }

        // Elevated side faces
        if (elev > 0 && cell.terrain !== Terrain.OCEAN) {
          g.fill({ color: darken(tColor, 0.6) });
          g.moveTo(x - tw/2, y + th/2 - elev); g.lineTo(x, y + th - elev);
          g.lineTo(x, y + th); g.lineTo(x - tw/2, y + th/2);
          g.closePath(); g.fill();
          g.fill({ color: darken(tColor, 0.75) });
          g.moveTo(x, y + th - elev); g.lineTo(x + tw/2, y + th/2 - elev);
          g.lineTo(x + tw/2, y + th/2); g.lineTo(x, y + th);
          g.closePath(); g.fill();
        }

        // Top face
        g.fill({ color: tColor });
        g.moveTo(x, y - elev); g.lineTo(x + tw/2, y + th/2 - elev);
        g.lineTo(x, y + th - elev); g.lineTo(x - tw/2, y + th/2 - elev);
        g.closePath(); g.fill();

        // Road lane markings
        if (cell.terrain === Terrain.FREEWAY) {
          g.fill({ color: 0xFFFF00, alpha: 0.2 });
          g.circle(x, y + th/2 - elev, 1); g.fill();
        }

        // === TREES ===
        if (cell.hasTree) {
          const treeH = 3 + ((c*3+r*5) % 4);
          const treeC = 0x2A6A20 + (((c+r*3) % 20) * 0x010200);
          // Trunk
          g.fill({ color: 0x5A3A1A });
          g.rect(x - 0.5, y + th/2 - elev - treeH, 1, treeH);
          g.fill();
          // Canopy
          g.fill({ color: treeC });
          g.circle(x, y + th/2 - elev - treeH - 2, 2.5 + ((c+r)%2));
          g.fill();
        }

        // === BUILDINGS ===
        if (cell.buildingH > 0) {
          const bh = cell.buildingH;
          const bw = tw * 0.3;
          const bd = th * 0.3;
          const by = y + th/2 - elev;
          const wallR = darken(cell.buildingColor, 0.7);
          const wallL = darken(cell.buildingColor, 0.85);
          const roof = cell.buildingColor;

          // Right wall (darker)
          g.fill({ color: wallR });
          g.moveTo(x, by); g.lineTo(x + bw, by + bd);
          g.lineTo(x + bw, by + bd - bh); g.lineTo(x, by - bh);
          g.closePath(); g.fill();

          // Left wall
          g.fill({ color: wallL });
          g.moveTo(x, by); g.lineTo(x - bw, by + bd);
          g.lineTo(x - bw, by + bd - bh); g.lineTo(x, by - bh);
          g.closePath(); g.fill();

          // Roof
          g.fill({ color: lighten(roof, 20) });
          g.moveTo(x, by - bh); g.lineTo(x + bw, by + bd - bh);
          g.lineTo(x, by + 2*bd - bh); g.lineTo(x - bw, by + bd - bh);
          g.closePath(); g.fill();

          // Windows (for buildings > 8px tall)
          if (bh > 8) {
            const floors = Math.floor(bh / 4);
            const winColor = ((c*3+r*7) % 3 === 0) ? 0xFFE882 : 0x7090B0;
            for (let f = 0; f < floors; f++) {
              const wy = by - bh + f * 4 + 3;
              // Left wall windows
              g.fill({ color: winColor, alpha: 0.6 });
              g.rect(x - bw + 1.5, wy, 2, 1.5); g.fill();
              g.rect(x - bw + 5, wy, 2, 1.5); g.fill();
              // Right wall windows
              g.rect(x + 1.5, wy, 2, 1.5); g.fill();
              g.rect(x + 5, wy, 2, 1.5); g.fill();
            }
          }
        }
      }
    }
    this.world.addChild(g);
  }

  private renderOverlay() {
    this.overlayLayer.removeChildren();
    if (!this.showDist) return;
    for (let did = 1; did <= 15; did++) {
      const isSel = this.selected === did, isHov = this.hovered === did;
      if (!isSel && !isHov) continue;
      const g = new Graphics();
      g.fill({ color: DIST_COL[did] ?? 0x808080, alpha: isSel ? 0.3 : 0.18 });
      for (let r = 0; r < MAP_H; r++) for (let c = 0; c < MAP_W; c++) {
        if (this.map[r][c].district !== did) continue;
        const x = isoX(c,r), y = isoY(c,r);
        g.moveTo(x, y); g.lineTo(x+TILE_W/2, y+TILE_H/2); g.lineTo(x, y+TILE_H); g.lineTo(x-TILE_W/2, y+TILE_H/2); g.closePath();
      }
      g.fill();
      this.overlayLayer.addChild(g);
    }
  }

  private renderLabels() {
    const hoodStyle = new TextStyle({ fontFamily: 'Segoe UI, sans-serif', fontSize: 8, fill: 0xFFFFFF, stroke: { color: 0x000000, width: 2.5 } });
    for (const h of HOODS) {
      if (!h.label) continue;
      const t = new Text({ text: h.name, style: hoodStyle });
      t.anchor.set(0.5); t.x = isoX(h.col, h.row); t.y = isoY(h.col, h.row) - 8; t.alpha = 0.8;
      this.labelLayer.addChild(t);
    }
    const lmStyle = new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 9, fontWeight: 'bold', fill: 0xFFD700, stroke: { color: 0x000000, width: 3 } });
    for (const lm of LANDMARKS) {
      const t = new Text({ text: lm.name, style: lmStyle });
      t.anchor.set(0.5); t.x = isoX(lm.col, lm.row); t.y = isoY(lm.col, lm.row) - 20;
      this.labelLayer.addChild(t);
    }
    const fwStyle = new TextStyle({ fontFamily: 'Consolas, monospace', fontSize: 7, fontWeight: 'bold', fill: 0xFFFFFF, stroke: { color: 0x505050, width: 2 } });
    for (const fw of FREEWAYS) {
      const mid = fw.pts[Math.floor(fw.pts.length/2)];
      const t = new Text({ text: fw.name, style: fwStyle });
      t.anchor.set(0.5); t.x = isoX(mid[0], mid[1]); t.y = isoY(mid[0], mid[1]) - 6; t.alpha = 0.7;
      this.labelLayer.addChild(t);
    }
  }

  setDistrictSelectCallback(cb: DistrictSelectCallback) { this.onSelect = cb; }
  selectDistrict(id: number | null) { this.selected = id; this.renderOverlay(); if (id) { const h = HOODS.find(h => h.district === id); if (h) { this.tgtX = this.w/2 - isoX(h.col,h.row)*this.camZ; this.tgtY = this.h/2 - isoY(h.col,h.row)*this.camZ; } } }
  toggleDistricts(show: boolean) { this.showDist = show; this.renderOverlay(); }
  zoomIn() { this.tgtZ = Math.min(2.5, this.tgtZ + 0.15); }
  zoomOut() { this.tgtZ = Math.max(0.15, this.tgtZ - 0.15); }
  resetView() { const dx = isoX(90,58), dy = isoY(90,58); this.tgtX = this.w/2 - dx*0.45; this.tgtY = this.h/2 - dy*0.45; this.tgtZ = 0.45; }
  destroy() { this.app.destroy(true); }
}
