export interface DistrictInfo {
  id: number;
  name: string;
  member: string;
  color: string;
  population: string;
  meetings: number;
  neighborhoods: string[];
  hotTopics: string[];
  recentAction: string;
  center: [number, number]; // [lng, lat]
}

export const DISTRICTS: DistrictInfo[] = [
  { id: 1, name: 'CD-1', member: 'Eunisses Hernandez', color: '#4CAF50', population: '262K', meetings: 42, neighborhoods: ['Highland Park', 'Lincoln Heights', 'Glassell Park', 'Mt. Washington'], hotTopics: ['Housing', 'Immigration', 'Parks'], recentAction: 'Community land trust expansion', center: [-118.210, 34.080] },
  { id: 2, name: 'CD-2', member: 'Paul Krekorian', color: '#2196F3', population: '268K', meetings: 38, neighborhoods: ['Studio City', 'North Hollywood', 'Valley Village', 'Sun Valley'], hotTopics: ['Budget', 'Entertainment', 'Transit'], recentAction: 'Budget surplus allocation', center: [-118.380, 34.175] },
  { id: 3, name: 'CD-3', member: 'Bob Blumenfield', color: '#FF9800', population: '272K', meetings: 35, neighborhoods: ['Woodland Hills', 'Tarzana', 'Encino', 'Reseda'], hotTopics: ['Public Safety', 'Homelessness', 'Valley Issues'], recentAction: 'RV parking restrictions', center: [-118.530, 34.185] },
  { id: 4, name: 'CD-4', member: 'Nithya Raman', color: '#9C27B0', population: '259K', meetings: 48, neighborhoods: ['Silver Lake', 'Los Feliz', 'Hancock Park', 'Mid-Wilshire'], hotTopics: ['Housing', 'Homelessness', 'CEQA Reform'], recentAction: 'Rent stabilization extension', center: [-118.310, 34.080] },
  { id: 5, name: 'CD-5', member: 'Katy Young', color: '#E91E63', population: '271K', meetings: 36, neighborhoods: ['Bel Air', 'Westwood', 'Century City', 'Beverlywood'], hotTopics: ['Development', 'Transit', 'Westside'], recentAction: 'Expo Line corridor plan', center: [-118.415, 34.050] },
  { id: 6, name: 'CD-6', member: 'Imelda Padilla', color: '#00BCD4', population: '275K', meetings: 32, neighborhoods: ['Van Nuys', 'Pacoima', 'Arleta', 'Panorama City'], hotTopics: ['Infrastructure', 'Sun Valley', 'Community'], recentAction: 'Street improvement bonds', center: [-118.430, 34.220] },
  { id: 7, name: 'CD-7', member: 'Monica Rodriguez', color: '#795548', population: '263K', meetings: 30, neighborhoods: ['Sylmar', 'Sunland-Tujunga', 'Lake View Terrace', 'Shadow Hills'], hotTopics: ['Fire Safety', 'Rural Issues', 'Wildlife'], recentAction: 'Fire evacuation routes', center: [-118.370, 34.300] },
  { id: 8, name: 'CD-8', member: 'Marqueece Harris-Dawson', color: '#F44336', population: '266K', meetings: 40, neighborhoods: ['South LA', 'Vermont Square', 'Exposition Park', 'Chesterfield Sq.'], hotTopics: ['Economic Dev.', 'South LA', 'Jobs'], recentAction: 'Workforce development center', center: [-118.290, 33.980] },
  { id: 9, name: 'CD-9', member: 'Curren Price', color: '#3F51B5', population: '269K', meetings: 37, neighborhoods: ['Downtown', 'South Park', 'Historic Core', 'Fashion District'], hotTopics: ['Downtown', 'Arts District', 'Transit'], recentAction: 'Arts District zoning overhaul', center: [-118.250, 34.020] },
  { id: 10, name: 'CD-10', member: 'Heather Hutt', color: '#607D8B', population: '258K', meetings: 44, neighborhoods: ['Mid-City', 'Crenshaw', 'West Adams', 'Leimert Park'], hotTopics: ['Transportation', 'Mid-City', 'Crenshaw'], recentAction: 'Venice Mobility Hub study', center: [-118.320, 34.020] },
  { id: 11, name: 'CD-11', member: 'Traci Park', color: '#009688', population: '273K', meetings: 39, neighborhoods: ['Venice', 'Mar Vista', 'Brentwood', 'Pacific Palisades'], hotTopics: ['Venice', 'Coastal', 'LAX'], recentAction: 'Venice alfresco dining permits', center: [-118.460, 33.960] },
  { id: 12, name: 'CD-12', member: 'John Lee', color: '#CDDC39', population: '274K', meetings: 33, neighborhoods: ['Chatsworth', 'Granada Hills', 'Porter Ranch', 'Northridge'], hotTopics: ['Parks', 'Granada Hills', 'Public Safety'], recentAction: 'Oversized vehicle restrictions', center: [-118.540, 34.280] },
  { id: 13, name: 'CD-13', member: 'Hugo Soto-Martinez', color: '#FF5722', population: '256K', meetings: 46, neighborhoods: ['Hollywood', 'East Hollywood', 'Atwater Village', 'Elysian Valley'], hotTopics: ['Rent Control', 'Hollywood', 'Nightlife'], recentAction: 'Tenant anti-harassment ordinance', center: [-118.290, 34.090] },
  { id: 14, name: 'CD-14', member: 'Kevin de León', color: '#8BC34A', population: '261K', meetings: 41, neighborhoods: ['Boyle Heights', 'Eagle Rock', 'El Sereno', 'Northeast LA'], hotTopics: ['Boyle Heights', 'Eagle Rock', 'Encampments'], recentAction: 'Encampment clearance protocol', center: [-118.190, 34.050] },
  { id: 15, name: 'CD-15', member: 'Tim McOsker', color: '#FFC107', population: '270K', meetings: 34, neighborhoods: ['San Pedro', 'Watts', 'Harbor City', 'Wilmington'], hotTopics: ['Port', 'San Pedro', 'Watts'], recentAction: 'Port community benefits agreement', center: [-118.280, 33.780] },
];
