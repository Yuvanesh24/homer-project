# HOMER - Home-Based Upper Extremity Rehabilitation

Clinical research management system for tracking 60 patients undergoing home-based upper arm rehabilitation therapy.

## Tech Stack
- **Frontend:** React, TypeScript, Tailwind CSS, Zustand
- **Backend:** Node.js, Express, Prisma, PostgreSQL

## Quick Start

### Prerequisites
- Docker Desktop
- Node.js 18+

### Setup

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

### Login
- Email: `admin@homer.org`
- Password: `admin123`

## Features
- Patient Management with auto-generated timeline
- Device & SIM Card Tracking
- Adverse Event Logging
- Session Logs (Intervention/Control groups)
- Dashboard with reminders
- CSV Export

## API
Backend: `http://localhost:3001`  
Frontend: `http://localhost:5173`
