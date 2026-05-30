import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  ROUTE_POINTS,
  SHIPPING_MODES,
  DEFAULT_USER,
  getEstimatedDuration,
  getProgressPercent,
  getTotalRouteDistance
} from './data/routes';
import {
  addShipment,
  clearStoredUser,
  deleteShipment,
  getShipments,
  getStoredUser,
  saveStoredUser,
  updateShipment
} from './lib/storage';
import { isSupabaseConfigured } from './lib/supabase';
import {
  Boxes,
  Clock,
  Globe2,
  LogOut,
  MapPin,
  PackagePlus,
  Plane,
  Route,
  Ship,
  ShieldCheck,
  Trash2,
  UserRound
} from 'lucide-react';
import './styles.css';

const icon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

function App() {
  const [user, setUser] = useState(getStoredUser());
  const [shipments, setShipments] = useState(getShipments());
  const [activeShipmentId, setActiveShipmentId] = useState(shipments[0]?.id || null);
  const [loginForm, setLoginForm] = useState({ name: '', email: '' });
  const [form, setForm] = useState({
    recipient: '',
    item: '',
    mode: 'air',
    destination: 'Tema / Accra, Ghana',
    trackingNumber: ''
  });

  const activeShipment = shipments.find(shipment => shipment.id === activeShipmentId) || shipments[0];
  const routeCoordinates = ROUTE_POINTS.map(point => point.coordinates);
  const completedCoordinates = activeShipment
    ? ROUTE_POINTS.slice(0, activeShipment.currentPointIndex + 1).map(point => point.coordinates)
    : [ROUTE_POINTS[0].coordinates];
  const currentPoint = activeShipment ? ROUTE_POINTS[activeShipment.currentPointIndex] : ROUTE_POINTS[0];
  const totalDistance = useMemo(() => Math.round(getTotalRouteDistance()), []);

  function handleLogin(event) {
    event.preventDefault();
    const createdUser = saveStoredUser({
      name: loginForm.name || DEFAULT_USER.name,
      email: loginForm.email || DEFAULT_USER.email,
      createdAt: new Date().toISOString()
    });
    setUser(createdUser);
  }

  function handleCreateShipment(event) {
    event.preventDefault();
    const shipment = addShipment(form);
    const updated = getShipments();
    setShipments(updated);
    setActiveShipmentId(shipment.id);
    setForm({
      recipient: '',
      item: '',
      mode: 'air',
      destination: 'Tema / Accra, Ghana',
      trackingNumber: ''
    });
  }

  function moveShipment(shipment, direction) {
    const nextIndex = Math.max(0, Math.min(ROUTE_POINTS.length - 1, shipment.currentPointIndex + direction));
    const point = ROUTE_POINTS[nextIndex];
    updateShipment(shipment.id, {
      currentPointIndex: nextIndex,
      status: nextIndex === ROUTE_POINTS.length - 1 ? 'Delivered in Ghana' : `Arrived at ${point.name}`
    });
    setShipments(getShipments());
  }

  function removeShipment(id) {
    const updated = deleteShipment(id);
    setShipments(updated);
    setActiveShipmentId(updated[0]?.id || null);
  }

  function logout() {
    clearStoredUser();
    setUser(null);
  }

  if (!user) {
    return (
      <main className="auth-page">
        <section className="auth-card glass">
          <div className="brand-chip"><Globe2 size={18} /> Shipment Tracker</div>
          <h1>Track U.S. shipments from warehouse to Ghana.</h1>
          <p>Create a customer profile, add a shipment, and watch the route move from America through export hubs, across the Atlantic, to Tema Harbor.</p>
          <form onSubmit={handleLogin} className="auth-form">
            <input placeholder="Full name" value={loginForm.name} onChange={event => setLoginForm({ ...loginForm, name: event.target.value })} />
            <input placeholder="Email address" type="email" value={loginForm.email} onChange={event => setLoginForm({ ...loginForm, email: event.target.value })} />
            <button type="submit">Enter dashboard</button>
          </form>
          <span className="muted">Demo mode uses browser storage. Supabase schema is included for real authentication and database storage.</span>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar glass">
        <div className="logo-row">
          <div className="logo"><Route size={22} /></div>
          <div>
            <strong>Shipment Tracker</strong>
            <span>US → Ghana logistics</span>
          </div>
        </div>

        <div className="user-card">
          <UserRound size={18} />
          <div>
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
        </div>

        <form className="shipment-form" onSubmit={handleCreateShipment}>
          <h2><PackagePlus size={18} /> Add shipment</h2>
          <input required placeholder="Recipient name" value={form.recipient} onChange={event => setForm({ ...form, recipient: event.target.value })} />
          <input required placeholder="Item / package description" value={form.item} onChange={event => setForm({ ...form, item: event.target.value })} />
          <input placeholder="Tracking number, optional" value={form.trackingNumber} onChange={event => setForm({ ...form, trackingNumber: event.target.value })} />
          <select value={form.mode} onChange={event => setForm({ ...form, mode: event.target.value })}>
            <option value="air">Air Freight</option>
            <option value="sea">Sea Freight</option>
            <option value="express">Express Hybrid</option>
          </select>
          <input value={form.destination} onChange={event => setForm({ ...form, destination: event.target.value })} />
          <button type="submit">Create shipment</button>
        </form>

        <div className="storage-note">
          <ShieldCheck size={16} />
          {isSupabaseConfigured ? 'Supabase keys detected.' : 'Demo storage active. Add Supabase keys when ready.'}
        </div>

        <button className="ghost danger" onClick={logout}><LogOut size={16} /> Logout</button>
      </aside>

      <section className="content">
        <header className="hero glass">
          <div>
            <span className="eyebrow">Live logistics dashboard</span>
            <h1>Track cargo from the United States to Tema Harbor.</h1>
            <p>Coordinates, route lines, checkpoints, distance estimates, and air/sea timelines are calculated inside the app.</p>
          </div>
          <div className="hero-stats">
            <Stat icon={<MapPin />} label="Route distance" value={`${totalDistance.toLocaleString()} km`} />
            <Stat icon={<Plane />} label="Air estimate" value={`${getEstimatedDuration('air')} days`} />
            <Stat icon={<Ship />} label="Sea estimate" value={`${getEstimatedDuration('sea')} days`} />
          </div>
        </header>

        <div className="grid">
          <section className="map-card glass">
            <div className="section-title">
              <div>
                <h2>Shipment route map</h2>
                <p>{activeShipment ? activeShipment.trackingNumber : 'Create a shipment to activate tracking.'}</p>
              </div>
              {activeShipment && <span className="status-pill">{activeShipment.status}</span>}
            </div>

            <MapContainer center={[22.5, -43]} zoom={3} scrollWheelZoom={false} className="map">
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Polyline positions={routeCoordinates} />
              <Polyline positions={completedCoordinates} weight={6} />
              {ROUTE_POINTS.map((point, index) => (
                <Marker key={point.id} position={point.coordinates} icon={icon}>
                  <Popup>
                    <strong>{index + 1}. {point.name}</strong><br />
                    {point.city}<br />
                    {point.coordinates[0]}, {point.coordinates[1]}<br />
                    {point.note}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </section>

          <section className="panel glass">
            <div className="section-title">
              <div>
                <h2>Active shipment</h2>
                <p>Move package through checkpoints manually for demo.</p>
              </div>
            </div>

            {activeShipment ? (
              <div className="active-details">
                <div className="tracking-number">{activeShipment.trackingNumber}</div>
                <h3>{activeShipment.item}</h3>
                <p>Recipient: {activeShipment.recipient}</p>
                <p>Destination: {activeShipment.destination}</p>
                <div className="progress-wrap">
                  <span>{getProgressPercent(activeShipment.currentPointIndex)}% complete</span>
                  <div className="progress"><i style={{ width: `${getProgressPercent(activeShipment.currentPointIndex)}%` }} /></div>
                </div>
                <div className="current-point">
                  <MapPin size={18} />
                  <div>
                    <strong>{currentPoint.name}</strong>
                    <span>{currentPoint.city} • {currentPoint.country}</span>
                  </div>
                </div>
                <div className="button-row">
                  <button className="ghost" onClick={() => moveShipment(activeShipment, -1)}>Previous point</button>
                  <button onClick={() => moveShipment(activeShipment, 1)}>Next checkpoint</button>
                </div>
              </div>
            ) : (
              <div className="empty-state"><Boxes size={42} /><p>No shipments yet. Add your first package from the left panel.</p></div>
            )}
          </section>
        </div>

        <section className="lower-grid">
          <div className="panel glass">
            <h2>Route checkpoints</h2>
            <div className="timeline">
              {ROUTE_POINTS.map((point, index) => (
                <div className={`timeline-item ${activeShipment && index <= activeShipment.currentPointIndex ? 'done' : ''}`} key={point.id}>
                  <b>{index + 1}</b>
                  <div>
                    <strong>{point.name}</strong>
                    <span>{point.city} — {point.type}</span>
                    <small>{point.coordinates[0]}, {point.coordinates[1]}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel glass">
            <h2>Saved shipments</h2>
            <div className="shipment-list">
              {shipments.map(shipment => (
                <button className={`shipment-row ${shipment.id === activeShipment?.id ? 'active' : ''}`} key={shipment.id} onClick={() => setActiveShipmentId(shipment.id)}>
                  <div>
                    <strong>{shipment.trackingNumber}</strong>
                    <span>{shipment.item} • {SHIPPING_MODES[shipment.mode].label}</span>
                  </div>
                  <Trash2 size={16} onClick={(event) => { event.stopPropagation(); removeShipment(shipment.id); }} />
                </button>
              ))}
              {shipments.length === 0 && <p className="muted">No saved shipments yet.</p>}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="stat-card">
      {React.cloneElement(icon, { size: 18 })}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
