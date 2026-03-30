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

// Restrict map to LA metro area — prevents loading tiles for the entire world
const LA_BOUNDS: [[number, number], [number, number]] = [
  [-118.8, 33.6],  // SW corner (past Malibu)
  [-117.9, 34.4],  // NE corner (past Pasadena)
];

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


    // ═══════════════════════════════════════════════════════════
    // ICONIC LA LANDMARKS — procedurally generated 3D shapes
    // ═══════════════════════════════════════════════════════════
    const landmarkFeatures: any[] = [];

    // Helper: create a rectangle polygon at lat/lng with dimensions in meters
    function rectAt(lng: number, lat: number, widthM: number, heightM: number): number[][] {
      const dLng = widthM / (111320 * Math.cos(lat * Math.PI / 180));
      const dLat = heightM / 111320;
      return [
        [lng - dLng/2, lat - dLat/2],
        [lng + dLng/2, lat - dLat/2],
        [lng + dLng/2, lat + dLat/2],
        [lng - dLng/2, lat + dLat/2],
        [lng - dLng/2, lat - dLat/2],
      ];
    }

    // Helper: create a circle polygon (for domes, towers)
    function circleAt(lng: number, lat: number, radiusM: number, sides = 16): number[][] {
      const coords: number[][] = [];
      for (let i = 0; i <= sides; i++) {
        const angle = (i / sides) * Math.PI * 2;
        const dLng = (radiusM * Math.cos(angle)) / (111320 * Math.cos(lat * Math.PI / 180));
        const dLat = (radiusM * Math.sin(angle)) / 111320;
        coords.push([lng + dLng, lat + dLat]);
      }
      return coords;
    }

    // ── HOLLYWOOD SIGN ──
    // 9 letters on the south slope of Mount Lee, ~14m tall each
    const signBaseLng = -118.3267;
    const signBaseLat = 34.1341;
    const letterW = 0.000085;  // ~9m in longitude
    const letterGap = 0.000015; // ~1.5m gap
    const letterStep = letterW + letterGap;
    'HOLLYWOOD'.split('').forEach((letter, i) => {
      const lng = signBaseLng + i * letterStep;
      landmarkFeatures.push({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [rectAt(lng, signBaseLat, 9, 2.5)] },
        properties: { height: 14, name: letter, type: 'hollywood-sign', color: '#FFFFFF' },
      });
    });

    // ── GRIFFITH OBSERVATORY ──
    // Iconic domed building on the south slope of Mount Hollywood
    // Main dome
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [circleAt(-118.3004, 34.1185, 15)] },
      properties: { height: 25, name: 'Griffith Observatory', type: 'landmark', color: '#F0E8D0' },
    });
    // Side domes
    [-1, 1].forEach(side => {
      landmarkFeatures.push({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [circleAt(-118.3004 + side * 0.0003, 34.1185, 8)] },
        properties: { height: 18, name: '', type: 'landmark', color: '#E0D8C0' },
      });
    });

    // ── CAPITOL RECORDS BUILDING ──
    // Cylindrical tower in Hollywood
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [circleAt(-118.3265, 34.1003, 12)] },
      properties: { height: 45, name: 'Capitol Records', type: 'landmark', color: '#E8E0D0' },
    });
    // Spire on top
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [circleAt(-118.3265, 34.1003, 3)] },
      properties: { height: 58, name: '', type: 'spire', color: '#C0C0C0' },
    });

    // ── LA CITY HALL ──
    // Iconic stepped tower in downtown
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [rectAt(-118.2428, 34.0537, 30, 20)] },
      properties: { height: 138, name: 'City Hall', type: 'landmark', color: '#F0E8D0' },
    });
    // Tower portion
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [rectAt(-118.2428, 34.0537, 15, 10)] },
      properties: { height: 150, name: '', type: 'spire', color: '#F8F0E0' },
    });

    // ── WALT DISNEY CONCERT HALL ──
    // Curvy metallic building
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [rectAt(-118.2500, 34.0553, 55, 40)] },
      properties: { height: 22, name: 'Disney Hall', type: 'landmark', color: '#D0D0D8' },
    });

    // ── DODGER STADIUM ──
    // Already in prominent buildings but add color accent
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [circleAt(-118.2400, 34.0739, 120)] },
      properties: { height: 8, name: 'Dodger Stadium', type: 'stadium', color: '#2060A8' },
    });

    // ── LAX THEME BUILDING ──
    // Space-age structure
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [circleAt(-118.4020, 33.9535, 20)] },
      properties: { height: 32, name: 'LAX Theme Building', type: 'landmark', color: '#F0F0F0' },
    });
    // Support legs
    [0, 120, 240].forEach(angle => {
      const rad = angle * Math.PI / 180;
      const dx = 0.00012 * Math.cos(rad);
      const dy = 0.00008 * Math.sin(rad);
      landmarkFeatures.push({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [circleAt(-118.4020 + dx, 33.9535 + dy, 4)] },
        properties: { height: 22, name: '', type: 'landmark', color: '#E0E0E0' },
      });
    });

    // ── THE BROAD ──
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [rectAt(-118.2503, 34.0544, 40, 25)] },
      properties: { height: 18, name: 'The Broad', type: 'landmark', color: '#F8F8F0' },
    });

    // ── WATTS TOWERS ──
    // Tall thin spires
    [0, 6, 12, -4, -9].forEach((offsetM, i) => {
      const heights = [30, 28, 25, 22, 18];
      landmarkFeatures.push({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [circleAt(-118.2413 + offsetM / 111320, 33.9389, 2)] },
        properties: { height: heights[i], name: i === 0 ? 'Watts Towers' : '', type: 'spire', color: '#C8A858' },
      });
    });

    // ── SOFI STADIUM ── (Inglewood)
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [circleAt(-118.3392, 33.9534, 160)] },
      properties: { height: 25, name: 'SoFi Stadium', type: 'stadium', color: '#3868A8' },
    });

    // ── CRYPTO.COM ARENA ── (downtown)
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [rectAt(-118.2673, 34.0430, 80, 65)] },
      properties: { height: 30, name: 'Crypto.com Arena', type: 'stadium', color: '#282838' },
    });

    // ── LA CONVENTION CENTER ──
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [rectAt(-118.2694, 34.0404, 120, 80)] },
      properties: { height: 18, name: 'Convention Center', type: 'landmark', color: '#A0A8B8' },
    });

    // ── UNION STATION ──
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [rectAt(-118.2365, 34.0561, 65, 35)] },
      properties: { height: 22, name: 'Union Station', type: 'landmark', color: '#E8D0A0' },
    });
    // Clock tower
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [rectAt(-118.2365, 34.0561, 8, 8)] },
      properties: { height: 38, name: '', type: 'spire', color: '#F0E0C0' },
    });

    // ── TCL CHINESE THEATRE ──
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [rectAt(-118.3418, 34.1022, 30, 25)] },
      properties: { height: 20, name: 'Chinese Theatre', type: 'landmark', color: '#C83020' },
    });
    // Pagoda top
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [rectAt(-118.3418, 34.1022, 15, 12)] },
      properties: { height: 28, name: '', type: 'spire', color: '#D04030' },
    });

    // ── HOLLYWOOD BOWL ──
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [circleAt(-118.3393, 34.1122, 60)] },
      properties: { height: 12, name: 'Hollywood Bowl', type: 'stadium', color: '#E0D8C0' },
    });
    // Band shell arc
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [circleAt(-118.3393, 34.1127, 25)] },
      properties: { height: 20, name: '', type: 'landmark', color: '#F0E8D8' },
    });

    // ── GETTY CENTER ── (Brentwood hills)
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [rectAt(-118.4745, 34.0780, 70, 50)] },
      properties: { height: 22, name: 'Getty Center', type: 'landmark', color: '#F0ECE0' },
    });

    // ── SANTA MONICA PIER ──
    // Ferris wheel
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [circleAt(-118.4983, 34.0087, 15)] },
      properties: { height: 40, name: 'Santa Monica Pier', type: 'landmark', color: '#E84040' },
    });
    // Pier structure
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [rectAt(-118.4975, 34.0090, 80, 15)] },
      properties: { height: 6, name: '', type: 'landmark', color: '#B89068' },
    });

    // ── USC ── Tommy Trojan area
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [rectAt(-118.2852, 34.0206, 45, 30)] },
      properties: { height: 25, name: 'USC', type: 'landmark', color: '#901020' },
    });

    // ── UCLA ── Royce Hall
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [rectAt(-118.4422, 34.0730, 50, 25)] },
      properties: { height: 22, name: 'UCLA', type: 'landmark', color: '#2868A0' },
    });

    // ── ROSE BOWL ── (Pasadena)
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [circleAt(-118.1678, 34.1613, 120)] },
      properties: { height: 18, name: 'Rose Bowl', type: 'stadium', color: '#488848' },
    });

    // ── LA MEMORIAL COLISEUM ──
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [circleAt(-118.2878, 34.0141, 100)] },
      properties: { height: 22, name: 'LA Coliseum', type: 'stadium', color: '#C8A848' },
    });
    // Peristyle tower
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [rectAt(-118.2878, 34.0120, 10, 10)] },
      properties: { height: 40, name: '', type: 'spire', color: '#E0D0A8' },
    });

    // ── THE FORUM ── (Inglewood)
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [circleAt(-118.3418, 33.9583, 80)] },
      properties: { height: 20, name: 'The Forum', type: 'stadium', color: '#D8C888' },
    });

    // ── BRADBURY BUILDING ── (downtown)
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [rectAt(-118.2476, 34.0505, 25, 20)] },
      properties: { height: 16, name: 'Bradbury Bldg', type: 'landmark', color: '#C88850' },
    });

    // ── ANGELS FLIGHT ── (downtown funicular)
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [rectAt(-118.2510, 34.0513, 5, 15)] },
      properties: { height: 10, name: 'Angels Flight', type: 'landmark', color: '#E85020' },
    });

    // ── CATHEDRAL OF OUR LADY ── (downtown)
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [rectAt(-118.2460, 34.0579, 40, 25)] },
      properties: { height: 28, name: 'Cathedral', type: 'landmark', color: '#E8D8B8' },
    });
    // Bell tower
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [rectAt(-118.2455, 34.0585, 6, 6)] },
      properties: { height: 46, name: '', type: 'spire', color: '#F0E8D0' },
    });

    // ── BEVERLY CENTER ──
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [rectAt(-118.3618, 34.0754, 70, 55)] },
      properties: { height: 25, name: 'Beverly Center', type: 'landmark', color: '#D0C8C0' },
    });

    // ── THE GROVE ──
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [rectAt(-118.3578, 34.0720, 55, 40)] },
      properties: { height: 15, name: 'The Grove', type: 'landmark', color: '#D8C8A0' },
    });

    // ── GRIFFITH PARK ── tall tree marker
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [circleAt(-118.3005, 34.1367, 8)] },
      properties: { height: 15, name: 'Griffith Park', type: 'landmark', color: '#308828' },
    });

    // ── ECHO PARK LAKE ── fountain marker
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [circleAt(-118.2607, 34.0730, 6)] },
      properties: { height: 12, name: 'Echo Park', type: 'landmark', color: '#4090C0' },
    });

    // ── GRAND CENTRAL MARKET ──
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [rectAt(-118.2491, 34.0509, 30, 18)] },
      properties: { height: 14, name: 'Grand Central Mkt', type: 'landmark', color: '#D04030' },
    });

    // ── PERSHING SQUARE ──
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [rectAt(-118.2526, 34.0488, 45, 45)] },
      properties: { height: 3, name: 'Pershing Square', type: 'landmark', color: '#58C048' },
    });
    // Purple tower sculpture
    landmarkFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [circleAt(-118.2526, 34.0488, 3)] },
      properties: { height: 28, name: '', type: 'spire', color: '#9048C0' },
    });

    // Add all landmarks as a GeoJSON source
    map.addSource('landmarks', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: landmarkFeatures },
    });

    // Hollywood Sign — white letters on the hillside
    map.addLayer({
      id: 'hollywood-sign',
      source: 'landmarks',
      type: 'fill-extrusion',
      filter: ['==', 'type', 'hollywood-sign'],
      paint: {
        'fill-extrusion-color': '#FFFFFF',
        'fill-extrusion-height': ['*', ['get', 'height'], 6.0],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.95,
      },
    });

    // Landmark buildings — custom colored extrusions
    map.addLayer({
      id: 'landmark-buildings',
      source: 'landmarks',
      type: 'fill-extrusion',
      filter: ['in', 'type', 'landmark', 'stadium'],
      paint: {
        'fill-extrusion-color': ['get', 'color'],
        'fill-extrusion-height': ['*', ['get', 'height'], 6.0],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.95,
      },
    });

    // Spires and towers — thin vertical accents
    map.addLayer({
      id: 'landmark-spires',
      source: 'landmarks',
      type: 'fill-extrusion',
      filter: ['==', 'type', 'spire'],
      paint: {
        'fill-extrusion-color': ['get', 'color'],
        'fill-extrusion-height': ['*', ['get', 'height'], 6.0],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.90,
      },
    });

    // Landmark labels
    map.addLayer({
      id: 'landmark-labels',
      source: 'landmarks',
      type: 'symbol',
      filter: ['all', ['has', 'name'], ['!=', 'name', ''], ['!=', 'type', 'hollywood-sign']],
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Semibold'],
        'text-size': 11,
        'text-offset': [0, -2],
        'text-anchor': 'bottom',
      },
      paint: {
        'text-color': '#FFFFF0',
        'text-halo-color': '#1A2A1A',
        'text-halo-width': 2,
      },
    });

    // City-wide SimCity buildings via MapLibre fill-extrusion
    const sources = map.getStyle()?.sources;
    const hasBuildings = Object.values(sources || {}).some((s: any) =>
      s.type === 'vector' && (s.url?.includes('openmaptiles') || s.url?.includes('openfreemap'))
    );

    // Prominent buildings GeoJSON — visible at early zoom levels (10-13)
    // before vector tile buildings appear
    fetch('/data/prominent_buildings.geojson')
      .then(r => r.json())
      .then(data => {
        if (map.getSource('prominent')) return; // already added
        map.addSource('prominent', { type: 'geojson', data });

        // Find label layer to insert below
        let earlyLabelId: string | undefined;
        for (const layer of map.getStyle()?.layers || []) {
          if (layer.type === 'symbol') { earlyLabelId = layer.id; break; }
        }

        map.addLayer({
          id: 'prominent-buildings',
          source: 'prominent',
          type: 'fill-extrusion',
          minzoom: 10,
          maxzoom: 14, // fade out as vector tile buildings take over
          paint: {
            'fill-extrusion-color': [
              'case',
              ['>', ['get', 'height'], 100],
              ['match', ['%', ['to-number', ['id'], 0], 4],
                0, '#5890C0', 1, '#70B0E0', 2, '#4880B0', '#60A8D0'
              ],
              ['>', ['get', 'height'], 50],
              ['match', ['%', ['to-number', ['id'], 0], 4],
                0, '#E8D8C0', 1, '#D0A050', 2, '#C06838', '#58A8B8'
              ],
              ['match', ['%', ['to-number', ['id'], 0], 4],
                0, '#F0E0C0', 1, '#D0A868', 2, '#E0C8A0', '#C08858'
              ]
            ],
            'fill-extrusion-height': ['*', ['get', 'height'], 6.0],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': [
              'interpolate', ['linear'], ['zoom'],
              10, 0.9, 13, 0.9, 14, 0  // fade out at zoom 14
            ],
          },
        }, earlyLabelId);

        // Labels for the tallest named buildings at early zoom
        map.addLayer({
          id: 'prominent-labels',
          source: 'prominent',
          type: 'symbol',
          minzoom: 11,
          maxzoom: 14,
          filter: ['all', ['has', 'name'], ['!=', 'name', ''], ['>', 'prominence', 100]],
          layout: {
            'text-field': ['get', 'name'],
            'text-font': ['Open Sans Semibold'],
            'text-size': ['interpolate', ['linear'], ['zoom'], 11, 8, 13, 11],
            'text-offset': [0, -1],
            'text-anchor': 'bottom',
          },
          paint: {
            'text-color': '#F0E8D0',
            'text-halo-color': '#1A2A1A',
            'text-halo-width': 1.5,
          },
        });
      })
      .catch(e => console.warn('Prominent buildings:', e));

    if (hasBuildings) {
      // Find label layer to insert below
      let labelLayerId: string | undefined;
      for (const layer of map.getStyle()?.layers || []) {
        if (layer.type === 'symbol') { labelLayerId = layer.id; break; }
      }

      // Building footprint outlines — dark cartoon outlines like SimCity
      map.addLayer({
        id: 'building-outlines',
        source: 'openmaptiles',
        'source-layer': 'building',
        type: 'line',
        minzoom: 13,
        paint: {
          'line-color': '#1A1A1A',
          'line-width': ['interpolate', ['linear'], ['zoom'], 13, 0.3, 15, 1.0, 18, 2.0],
          'line-opacity': 0.7,
        },
      }, labelLayerId);

      // ALL buildings — VIVID SimCity palette, way more colorful than reality
      // This is a video game aesthetic, not an architecture rendering
      map.addLayer({
        id: 'buildings-3d',
        source: 'openmaptiles',
        'source-layer': 'building',
        type: 'fill-extrusion',
        minzoom: 1,
        paint: {
          'fill-extrusion-color': [
            'case',
            // Skyscrapers (>60m) → BOLD glass towers — vivid blues and teals
            ['>', ['coalesce', ['get', 'render_height'], 8], 60],
            ['match', ['%', ['to-number', ['id'], 0], 8],
              0, '#3088D0',   // electric blue
              1, '#50C0E0',   // cyan glass
              2, '#2070B0',   // deep blue
              3, '#40B8D8',   // bright teal
              4, '#6090C0',   // steel blue
              5, '#20A0C8',   // aqua
              6, '#5078B0',   // navy blue
              '#3088D0'
            ],
            // Highrise (30-60m) → punchy commercial variety
            ['>', ['coalesce', ['get', 'render_height'], 8], 30],
            ['match', ['%', ['to-number', ['id'], 0], 10],
              0, '#F8F0D0',   // bright white/cream
              1, '#E0A030',   // bold gold
              2, '#D05830',   // vivid terracotta
              3, '#38B0C0',   // strong teal
              4, '#F0D8A0',   // sunny yellow
              5, '#C86040',   // rust orange
              6, '#80C0D0',   // light cyan
              7, '#E8C078',   // amber
              8, '#A0B8C8',   // cool steel
              '#E8D0A0'
            ],
            // Midrise (15-30m) → warm with pops of color
            ['>', ['coalesce', ['get', 'render_height'], 8], 15],
            ['match', ['%', ['to-number', ['id'], 0], 10],
              0, '#F8E8C0',   // bright cream
              1, '#E8B050',   // bold golden
              2, '#F0C880',   // warm amber
              3, '#C08040',   // rich brown
              4, '#E8D0A0',   // sandstone
              5, '#B0D0D8',   // powder blue
              6, '#D8A060',   // caramel
              7, '#F0D8B0',   // light gold
              8, '#C8B090',   // taupe
              '#E8D0B0'
            ],
            // Lowrise (<15m) → candy-colored residential like SimCity zones
            ['match', ['%', ['to-number', ['id'], 0], 14],
              0, '#F8F0D0',   // bright cream
              1, '#F0B870',   // bold orange
              2, '#FFFFF0',   // pure white
              3, '#A0D898',   // minty green
              4, '#F0A890',   // coral/salmon
              5, '#90C8E8',   // sky blue
              6, '#F8E098',   // sunny yellow
              7, '#D8A070',   // warm brown
              8, '#C8E8C8',   // light green
              9, '#E8C888',   // golden
              10, '#D8B0C8',  // lavender/mauve
              11, '#A8D0D8',  // aqua mint
              12, '#F0D0A0',  // peach
              '#F0E0C0'       // warm cream
            ]
          ],
          'fill-extrusion-height': ['*', ['coalesce', ['get', 'render_height'], 8], 6.0],
          'fill-extrusion-base': ['*', ['coalesce', ['get', 'render_min_height'], 0], 6.0],
          'fill-extrusion-opacity': 0.95,
          'fill-extrusion-vertical-gradient': true,
        },
      }, labelLayerId);

      // ═══════════════════════════════════════════════════════════
      // BUILDING DETAIL LAYERS — add depth, floors, crowns
      // These stack on top of the main color layer to create
      // architectural detail without repeating texture patterns
      // ═══════════════════════════════════════════════════════════

      // Ground floor / lobby — darker base on all buildings
      // Suggests entrance level, retail, darker stone base
      map.addLayer({
        id: 'building-ground-floor',
        source: 'openmaptiles',
        'source-layer': 'building',
        type: 'fill-extrusion',
        minzoom: 13,
        filter: ['>', ['coalesce', ['get', 'render_height'], 0], 10],
        paint: {
          'fill-extrusion-color': '#2A2A20',
          'fill-extrusion-height': ['min', ['*', ['coalesce', ['get', 'render_height'], 0], 0.4], 18],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.18,
          'fill-extrusion-vertical-gradient': false,
        },
      }, labelLayerId);

      // Floor division band at 1/6 height
      map.addLayer({
        id: 'building-band-1',
        source: 'openmaptiles',
        'source-layer': 'building',
        type: 'fill-extrusion',
        minzoom: 14,
        filter: ['>', ['coalesce', ['get', 'render_height'], 0], 15],
        paint: {
          'fill-extrusion-color': '#000000',
          'fill-extrusion-height': ['*', ['coalesce', ['get', 'render_height'], 0], 1.0],
          'fill-extrusion-base': ['-', ['*', ['coalesce', ['get', 'render_height'], 0], 1.0], 3],
          'fill-extrusion-opacity': 0.10,
          'fill-extrusion-vertical-gradient': false,
        },
      }, labelLayerId);

      // Floor division band at 1/3 height
      map.addLayer({
        id: 'building-band-2',
        source: 'openmaptiles',
        'source-layer': 'building',
        type: 'fill-extrusion',
        minzoom: 14,
        filter: ['>', ['coalesce', ['get', 'render_height'], 0], 20],
        paint: {
          'fill-extrusion-color': '#000000',
          'fill-extrusion-height': ['*', ['coalesce', ['get', 'render_height'], 0], 2.0],
          'fill-extrusion-base': ['-', ['*', ['coalesce', ['get', 'render_height'], 0], 2.0], 3],
          'fill-extrusion-opacity': 0.10,
          'fill-extrusion-vertical-gradient': false,
        },
      }, labelLayerId);

      // Floor division band at 1/2 height
      map.addLayer({
        id: 'building-band-3',
        source: 'openmaptiles',
        'source-layer': 'building',
        type: 'fill-extrusion',
        minzoom: 14,
        filter: ['>', ['coalesce', ['get', 'render_height'], 0], 25],
        paint: {
          'fill-extrusion-color': '#000000',
          'fill-extrusion-height': ['*', ['coalesce', ['get', 'render_height'], 0], 3.0],
          'fill-extrusion-base': ['-', ['*', ['coalesce', ['get', 'render_height'], 0], 3.0], 3],
          'fill-extrusion-opacity': 0.10,
          'fill-extrusion-vertical-gradient': false,
        },
      }, labelLayerId);

      // Floor division band at 2/3 height
      map.addLayer({
        id: 'building-band-4',
        source: 'openmaptiles',
        'source-layer': 'building',
        type: 'fill-extrusion',
        minzoom: 14,
        filter: ['>', ['coalesce', ['get', 'render_height'], 0], 35],
        paint: {
          'fill-extrusion-color': '#000000',
          'fill-extrusion-height': ['*', ['coalesce', ['get', 'render_height'], 0], 4.0],
          'fill-extrusion-base': ['-', ['*', ['coalesce', ['get', 'render_height'], 0], 4.0], 3],
          'fill-extrusion-opacity': 0.10,
          'fill-extrusion-vertical-gradient': false,
        },
      }, labelLayerId);

      // Floor division band at 5/6 height
      map.addLayer({
        id: 'building-band-5',
        source: 'openmaptiles',
        'source-layer': 'building',
        type: 'fill-extrusion',
        minzoom: 14,
        filter: ['>', ['coalesce', ['get', 'render_height'], 0], 50],
        paint: {
          'fill-extrusion-color': '#000000',
          'fill-extrusion-height': ['*', ['coalesce', ['get', 'render_height'], 0], 5.0],
          'fill-extrusion-base': ['-', ['*', ['coalesce', ['get', 'render_height'], 0], 5.0], 3],
          'fill-extrusion-opacity': 0.10,
          'fill-extrusion-vertical-gradient': false,
        },
      }, labelLayerId);

      // Skyscraper crown — bright accent on top of tall buildings
      // Creates the lit penthouse / observation deck look
      map.addLayer({
        id: 'building-crown',
        source: 'openmaptiles',
        'source-layer': 'building',
        type: 'fill-extrusion',
        minzoom: 13,
        filter: ['>', ['coalesce', ['get', 'render_height'], 0], 50],
        paint: {
          'fill-extrusion-color': '#FFFFF0',
          'fill-extrusion-height': [
            '+', ['*', ['coalesce', ['get', 'render_height'], 0], 6.0], 1
          ],
          'fill-extrusion-base': ['*', ['coalesce', ['get', 'render_height'], 0], 5.7],
          'fill-extrusion-opacity': 0.25,
          'fill-extrusion-vertical-gradient': false,
        },
      }, labelLayerId);

      // Roof tint — darker shade on building tops for depth
      map.addLayer({
        id: 'buildings-roof-tint',
        source: 'openmaptiles',
        'source-layer': 'building',
        type: 'fill-extrusion',
        minzoom: 14,
        paint: {
          'fill-extrusion-color': '#1A1A10',
          'fill-extrusion-height': [
            '+', ['*', ['coalesce', ['get', 'render_height'], 8], 6.0], 0.5
          ],
          'fill-extrusion-base': [
            '*', ['coalesce', ['get', 'render_height'], 8], 6.0
          ],
          'fill-extrusion-opacity': 0.12,
          'fill-extrusion-vertical-gradient': false,
        },
      }, labelLayerId);
    }
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <style>{`
        .simcity-map {
          filter: saturate(1.4) contrast(1.15) brightness(1.08);
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
          maxBounds={LA_BOUNDS}
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
