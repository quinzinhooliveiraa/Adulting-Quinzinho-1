# Casa dos 20

A mobile-first web app to monetize the philosophical reflection book by Quinzinho Oliveira. Targets ages 17-30, freemium model, fully in Brazilian Portuguese.

## Architecture

- **Frontend**: React + Vite + TypeScript, TailwindCSS, shadcn/ui, wouter routing, TanStack Query
- **Backend**: Express.js + TypeScript, express-session with connect-pg-simple
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Session-based with scrypt password hashing (Node crypto)

## Design System
- Fonts: Playfair Display (serif titles) + DM Sans (body)
- Warm white bg: `#faf9f7`
- Glass-card utility for elevated cards
- All UI text in Brazilian Portuguese

## Database Schema (`shared/schema.ts`)
- `users`: id (UUID varchar), username, password, name, email (unique)
- `journal_entries`: id (serial), userId (FK), text, tags (text[]), mood, date, createdAt, updatedAt
- `mood_checkins`: id (serial), userId (FK), mood, entry, tags (text[]), date, createdAt

## Key Files
- `shared/schema.ts` — Drizzle schema + Zod insert schemas + types
- `server/db.ts` — PostgreSQL pool + Drizzle instance
- `server/storage.ts` — IStorage interface + DatabaseStorage implementation
- `server/routes.ts` — Express API routes (auth, journal CRUD, checkins CRUD)
- `client/src/hooks/useAuth.tsx` — AuthProvider context + useAuth hook
- `client/src/hooks/useJournal.ts` — TanStack Query hooks for journal CRUD
- `client/src/hooks/useCheckins.ts` — TanStack Query hooks for mood check-ins
- `client/src/pages/Home.tsx` — Main dashboard with check-ins, reflections, recommendations
- `client/src/pages/Journal.tsx` — Journal entry list + editor
- `client/src/pages/Book.tsx` — Daily reflections content
- `client/src/components/Onboarding.tsx` — Registration flow
- `client/src/components/BlogReflectionEditor.tsx` — Rich reflection editor with drawing/images
- `client/src/components/NotebookEditor.tsx` — Notebook-style text editor
- `client/src/utils/intelligentRecommendation.ts` — Check-in analysis + content recommendations
- `client/src/assets/author.webp` — Quinzinho Oliveira photo

## API Routes
- `POST /api/auth/register` — name, email, password
- `POST /api/auth/login` — email, password
- `GET /api/auth/me` — current user (session)
- `POST /api/auth/logout`
- `GET /api/journal` — list entries (optional `?tag=`)
- `POST /api/journal` — create entry
- `PATCH /api/journal/:id` — update entry
- `DELETE /api/journal/:id` — delete entry
- `GET /api/checkins` — list check-ins
- `GET /api/checkins/latest` — latest check-in
- `POST /api/checkins` — create check-in

## Environment Variables
- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — Express session secret

## localStorage Keys (offline fallback)
- `casa-dos-20-onboarding-complete`
- `casa-dos-20-user-name`
- `casa-dos-20-theme`
- `casa-dos-20-entries`
- `casa-dos-20-last-checkin`
- `casa-dos-20-notifications`

## Amazon Link
https://www.amazon.com.br/Casa-dos-20-Quinzinho-Oliveira/dp/B0CWW9JR92/

## Content
- DAILY_REFLECTIONS types: `"reflection"` (fromBook?: bool), `"tip"`, `"reminder"` — ids: reflections 1-250, tips 301-450, reminders 451-600
