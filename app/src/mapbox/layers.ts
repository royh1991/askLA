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
      const alpha = id === selectedId ? 140 : id === hoveredId ? 110 : 25;
      return [...rgb, alpha] as [number, number, number, number];
    },
    getLineColor: (d: any) => {
      const id = d.properties?.district;
      if (id === selectedId) return [255, 255, 255, 255];
      if (id === hoveredId) return [255, 255, 255, 220];
      const rgb = DISTRICT_COLORS[id] || [128, 128, 128];
      return [...rgb, 100] as [number, number, number, number];
    },
    getLineWidth: (d: any) => {
      const id = d.properties?.district;
      return id === selectedId ? 120 : id === hoveredId ? 90 : 20;
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

// SimCity-style 3D building extrusions from real OSM footprints
// Colors based on building type, heights exaggerated for SimCity feel
const SIMCITY_COLORS: Record<string, [number, number, number]> = {
  // Airport
  terminal: [65, 105, 225],      // royal blue
  hangar: [255, 140, 0],         // orange
  // Stadium/sports
  stadium: [50, 205, 50],        // green
  grandstand: [50, 205, 50],
  // Civic/public
  government: [206, 147, 216],   // purple
  public: [206, 147, 216],
  civic: [206, 147, 216],
  church: [206, 147, 216],
  cathedral: [206, 147, 216],
  // Commercial
  commercial: [100, 181, 246],   // blue
  retail: [100, 181, 246],
  office: [100, 181, 246],
  hotel: [255, 183, 77],         // amber
  // Industrial
  industrial: [255, 213, 79],    // yellow
  warehouse: [255, 213, 79],
  // Residential
  residential: [129, 199, 132],  // green
  apartments: [129, 199, 132],
  house: [129, 199, 132],
  // Tall buildings
  tower: [171, 71, 188],         // purple
  skyscraper: [171, 71, 188],
  // Parking
  parking: [158, 158, 158],      // gray
  garage: [158, 158, 158],
};

function getSimCityColor(props: any): [number, number, number, number] {
  const h = parseFloat(props.height) || 0;
  const type = props.aeroway || props.building || props.leisure || 'yes';

  // Check named color first
  const named = SIMCITY_COLORS[type];
  if (named) return [...named, 210];

  // Fall back to height-based coloring (like SimCity)
  if (h > 100) return [171, 71, 188, 220];    // Skyscrapers → purple
  if (h > 50) return [255, 213, 79, 210];      // Tall office → yellow
  if (h > 25) return [100, 181, 246, 210];      // Mid-rise → blue
  if (h > 10) return [255, 183, 77, 200];       // Low-rise → amber
  return [129, 199, 132, 200];                   // Small → green
}

export function createSimCityBuildingLayer(data: any) {
  return new GeoJsonLayer({
    id: 'simcity-buildings',
    data,
    extruded: true,
    wireframe: true,
    filled: true,
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 100, 180],
    getFillColor: (f: any) => getSimCityColor(f.properties),
    getLineColor: [0, 0, 0, 60],
    getElevation: (f: any) => {
      const h = parseFloat(f.properties.height) || (parseFloat(f.properties['building:levels']) || 3) * 3.5;
      return h * 2; // 2x exaggeration for SimCity feel
    },
    lineWidthMinPixels: 1,
    material: {
      ambient: 0.35,
      diffuse: 0.65,
      shininess: 32,
      specularColor: [200, 200, 200],
    },
    onClick: (info: any) => {
      const p = info.object?.properties;
      if (p?.name) console.log('Building:', p.name, p.height ? p.height + 'm' : '');
    },
  });
}

// Landmark overlays — placeholder for future implementation
export function createLandmarkOverlays(): any[] {
  return [];
}
