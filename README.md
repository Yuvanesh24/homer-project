# HOMER - Home-Based Upper Extremity Rehabilitation

Clinical research management system for tracking 60 patients undergoing home-based upper arm rehabilitation therapy.

## Tech Stack
- **Frontend:** React, TypeScript, Tailwind CSS, Zustand
- **Backend:** Node.js, Express, Prisma, PostgreSQL

---

## Quick Start (Your Current Setup)

### Option 1: Docker + Manual (Current - Recommended for Development)

1. **Start PostgreSQL:**
```bash
docker run -d --name homer-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=homer_db -p 5432:5432 postgres:15
```

2. **Backend:**
```bash
cd backend
npm install
npm run db:push
npm run db:seed
npm run dev
```

3. **Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Easy Ways to Run (Choose One)

### Option 1: Docker Compose (Simplest - Single Command)

```bash
cd homer-project
docker-compose up -d
```

This starts PostgreSQL automatically. Then run backend and frontend:
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

### Option 2: Using npm-run-all (Run both in one terminal)

```bash
# Install in backend folder
cd backend
npm install npm-run-all --save-dev

# Add this script to package.json:
# "start:all": "npm-run-all --parallel dev:backend dev:frontend"

# Run both:
npm run start:all
```

### Option 3: Using concurrently

```bash
cd homer-project
npm install -g concurrently

# Run both services:
concurrently "cd backend && npm run dev" "cd frontend && npm run dev"
```

---

## Syncing Data Between Devices

### Method 1: JSON Export/Import (Recommended)

1. **Export data from Device A:**
   - Go to Reports page
   - Click "Export All Data (JSON)"
   - Save the `.json` file

2. **Import to Device B:**
   - Go to Reports page  
   - Click "Import Data (JSON)"
   - Select the file
   - Choose "Merge" (keeps existing data) or "Replace" (deletes all first)

**What's exported:** Patients, Devices, SIMs, Sessions, Adverse Events, Issues, Reminders, Study Events

### Method 2: Dropbox Sync (Manual)

1. Create a Dropbox account (free 2GB)
2. Install Dropbox on both computers
3. Export JSON on Device A → Save to Dropbox folder
4. On Device B → Copy from Dropbox → Import

### Method 3: Google Drive / OneDrive

Same as Dropbox - export to a cloud-synced folder.

---

## Setting Up on Friend's Laptop

### Prerequisites Needed:
1. **Docker Desktop** - https://www.docker.com/products/docker-desktop
2. **Node.js 18+** - https://nodejs.org

### Steps:

1. **Copy the project folder** to friend's laptop (or share via Google Drive/Dropbox)

2. **Start PostgreSQL:**
```bash
docker run -d --name homer-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=homer_db -p 5432:5432 postgres:15
```

3. **Setup Backend:**
```bash
cd homer-project/backend
npm install
npm run db:push
npm run dev
```

4. **Setup Frontend:**
```bash
cd homer-project/frontend
npm install
npm run dev
```

5. **Access:** Open http://localhost:5173

### First-Time Sync:
- On YOUR laptop: Go to Reports → Export All Data (JSON)
- Copy the file to friend's laptop (via USB/email/Dropbox)
- On friend's laptop: Go to Reports → Import Data (JSON)

---

## Features
- Patient Management with auto-generated timeline
- Device & SIM Card Tracking
- Adverse Event Logging
- Session Logs (Intervention/Control groups)
- Dashboard with reminders
- CSV Export
- **JSON Backup & Sync** (NEW)

---

## API
Backend: `http://localhost:3001`  
Frontend: `http://localhost:5173`
