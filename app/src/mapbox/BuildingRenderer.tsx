'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// SimCity color palette by building height
function getSimCityColor(height: number, isLandmark: boolean): THREE.Color {
  if (isLandmark) return new THREE.Color('#FFD700'); // Gold for landmarks
  if (height > 100) return new THREE.Color('#AB47BC'); // Purple skyscrapers
  if (height > 50) return new THREE.Color('#FFB74D');  // Amber high-rise
  if (height > 25) return new THREE.Color('#64B5F6');  // Blue mid-rise
  if (height > 12) return new THREE.Color('#C4B998');  // Tan low-rise
  return new THREE.Color('#81C784');                    // Green houses
}

// Procedural window texture (mrdoob technique)
function createWindowTexture(buildingType: 'residential' | 'commercial' | 'skyscraper'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  // Wall base color
  const wallColors: Record<string, string> = {
    residential: '#C4B090',
    commercial: '#A0B0C8',
    skyscraper: '#8090A8',
  };
  ctx.fillStyle = wallColors[buildingType] || '#B8A888';
  ctx.fillRect(0, 0, 32, 64);

  // Windows: alternating floor rows
  for (let y = 2; y < 64; y += 4) {
    for (let x = 2; x < 32; x += 4) {
      // Random lit/unlit
      const lit = Math.random() > 0.4;
      if (lit) {
        const brightness = 180 + Math.floor(Math.random() * 75);
        ctx.fillStyle = buildingType === 'skyscraper'
          ? `rgb(${brightness},${brightness},${brightness + 20})`  // Bluish glass
          : `rgb(${brightness},${brightness - 20},${brightness - 60})`; // Warm yellow
      } else {
        const dark = 30 + Math.floor(Math.random() * 30);
        ctx.fillStyle = `rgb(${dark},${dark + 5},${dark + 15})`;
      }
      ctx.fillRect(x, y, 2, 2);
    }
  }

  // Upscale with pixel art look
  const upscaled = document.createElement('canvas');
  upscaled.width = 256;
  upscaled.height = 512;
  const ctx2 = upscaled.getContext('2d')!;
  ctx2.imageSmoothingEnabled = false;
  ctx2.drawImage(canvas, 0, 0, 256, 512);

  const texture = new THREE.CanvasTexture(upscaled);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

// Create toon gradient map (4 discrete shading steps)
function createGradientMap(): THREE.DataTexture {
  const colors = new Uint8Array([40, 120, 190, 255]);
  const tex = new THREE.DataTexture(colors, colors.length, 1, THREE.RedFormat);
  tex.needsUpdate = true;
  return tex;
}

interface BuildingData {
  polygon: [number, number][]; // [x, y] in meters relative to center
  height: number;
  name?: string;
  isLandmark: boolean;
  type: string;
}

interface BuildingRendererProps {
  buildings: BuildingData[];
}

export default function BuildingRenderer({ buildings }: BuildingRendererProps) {
  const gradientMap = useMemo(() => createGradientMap(), []);
  const windowTextures = useMemo(() => ({
    residential: createWindowTexture('residential'),
    commercial: createWindowTexture('commercial'),
    skyscraper: createWindowTexture('skyscraper'),
  }), []);

  // Group buildings by type for instancing
  const meshData = useMemo(() => {
    const geometries: THREE.BufferGeometry[] = [];
    const edgeGeometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];

    for (const bld of buildings) {
      if (bld.polygon.length < 3) continue;

      // Create Shape from polygon
      const shape = new THREE.Shape();
      shape.moveTo(bld.polygon[0][0], bld.polygon[0][1]);
      for (let i = 1; i < bld.polygon.length; i++) {
        shape.lineTo(bld.polygon[i][0], bld.polygon[i][1]);
      }

      // SimCity height exaggeration
      const exaggeratedHeight = bld.height * 1.8;

      // Extrude
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: exaggeratedHeight,
        bevelEnabled: false,
      });
      // Rotate so extrusion goes UP (Y axis)
      geo.rotateX(-Math.PI / 2);

      geometries.push(geo);

      // Edge geometry for black outlines
      const edges = new THREE.EdgesGeometry(geo, 15);
      edgeGeometries.push(edges);

      // Material: toon shaded with window texture for tall buildings
      const color = getSimCityColor(bld.height, bld.isLandmark);
      const textureType = bld.height > 50 ? 'skyscraper' : bld.height > 15 ? 'commercial' : 'residential';

      if (bld.height > 10) {
        materials.push(new THREE.MeshToonMaterial({
          color,
          gradientMap,
          map: windowTextures[textureType],
        }));
      } else {
        materials.push(new THREE.MeshToonMaterial({
          color,
          gradientMap,
        }));
      }
    }

    return { geometries, edgeGeometries, materials };
  }, [buildings, gradientMap, windowTextures]);

  if (meshData.geometries.length === 0) return null;

  return (
    <group>
      {/* Directional light for toon shading */}
      <directionalLight position={[100, 200, 150]} intensity={1.2} color="#ffffff" />
      <ambientLight intensity={0.5} color="#B0C0D0" />

      {/* Buildings */}
      {meshData.geometries.map((geo, i) => (
        <group key={i}>
          <mesh geometry={geo} material={meshData.materials[i]} />
          {/* Black outlines */}
          <lineSegments geometry={meshData.edgeGeometries[i]}>
            <lineBasicMaterial color="#000000" linewidth={1} transparent opacity={0.4} />
          </lineSegments>
        </group>
      ))}
    </group>
  );
}
