import { buildShipment } from '../data/routes';

const SHIPMENTS_KEY = 'shipment-tracker-shipments';
const USER_KEY = 'shipment-tracker-user';

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export function clearStoredUser() {
  localStorage.removeItem(USER_KEY);
}

export function getShipments() {
  const raw = localStorage.getItem(SHIPMENTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveShipments(shipments) {
  localStorage.setItem(SHIPMENTS_KEY, JSON.stringify(shipments));
  return shipments;
}

export function addShipment(payload) {
  const shipment = buildShipment(payload);
  const updated = [shipment, ...getShipments()];
  saveShipments(updated);
  return shipment;
}

export function updateShipment(id, changes) {
  const updated = getShipments().map(shipment =>
    shipment.id === id ? { ...shipment, ...changes } : shipment
  );
  saveShipments(updated);
  return updated.find(shipment => shipment.id === id);
}

export function deleteShipment(id) {
  const updated = getShipments().filter(shipment => shipment.id !== id);
  saveShipments(updated);
  return updated;
}
