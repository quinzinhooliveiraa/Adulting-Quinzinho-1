# Casa dos 20

A mobile-first web app to monetize the philosophical reflection book by Quinzinho Oliveira. Targets ages 17-30, freemium model, fully in Brazilian Portuguese.

## Architecture

- **Frontend**: React + Vite + TypeScript, TailwindCSS, shadcn/ui, wouter routing, TanStack Query
- **Backend**: Express.js + TypeScript, express-session with connect-pg-simple
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Session-based with scrypt password hashing (Node crypto), Google Sign-In, Apple Sign-In (native iOS via @capacitor-community/apple-sign-in)
- **WebSocket**: ws library, lobby system at `/ws/lobby` (noServer mode, manual upgrade handling)

## Design System
- Fonts: Playfair Display (serif titles) + DM Sans (body)
- Theme-aware colors using CSS variables (bg-background, text-foreground, bg-card, etc.)
- Glass-card utility for elevated cards
- All UI text in Brazilian Portuguese

## Database Schema (`shared/schema.ts`)
- `users`: id (UUID varchar), username, password, name, email (unique), role ("user"|"admin"), isPremium (bool), isActive (bool), trialEndsAt (timestamp), premiumUntil (timestamp), invitedBy (varchar), googleId, appleId, stripeCustomerId, stripeSubscriptionId, emailVerified, emailVerificationToken, passwordResetToken, passwordResetExpires, journeyOnboardingDone, journeyOrder (text[]), lastActiveAt (timestamp), pwaInstalled (bool), createdAt
- `coupons`: id (serial), code (text unique), type ("premium_days"|"full_premium"), value (integer), maxUses (integer|null), usedCount (integer), expiresAt (timestamp|null), isActive (bool), note (text|null), createdAt
- `coupon_uses`: id (serial), couponId (FK→coupons), userId (FK→users), usedAt (timestamp)
- `journal_entries`: id (serial), userId (FK), text, tags (text[]), mood, date, createdAt, updatedAt
- `mood_checkins`: id (serial), userId (FK), mood, entry, tags (text[]), date, createdAt
- `feedback_tickets`: id (serial), userId (FK), type (feedback/idea/bug/support), subject, message, status, createdAt
- `journey_progress`: id (serial), userId (FK), journeyId (text), completedDays (text[]), startedAt (timestamp), lastActivityAt (timestamp)
- `push_subscriptions`: id (serial), userId (FK), endpoint (text), p256dh (text), auth (text), createdAt (timestamp)

## Profile Photo
- Profile photo stored as base64 JPEG (resized to max 256px, quality 0.7) in `users.profilePhoto` column
- Uploaded via PATCH `/api/auth/profile` with `{ profilePhoto: "data:image/jpeg;base64,..." }`
- Also cached in localStorage for instant display; server is source of truth
- Frontend: MobileLayout.tsx syncs photo from `user.profilePhoto` on login

## Stripe (CONFIGURED - LIVE)
- `STRIPE_SECRET_KEY` is set with a live key (sk_live_...)
- Webhook auto-configured via stripe-replit-sync
- Products/prices synced from Stripe dashboard
- Routes: `/api/stripe/products`, `/api/stripe/checkout`, `/api/stripe/webhook`
- Premium subscription with 14-day trial via Stripe Checkout

## Email (Brevo)
- Transactional emails via Brevo (Sendinblue) API v3
- `BREVO_API_KEY` stored as secret; sender: `quinzinhooliveiraa@gmail.com`
- Client: `server/brevoClient.ts` — single `sendBrevoEmail()` function
- Used for: email verification on registration, password reset links
- Routes:
  - `POST /api/auth/forgot-password` — sends reset link (1-hour expiry)
  - `POST /api/auth/reset-password` — validates token, sets new password, auto-logs in
  - `GET /api/auth/verify-email?token=...` — confirms email
  - `POST /api/auth/resend-verification` — resends verification email
- Frontend: `/reset-password?token=...` page (outside auth gate) for password reset

## Push Notifications (PWA)
- Service worker at `client/public/sw.js` handles push events and notification clicks
- PWA manifest at `client/public/manifest.json` enables "Add to Home Screen"
- VAPID keys stored as env vars: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- Frontend utility: `client/src/utils/pushNotifications.ts` (subscribe, unsubscribe, permission)
- API routes: `/api/push/subscribe`, `/api/push/unsubscribe`, `/api/push/send` (admin), `/api/push/test`, `/api/push/clicked`
- Toggle in user menu (MobileLayout); admin can send to all from Admin > Push tab
- **Push Campaign Analytics**: `push_campaigns` table tracks sent/failed/clicked counts per broadcast
  - Service worker reports clicks to `/api/push/clicked` with `campaignId`
  - Admin sees "Histórico de Envios" with delivery and click-through rates
  - API: `/api/admin/push-campaigns` (GET, admin only)
- Service worker registered on app load in `client/src/main.tsx`
- **Scheduled Notifications**: `scheduled_notifications` table (id, title, body, url, intervalHours, isActive, lastSentAt)
  - Admin UI in Push tab: create/toggle/delete recurring notifications
  - Scheduler runs every 5 min on server, sends due notifications to all subscribers
  - Frequency options: 6h, 12h, daily, 2d, 3d, weekly
  - API: GET/POST `/api/notifications/scheduled`, PATCH/DELETE `/api/notifications/scheduled/:id`

## Jornadas (30-Day Challenges)
- 6 journeys across 2 seasons aligned with book themes: autoconhecimento, propósito, relações, incerteza, crescimento, solidão
- Each journey has 30 daily challenges with types: reflexão, ação, escrita, meditação, desafio, leitura
- Progressive unlock system: complete one journey to unlock the next (admin bypasses)
- **Quiz-based onboarding**: First time opening Jornadas, user sees intro + 8-question deep quiz that personalizes journey order
  - Quiz results saved to `users.journey_order` (text array) and `users.journey_onboarding_done` (boolean)
  - Each question has subtitle providing context; questions probe nighttime thoughts, identity, fears, relationships, purpose, screen habits
  - Each user gets a unique order based on their quiz answers; first journey always unlocked
  - Onboarding only shows once per user
- **Restart journey**: Users can restart any journey from JourneyDetail (RotateCcw icon in header); requires typing "recomeçar" to confirm
- **Access model**: Available during trial (14 days); after trial ends, Jornadas menu shows paywall; progress is NEVER lost
- Progress persisted in DB via `/api/journey/progress`, `/api/journey/start`, `/api/journey/complete-day`, `/api/journey/uncomplete-day`, `/api/journey/onboarding`, `/api/journey/restart`
- **Day unlock**: Next day only accessible after midnight (local time) following completion of previous day; shows "Próxima atividade amanhã" banner
- **Writing challenges**: escrita/reflexao type challenges open inline textarea editor; saved to journal diary on completion
- Journey content defined in `client/src/pages/Journey.tsx` (exported `JOURNEYS` array)

## Email Verification
- Email verification required before accessing the app (full-screen gate in `EmailVerificationGate.tsx`)
- Verification email sent on registration via Resend (`sendVerificationEmail()` in routes.ts)
- Routes: `GET /api/auth/verify-email?token=`, `POST /api/auth/resend-verification`
- Admin users bypass the gate (can use app without verifying)
- DB columns: `emailVerified` (boolean), `emailVerificationToken` (text)
- Gate shows: email address, "Já confirmei" button (re-fetches user), resend button, logout option

## Google OAuth
- Google Sign-In via Google Identity Services library (GSI)
- `GET /api/auth/google-client-id` returns client ID (from `GOOGLE_CLIENT_ID` env var)
- `POST /api/auth/google` decodes Google ID token, creates/finds user by `googleId` or email
- Google users auto-verified (`emailVerified: true`), skip verification gate
- DB column: `googleId` (text) on users table

## Stripe Integration
- Connected via Replit Stripe integration (`server/stripeClient.ts`)
- Products seeded via `scripts/seed-products.ts`: R$9,90/month and R$79,90/year
- Checkout: `POST /api/stripe/checkout` with `{ priceId, trialDays }` → creates Stripe checkout session
- Trial: 14-day free trial with card required (uses `subscription_data.trial_period_days`)
- Products list: `GET /api/stripe/products` returns available plans from DB
- Webhook: `/api/stripe/webhook` registered before express.json() for raw body parsing
- DB columns: `stripeCustomerId`, `stripeSubscriptionId` on users

## Premium / Freemium Model
- New users get 14-day free trial (trialEndsAt set on registration)
- Card game mode requires premium access (trial, paid, or admin-granted)
- Jornadas require premium access (admin has full access)
- Solo/Conversa modes free with 5-question limit per theme; paywall after exhaustion
- **Free user limits**:
  - Journal: 15 entries/month (`FREE_MONTHLY_JOURNAL_LIMIT`), enforced server-side + client banner/popup
  - Room creation: premium only (free users can join rooms created by premium users)
  - API: `GET /api/journal/limit` returns `{ count, limit, remaining }`
- Removing premium (admin sets isPremium=false, clears trialEndsAt/premiumUntil) immediately reverts to free limits

## Journey Completion Report
- AI-generated personalized report at the end of each 30-day journey (Gemini 2.0 Flash via `@google/generative-ai`)
- Endpoint: `POST /api/journey/report` (premium only)
- Analyzes: journal entries tagged with journey name, mood checkins, journey activities completed
- Returns structured JSON: título, resumo, pontosFortes, pontosAtencao, oQueMelhorou, oQuePodeMelhorar, dicaPratica, fraseMotivacional
- Frontend: Full-screen report overlay in JourneyDetail.tsx with color-coded sections

## Journal Categories
- Entries are categorized by source: Diário (📝), Perguntas (💬), Jornadas (🗺️)
- Source detection via tags: "perguntas"/"reflexão" → Perguntas, "jornada" → Jornadas, else → Diário
- Filter tabs at top of Journal page with counts per category
- Color-coded source badges on each entry card (purple=Diário, blue=Perguntas, green=Jornadas)
- Admin users always have full access
- `getUserPremiumStatus()` in routes.ts determines access: admin > paid > granted > trial > expired > blocked
- Frontend checks `user.hasPremium` from auth context

## Onboarding
- Shows ONLY for new registrations (localStorage flag `casa-dos-20-needs-onboarding`)
- Never shows for returning/existing users
- Steps: welcome → checkin → journal → questions → journeys → book → notifications → premium
- Smooth slide animations with staggered fade-in effects
- Premium step: "Começar Trial Grátis" → Stripe checkout with 14-day trial (card required)
- "Continuar grátis por agora" skips premium and enters app

## Admin System
- Admin role: full access to all features + admin panel at `/admin`
- Admin panel shows: user stats, search/filter users, grant/revoke premium, block/unblock users, invite new users, feedback tickets
- Admin email: `quinzinhooliveiraa@gmail.com` — ONLY this email can access admin (enforced in middleware + UI)
- `ADMIN_EMAIL` constant in routes.ts; `requireAdmin` checks session userId + role === "admin" + email match
- Delete user cascades: feedback → checkins → journal → user

## Lobby / Multiplayer System
- WebSocket server at `/ws/lobby` (noServer mode to avoid Vite HMR conflict)
- In-memory lobby state (Map of lobbies, resets on server restart)
- Lobby codes: 5-char alphanumeric, max 8 players
- Flow: create/join lobby → waiting room (share code) → host starts → turn-based card game
- Turn rotation: host or current player can draw next card
- Weighted random cards (unseen pool, resets when all seen)
- Host handoff on disconnect
- WebSocket client uses pending queue pattern: messages sent before connection opens are queued and flushed on `onopen`
- Native share API: uses `navigator.share()` when available on mobile (fallback to social buttons)

## Speech-to-Text / Audio
- Uses Web Speech API (SpeechRecognition / webkitSpeechRecognition)
- Language: pt-BR, continuous mode, interim results
- Shared hook: `client/src/hooks/useSpeechToText.ts`
- Reusable component: `client/src/components/AudioButton.tsx`
- Available in: AnswerSheet (Questions), BlogReflectionEditor, NotebookEditor, Home check-in, Home reflection, Journal textarea
- Browser-native (no external API needed), supported on Chrome/Edge/Safari

## Theme
- Default theme: "system" (follows OS preference)
- Theme stored in localStorage key `casa-dos-20-theme`

## Responsive Layout
- Mobile: bottom navigation bar, max-w-md container
- Desktop (md+): sidebar navigation on the left (collapsible via toggle), full-width content
- Sidebar state stored in localStorage key `casa-dos-20-sidebar-collapsed`
- BlogReflectionEditor: responsive padding and font sizes

## Login Page
- Icon images: `icon-light.png` (door icon for light mode), `icon-dark.png` (door icon for dark mode)
- Uses `useTheme().resolvedTheme` to swap icons dynamically
- Title "Casa dos 20" displayed as text below icon

## Express Body Parser
- JSON limit set to 100mb to support base64 image data in journal entries
- No limit on number of images per reflection

## Journal Features
- Entries show title (first line) + summary (first 120 chars)
- Clickable entries open full detail view with edit/archive/delete/share
- Archive system uses localStorage key `casa-dos-20-archived-entries`
- Entries with images show thumbnail and "fotos" badge
- BlogReflectionEditor supports `initialImages` and `initialBanner` props for editing saved rich entries
- Pinch-to-zoom/rotate on mobile for image manipulation (two-finger gesture)

## Key Files
- `shared/schema.ts` — Drizzle schema + Zod insert schemas + types
- `server/db.ts` — PostgreSQL pool + Drizzle instance
- `server/storage.ts` — IStorage interface + DatabaseStorage implementation
- `server/routes.ts` — Express API routes (auth, journal CRUD, checkins CRUD, admin, feedback, WebSocket lobby)
- `server/vite.ts` — Vite dev server setup with HMR on `/vite-hmr`
- `client/src/hooks/useAuth.tsx` — AuthProvider context + useAuth hook
- `client/src/hooks/useJournal.ts` — TanStack Query hooks for journal CRUD
- `client/src/hooks/useCheckins.ts` — TanStack Query hooks for mood check-ins
- `client/src/hooks/useSpeechToText.ts` — Web Speech API hook for voice-to-text
- `client/src/pages/Home.tsx` — Main dashboard with check-ins, reflections, recommendations
- `client/src/pages/Journal.tsx` — Journal entry list + editor
- `client/src/pages/Questions.tsx` — Card game with solo/conversation/lobby modes
- `client/src/pages/Admin.tsx` — Admin dashboard (stats, user management, invites, feedback tickets)
- `client/src/pages/Book.tsx` — Daily reflections content
- `client/src/pages/Auth.tsx` — Login/Register page
- `client/src/components/Onboarding.tsx` — Walkthrough flow
- `client/src/components/BlogReflectionEditor.tsx` — Rich reflection editor with drawing/images/voice
- `client/src/components/NotebookEditor.tsx` — Notebook-style text editor with voice
- `client/src/components/layout/MobileLayout.tsx` — Bottom nav + user menu

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
- `POST /api/feedback` — submit feedback ticket (auth required)
- `GET /api/admin/feedback` — list feedback tickets (admin only)
- `PATCH /api/admin/feedback/:id` — update ticket status (admin only)
- `GET /api/admin/users` — all users with premium status (admin only)
- `PATCH /api/admin/users/:id` — update user role/premium/active (admin only)
- `DELETE /api/admin/users/:id` — delete user + cascade (admin only)
- `POST /api/admin/invite` — create user account with temp password (admin only)
- `GET /api/admin/stats` — user statistics dashboard (admin only)
- `WS /ws/lobby` — WebSocket lobby for multiplayer card game

## Environment Variables
- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — Express session secret

## localStorage Keys
- `casa-dos-20-needs-onboarding`
- `casa-dos-20-user-name`
- `casa-dos-20-theme`
- `casa-dos-20-entries`
- `casa-dos-20-last-checkin`
- `casa-dos-20-notifications`
- `casa-dos-20-profile-photo`
- `casa-dos-20-seen-{title}` — weighted card seen tracking per category
- `casa-dos-20-archived-entries` — array of archived journal entry IDs

## Mobile Apps (Capacitor)
- **Capacitor** configured with `capacitor.config.ts` for native iOS + Android builds
- App ID: `com.casados20.app`
- `android/` — Android Studio project (portrait-locked, Splash Screen configured)
- `ios/` — Xcode project (portrait-locked)
- Plugins: SplashScreen, StatusBar, Keyboard, Browser, App, PushNotifications, LocalNotifications
- Build: `npx vite build --outDir dist/public && npx cap sync`
- Open: `npx cap open android` / `npx cap open ios`
- Guide: `GUIA_PUBLICACAO_STORES.md` — full step-by-step for Google Play and App Store
- Before publishing to stores, update `capacitor.config.ts` server.url to production URL

## Amazon Link
https://www.amazon.com.br/Casa-dos-20-Quinzinho-Oliveira/dp/B0CWW9JR92/

## Content
- DAILY_REFLECTIONS types: `"reflection"` (fromBook?: bool), `"tip"`, `"reminder"` — ids: reflections 1-250, tips 301-450, reminders 451-600
