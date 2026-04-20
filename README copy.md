# StayHub — Rental Platform

A full-stack rental property platform for India with a Django REST API backend, Next.js web app, and Flutter mobile app.

## Project Structure

```
GharBazar_Project/
├── Server/          # Django REST API + WebSocket backend
├── Apps/
│   ├── webapp/      # Next.js 15 web application
│   └── stayhub/     # Flutter mobile app (Android/iOS)
└── docs/            # Architecture & API documentation
```

## Tech Stack

| Layer    | Technology                                      |
|----------|-------------------------------------------------|
| Backend  | Django 5, Django REST Framework, Django Channels |
| Database | PostgreSQL (Supabase), Redis                    |
| Auth     | Firebase Authentication, JWT                   |
| Web App  | Next.js 15, TypeScript, Tailwind CSS, Zustand  |
| Mobile   | Flutter 3, Riverpod 3, GoRouter                |
| Storage  | Cloudinary                                     |
| Email    | Brevo (Sendinblue)                             |
| Tasks    | Celery + Redis                                 |

## Getting Started

### Backend (Django)

```bash
cd Server
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # Fill in your credentials
python manage.py migrate
python manage.py runserver
```

### Web App (Next.js)

```bash
cd Apps/webapp
npm install
cp .env.local.example .env.local  # Fill in your credentials
npm run dev
```

### Mobile App (Flutter)

```bash
cd Apps/stayhub
flutter pub get
# Add google-services.json to android/app/ from Firebase Console
flutter run
```

## Environment Variables

Each app has an `.env.example` file listing all required variables:

- `Server/.env.example` — Django backend
- `Apps/webapp/.env.local.example` — Next.js web app
- `Apps/webapp/src/config/.env.example` — Firebase client config

## Features

- Property listings with search, filters, and image uploads
- Owner and tenant onboarding flows
- Real-time chat (WebSocket via Django Channels)
- Firebase Authentication (email/password, Google Sign-In)
- Email OTP verification
- Analytics dashboard for owners
- Favourites, notifications, lead management

## License

MIT
