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

export default function SimCityMap({ selectedDistrictId, onDistrictSelect }: SimCityMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [hoveredDistrictId, setHoveredDistrictId] = useState<number | null>(null);

  useEffect(() => {
    if (!mapRef.current || !selectedDistrictId) return;
    const dist = DISTRICTS.find(d => d.id === selectedDistrictId);
    if (dist) {
      mapRef.current.flyTo({ center: dist.center, zoom: 14, pitch: 55, bearing: -17, duration: 1500 });
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

    const styleLayers = map.getStyle()?.layers;
    if (!styleLayers) return;

    let labelLayerId: string | undefined;
    for (const layer of styleLayers) {
      if (layer.type === 'symbol' && (layer as any).layout?.['text-field']) {
        labelLayerId = layer.id;
        break;
      }
    }

    // SimCity-style 3D buildings — bright flat colors, no vertical gradient
    const sources = map.getStyle()?.sources;
    const hasBuildings = Object.values(sources || {}).some((s: any) =>
      s.type === 'vector' && (s.url?.includes('openmaptiles') || s.url?.includes('openfreemap'))
    );

    if (hasBuildings) {
      map.addLayer({
        id: 'buildings-3d',
        source: 'openmaptiles',
        'source-layer': 'building',
        type: 'fill-extrusion',
        minzoom: 1,
        paint: {
          // SimCity color ramp: green houses → blue commercial → yellow office → purple skyscrapers
          'fill-extrusion-color': [
            'interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 8],
            0, '#6ABF69',     // bright green (houses)
            12, '#C4B998',    // warm tan (low-rise)
            25, '#5DADE2',    // bright blue (mid-rise)
            50, '#F4D03F',    // bright yellow (office)
            80, '#E74C3C',    // red (tall)
            120, '#8E44AD',   // purple (skyscrapers)
            200, '#F0F0F0',   // white (supertall)
          ],
          'fill-extrusion-height': [
            '*', ['coalesce', ['get', 'render_height'], 8], 2.0 // 2x height exaggeration
          ],
          'fill-extrusion-base': [
            '*', ['coalesce', ['get', 'render_min_height'], 0], 2.0
          ],
          'fill-extrusion-opacity': 0.92,
          'fill-extrusion-vertical-gradient': false, // flat shading = SimCity look
        },
      }, labelLayerId);
    }
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* SimCity post-processing: pixelation + saturation */}
      <style>{`
        .simcity-map {
          filter: saturate(1.5) contrast(1.2) brightness(1.05);
        }
      `}</style>

      <div className="simcity-map" style={{ width: '100%', height: '100%' }}>
        <Map
          ref={mapRef}
          initialViewState={{
            longitude: -118.2437,
            latitude: 34.0522,
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
          // pixelRatio kept at default for readable text
        >
          <DeckGLOverlay layers={layers} />
          <NavigationControl position="top-left" showCompass={false} />
        </Map>
      </div>
    </div>
  );
}
