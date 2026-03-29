'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Map, NavigationControl, useControl } from 'react-map-gl/maplibre';
import { MapboxOverlay } from '@deck.gl/mapbox';
import type { MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

import { MAP_STYLE } from './mapStyle';
import { createDistrictLayer, createSimCityBuildingLayer, createLandmarkOverlays } from './layers';
import { DISTRICTS, type DistrictInfo } from './districtData';
import districtsGeoJson from '../data/la-districts.json';

// deck.gl MapboxOverlay as a react-map-gl control
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
  const [mapLoaded, setMapLoaded] = useState(false);

  // Fly to selected district
  useEffect(() => {
    if (!mapRef.current || !selectedDistrictId) return;
    const dist = DISTRICTS.find(d => d.id === selectedDistrictId);
    if (dist) {
      mapRef.current.flyTo({
        center: dist.center,
        zoom: 13.5,
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

  // Load SimCity building data
  const [buildingData, setBuildingData] = useState<any>(null);
  useEffect(() => {
    // Load all building GeoJSON files and merge them
    Promise.all([
      fetch('/data/dtla_buildings.geojson').then(r => r.json()).catch(() => null),
      fetch('/data/lax_buildings.geojson').then(r => r.json()).catch(() => null),
      fetch('/data/dodger_stadium.geojson').then(r => r.json()).catch(() => null),
    ]).then(([dtla, lax, dodger]) => {
      const features: any[] = [];
      if (dtla?.features) features.push(...dtla.features);
      if (lax?.features) features.push(...lax.features);
      if (dodger?.features) features.push(...dodger.features);
      setBuildingData({ type: 'FeatureCollection', features });
    });
  }, []);

  // deck.gl layers
  const layers = useMemo(() => {
    const l: any[] = [
      createDistrictLayer(
        districtsGeoJson,
        selectedDistrictId,
        hoveredDistrictId,
        handleDistrictClick,
        handleDistrictHover,
      ),
    ];
    if (buildingData) {
      l.push(createSimCityBuildingLayer(buildingData));
    }
    // SimCity sprite overlays as elevated BitmapLayers with shadows
    l.push(...createLandmarkOverlays());
    return l;
  }, [selectedDistrictId, hoveredDistrictId, handleDistrictClick, handleDistrictHover, buildingData]);

  // Add 3D buildings and SimCity sprite overlays after map loads
  const handleMapLoad = useCallback(() => {
    setMapLoaded(true);
    const map = mapRef.current?.getMap();
    if (!map) return;

    const styleLayers = map.getStyle()?.layers;
    if (!styleLayers) return;

    // Find the first label layer to insert below
    let labelLayerId: string | undefined;
    for (const layer of styleLayers) {
      if (layer.type === 'symbol' && (layer as any).layout?.['text-field']) {
        labelLayerId = layer.id;
        break;
      }
    }

    // Add 3D building extrusions (SimCity colored by height)
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
        minzoom: 13,
        paint: {
          'fill-extrusion-color': [
            'interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 10],
            0, '#81C784',
            15, '#64B5F6',
            40, '#FFD54F',
            80, '#CE93D8',
          ],
          'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 10],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': 0.82,
        },
      }, labelLayerId);
    }

    // Hide default 3D buildings in areas where we have SimCity sprites
    // We can't use 'within' for polygons, so we'll handle it via the
    // deck.gl layer rendering order (our sprites render on top)

  }, []);

  return (
    <Map
      ref={mapRef}
      initialViewState={{
        longitude: -118.2437,
        latitude: 34.0522,
        zoom: 11,
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
    </Map>
  );
}
