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
- `users`: id (UUID varchar), username, password, name, email (unique), role ("user"|"admin"), isPremium (bool), isActive (bool), trialEndsAt (timestamp), premiumUntil (timestamp), invitedBy (varchar), createdAt
- `journal_entries`: id (serial), userId (FK), text, tags (text[]), mood, date, createdAt, updatedAt
- `mood_checkins`: id (serial), userId (FK), mood, entry, tags (text[]), date, createdAt

## Premium / Freemium Model
- New users get 14-day free trial (trialEndsAt set on registration)
- Card game mode requires premium access (trial, paid, or admin-granted)
- Admin users always have full access
- `getUserPremiumStatus()` in routes.ts determines access: admin > paid > granted > trial > expired > blocked
- Frontend checks `user.hasPremium` from auth context

## Admin System
- Admin role: full access to all features + admin panel at `/admin`
- Admin panel shows: user stats, search/filter users, grant/revoke premium, block/unblock users, invite new users
- Admin API routes: `GET /api/admin/users`, `PATCH /api/admin/users/:id`, `POST /api/admin/invite`, `GET /api/admin/stats`
- Admin middleware: `requireAdmin` checks session userId + role === "admin"
- Current admin: joaquimoliveira.w1@gmail.com

## Key Files
- `shared/schema.ts` — Drizzle schema + Zod insert schemas + types
- `server/db.ts` — PostgreSQL pool + Drizzle instance
- `server/storage.ts` — IStorage interface + DatabaseStorage implementation
- `server/routes.ts` — Express API routes (auth, journal CRUD, checkins CRUD, admin)
- `client/src/hooks/useAuth.tsx` — AuthProvider context + useAuth hook (includes role, hasPremium, premiumReason)
- `client/src/hooks/useJournal.ts` — TanStack Query hooks for journal CRUD
- `client/src/hooks/useCheckins.ts` — TanStack Query hooks for mood check-ins
- `client/src/pages/Home.tsx` — Main dashboard with check-ins, reflections, recommendations
- `client/src/pages/Journal.tsx` — Journal entry list + editor
- `client/src/pages/Questions.tsx` — Card game with solo/conversation modes, premium-gated
- `client/src/pages/Admin.tsx` — Admin dashboard (stats, user management, invites)
- `client/src/pages/Book.tsx` — Daily reflections content
- `client/src/pages/Auth.tsx` — Login/Register page (first page, with Google login button)
- `client/src/components/Onboarding.tsx` — Walkthrough flow (shown only after new registration)
- `client/src/components/BlogReflectionEditor.tsx` — Rich reflection editor with drawing/images
- `client/src/components/NotebookEditor.tsx` — Notebook-style text editor
- `client/src/components/layout/MobileLayout.tsx` — Bottom nav + user menu (admin link for admins)
- `client/src/utils/intelligentRecommendation.ts` — Check-in analysis + content recommendations
- `client/src/assets/author.webp` — Quinzinho Oliveira photo

## API Routes
- `POST /api/auth/register` — name, email, password, inviteCode (optional)
- `POST /api/auth/login` — email, password
- `GET /api/auth/me` — current user with role, hasPremium, premiumReason, trialEndsAt
- `POST /api/auth/logout`
- `GET /api/journal` — list entries (optional `?tag=`)
- `POST /api/journal` — create entry
- `PATCH /api/journal/:id` — update entry
- `DELETE /api/journal/:id` — delete entry
- `GET /api/checkins` — list check-ins
- `GET /api/checkins/latest` — latest check-in
- `POST /api/checkins` — create check-in
- `GET /api/admin/users` — all users with premium status (admin only)
- `PATCH /api/admin/users/:id` — update user role/premium/active (admin only)
- `POST /api/admin/invite` — create user account with temp password (admin only)
- `GET /api/admin/stats` — user statistics dashboard (admin only)

## Environment Variables
- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — Express session secret

## localStorage Keys (offline fallback)
- `casa-dos-20-needs-onboarding`
- `casa-dos-20-user-name`
- `casa-dos-20-theme`
- `casa-dos-20-entries`
- `casa-dos-20-last-checkin`
- `casa-dos-20-notifications`
- `casa-dos-20-profile-photo`
- `casa-dos-20-seen-{title}` — weighted card seen tracking per category

## Amazon Link
https://www.amazon.com.br/Casa-dos-20-Quinzinho-Oliveira/dp/B0CWW9JR92/

## Content
- DAILY_REFLECTIONS types: `"reflection"` (fromBook?: bool), `"tip"`, `"reminder"` — ids: reflections 1-250, tips 301-450, reminders 451-600
