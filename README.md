# SportVelly

SportVelly is a full-stack live sports commentary application. The backend exposes match and commentary REST APIs, stores data in PostgreSQL with Drizzle ORM, and broadcasts real-time commentary over WebSocket. The frontend is a Vite React app that lists matches, lets users watch a match, loads a small recent commentary context, and then streams new updates live.

## Project Structure

```text
SportVelly/
  backend/              Express, PostgreSQL, Drizzle, WebSocket server
    src/
      db/               Drizzle database client and schema
      routes/           REST routes for matches and commentary
      seed/             API-based seed script for demo data
      validation/       Zod request validation
      ws/               WebSocket server and match subscriptions
    drizzle/            Generated database migrations
  frontend/             Vite + React frontend
    components/         Match cards, live feed, status indicator
    hooks/              Match data and WebSocket hooks
    services/           REST API client
```

## Tech Stack

- Node.js 20
- Express 5
- PostgreSQL
- Drizzle ORM and Drizzle Kit
- Zod
- `ws` WebSocket server
- React 19
- Vite
- Tailwind via CDN in `frontend/index.html`
- Arcjet integration for HTTP/WebSocket protection

## Backend Features

- `GET /matches` lists recent matches.
- `POST /matches` creates a match and broadcasts `match_created`.
- `GET /matches/:id/commentary` lists recent commentary for one match.
- `POST /matches/:id/commentary` creates commentary and broadcasts a `commentary` WebSocket event.
- `GET /` is a simple health endpoint.
- `ws://localhost:8000/ws` accepts live WebSocket clients.
- WebSocket clients subscribe with:

```json
{ "type": "subscribe", "matchId": 10 }
```

The server only broadcasts new commentary after a client subscribes. It does not replay old commentary over WebSocket; old rows are available through the REST commentary endpoint.

## Frontend Features

- Loads matches from the backend REST API.
- Displays match status, teams, scores, and start time.
- Lets the user watch one match at a time.
- Loads a small amount of recent commentary for live matches.
- Receives new commentary over WebSocket and prepends it to the live feed.
- Reconnects the WebSocket automatically with exponential backoff.

## Prerequisites

- Node.js 20.x
- npm
- PostgreSQL database URL, for example Neon or a local Postgres instance

## Environment Variables

Create `backend/.env`:

```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

PORT=8000
HOST=0.0.0.0

ARCJET_KEY="your_arcjet_key"
ARCJET_MODE="DRY_RUN"

API_URL="http://localhost:8000"
DELAY_MS="1500"
CORS_ORIGINS="http://localhost:3000,http://localhost:5173"
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL="http://localhost:8000"
VITE_WS_BASE_URL="ws://localhost:8000/ws"
```

Do not commit real database URLs, API keys, or service tokens.

## Install

From the repository root:

```powershell
cd backend
npm install

cd ..\frontend
npm install
```

## Database Setup

Generate migrations after schema changes:

```powershell
cd backend
npm run db:generate
```

Apply migrations:

```powershell
cd backend
npm run db:migrate
```

## Run Locally

Start the backend:

```powershell
cd backend
npm run dev
```

The backend runs at:

```text
http://localhost:8000
ws://localhost:8000/ws
```

Start the frontend in a second terminal:

```powershell
cd frontend
npm run dev
```

The frontend runs at:

```text
http://localhost:3000
```

## Seed Demo Data

The seed script talks to the backend API, so the backend must be running first.

```powershell
cd backend
npm run seed
```

For a live demo:

1. Start the backend.
2. Start the frontend.
3. Open the frontend and click `Watch Live` on a match.
4. Run `npm run seed` from `backend`.
5. New commentary should arrive gradually in the live feed.

Adjust seed speed with `DELAY_MS` in `backend/.env`.

## API Reference

### List Matches

```http
GET /matches?limit=50
```

Response:

```json
{
  "data": [
    {
      "id": 10,
      "sport": "football",
      "homeTeam": "Arsenal FC",
      "awayTeam": "Liverpool FC",
      "status": "live",
      "startTime": "2026-05-12T18:21:03.922Z",
      "endTime": "2026-05-12T20:21:03.922Z",
      "homeScore": 0,
      "awayScore": 0
    }
  ]
}
```

### Create Match

```http
POST /matches
Content-Type: application/json
```

```json
{
  "sport": "football",
  "homeTeam": "Arsenal FC",
  "awayTeam": "Liverpool FC",
  "startTime": "2026-05-12T18:00:00.000Z",
  "endTime": "2026-05-12T20:00:00.000Z",
  "homeScore": 0,
  "awayScore": 0
}
```

### List Match Commentary

```http
GET /matches/10/commentary?limit=8
```

### Create Commentary

```http
POST /matches/10/commentary
Content-Type: application/json
```

```json
{
  "minute": 12,
  "sequence": 120,
  "period": "1st half",
  "eventType": "save",
  "team": "Liverpool FC",
  "actor": "Mohamed Salah",
  "message": "Goalkeeper makes a strong save at the near post. (Liverpool FC)",
  "metadata": { "assist": "Sam Kerr" },
  "tags": ["save"]
}
```

`metadata` and `tags` default to `{}` and `[]` when omitted.

## WebSocket Messages

Connect:

```text
ws://localhost:8000/ws
```

Subscribe:

```json
{ "type": "subscribe", "matchId": 10 }
```

Unsubscribe:

```json
{ "type": "unsubscribe", "matchId": 10 }
```

Commentary event:

```json
{
  "type": "commentary",
  "data": {
    "id": 1,
    "matchId": 10,
    "minute": 12,
    "sequence": 120,
    "period": "1st half",
    "eventType": "save",
    "message": "Goalkeeper makes a strong save at the near post. (Liverpool FC)"
  }
}
```

## Deployment Notes

### Backend on Render

Use these settings for a Node web service:

- Language: Node
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/`
- Environment variables: `DATABASE_URL`, `ARCJET_KEY`, `ARCJET_MODE`, `CORS_ORIGINS`, `API_URL`

Run migrations before deployment only after confirming your database credentials and migration safety:

```text
npm run db:migrate
```

### Frontend

Set the production API and WebSocket URLs:

```env
VITE_API_BASE_URL="https://your-backend-host"
VITE_WS_BASE_URL="wss://your-backend-host/ws"
```

Build command:

```text
npm run build
```

Publish directory:

```text
dist
```

## Troubleshooting

### Frontend cannot load matches

- Confirm backend is running on `http://localhost:8000`.
- Confirm `frontend/.env` has `VITE_API_BASE_URL`.
- Restart Vite after changing `.env`.
- Confirm backend `CORS_ORIGINS` includes the frontend origin.

### WebSocket connects but no commentary appears

- Click `Watch Live` before inserting new commentary.
- Subscribe to the actual database match id shown in the UI.
- WebSocket only sends future updates. Use `GET /matches/:id/commentary` for old rows.
- Run `npm run seed` while the frontend is already watching a match.

### Seed fails with `Failed to create commentary: 400`

- Check backend validation errors in the API response.
- Ensure required commentary fields are present: `minute`, `sequence`, `period`, `eventType`, `actor`, `team`, and `message`.
- `metadata` and `tags` may be omitted because the API provides defaults.

### Port already in use

Use a different port or stop the existing process:

```powershell
$env:PORT=8010; npm run dev
```

### PowerShell blocks `npm`

Use the Windows npm shim:

```powershell
npm.cmd run dev
npm.cmd run build
```

## Scripts

Backend:

```text
npm run dev
npm start
npm run db:generate
npm run db:migrate
npm run seed
```

Frontend:

```text
npm run dev
npm run build
npm run preview
```

## Security Notes

- Rotate any secrets that were committed or shared accidentally.
- Keep real `.env` files out of git.
- Use `wss://` for WebSocket connections in production.
- Restrict `CORS_ORIGINS` to known frontend origins in production.
- Keep Arcjet enabled in production after verifying the allowed traffic patterns.
