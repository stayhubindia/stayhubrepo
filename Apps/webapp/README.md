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
```

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
