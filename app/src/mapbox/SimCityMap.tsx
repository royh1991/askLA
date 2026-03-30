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

function DeckGLOverlay(props: any) {
  const overlay = useControl(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

interface SimCityMapProps {
  selectedDistrictId: number | null;
  onDistrictSelect: (district: DistrictInfo | null) => void;
}

// Downtown LA center
const CENTER_LAT = 34.0522;
const CENTER_LNG = -118.2437;

// Lazy-loaded Three.js components
let ThreeCanvas: any = null;
let SimCityBuildings: any = null;

export default function SimCityMap({ selectedDistrictId, onDistrictSelect }: SimCityMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [hoveredDistrictId, setHoveredDistrictId] = useState<number | null>(null);
  const [threeReady, setThreeReady] = useState(false);

  // Load Three.js dynamically
  useEffect(() => {
    Promise.all([
      import('react-three-map/maplibre').then(m => { ThreeCanvas = m.Canvas; }),
      import('./SimCityBuildings').then(m => { SimCityBuildings = m.default; }),
    ]).then(() => setThreeReady(true)).catch(e => console.warn('Three.js:', e));
  }, []);

  useEffect(() => {
    if (!mapRef.current || !selectedDistrictId) return;
    const dist = DISTRICTS.find(d => d.id === selectedDistrictId);
    if (dist) {
      mapRef.current.flyTo({ center: dist.center, zoom: 15, pitch: 55, bearing: -17, duration: 1500 });
    }
  }, [selectedDistrictId]);

  const handleDistrictClick = useCallback((districtId: number) => {
    onDistrictSelect(DISTRICTS.find(d => d.id === districtId) || null);
  }, [onDistrictSelect]);

  const handleDistrictHover = useCallback((districtId: number | null) => {
    setHoveredDistrictId(districtId);
  }, []);

  const layers = useMemo(() => [
    createDistrictLayer(districtsGeoJson, selectedDistrictId, hoveredDistrictId, handleDistrictClick, handleDistrictHover),
  ], [selectedDistrictId, hoveredDistrictId, handleDistrictClick, handleDistrictHover]);

  const handleMapLoad = useCallback(() => {
    // No fill-extrusion — Three.js handles all buildings
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <style>{`
        .simcity-map {
          filter: saturate(1.4) contrast(1.15);
        }
      `}</style>

      <div className="simcity-map" style={{ width: '100%', height: '100%' }}>
        <Map
          ref={mapRef}
          initialViewState={{
            longitude: CENTER_LNG,
            latitude: CENTER_LAT,
            zoom: 15,
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

          {threeReady && ThreeCanvas && SimCityBuildings && (
            <ThreeCanvas latitude={CENTER_LAT} longitude={CENTER_LNG} altitude={0}>
              <SimCityBuildings />
            </ThreeCanvas>
          )}
        </Map>
      </div>
    </div>
  );
}
