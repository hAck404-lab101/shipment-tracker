export const ROUTE_POINTS = [
  {
    id: 'ny-warehouse',
    name: 'New York Export Warehouse',
    type: 'Origin Hub',
    city: 'New York, USA',
    country: 'United States',
    coordinates: [40.7128, -74.006],
    note: 'Shipment starts here after customer order is registered.'
  },
  {
    id: 'pa-processing',
    name: 'Pennsylvania Processing Point',
    type: 'Sorting Center',
    city: 'Philadelphia, Pennsylvania',
    country: 'United States',
    coordinates: [39.9526, -75.1652],
    note: 'Package is inspected, scanned, and grouped for interstate transit.'
  },
  {
    id: 'oh-consolidation',
    name: 'Ohio Consolidation Shop',
    type: 'Consolidation Store',
    city: 'Columbus, Ohio',
    country: 'United States',
    coordinates: [39.9612, -82.9988],
    note: 'Multiple packages are combined before export routing.'
  },
  {
    id: 'ga-customs-prep',
    name: 'Georgia Customs Prep Hub',
    type: 'Export Prep',
    city: 'Atlanta, Georgia',
    country: 'United States',
    coordinates: [33.749, -84.388],
    note: 'Documentation and export labels are prepared.'
  },
  {
    id: 'fl-air-sea',
    name: 'Florida Air & Sea Departure Hub',
    type: 'Departure Port',
    city: 'Miami, Florida',
    country: 'United States',
    coordinates: [25.7617, -80.1918],
    note: 'Shipment leaves the United States by air freight or sea freight.'
  },
  {
    id: 'atlantic-transit',
    name: 'Atlantic Transit Zone',
    type: 'International Transit',
    city: 'Atlantic Ocean',
    country: 'International Waters',
    coordinates: [8.7832, -35.5085],
    note: 'The shipment is in overseas transit toward West Africa.'
  },
  {
    id: 'tema-port',
    name: 'Tema Harbor Port Receiving Store',
    type: 'Ghana Port Store',
    city: 'Tema, Greater Accra',
    country: 'Ghana',
    coordinates: [5.633, 0.0166],
    note: 'Local receiving point close to Tema Harbor for clearance and handover.'
  },
  {
    id: 'accra-delivery',
    name: 'Accra Final Delivery Desk',
    type: 'Final Delivery',
    city: 'Accra, Ghana',
    country: 'Ghana',
    coordinates: [5.6037, -0.187],
    note: 'Final customer delivery or pickup confirmation.'
  }
];

export const SHIPPING_MODES = {
  air: {
    label: 'Air Freight',
    speedKmh: 760,
    baseDays: 3,
    handlingDays: 2,
    description: 'Fastest option for urgent packages, electronics, documents, and smaller cargo.'
  },
  sea: {
    label: 'Sea Freight',
    speedKmh: 35,
    baseDays: 18,
    handlingDays: 7,
    description: 'Best for cheaper bulky goods, boxes, barrels, and non-urgent shipments.'
  },
  express: {
    label: 'Express Hybrid',
    speedKmh: 900,
    baseDays: 2,
    handlingDays: 1,
    description: 'Premium route with faster scans, priority customs preparation, and quicker dispatch.'
  }
};

export const DEFAULT_USER = {
  name: 'Demo Customer',
  email: 'customer@shipment.local'
};

const toRadians = value => (value * Math.PI) / 180;

export function getDistanceKm(pointA, pointB) {
  const [lat1, lon1] = pointA;
  const [lat2, lon2] = pointB;
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export function getTotalRouteDistance(points = ROUTE_POINTS) {
  return points.reduce((total, point, index) => {
    if (index === 0) return total;
    return total + getDistanceKm(points[index - 1].coordinates, point.coordinates);
  }, 0);
}

export function getEstimatedDuration(mode = 'air') {
  const selectedMode = SHIPPING_MODES[mode] || SHIPPING_MODES.air;
  const distance = getTotalRouteDistance();
  const travelHours = distance / selectedMode.speedKmh;
  const travelDays = travelHours / 24;
  return Math.ceil(travelDays + selectedMode.baseDays + selectedMode.handlingDays);
}

export function buildShipment({ recipient, item, trackingNumber, mode, destination }) {
  return {
    id: crypto.randomUUID(),
    trackingNumber: trackingNumber || `ST-${Date.now().toString().slice(-7)}`,
    recipient,
    item,
    mode,
    destination,
    origin: 'United States',
    currentPointIndex: 0,
    createdAt: new Date().toISOString(),
    status: 'Registered in the United States',
    estimatedDays: getEstimatedDuration(mode)
  };
}

export function getProgressPercent(index) {
  return Math.round((index / (ROUTE_POINTS.length - 1)) * 100);
}
