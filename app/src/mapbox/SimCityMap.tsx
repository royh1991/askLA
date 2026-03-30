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
    const map = mapRef.current?.getMap();
    if (!map) return;


    // City-wide SimCity buildings via MapLibre fill-extrusion
    // This covers ALL of LA — not just the Overpass-fetched clusters
    const sources = map.getStyle()?.sources;
    const hasBuildings = Object.values(sources || {}).some((s: any) =>
      s.type === 'vector' && (s.url?.includes('openmaptiles') || s.url?.includes('openfreemap'))
    );

    if (hasBuildings) {
      // Find label layer to insert below
      let labelLayerId: string | undefined;
      for (const layer of map.getStyle()?.layers || []) {
        if (layer.type === 'symbol') { labelLayerId = layer.id; break; }
      }

      // SimCity varied color palette — pseudo-random per building using $id
      // This creates the colorful variety seen in SimCity: blue glass, cream,
      // brick red, teal, yellow buildings mixed together on every block
      map.addLayer({
        id: 'buildings-3d',
        source: 'openmaptiles',
        'source-layer': 'building',
        type: 'fill-extrusion',
        minzoom: 1,
        paint: {
          'fill-extrusion-color': [
            'match',
            ['%', ['to-number', ['id'], 0], 12],
            0, '#6B8EAD',   // steel blue glass
            1, '#E8D8C0',   // cream/ivory
            2, '#B05A3C',   // brick red
            3, '#7AACB0',   // teal
            4, '#D4C090',   // warm sand
            5, '#8898A8',   // cool gray
            6, '#C8A060',   // golden tan
            7, '#9EB89E',   // sage green
            8, '#B89070',   // sienna
            9, '#6890B0',   // slate blue
            10, '#D0B880',  // wheat
            11, '#A87858',  // copper brown
            '#C4B998'       // default warm tan
          ],
          'fill-extrusion-height': [
            '*', ['coalesce', ['get', 'render_height'], 8], 2.5
          ],
          'fill-extrusion-base': [
            '*', ['coalesce', ['get', 'render_min_height'], 0], 2.5
          ],
          'fill-extrusion-opacity': 0.92,
          'fill-extrusion-vertical-gradient': false,
        },
      }, labelLayerId);

      // Add a second darker layer for just the rooftops to create
      // that SimCity look where roofs are slightly different shade
      map.addLayer({
        id: 'buildings-roof-tint',
        source: 'openmaptiles',
        'source-layer': 'building',
        type: 'fill-extrusion',
        minzoom: 14,
        paint: {
          'fill-extrusion-color': '#000000',
          'fill-extrusion-height': [
            '+',
            ['*', ['coalesce', ['get', 'render_height'], 8], 2.5],
            0.5 // tiny layer on top
          ],
          'fill-extrusion-base': [
            '*', ['coalesce', ['get', 'render_height'], 8], 2.5
          ],
          'fill-extrusion-opacity': 0.15, // subtle dark tint on roofs
          'fill-extrusion-vertical-gradient': false,
        },
      }, labelLayerId);
    }
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <style>{`
        .simcity-map {
          filter: saturate(1.6) contrast(1.2) brightness(1.05);
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

          {/* Three.js buildings disabled — fill-extrusion covers all of LA
              Re-enable for enhanced detail on landmarks later
          {threeReady && ThreeCanvas && SimCityBuildings && (
            <ThreeCanvas latitude={CENTER_LAT} longitude={CENTER_LNG} altitude={0}>
              <SimCityBuildings />
            </ThreeCanvas>
          )}
          */}
        </Map>
      </div>
    </div>
  );
}
