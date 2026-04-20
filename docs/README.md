# GharBazar - Rental Property Platform

A modern, full-stack rental property platform connecting property owners directly with tenants. Built with Django REST Framework and Next.js.

## Features

- **Dual User Roles**: Separate interfaces for property owners and tenants
- **Property Management**: Complete CRUD operations for property listings
- **Search & Filters**: Advanced search with city, property type, and rent range filters
- **Favorites System**: Tenants can save favorite properties
- **Contact Management**: Direct communication between owners and tenants
- **Real-time Analytics**: Track views, favorites, and contacts for each property
- **Mobile-First Design**: Responsive UI optimized for mobile devices
- **Authentication**: Email OTP and Google OAuth integration
- **Profile Management**: Complete user profile with location support

## Tech Stack

### Backend
- **Framework**: Django 5.x + Django REST Framework
- **Database**: PostgreSQL
- **Cache**: Redis
- **Task Queue**: Celery
- **Real-time**: Django Channels
- **Storage**: Cloudinary (images)
- **Email**: Brevo API

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Authentication**: Firebase Auth
- **HTTP Client**: Axios

## Project Structure

```
GharBazar_Project/
├── Server/                 # Django backend
│   ├── apps/              # Django apps
│   │   ├── users/         # User management
│   │   ├── properties/    # Property listings
│   │   ├── favorites/     # Favorites system
│   │   ├── contacts/      # Contact management
│   │   ├── notifications/ # Notifications
│   │   ├── communication/ # Messaging
│   │   └── analytics/     # Analytics
│   ├── core/              # Core settings
│   └── server/            # Project settings
│
└── Apps/
    └── webapp/            # Next.js frontend
        ├── app/           # App router pages
        ├── src/           # Source code
        │   ├── components/
        │   ├── modules/
        │   ├── services/
        │   ├── store/
        │   └── types/
        └── public/        # Static assets
```

## Setup Instructions

### Prerequisites
- Python 3.12+
- Node.js 18+
- PostgreSQL 14+
- Redis 7+

### Backend Setup

1. Navigate to Server directory:
```bash
cd Server
```

2. Create virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file (use `.env.example` as template):
```bash
cp .env.example .env
```

5. Configure environment variables in `.env`:
- Database credentials
- Redis URL
- Secret keys
- Firebase credentials
- Cloudinary credentials
- Brevo API key

6. Run migrations:
```bash
python manage.py migrate
```

7. Create superuser:
```bash
python manage.py createsuperuser
```

8. Run development server:
```bash
python manage.py runserver
```

### Frontend Setup

1. Navigate to webapp directory:
```bash
cd Apps/webapp
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file (use `.env.local.example` as template):
```bash
cp .env.local.example .env.local
```

4. Configure Firebase credentials in `.env.local`

5. Run development server:
```bash
npm run dev
```

6. Build for production:
```bash
npm run build
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/request-otp/` - Request OTP
- `POST /api/v1/auth/verify-otp/` - Verify OTP
- `POST /api/v1/auth/google/` - Google OAuth login
- `POST /api/v1/auth/refresh/` - Refresh access token

### Properties
- `GET /api/v1/properties/` - List properties
- `POST /api/v1/properties/` - Create property
- `GET /api/v1/properties/{id}/` - Get property details
- `PATCH /api/v1/properties/{id}/` - Update property
- `POST /api/v1/properties/{id}/submit/` - Submit for approval
- `POST /api/v1/properties/{id}/mark-rented/` - Mark as rented

### Favorites
- `GET /api/v1/favorites/` - List favorites
- `POST /api/v1/favorites/` - Add favorite
- `DELETE /api/v1/favorites/{id}/` - Remove favorite

### Contacts
- `GET /api/v1/contacts/` - List contacts
- `POST /api/v1/contacts/` - Create contact

## Environment Variables

### Backend (.env)
```
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
PSQL_DB_NAME=gharbazar
PSQL_USER=postgres
PSQL_PASSWORD=your-password
PSQL_HOST=localhost
PSQL_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/0

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Brevo
BREVO_API_KEY=your-brevo-key
BREVO_SENDER_EMAIL=noreply@gharbazar.com
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## Features in Detail

### For Property Owners
- Add and manage property listings
- Track property performance (views, favorites, contacts)
- Receive contact requests from interested tenants
- Mark properties as rented
- Profile management with location

### For Tenants
- Browse and search properties
- Filter by city, type, and rent range
- Save favorite properties
- Contact property owners directly
- Profile management

## Development

### Running Tests
```bash
# Backend
cd Server
python manage.py test

# Frontend
cd Apps/webapp
npm test
```

### Code Quality
```bash
# Backend
black .
flake8 .

# Frontend
npm run lint
npm run type-check
```

## Deployment

### Backend (Django)
- Configure production settings
- Set DEBUG=False
- Use environment variables for secrets
- Set up PostgreSQL and Redis
- Configure Gunicorn/uWSGI
- Set up Nginx reverse proxy

### Frontend (Next.js)
- Build production bundle: `npm run build`
- Deploy to Vercel/Netlify or self-host
- Configure environment variables
- Set up CDN for static assets

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is private and proprietary.

## Contact

For questions or support, please contact the development team.
