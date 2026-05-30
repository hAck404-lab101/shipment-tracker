# Shipment Tracker

A production-focused logistics tracking web app for shipments moving from the United States to Ghana. Customers create shipment requests with full package and destination details, while admins control shipment progress, checkpoints, delivery status, and tracking notes.

## Core Features

- Customer account entry
- Admin account entry
- Create shipment requests with sender, receiver, destination, box, weight, customs, and shipping details
- Admin dashboard for managing every shipment
- Admin-controlled checkpoint and status updates
- UPS-style tracking summary and mobile-friendly route timeline
- Desktop route map with OpenStreetMap/Leaflet
- Route checkpoints from the U.S. to Ghana
- Tema Harbor Port receiving store and customs checkpoint
- Air, sea, and express delivery estimates
- Haversine route distance calculation
- Volumetric weight and chargeable weight calculation
- Activity log for shipment history
- Search and filter shipments by tracking number, receiver, city, and status
- Supabase-ready database schema

## Route Checkpoints

The route starts in the United States and passes through multiple logistics points before Ghana:

1. New York Export Warehouse
2. Pennsylvania Sorting Center
3. Ohio Consolidation Store
4. Georgia Export Documentation Hub
5. Florida Air & Sea Departure Terminal
6. Atlantic International Transit
7. Tema Harbor Port Receiving Store
8. Tema Customs Clearance Desk
9. Ghana Final Delivery Dispatch

## Shipment Details Collected

- Sender name, phone, and email
- Receiver name, phone, and email
- Destination country, city, and final delivery address
- Package name / description
- Package category
- Box size
- Quantity
- Actual weight
- Box dimensions
- Declared value
- Shipping method
- Pickup option
- Insurance option
- Fragile package option
- Special handling notes

## Admin Features

- View total, pending, in-transit, delivered, and delayed shipments
- Search shipment records
- Filter by status
- Update current checkpoint
- Update shipment status
- Add admin note
- Mark shipment as delivered
- Delete shipment records
- Open a shipment in the tracking page

## Tech Stack

- React
- Vite
- Leaflet / React Leaflet
- Supabase-ready schema
- Browser storage fallback for immediate use

## Install

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Supabase Setup

The interface runs immediately with browser storage, but the project includes a production database schema.

1. Create a Supabase project.
2. Open Supabase SQL Editor.
3. Run `supabase/schema.sql`.
4. Copy `.env.example` to `.env`.
5. Add your keys:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Deployment

Recommended deployment settings for Vercel:

```txt
Build command: npm run build
Output directory: dist
```

## Author

Built for Godwin / DiMiles logistics project concept.
