import { GeoJsonLayer, IconLayer } from '@deck.gl/layers';

const DISTRICT_COLORS: Record<number, [number, number, number]> = {
  1: [76, 175, 80], 2: [33, 150, 243], 3: [255, 152, 0], 4: [156, 39, 176],
  5: [233, 30, 99], 6: [0, 188, 212], 7: [121, 85, 72], 8: [244, 67, 54],
  9: [63, 81, 181], 10: [96, 125, 139], 11: [0, 150, 136], 12: [205, 220, 57],
  13: [255, 87, 34], 14: [139, 195, 74], 15: [255, 193, 7],
};

export function createDistrictLayer(
  data: any,
  selectedId: number | null,
  hoveredId: number | null,
  onClick: (districtId: number) => void,
  onHover: (districtId: number | null) => void,
) {
  return new GeoJsonLayer({
    id: 'council-districts',
    data,
    filled: true,
    stroked: true,
    pickable: true,
    getFillColor: (d: any) => {
      const id = d.properties?.district;
      const rgb = DISTRICT_COLORS[id] || [128, 128, 128];
      const alpha = id === selectedId ? 100 : id === hoveredId ? 60 : 30;
      return [...rgb, alpha] as [number, number, number, number];
    },
    getLineColor: (d: any) => {
      const id = d.properties?.district;
      if (id === selectedId) return [255, 255, 255, 220];
      if (id === hoveredId) return [255, 255, 255, 150];
      const rgb = DISTRICT_COLORS[id] || [128, 128, 128];
      return [...rgb, 120] as [number, number, number, number];
    },
    getLineWidth: (d: any) => {
      const id = d.properties?.district;
      return id === selectedId ? 80 : id === hoveredId ? 50 : 20;
    },
    lineWidthUnits: 'meters' as const,
    onClick: (info: any) => {
      const id = info.object?.properties?.district;
      if (id) onClick(id);
    },
    onHover: (info: any) => {
      onHover(info.object?.properties?.district ?? null);
    },
    updateTriggers: {
      getFillColor: [selectedId, hoveredId],
      getLineColor: [selectedId, hoveredId],
      getLineWidth: [selectedId, hoveredId],
    },
  });
}

// SimCity-style landmark sprites placed at real geographic coordinates
interface LandmarkData {
  name: string;
  coordinates: [number, number]; // [lng, lat]
  icon: string; // path to sprite image
  size: number; // pixel size on screen
}

const LANDMARKS: LandmarkData[] = [
  { name: 'LAX', coordinates: [-118.4085, 33.9416], icon: '/sprites/landmarks/lax-simcity.png', size: 280 },
  // More landmarks will be added here as they're generated
];

export function createLandmarkLayer() {
  return new IconLayer({
    id: 'simcity-landmarks',
    data: LANDMARKS,
    pickable: true,
    getIcon: (d: LandmarkData) => ({
      url: d.icon,
      width: 991,
      height: 873,
      anchorY: 873,
    }),
    getPosition: (d: LandmarkData) => d.coordinates,
    getSize: (d: LandmarkData) => d.size,
    sizeUnits: 'pixels' as const,
    sizeMinPixels: 80,
    sizeMaxPixels: 500,
    billboard: false, // Render flat on the map surface, not facing camera
  });
}
