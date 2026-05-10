# GharBazar WebApp

Next.js frontend for the GharBazar rental marketplace APIs.

## Stack
- Next.js App Router
- TypeScript
- Tailwind CSS v4
- React Query
- Zustand
- React Hook Form + Zod

## Environment
Create `.env.local` using `.env.local.example`.

```bash
cp .env.local.example .env.local
```

Set API base URL:

```
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8005/api/v1
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_ENABLE_DEBUG_LOGS=false
```

Optional Firebase public keys can also be configured via `.env.local`.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build Cache Recovery
If you ever see chunk errors like `Cannot find module './611.js'` or `/_app` runtime errors:

```bash
npm run clean:next
npm run build
npm run dev
```

## Auth Flow Implemented
- Request OTP: `POST /auth/email-otp/request/`
- Verify OTP: `POST /auth/email-otp/verify/`
- Stores JWT in local auth store after verification.
- Redirects signed-in user to `/dashboard`.

## Quality Commands

```bash
npm run lint
npm run build
npm run test           # Run unit tests
npm run test:watch     # Watch mode for unit tests
npm run test:e2e       # Run E2E tests (requires app running)
npm run test:e2e:ui    # E2E tests in interactive UI mode
npm run test:e2e:headed # E2E tests with visible browser
npm run test:all       # Run lint + unit tests + E2E tests
```

## Testing

### Unit Tests (Vitest)
```bash
npm run test
npm run test:watch
```

Covers:
- Idempotent action guards
- Request signing
- Auth store
- API modules

### E2E Tests (Playwright)

Requires app running: `npm run dev`

```bash
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:debug tests/e2e/auth.spec.ts
```

Covers:
- Auth flow (OTP request/verify)
- Property browse, filter, detail
- Favorites workflow
- Contact/lead creation
- Role-based UI differences (Tenant vs Owner)

See [E2E Testing Guide](./docs/E2E_TESTING.md) for full documentation.


## Current Pages
- `/` landing page
- `/auth` email OTP login/signup
- `/dashboard` auth-aware shell + owner "My Listings" table (`mine=true`)
- `/profile` account profile (`GET/PATCH /users/me/`)
- `/leads` owner lead management table (`/contacts/leads/`)
- `/properties` searchable rental listing page + trending sidebar
- `/properties/[id]` property detail with favorite + contact CTA
- `/notifications` list/unread/mark-read UI

## API Integration Added
- Favorites: `GET/POST /favorites/`, `DELETE /favorites/{property_id}/`
- Property detail: `GET /properties/{id}/`
- User profile: `GET /users/me/`, `PATCH /users/me/`
- Contact owner CTA: `POST /contacts/` with `contact_type=CHAT`
- Owner leads: `GET /contacts/leads/`
- Notifications: `GET /notifications/`, `GET /notifications/unread-count/`, `POST /notifications/{id}/read/`, `POST /notifications/mark-all-read/`

