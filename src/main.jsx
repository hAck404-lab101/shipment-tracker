import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  BOX_SIZES,
  PACKAGE_CATEGORIES,
  ROUTE_POINTS,
  SHIPPING_MODES,
  STATUS_OPTIONS,
  getChargeableWeight,
  getEstimatedDuration,
  getProgressPercent,
  getTotalRouteDistance,
  getVolumetricWeight
} from './data/routes';
import {
  addShipment,
  clearStoredUser,
  deleteShipment,
  getShipments,
  getStoredUser,
  saveStoredUser
} from './lib/storage';
import { getDashboardStats, updateShipmentCheckpoint, updateShipmentRecord } from './lib/admin';
import {
  Boxes,
  CheckCircle2,
  Clock,
  Globe2,
  LayoutDashboard,
  LogOut,
  MapPin,
  PackagePlus,
  Plane,
  Route,
  Search,
  Settings,
  Ship,
  ShieldCheck,
  Trash2,
  UserRound,
  Warehouse
} from 'lucide-react';
import './styles.css';

const icon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const initialShipmentForm = {
  senderName: '', senderPhone: '', senderEmail: '',
  receiverName: '', receiverPhone: '', receiverEmail: '',
  destinationCountry: 'Ghana', destinationCity: '', destinationAddress: '',
  item: '', category: 'Personal Goods', boxSize: 'Medium Box',
  length: '', width: '', height: '', weightKg: '', quantity: 1,
  declaredValue: '', mode: 'air', pickupOption: 'Warehouse drop-off',
  insured: false, fragile: false, notes: '', trackingNumber: ''
};

function App() {
  const [user, setUser] = useState(getStoredUser());
  const [view, setView] = useState('customer');
  const [shipments, setShipments] = useState(getShipments());
  const [activeShipmentId, setActiveShipmentId] = useState(shipments[0]?.id || null);
  const [loginForm, setLoginForm] = useState({ name: '', email: '', role: 'customer' });
  const [form, setForm] = useState(initialShipmentForm);
  const [adminFilter, setAdminFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const activeShipment = shipments.find(shipment => shipment.id === activeShipmentId) || shipments[0];
  const routeCoordinates = ROUTE_POINTS.map(point => point.coordinates);
  const completedCoordinates = activeShipment ? ROUTE_POINTS.slice(0, activeShipment.currentPointIndex + 1).map(point => point.coordinates) : [ROUTE_POINTS[0].coordinates];
  const currentPoint = activeShipment ? ROUTE_POINTS[activeShipment.currentPointIndex] : ROUTE_POINTS[0];
  const totalDistance = useMemo(() => Math.round(getTotalRouteDistance()), []);
  const stats = getDashboardStats(shipments);

  const filteredShipments = shipments.filter(shipment => {
    const matchesStatus = adminFilter === 'All' || shipment.status === adminFilter;
    const text = `${shipment.trackingNumber} ${shipment.receiverName} ${shipment.item} ${shipment.destinationCity}`.toLowerCase();
    return matchesStatus && text.includes(searchTerm.toLowerCase());
  });

  function refresh() { setShipments(getShipments()); }

  function handleLogin(event) {
    event.preventDefault();
    const createdUser = saveStoredUser({
      name: loginForm.name || 'Shipment Customer',
      email: loginForm.email || 'customer@shipmenttracker.app',
      role: loginForm.role,
      createdAt: new Date().toISOString()
    });
    setUser(createdUser);
    setView(createdUser.role === 'admin' ? 'admin' : 'customer');
  }

  function handleCreateShipment(event) {
    event.preventDefault();
    const shipment = addShipment({ ...form, userEmail: user.email, userName: user.name });
    refresh();
    setActiveShipmentId(shipment.id);
    setForm(initialShipmentForm);
    setView('tracking');
  }

  function handleAdminUpdate(shipment, pointIndex, status, note) {
    updateShipmentCheckpoint(shipment.id, Number(pointIndex), status, note);
    refresh();
  }

  function markDelivered(shipment) {
    updateShipmentRecord(shipment.id, {
      status: 'Delivered',
      currentPointIndex: ROUTE_POINTS.length - 1,
      adminNote: 'Shipment delivered successfully.',
      activity: [{ title: 'Delivered', status: 'Delivered', location: shipment.destinationAddress, city: shipment.destinationCity, time: new Date().toISOString(), note: 'Package received by customer.' }, ...(shipment.activity || [])]
    });
    refresh();
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

  if (!user) return <AuthPage loginForm={loginForm} setLoginForm={setLoginForm} handleLogin={handleLogin} />;

  return (
    <main className="app-shell">
      <aside className="sidebar glass">
        <div className="logo-row"><div className="logo"><Route size={22} /></div><div><strong>Shipment Tracker</strong><span>US → Ghana logistics</span></div></div>
        <div className="user-card"><UserRound size={18} /><div><strong>{user.name}</strong><span>{user.email}</span></div></div>
        <nav className="side-nav">
          <button className={view === 'customer' ? 'active' : ''} onClick={() => setView('customer')}><PackagePlus size={16} /> Create shipment</button>
          <button className={view === 'tracking' ? 'active' : ''} onClick={() => setView('tracking')}><Route size={16} /> Track shipment</button>
          {user.role === 'admin' && <button className={view === 'admin' ? 'active' : ''} onClick={() => setView('admin')}><LayoutDashboard size={16} /> Admin dashboard</button>}
        </nav>
        <div className="storage-note"><ShieldCheck size={16} /> Production-ready interface. Connect Supabase keys for cloud database mode.</div>
        <button className="ghost danger" onClick={logout}><LogOut size={16} /> Logout</button>
      </aside>

      <section className="content">
        <header className="hero glass">
          <div><span className="eyebrow">Production logistics platform</span><h1>Manage cargo from U.S. origin hubs to Ghana delivery.</h1><p>Admin-controlled tracking, shipment records, package details, route checkpoints, and customer-friendly delivery progress.</p></div>
          <div className="hero-stats"><Stat icon={<MapPin />} label="Route distance" value={`${totalDistance.toLocaleString()} km`} /><Stat icon={<Plane />} label="Air estimate" value={`${getEstimatedDuration('air')} days`} /><Stat icon={<Ship />} label="Sea estimate" value={`${getEstimatedDuration('sea')} days`} /></div>
        </header>

        {view === 'customer' && <CreateShipment form={form} setForm={setForm} handleCreateShipment={handleCreateShipment} />}
        {view === 'tracking' && <TrackingView shipments={shipments} activeShipment={activeShipment} setActiveShipmentId={setActiveShipmentId} currentPoint={currentPoint} completedCoordinates={completedCoordinates} routeCoordinates={routeCoordinates} removeShipment={removeShipment} />}
        {view === 'admin' && user.role === 'admin' && <AdminDashboard stats={stats} shipments={filteredShipments} adminFilter={adminFilter} setAdminFilter={setAdminFilter} searchTerm={searchTerm} setSearchTerm={setSearchTerm} handleAdminUpdate={handleAdminUpdate} markDelivered={markDelivered} removeShipment={removeShipment} setActiveShipmentId={setActiveShipmentId} setView={setView} />}
      </section>
    </main>
  );
}

function AuthPage({ loginForm, setLoginForm, handleLogin }) {
  return <main className="auth-page"><section className="auth-card glass"><div className="brand-chip"><Globe2 size={18} /> Shipment Tracker</div><h1>Professional cargo tracking from the United States to Ghana.</h1><p>Sign in as a customer to create shipments or as an admin to manage shipment progress, checkpoints, and delivery statuses.</p><form onSubmit={handleLogin} className="auth-form"><input required placeholder="Full name" value={loginForm.name} onChange={event => setLoginForm({ ...loginForm, name: event.target.value })} /><input required placeholder="Email address" type="email" value={loginForm.email} onChange={event => setLoginForm({ ...loginForm, email: event.target.value })} /><select value={loginForm.role} onChange={event => setLoginForm({ ...loginForm, role: event.target.value })}><option value="customer">Customer Account</option><option value="admin">Admin Account</option></select><button type="submit">Continue</button></form><span className="muted">Use admin mode to control all shipment updates and route movement.</span></section></main>;
}

function CreateShipment({ form, setForm, handleCreateShipment }) {
  const volumetric = getVolumetricWeight(form);
  const chargeable = Math.max(Number(form.weightKg || 0), volumetric);
  return <section className="panel glass"><div className="section-title"><div><h2>Create shipment request</h2><p>Collect sender, receiver, box, customs, and delivery information.</p></div></div><form className="advanced-form" onSubmit={handleCreateShipment}>
    <FormGroup title="Sender details"><input required placeholder="Sender name" value={form.senderName} onChange={e => setForm({ ...form, senderName: e.target.value })} /><input required placeholder="Sender phone" value={form.senderPhone} onChange={e => setForm({ ...form, senderPhone: e.target.value })} /><input required type="email" placeholder="Sender email" value={form.senderEmail} onChange={e => setForm({ ...form, senderEmail: e.target.value })} /></FormGroup>
    <FormGroup title="Receiver and destination"><input required placeholder="Receiver name" value={form.receiverName} onChange={e => setForm({ ...form, receiverName: e.target.value })} /><input required placeholder="Receiver phone" value={form.receiverPhone} onChange={e => setForm({ ...form, receiverPhone: e.target.value })} /><input required type="email" placeholder="Receiver email" value={form.receiverEmail} onChange={e => setForm({ ...form, receiverEmail: e.target.value })} /><input required placeholder="Destination country" value={form.destinationCountry} onChange={e => setForm({ ...form, destinationCountry: e.target.value })} /><input required placeholder="Destination city" value={form.destinationCity} onChange={e => setForm({ ...form, destinationCity: e.target.value })} /><input required placeholder="Final delivery address" value={form.destinationAddress} onChange={e => setForm({ ...form, destinationAddress: e.target.value })} /></FormGroup>
    <FormGroup title="Package details"><input required placeholder="Package name / description" value={form.item} onChange={e => setForm({ ...form, item: e.target.value })} /><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{PACKAGE_CATEGORIES.map(item => <option key={item}>{item}</option>)}</select><select value={form.boxSize} onChange={e => setForm({ ...form, boxSize: e.target.value })}>{BOX_SIZES.map(item => <option key={item}>{item}</option>)}</select><input type="number" min="1" placeholder="Quantity" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /><input type="number" min="0" step="0.1" placeholder="Actual weight in KG" value={form.weightKg} onChange={e => setForm({ ...form, weightKg: e.target.value })} /><input type="number" min="0" placeholder="Length cm" value={form.length} onChange={e => setForm({ ...form, length: e.target.value })} /><input type="number" min="0" placeholder="Width cm" value={form.width} onChange={e => setForm({ ...form, width: e.target.value })} /><input type="number" min="0" placeholder="Height cm" value={form.height} onChange={e => setForm({ ...form, height: e.target.value })} /></FormGroup>
    <FormGroup title="Shipping and customs"><select value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value })}><option value="air">Air Freight</option><option value="sea">Sea Freight</option><option value="express">Express Hybrid</option></select><input type="number" min="0" placeholder="Declared value" value={form.declaredValue} onChange={e => setForm({ ...form, declaredValue: e.target.value })} /><input placeholder="Tracking number, optional" value={form.trackingNumber} onChange={e => setForm({ ...form, trackingNumber: e.target.value })} /><select value={form.pickupOption} onChange={e => setForm({ ...form, pickupOption: e.target.value })}><option>Warehouse drop-off</option><option>Pickup from sender</option><option>Partner shop drop-off</option></select><label className="check"><input type="checkbox" checked={form.insured} onChange={e => setForm({ ...form, insured: e.target.checked })} /> Add insurance</label><label className="check"><input type="checkbox" checked={form.fragile} onChange={e => setForm({ ...form, fragile: e.target.checked })} /> Fragile package</label><textarea placeholder="Special handling notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></FormGroup>
    <div className="quote-card"><strong>Chargeable weight: {chargeable || 0} kg</strong><span>Volumetric weight: {volumetric || 0} kg</span><span>Estimated {SHIPPING_MODES[form.mode].label}: {getEstimatedDuration(form.mode)} days</span></div><button type="submit">Submit shipment request</button></form></section>;
}

function TrackingView({ shipments, activeShipment, setActiveShipmentId, currentPoint, completedCoordinates, routeCoordinates, removeShipment }) {
  if (!activeShipment) return <section className="panel glass"><div className="empty-state"><Boxes size={42} /><p>No shipments available. Create a shipment first.</p></div></section>;
  return <><div className="grid tracking-grid"><section className="map-card glass hide-mobile"><div className="section-title"><div><h2>Shipment route map</h2><p>{activeShipment.trackingNumber}</p></div><span className="status-pill">{activeShipment.status}</span></div><MapContainer center={[22.5, -43]} zoom={3} scrollWheelZoom={false} className="map"><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><Polyline positions={routeCoordinates} /><Polyline positions={completedCoordinates} weight={6} />{ROUTE_POINTS.map((point, index) => <Marker key={point.id} position={point.coordinates} icon={icon}><Popup><strong>{index + 1}. {point.name}</strong><br />{point.city}, {point.country}<br />{point.coordinates[0]}, {point.coordinates[1]}<br />{point.note}</Popup></Marker>)}</MapContainer></section><section className="panel glass"><h2>Tracking summary</h2><div className="tracking-number">{activeShipment.trackingNumber}</div><h3>{activeShipment.item}</h3><p>Receiver: {activeShipment.receiverName}</p><p>Destination: {activeShipment.destinationAddress}, {activeShipment.destinationCity}, {activeShipment.destinationCountry}</p><div className="progress-wrap"><span>{getProgressPercent(activeShipment.currentPointIndex)}% complete</span><div className="progress"><i style={{ width: `${getProgressPercent(activeShipment.currentPointIndex)}%` }} /></div></div><div className="current-point"><MapPin size={18} /><div><strong>{currentPoint.name}</strong><span>{currentPoint.city} • {currentPoint.country}</span></div></div><PackageFacts shipment={activeShipment} /></section></div><section className="lower-grid"><RouteTimeline activeShipment={activeShipment} /><section className="panel glass"><h2>My shipments</h2><div className="shipment-list">{shipments.map(shipment => <button className={`shipment-row ${shipment.id === activeShipment.id ? 'active' : ''}`} key={shipment.id} onClick={() => setActiveShipmentId(shipment.id)}><div><strong>{shipment.trackingNumber}</strong><span>{shipment.item} • {shipment.status}</span></div><Trash2 size={16} onClick={(event) => { event.stopPropagation(); removeShipment(shipment.id); }} /></button>)}</div></section></section></>;
}

function AdminDashboard({ stats, shipments, adminFilter, setAdminFilter, searchTerm, setSearchTerm, handleAdminUpdate, markDelivered, removeShipment, setActiveShipmentId, setView }) {
  return <><section className="stats-grid"><Stat icon={<Boxes />} label="Total" value={stats.total} /><Stat icon={<Clock />} label="Pending" value={stats.pending} /><Stat icon={<Warehouse />} label="In transit" value={stats.transit} /><Stat icon={<CheckCircle2 />} label="Delivered" value={stats.delivered} /></section><section className="panel glass"><div className="section-title"><div><h2>Admin shipment control</h2><p>Update checkpoint, status, notes, and customer tracking progress.</p></div></div><div className="toolbar"><div className="search-box"><Search size={16} /><input placeholder="Search tracking, receiver, city..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div><select value={adminFilter} onChange={e => setAdminFilter(e.target.value)}><option>All</option>{STATUS_OPTIONS.map(status => <option key={status}>{status}</option>)}</select></div><div className="admin-table">{shipments.map(shipment => <AdminRow key={shipment.id} shipment={shipment} handleAdminUpdate={handleAdminUpdate} markDelivered={markDelivered} removeShipment={removeShipment} openTracking={() => { setActiveShipmentId(shipment.id); setView('tracking'); }} />)}{shipments.length === 0 && <p className="muted">No matching shipments.</p>}</div></section></>;
}

function AdminRow({ shipment, handleAdminUpdate, markDelivered, removeShipment, openTracking }) {
  const [pointIndex, setPointIndex] = useState(shipment.currentPointIndex);
  const [status, setStatus] = useState(shipment.status);
  const [note, setNote] = useState(shipment.adminNote || '');
  return <div className="admin-row"><div><strong>{shipment.trackingNumber}</strong><span>{shipment.receiverName} • {shipment.destinationCity}</span><small>{shipment.item} • {shipment.boxSize} • {getChargeableWeight(shipment)} kg chargeable</small></div><select value={pointIndex} onChange={e => setPointIndex(e.target.value)}>{ROUTE_POINTS.map((point, index) => <option value={index} key={point.id}>{index + 1}. {point.name}</option>)}</select><select value={status} onChange={e => setStatus(e.target.value)}>{STATUS_OPTIONS.map(item => <option key={item}>{item}</option>)}</select><input placeholder="Admin note" value={note} onChange={e => setNote(e.target.value)} /><div className="admin-actions"><button onClick={() => handleAdminUpdate(shipment, pointIndex, status, note)}>Update</button><button className="ghost" onClick={() => markDelivered(shipment)}>Delivered</button><button className="ghost" onClick={openTracking}>View</button><button className="ghost danger" onClick={() => removeShipment(shipment.id)}>Delete</button></div></div>;
}

function RouteTimeline({ activeShipment }) {
  return <section className="panel glass"><h2>Route checkpoints</h2><div className="timeline">{ROUTE_POINTS.map((point, index) => <div className={`timeline-item ${index <= activeShipment.currentPointIndex ? 'done' : ''}`} key={point.id}><b>{index + 1}</b><div><strong>{point.name}</strong><span>{point.city}, {point.country} — {point.type}</span><small>{point.note}</small></div></div>)}</div><h2 className="activity-title">Activity log</h2><div className="timeline compact">{(activeShipment.activity || []).map((activity, index) => <div className="timeline-item done" key={`${activity.time}-${index}`}><b>{index + 1}</b><div><strong>{activity.title}</strong><span>{activity.location}</span><small>{new Date(activity.time).toLocaleString()} — {activity.note}</small></div></div>)}</div></section>;
}

function PackageFacts({ shipment }) {
  return <div className="facts-grid"><span>Mode <strong>{SHIPPING_MODES[shipment.mode]?.label}</strong></span><span>Box <strong>{shipment.boxSize}</strong></span><span>Actual weight <strong>{shipment.weightKg || 0} kg</strong></span><span>Chargeable <strong>{getChargeableWeight(shipment)} kg</strong></span><span>Dimensions <strong>{shipment.length || 0}×{shipment.width || 0}×{shipment.height || 0} cm</strong></span><span>Declared value <strong>{shipment.declaredValue || 0}</strong></span><span>Insurance <strong>{shipment.insured ? 'Yes' : 'No'}</strong></span><span>Fragile <strong>{shipment.fragile ? 'Yes' : 'No'}</strong></span></div>;
}

function FormGroup({ title, children }) { return <fieldset><legend>{title}</legend><div className="form-grid">{children}</div></fieldset>; }
function Stat({ icon, label, value }) { return <div className="stat-card">{React.cloneElement(icon, { size: 18 })}<span>{label}</span><strong>{value}</strong></div>; }

createRoot(document.getElementById('root')).render(<App />);
