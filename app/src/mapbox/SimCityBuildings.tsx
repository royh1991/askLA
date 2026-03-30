'use client';

import { useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { coordsToVector3 } from 'react-three-map/maplibre';

// Canvas origin — must match what's passed to <Canvas latitude={} longitude={}>
const ORIGIN = { latitude: 34.0522, longitude: -118.2437, altitude: 0 };

// Convert a lat/lng to Three.js [x, y, z] relative to the canvas origin
function geoToLocal(lat: number, lng: number, alt: number = 0): [number, number, number] {
  const [x, y, z] = coordsToVector3(
    { latitude: lat, longitude: lng, altitude: alt },
    ORIGIN,
  );
  return [x, y, z];
}

// Warm SimCity 3000 color palette — brick, tan, cream, brown
const WARM_COLORS = [
  '#8B4513', '#A0522D', '#CD853F', '#DEB887', '#D2B48C',
  '#BC8F8F', '#C4A882', '#B8860B', '#DAA520', '#D2691E',
  '#A67B5B', '#C19A6B', '#E8D4B8', '#967969', '#CC7722',
  '#B5651D', '#9B7653', '#C8AD7F', '#A58D6D', '#D4A76A',
];

// Procedural window texture — warm tones
function createWindowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 32; c.height = 64;
  const ctx = c.getContext('2d')!;

  // Warm wall color
  ctx.fillStyle = '#C4B090';
  ctx.fillRect(0, 0, 32, 64);

  // Window grid
  for (let y = 2; y < 64; y += 3) {
    for (let x = 1; x < 32; x += 3) {
      const lit = Math.random() > 0.3;
      if (lit) {
        const b = 200 + Math.floor(Math.random() * 55);
        ctx.fillStyle = `rgb(${b - 20},${b - 30},${b - 60})`;
      } else {
        const d = 40 + Math.floor(Math.random() * 30);
        ctx.fillStyle = `rgb(${d},${d + 5},${d + 10})`;
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

// Toon gradient
function createGradientMap(): THREE.DataTexture {
  const colors = new Uint8Array([60, 140, 200, 255]);
  const tex = new THREE.DataTexture(colors, 4, 1, THREE.RedFormat);
  tex.needsUpdate = true;
  return tex;
}

interface BuildingFeature {
  coords: number[][];  // [lng, lat] ring
  height: number;
  name?: string;
}

export default function SimCityBuildings() {
  const [buildings, setBuildings] = useState<BuildingFeature[]>([]);
  const gradientMap = useMemo(() => createGradientMap(), []);
  const windowTex = useMemo(() => createWindowTexture(), []);

  // Load building data from all areas
  useEffect(() => {
    Promise.all([
      fetch('/data/dtla_buildings.geojson').then(r => r.json()).catch(() => ({ features: [] })),
      fetch('/data/lax_buildings.geojson').then(r => r.json()).catch(() => ({ features: [] })),
      fetch('/data/dodger_stadium.geojson').then(r => r.json()).catch(() => ({ features: [] })),
      fetch('/data/hollywood_ktown_usc_buildings.geojson').then(r => r.json()).catch(() => ({ features: [] })),
    ]).then(([dtla, lax, dodger, hku]) => {
      const data = {
        features: [...(dtla.features||[]), ...(lax.features||[]), ...(dodger.features||[]), ...(hku.features||[])],
      };
        const blds: BuildingFeature[] = [];
        for (const f of data.features || []) {
          if (f.geometry?.type !== 'Polygon') continue;
          const coords = f.geometry.coordinates[0];
          if (!coords || coords.length < 3) continue;
          const height = parseFloat(f.properties?.height) ||
            (parseFloat(f.properties?.['building:levels']) || 3) * 3.5;
          blds.push({ coords, height, name: f.properties?.name });
        }
        setBuildings(blds);
        console.log(`Loaded ${blds.length} buildings, rendering all`);
      }).catch(e => console.warn('Building load error:', e));
  }, []);

  // Group buildings by height tier and merge geometries for performance
  const tiers = useMemo(() => {
    if (buildings.length === 0) return [];

    const tierDefs = [
      { name: 'houses', min: 0, max: 10, color: '#A67B5B' },
      { name: 'lowrise', min: 10, max: 25, color: '#C4A882' },
      { name: 'midrise', min: 25, max: 50, color: '#CD853F' },
      { name: 'highrise', min: 50, max: 100, color: '#B8860B' },
      { name: 'skyscraper', min: 100, max: Infinity, color: '#8B4513' },
    ];

    const result: { geo: THREE.BufferGeometry; edges: THREE.BufferGeometry; color: string; hasWindows: boolean }[] = [];

    for (const tier of tierDefs) {
      const tierBlds = buildings.filter(b => b.height >= tier.min && b.height < tier.max);
      if (tierBlds.length === 0) continue;

      const geos: THREE.BufferGeometry[] = [];
      for (const bld of tierBlds) {
        try {
          const localCoords = bld.coords.map(([lng, lat]) => {
            const [x, _y, z] = geoToLocal(lat, lng);
            return new THREE.Vector2(x, z);
          });
          if (localCoords.length < 3) continue;

          const shape = new THREE.Shape(localCoords);
          const h = bld.height * 3.0;
          const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false });
          geo.rotateX(-Math.PI / 2);
          geos.push(geo);
        } catch { /* skip invalid */ }
      }

      if (geos.length === 0) continue;

      try {
        const merged = mergeGeometries(geos, false);
        if (merged) {
          const edges = new THREE.EdgesGeometry(merged, 25);
          result.push({ geo: merged, edges, color: tier.color, hasWindows: tier.min >= 10 });
        }
      } catch (e) {
        // Fallback: just use the first geo
        if (geos[0]) {
          result.push({ geo: geos[0], edges: new THREE.EdgesGeometry(geos[0], 25), color: tier.color, hasWindows: tier.min >= 10 });
        }
      }

      // Dispose individual geos
      for (const g of geos) g.dispose();
    }

    return result;
  }, [buildings]);

  if (tiers.length === 0) return null;

  return (
    <group>
      {/* Warm directional lighting like SimCity 3000 */}
      <directionalLight position={[300, 500, 200]} intensity={1.8} color="#FFF5E0" />
      <ambientLight intensity={0.5} color="#C8B8A8" />
      <hemisphereLight args={['#87CEEB', '#4A7A3A', 0.3]} />

      {/* Merged tier meshes — one draw call per tier */}
      {tiers.map((tier, i) => (
        <group key={i}>
          <mesh geometry={tier.geo}>
            <meshToonMaterial
              color={tier.color}
              gradientMap={gradientMap}
              map={tier.hasWindows ? windowTex : undefined}
            />
          </mesh>
          <lineSegments geometry={tier.edges}>
            <lineBasicMaterial color="#1A1A1A" transparent opacity={0.4} />
          </lineSegments>
        </group>
      ))}
    </group>
  );
}
