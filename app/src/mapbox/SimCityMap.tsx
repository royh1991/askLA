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


    // City-wide SimCity buildings via MapLibre fill-extrusion
    // This covers ALL of LA — not just the Overpass-fetched clusters
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
            'fill-extrusion-height': ['*', ['get', 'height'], 3.0],
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
          filter: ['all', ['has', 'name'], ['!=', 'name', ''], ['>', 'height', 80]],
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

      // ALL buildings — bold solid colors, height-dependent SimCity palette
      // No repeating texture patterns (they trigger trypophobia)
      map.addLayer({
        id: 'buildings-3d',
        source: 'openmaptiles',
        'source-layer': 'building',
        type: 'fill-extrusion',
        minzoom: 1,
        paint: {
          'fill-extrusion-color': [
            'case',
            // Skyscrapers (>60m) → bold glass/steel blues
            ['>', ['coalesce', ['get', 'render_height'], 8], 60],
            ['match', ['%', ['to-number', ['id'], 0], 6],
              0, '#5890C0',   // bright blue glass
              1, '#70B0E0',   // sky blue glass
              2, '#4880B0',   // medium blue
              3, '#60A8D0',   // light blue
              4, '#8098B0',   // steel
              '#5890C0'
            ],
            // Highrise (30-60m) → vivid commercial mix
            ['>', ['coalesce', ['get', 'render_height'], 8], 30],
            ['match', ['%', ['to-number', ['id'], 0], 8],
              0, '#F0E8D0',   // bright white
              1, '#D0A050',   // bold golden
              2, '#C06838',   // terracotta
              3, '#58A8B8',   // teal
              4, '#E8D8C0',   // cream
              5, '#90A0B0',   // steel gray
              6, '#B06040',   // dark brick
              '#E0D0B8'
            ],
            // Midrise (15-30m) → warm commercial
            ['>', ['coalesce', ['get', 'render_height'], 8], 15],
            ['match', ['%', ['to-number', ['id'], 0], 8],
              0, '#F0E0C0',   // warm cream
              1, '#D0A868',   // golden
              2, '#E0C8A0',   // warm beige
              3, '#C08858',   // brown
              4, '#E8D0B0',   // sandstone
              5, '#B8C8D0',   // cool gray
              6, '#D8B088',   // caramel
              '#E0D0B8'
            ],
            // Lowrise (<15m) → colorful residential SimCity palette
            ['match', ['%', ['to-number', ['id'], 0], 12],
              0, '#F0E8D0',   // bright cream
              1, '#E8C090',   // warm orange
              2, '#F8F0E0',   // white
              3, '#C0D8B8',   // sage green
              4, '#E8B8A0',   // salmon/pink
              5, '#B8D0E0',   // sky blue
              6, '#F0E0C0',   // golden
              7, '#D0A878',   // brown
              8, '#E0E8E0',   // pale mint
              9, '#D8C098',   // sandstone
              10, '#D0B8C0',  // mauve
              '#E0D8C0'       // default warm
            ]
          ],
          'fill-extrusion-height': ['*', ['coalesce', ['get', 'render_height'], 8], 3.0],
          'fill-extrusion-base': ['*', ['coalesce', ['get', 'render_min_height'], 0], 3.0],
          'fill-extrusion-opacity': 0.92,
          'fill-extrusion-vertical-gradient': true,
        },
      }, labelLayerId);

      // Subtle floor band at 1/3 building height — suggests floor divisions
      map.addLayer({
        id: 'building-band-lower',
        source: 'openmaptiles',
        'source-layer': 'building',
        type: 'fill-extrusion',
        minzoom: 14,
        filter: ['>', ['coalesce', ['get', 'render_height'], 0], 20],
        paint: {
          'fill-extrusion-color': '#000000',
          'fill-extrusion-height': ['*', ['coalesce', ['get', 'render_height'], 0], 1.0],
          'fill-extrusion-base': ['-', ['*', ['coalesce', ['get', 'render_height'], 0], 1.0], 1.5],
          'fill-extrusion-opacity': 0.06,
          'fill-extrusion-vertical-gradient': false,
        },
      }, labelLayerId);

      // Subtle floor band at 2/3 building height
      map.addLayer({
        id: 'building-band-upper',
        source: 'openmaptiles',
        'source-layer': 'building',
        type: 'fill-extrusion',
        minzoom: 14,
        filter: ['>', ['coalesce', ['get', 'render_height'], 0], 30],
        paint: {
          'fill-extrusion-color': '#000000',
          'fill-extrusion-height': ['*', ['coalesce', ['get', 'render_height'], 0], 2.0],
          'fill-extrusion-base': ['-', ['*', ['coalesce', ['get', 'render_height'], 0], 2.0], 1.5],
          'fill-extrusion-opacity': 0.06,
          'fill-extrusion-vertical-gradient': false,
        },
      }, labelLayerId);

      // Roof tint — subtle darker shade on building tops for depth
      map.addLayer({
        id: 'buildings-roof-tint',
        source: 'openmaptiles',
        'source-layer': 'building',
        type: 'fill-extrusion',
        minzoom: 14,
        paint: {
          'fill-extrusion-color': '#000000',
          'fill-extrusion-height': [
            '+', ['*', ['coalesce', ['get', 'render_height'], 8], 3.0], 0.3
          ],
          'fill-extrusion-base': [
            '*', ['coalesce', ['get', 'render_height'], 8], 3.0
          ],
          'fill-extrusion-opacity': 0.10,
          'fill-extrusion-vertical-gradient': false,
        },
      }, labelLayerId);
    }
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <style>{`
        .simcity-map {
          filter: saturate(1.35) contrast(1.12) brightness(1.12);
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
