# Shipment Tracker

A clean logistics tracking web app for shipments moving from the United States to Ghana. It lets users create a profile, add shipments, view route checkpoints, and track cargo across U.S. hubs, overseas transit, Tema Harbor, and final Ghana delivery.

## Features

- User profile entry for demo access
- Add shipment with recipient, item, shipping mode, destination, and optional tracking number
- U.S. to Ghana route simulation
- Four U.S. checkpoint states before Ghana:
  - New York
  - Pennsylvania
  - Ohio
  - Georgia
  - Florida departure hub
- Ghana receiving store near Tema Harbor Port
- Map route with coordinates, markers, and route lines
- Distance calculation using the Haversine formula
- Estimated delivery days for:
  - Air Freight
  - Sea Freight
  - Express Hybrid
- Shipment progress timeline
- Local storage demo mode
- Optional Supabase setup for real auth/database later
- Mobile responsive UI

## Tech Stack

- React
- Vite
- Leaflet / React Leaflet
- Supabase-ready database schema
- LocalStorage fallback

## Install

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

Open the local URL shown in your terminal.

## Build

```bash
npm run build
```

## Optional Supabase Setup

The app works without Supabase using browser storage. To connect a real database:

1. Create a Supabase project.
2. Open the SQL editor.
3. Run the file in `supabase/schema.sql`.
4. Copy `.env.example` to `.env`.
5. Add your keys:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

The current version includes the Supabase client and schema, but keeps the UI in demo/local mode so it can run immediately.

## Route Logic

Route checkpoints are stored in `src/data/routes.js`. Each checkpoint has:

- name
- type
- city
- country
- latitude/longitude coordinates
- route note

The app calculates total route distance and estimated delivery duration based on shipping mode speed and handling days.

## Deployment

Recommended platforms:

- Vercel
- Netlify
- Render static hosting
- cPanel static deployment after `npm run build`

## Author

Built for Godwin / DiMiles logistics project concept.
