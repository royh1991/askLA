'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Toon gradient: 4 discrete shading steps
function createGradientMap(): THREE.DataTexture {
  const colors = new Uint8Array([40, 120, 190, 255]);
  const tex = new THREE.DataTexture(colors, colors.length, 1, THREE.RedFormat);
  tex.needsUpdate = true;
  return tex;
}

// Procedural window texture (mrdoob technique)
function createWindowTexture(type: 'warm' | 'cool' | 'glass'): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 32; c.height = 64;
  const ctx = c.getContext('2d')!;

  // Wall color
  ctx.fillStyle = type === 'glass' ? '#7090A8' : type === 'cool' ? '#A0B0C0' : '#C4B090';
  ctx.fillRect(0, 0, 32, 64);

  for (let y = 2; y < 64; y += 4) {
    for (let x = 2; x < 32; x += 4) {
      const lit = Math.random() > 0.35;
      if (lit) {
        const b = 180 + Math.floor(Math.random() * 75);
        ctx.fillStyle = type === 'glass' ? `rgb(${b},${b},${b + 20})` : `rgb(${b},${b - 20},${b - 60})`;
      } else {
        const d = 25 + Math.floor(Math.random() * 30);
        ctx.fillStyle = `rgb(${d},${d + 5},${d + 15})`;
      }
      ctx.fillRect(x, y, 2, 2);
    }
  }

  const up = document.createElement('canvas');
  up.width = 256; up.height = 512;
  const ctx2 = up.getContext('2d')!;
  ctx2.imageSmoothingEnabled = false;
  ctx2.drawImage(c, 0, 0, 256, 512);

  const tex = new THREE.CanvasTexture(up);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = tex.minFilter = THREE.NearestFilter;
  return tex;
}

// Building height tiers with SimCity colors
interface Tier {
  name: string;
  minH: number; maxH: number;
  color: string;
  texture: 'warm' | 'cool' | 'glass' | null;
  landmarkColor: string;
}

const TIERS: Tier[] = [
  { name: 'houses', minH: 0, maxH: 8, color: '#81C784', texture: null, landmarkColor: '#FFD700' },
  { name: 'lowrise', minH: 8, maxH: 20, color: '#C4B998', texture: 'warm', landmarkColor: '#FFD700' },
  { name: 'midrise', minH: 20, maxH: 50, color: '#64B5F6', texture: 'cool', landmarkColor: '#FF8A65' },
  { name: 'highrise', minH: 50, maxH: 100, color: '#FFB74D', texture: 'glass', landmarkColor: '#FF7043' },
  { name: 'skyscraper', minH: 100, maxH: Infinity, color: '#AB47BC', texture: 'glass', landmarkColor: '#E040FB' },
];

interface BuildingData {
  polygon: [number, number][];
  height: number;
  name?: string;
  isLandmark: boolean;
  type: string;
}

interface Props {
  buildings: BuildingData[];
}

export default function BuildingRenderer({ buildings }: Props) {
  const gradientMap = useMemo(() => createGradientMap(), []);
  const textures = useMemo(() => ({
    warm: createWindowTexture('warm'),
    cool: createWindowTexture('cool'),
    glass: createWindowTexture('glass'),
  }), []);

  // Merge all buildings per tier for performance (one draw call per tier)
  const tierMeshes = useMemo(() => {
    const result: { merged: THREE.BufferGeometry; edges: THREE.BufferGeometry; tier: Tier; isLandmark: boolean }[] = [];

    for (const tier of TIERS) {
      // Separate landmarks from generic buildings
      for (const isLm of [false, true]) {
        const tierBuildings = buildings.filter(b => {
          const inTier = b.height >= tier.minH && b.height < tier.maxH;
          return inTier && b.isLandmark === isLm;
        });
        if (tierBuildings.length === 0) continue;

        const geos: THREE.BufferGeometry[] = [];
        for (const bld of tierBuildings) {
          if (bld.polygon.length < 3) continue;
          try {
            const shape = new THREE.Shape();
            shape.moveTo(bld.polygon[0][0], bld.polygon[0][1]);
            for (let i = 1; i < bld.polygon.length; i++) {
              shape.lineTo(bld.polygon[i][0], bld.polygon[i][1]);
            }

            const h = bld.height * 1.8; // SimCity exaggeration
            const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false });
            geo.rotateX(-Math.PI / 2); // extrusion goes UP
            geos.push(geo);
          } catch {
            // Skip invalid polygons
          }
        }
        if (geos.length === 0) continue;

        try {
          const merged = mergeGeometries(geos, false);
          if (!merged) continue;
          const edges = new THREE.EdgesGeometry(merged, 20);
          result.push({ merged, edges, tier, isLandmark: isLm });
        } catch {
          // mergeGeometries can fail on incompatible geos
        }

        // Dispose individual geos
        for (const g of geos) g.dispose();
      }
    }

    return result;
  }, [buildings]);

  if (tierMeshes.length === 0) return null;

  return (
    <group>
      {/* Lighting for toon shading */}
      <directionalLight position={[200, 400, 300]} intensity={1.5} color="#FFFFFF" />
      <ambientLight intensity={0.4} color="#B0C4DE" />
      <hemisphereLight args={['#87CEEB', '#3D5C3D', 0.3]} />

      {/* One merged mesh per tier — massive perf improvement */}
      {tierMeshes.map(({ merged, edges, tier, isLandmark }, i) => (
        <group key={i}>
          <mesh geometry={merged}>
            <meshToonMaterial
              color={isLandmark ? tier.landmarkColor : tier.color}
              gradientMap={gradientMap}
              map={tier.texture ? textures[tier.texture] : undefined}
            />
          </mesh>
          <lineSegments geometry={edges}>
            <lineBasicMaterial color="#1A1A1A" transparent opacity={isLandmark ? 0.6 : 0.3} />
          </lineSegments>
        </group>
      ))}
    </group>
  );
}
