import { ROUTE_POINTS } from '../data/routes';
import { getShipments, saveShipments } from './storage';

export function updateShipmentRecord(id, changes) {
  const updated = getShipments().map(shipment =>
    shipment.id === id
      ? { ...shipment, ...changes, updatedAt: new Date().toISOString() }
      : shipment
  );
  saveShipments(updated);
  return updated.find(shipment => shipment.id === id);
}

export function updateShipmentCheckpoint(id, pointIndex, status, note = '') {
  const shipment = getShipments().find(item => item.id === id);
  const point = ROUTE_POINTS[Number(pointIndex)];
  if (!shipment || !point) return null;

  const activity = [
    {
      title: status || point.status,
      status: status || point.status,
      location: point.name,
      city: `${point.city}, ${point.country}`,
      coordinates: point.coordinates,
      time: new Date().toISOString(),
      note: note || point.note
    },
    ...(shipment.activity || [])
  ];

  return updateShipmentRecord(id, {
    currentPointIndex: Number(pointIndex),
    status: status || point.status,
    adminNote: note || point.note,
    activity
  });
}

export function getDashboardStats(shipments = getShipments()) {
  return {
    total: shipments.length,
    pending: shipments.filter(item => ['Pending Review', 'Shipment Registered'].includes(item.status)).length,
    transit: shipments.filter(item => ['Processing', 'In U.S. Transit', 'Ready for Export', 'Departed United States', 'In Overseas Transit', 'Arrived at Tema Harbor', 'Customs Clearance', 'Out for Delivery'].includes(item.status)).length,
    delivered: shipments.filter(item => item.status === 'Delivered').length,
    delayed: shipments.filter(item => item.status === 'Delayed').length
  };
}
