// 50 LA landmark building names — these get special treatment
export const LANDMARK_NAMES = new Set([
  'City Hall', 'Los Angeles City Hall',
  'Capitol Records Building', 'Capitol Records',
  'U.S. Bank Tower', 'US Bank Tower',
  'Wilshire Grand Center', 'Wilshire Grand Building',
  'Walt Disney Concert Hall',
  'The Broad',
  'Los Angeles County Museum of Art', 'LACMA',
  'Watts Towers', 'Watts Towers of Simon Rodia',
  'Union Station', 'Los Angeles Union Station',
  'Dodger Stadium',
  'SoFi Stadium',
  'Crypto.com Arena', 'Staples Center',
  'Hollywood Bowl',
  'Greek Theatre',
  'The Forum',
  'Griffith Observatory',
  'TCL Chinese Theatre', "Grauman's Chinese Theatre",
  'Getty Center', 'J. Paul Getty Museum',
  'Getty Villa',
  'Beverly Center',
  'The Grove',
  'Santa Monica Pier',
  'Cathedral of Our Lady of the Angels',
  'Bradbury Building',
  'Los Angeles Central Library', 'Central Library',
  'Rose Bowl',
  'Los Angeles Memorial Coliseum', 'Memorial Coliseum',
  'Angels Flight',
  'The Wiltern', 'Wiltern Theatre',
  'Pantages Theatre',
  'El Capitan Theatre',
  'Los Angeles Convention Center', 'Convention Center',
  'Olvera Street',
  'Pershing Square',
  'Chateau Marmont',
  'Hollywood Roosevelt Hotel',
  'Grand Central Market',
  'Crenshaw Mall', 'Baldwin Hills Crenshaw Plaza',
  'Aon Center',
  'Two California Plaza',
  'Gas Company Tower',
  'One Wilshire',
  'LAX Theme Building',
]);

// Convert lat/lng polygon to meters relative to a center point
const DEG_TO_M_LAT = 111320; // meters per degree latitude
function degToMeters(lat: number, lng: number, centerLat: number, centerLng: number): [number, number] {
  const degToMLng = DEG_TO_M_LAT * Math.cos(centerLat * Math.PI / 180);
  return [
    (lng - centerLng) * degToMLng,
    (lat - centerLat) * DEG_TO_M_LAT,
  ];
}

export interface ProcessedBuilding {
  polygon: [number, number][];
  height: number;
  name: string;
  isLandmark: boolean;
  type: string;
  center: [number, number]; // [lng, lat] for positioning on map
}

export function processGeoJsonBuildings(geojson: any, centerLat: number, centerLng: number): ProcessedBuilding[] {
  const buildings: ProcessedBuilding[] = [];

  for (const feature of geojson.features || []) {
    const props = feature.properties || {};
    const geom = feature.geometry;
    if (!geom || geom.type !== 'Polygon') continue;

    const coords = geom.coordinates[0]; // outer ring
    if (!coords || coords.length < 3) continue;

    // Convert to meters relative to center
    const polygon: [number, number][] = coords.map(([lng, lat]: [number, number]) =>
      degToMeters(lat, lng, centerLat, centerLng)
    );

    // Height
    const height = parseFloat(props.height) ||
      (parseFloat(props['building:levels']) || 3) * 3.5;

    // Check if landmark
    const name = props.name || '';
    const isLandmark = LANDMARK_NAMES.has(name);

    // Building type
    const type = props.aeroway || props.building || props.leisure || 'residential';

    // Center of polygon for map positioning
    const lngs = coords.map((c: number[]) => c[0]);
    const lats = coords.map((c: number[]) => c[1]);
    const centerCoord: [number, number] = [
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
      (Math.min(...lats) + Math.max(...lats)) / 2,
    ];

    buildings.push({ polygon, height, name, isLandmark, type, center: centerCoord });
  }

  return buildings;
}
