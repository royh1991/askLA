'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Map, NavigationControl, useControl } from 'react-map-gl/maplibre';
import { MapboxOverlay } from '@deck.gl/mapbox';
import type { MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

import { MAP_STYLE } from './mapStyle';
import { createDistrictLayer } from './layers';
import { DISTRICTS, type DistrictInfo } from './districtData';
import districtsGeoJson from '../data/la-districts.json';
import { processGeoJsonBuildings, type ProcessedBuilding } from './buildingData';

// Lazy import react-three-map and BuildingRenderer (they need window/document)
let Canvas: any = null;
let BuildingRenderer: any = null;

function DeckGLOverlay(props: any) {
  const overlay = useControl(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

interface SimCityMapProps {
  selectedDistrictId: number | null;
  onDistrictSelect: (district: DistrictInfo | null) => void;
}

// Downtown LA center for coordinate conversion
const CENTER_LAT = 34.0522;
const CENTER_LNG = -118.2437;

export default function SimCityMap({ selectedDistrictId, onDistrictSelect }: SimCityMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [hoveredDistrictId, setHoveredDistrictId] = useState<number | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [buildings, setBuildings] = useState<ProcessedBuilding[]>([]);
  const [threeReady, setThreeReady] = useState(false);

  // Load Three.js components dynamically (SSR-safe)
  useEffect(() => {
    Promise.all([
      import('react-three-map/maplibre').then(m => { Canvas = m.Canvas; }),
      import('./BuildingRenderer').then(m => { BuildingRenderer = m.default; }),
    ]).then(() => setThreeReady(true)).catch(e => console.warn('Three.js load failed:', e));
  }, []);

  // Load building data
  useEffect(() => {
    Promise.all([
      fetch('/data/dtla_buildings.geojson').then(r => r.json()).catch(() => ({ features: [] })),
      fetch('/data/lax_buildings.geojson').then(r => r.json()).catch(() => ({ features: [] })),
      fetch('/data/dodger_stadium.geojson').then(r => r.json()).catch(() => ({ features: [] })),
    ]).then(([dtla, lax, dodger]) => {
      const merged = {
        type: 'FeatureCollection',
        features: [
          ...(dtla.features || []),
          ...(lax.features || []),
          ...(dodger.features || []),
        ],
      };
      const processed = processGeoJsonBuildings(merged, CENTER_LAT, CENTER_LNG);
      setBuildings(processed);
      console.log(`Loaded ${processed.length} buildings, ${processed.filter(b => b.isLandmark).length} landmarks`);
    });
  }, []);

  // Fly to selected district
  useEffect(() => {
    if (!mapRef.current || !selectedDistrictId) return;
    const dist = DISTRICTS.find(d => d.id === selectedDistrictId);
    if (dist) {
      mapRef.current.flyTo({
        center: dist.center,
        zoom: 14,
        pitch: 55,
        bearing: -17,
        duration: 1500,
      });
    }
  }, [selectedDistrictId]);

  const handleDistrictClick = useCallback((districtId: number) => {
    const dist = DISTRICTS.find(d => d.id === districtId);
    onDistrictSelect(dist || null);
  }, [onDistrictSelect]);

  const handleDistrictHover = useCallback((districtId: number | null) => {
    setHoveredDistrictId(districtId);
  }, []);

  // deck.gl layers (districts only — buildings handled by Three.js)
  const layers = useMemo(() => [
    createDistrictLayer(
      districtsGeoJson,
      selectedDistrictId,
      hoveredDistrictId,
      handleDistrictClick,
      handleDistrictHover,
    ),
  ], [selectedDistrictId, hoveredDistrictId, handleDistrictClick, handleDistrictHover]);

  // Disable MapLibre native fill-extrusion since Three.js handles buildings
  const handleMapLoad = useCallback(() => {
    setMapLoaded(true);
    // Do NOT add the fill-extrusion layer — Three.js renders all buildings
  }, []);

  return (
    <Map
      ref={mapRef}
      initialViewState={{
        longitude: CENTER_LNG,
        latitude: CENTER_LAT,
        zoom: 14,
        pitch: 55,
        bearing: -17,
      }}
      maxPitch={65}
      minPitch={20}
      maxZoom={18}
      minZoom={9}
      mapStyle={MAP_STYLE}
      onLoad={handleMapLoad}
      style={{ width: '100%', height: '100%' }}
      cursor={hoveredDistrictId ? 'pointer' : 'grab'}
      attributionControl={false}
    >
      <DeckGLOverlay layers={layers} />
      <NavigationControl position="top-left" showCompass={false} />

      {/* Three.js SimCity buildings rendered via react-three-map */}
      {threeReady && Canvas && BuildingRenderer && buildings.length > 0 && (
        <Canvas latitude={CENTER_LAT} longitude={CENTER_LNG} altitude={0}>
          <BuildingRenderer buildings={buildings} />
        </Canvas>
      )}
    </Map>
  );
}
