export const ROUTE_POINTS = [
  { id: 'ny-origin', name: 'New York Export Warehouse', type: 'Origin warehouse', city: 'New York', state: 'New York', country: 'United States', coordinates: [40.7128, -74.006], note: 'Shipment received, verified, labelled, and prepared for domestic movement.', status: 'Received at U.S. Warehouse' },
  { id: 'pa-sort', name: 'Pennsylvania Sorting Center', type: 'Sorting center', city: 'Philadelphia', state: 'Pennsylvania', country: 'United States', coordinates: [39.9526, -75.1652], note: 'Package is scanned, sorted, and grouped by export category.', status: 'Processing' },
  { id: 'oh-consolidation', name: 'Ohio Consolidation Store', type: 'Consolidation store', city: 'Columbus', state: 'Ohio', country: 'United States', coordinates: [39.9612, -82.9988], note: 'Small shipments are consolidated into export batches.', status: 'In U.S. Transit' },
  { id: 'ga-export', name: 'Georgia Export Documentation Hub', type: 'Export documentation', city: 'Atlanta', state: 'Georgia', country: 'United States', coordinates: [33.749, -84.388], note: 'Invoice, declaration, insurance, and export papers are reviewed.', status: 'Ready for Export' },
  { id: 'fl-departure', name: 'Florida Air & Sea Departure Terminal', type: 'Departure terminal', city: 'Miami', state: 'Florida', country: 'United States', coordinates: [25.7617, -80.1918], note: 'Cargo departs the United States by selected shipping method.', status: 'Departed United States' },
  { id: 'atlantic', name: 'Atlantic International Transit', type: 'Overseas transit', city: 'Atlantic Route', state: 'International Waters', country: 'International', coordinates: [8.7832, -35.5085], note: 'Shipment is moving across the Atlantic toward West Africa.', status: 'In Overseas Transit' },
  { id: 'tema-port', name: 'Tema Harbor Port Receiving Store', type: 'Port receiving store', city: 'Tema', state: 'Greater Accra', country: 'Ghana', coordinates: [5.633, 0.0166], note: 'Shipment arrives near Tema Harbor for local receiving and customs clearance.', status: 'Arrived at Tema Harbor' },
  { id: 'customs-clearance', name: 'Tema Customs Clearance Desk', type: 'Customs clearance', city: 'Tema', state: 'Greater Accra', country: 'Ghana', coordinates: [5.652, 0.008], note: 'Import documents are checked before release for delivery.', status: 'Customs Clearance' },
  { id: 'final-delivery', name: 'Ghana Final Delivery Dispatch', type: 'Final delivery', city: 'Customer destination', state: 'Ghana', country: 'Ghana', coordinates: [5.6037, -0.187], note: 'Shipment is dispatched to the customer-entered destination address.', status: 'Out for Delivery' }
];

export const STATUS_OPTIONS = ['Pending Review', 'Shipment Registered', 'Received at U.S. Warehouse', 'Processing', 'In U.S. Transit', 'Ready for Export', 'Departed United States', 'In Overseas Transit', 'Arrived at Tema Harbor', 'Customs Clearance', 'Out for Delivery', 'Delivered', 'Delayed', 'Cancelled'];
export const BOX_SIZES = ['Small Box', 'Medium Box', 'Large Box', 'Extra Large Box', 'Custom Size'];
export const PACKAGE_CATEGORIES = ['Electronics', 'Clothing', 'Documents', 'Personal Goods', 'Auto Parts', 'Commercial Goods', 'Fragile Items', 'Other'];

export const SHIPPING_MODES = {
  air: { label: 'Air Freight', speedKmh: 760, baseDays: 3, handlingDays: 2, description: 'Fast shipment for urgent packages and smaller cargo.' },
  sea: { label: 'Sea Freight', speedKmh: 35, baseDays: 18, handlingDays: 7, description: 'Cost-effective option for bulky boxes, barrels, and non-urgent cargo.' },
  express: { label: 'Express Hybrid', speedKmh: 900, baseDays: 2, handlingDays: 1, description: 'Priority processing with faster dispatch and customs preparation.' }
};

const toRadians = value => (value * Math.PI) / 180;

export function getDistanceKm(pointA, pointB) {
  const [lat1, lon1] = pointA;
  const [lat2, lon2] = pointB;
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getTotalRouteDistance(points = ROUTE_POINTS) {
  return points.reduce((total, point, index) => index === 0 ? total : total + getDistanceKm(points[index - 1].coordinates, point.coordinates), 0);
}

export function getEstimatedDuration(mode = 'air') {
  const selectedMode = SHIPPING_MODES[mode] || SHIPPING_MODES.air;
  const travelDays = getTotalRouteDistance() / selectedMode.speedKmh / 24;
  return Math.ceil(travelDays + selectedMode.baseDays + selectedMode.handlingDays);
}

export function getProgressPercent(index = 0) {
  return Math.round((index / (ROUTE_POINTS.length - 1)) * 100);
}

export function getVolumetricWeight({ length = 0, width = 0, height = 0 }) {
  return Number(((Number(length) * Number(width) * Number(height)) / 5000).toFixed(2));
}

export function getChargeableWeight(shipment) {
  return Math.max(Number(shipment.weightKg || 0), getVolumetricWeight(shipment));
}

export function buildShipment(payload) {
  const currentPointIndex = 0;
  const point = ROUTE_POINTS[currentPointIndex];
  return {
    id: crypto.randomUUID(),
    trackingNumber: payload.trackingNumber || `ST-${Date.now().toString().slice(-8)}`,
    origin: 'United States',
    status: 'Pending Review',
    currentPointIndex,
    estimatedDays: getEstimatedDuration(payload.mode),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    adminNote: 'Shipment submitted and awaiting logistics review.',
    activity: [{ title: 'Shipment request submitted', status: 'Pending Review', location: point.name, time: new Date().toISOString(), note: 'Customer created a shipment request.' }],
    ...payload
  };
}
