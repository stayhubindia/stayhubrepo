#  GharBazar - Property Rental Marketplace

## 📋 Project Overview

GharBazar is a modern, full-stack property rental marketplace platform that connects property owners with tenants directly, eliminating the need for brokers. The platform features real-time chat, property management, favorites, analytics, and a mobile-first responsive design.

---

## 🛠️ Tech Stack

### **Frontend (Web Application)**

#### Core Framework
- **Next.js 15.5.12** - React framework with App Router
- **React 19** - UI library with latest features
- **TypeScript** - Type-safe development

#### Styling & UI
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **Lucide React** - Modern icon library
- **Custom CSS Animations** - Smooth transitions and effects

#### State Management
- **Zustand** - Lightweight state management
- **TanStack Query (React Query)** - Server state management
- **Persist Middleware** - State persistence

#### Real-time Communication
- **Native WebSocket** - Real-time messaging
- **Django Channels** - WebSocket backend integration
- **React Hot Toast** - Toast notifications

#### Authentication
- **JWT (JSON Web Tokens)** - Secure authentication
- **Firebase Auth** - Google OAuth integration
- **HTTP-only Cookies** - Secure token storage

#### HTTP Client
- **Axios** - Promise-based HTTP client
- **Interceptors** - Request/response handling
- **Error handling** - Centralized error management

#### Development Tools
- **ESLint** - Code linting
- **TypeScript** - Static type checking
- **Hot Module Replacement** - Fast refresh

---

### **Backend (API Server)**

#### Core Framework
- **Django 5.1.4** - Python web framework
- **Django REST Framework 3.15.2** - RESTful API toolkit
- **Python 3.11+** - Programming language

#### Database
- **PostgreSQL** - Primary relational database
- **psycopg2-binary 2.9.10** - PostgreSQL adapter

#### Real-time Features
- **Django Channels 4.1.0** - WebSocket support
- **Channels Redis 4.2.0** - Channel layer backend
- **Redis** - Message broker and caching

#### Authentication & Security
- **djangorestframework-simplejwt 5.4.0** - JWT authentication
- **Firebase Admin SDK** - Google OAuth verification
- **CORS Headers** - Cross-origin resource sharing
- **django-cors-headers 4.6.0** - CORS middleware

#### File Storage
- **Pillow 11.0.0** - Image processing
- **Django Storage** - File upload handling

#### Task Queue
- **Celery 5.4.0** - Asynchronous task queue
- **Redis** - Celery broker

#### API Documentation
- **drf-spectacular 0.28.0** - OpenAPI 3.0 schema generation
- **Swagger UI** - Interactive API documentation

#### Testing
- **pytest** - Testing framework
- **pytest-django** - Django testing utilities
- **Coverage** - Code coverage reporting

#### Development Tools
- **python-dotenv** - Environment variable management
- **django-extensions** - Development utilities

---

## 🏗️ Architecture

### **System Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Browser    │  │    Mobile    │  │   Desktop    │      │
│  │   (Next.js)  │  │  (Responsive)│  │  (Responsive)│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/WSS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Next.js Frontend (Port 3000)            │   │
│  │  • Server-side Rendering (SSR)                       │   │
│  │  • Client-side Routing                               │   │
│  │  • API Route Handlers                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ REST API / WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend Layer                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Django REST API (Port 8000/8005)             │   │
│  │  • RESTful Endpoints                                 │   │
│  │  • JWT Authentication                                │   │
│  │  • Business Logic                                    │   │
│  │  • WebSocket (Django Channels)                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │    Redis     │  │   Celery     │
│   Database   │  │   Cache &    │  │ Task Queue   │
│              │  │   Channels   │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## 📁 Project Structure

### **Frontend Structure**

```
Apps/webapp/
├── app/                          # Next.js App Router
│   ├── account/                  # Account hub page
│   ├── auth/                     # Authentication pages
│   ├── chats/                    # Real-time chat interface
│   ├── dashboard/                # User dashboard
│   │   └── properties/           # Property management
│   │       ├── add/              # Add property form
│   │       └── page.tsx          # My properties list
│   ├── profile/                  # User profile page
│   ├── properties/               # Property listings
│   │   ├── [id]/                 # Property detail page
│   │   └── page.tsx              # Property search
│   ├── signup/                   # Tenant signup
│   ├── owner-signup/             # Owner signup
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Homepage
│   └── globals.css               # Global styles
├── src/
│   ├── components/               # Reusable components
│   │   ├── layout/               # Layout components
│   │   ├── property/             # Property components
│   │   └── providers/            # Context providers
│   ├── hooks/                    # Custom React hooks
│   ├── modules/                  # Feature modules
│   │   ├── auth/                 # Authentication
│   │   ├── communication/        # Chat system
│   │   ├── contacts/             # Contact leads
│   │   ├── favorites/            # Favorites
│   │   └── properties/           # Properties
│   ├── services/                 # API services
│   │   ├── http.ts               # HTTP client
│   │   └── websocket.ts          # WebSocket service
│   ├── store/                    # Zustand stores
│   ├── types/                    # TypeScript types
│   └── lib/                      # Utility functions
└── public/                       # Static assets
```

### **Backend Structure**

```
Server/
├── apps/                         # Django apps
│   ├── analytics/                # Analytics & tracking
│   ├── communication/            # Chat & messaging
│   │   ├── consumers.py          # WebSocket consumers
│   │   ├── routing.py            # WebSocket routing
│   │   ├── models.py             # Conversation & Message
│   │   ├── serializers.py        # API serializers
│   │   ├── services.py           # Business logic
│   │   └── views.py              # API views
│   ├── contacts/                 # Contact leads
│   ├── favorites/                # Favorites system
│   ├── notifications/            # Notifications
│   ├── properties/               # Property management
│   │   ├── models.py             # Property model
│   │   ├── serializers.py        # API serializers
│   │   ├── services.py           # Business logic
│   │   ├── filters.py            # Query filters
│   │   └── views.py              # API views
│   └── users/                    # User management
├── core/                         # Core utilities
│   ├── models.py                 # Base models
│   ├── permissions.py            # Custom permissions
│   ├── throttles.py              # Rate limiting
│   └── exceptions.py             # Custom exceptions
├── server/                       # Django settings
│   ├── settings.py               # Configuration
│   ├── urls.py                   # URL routing
│   ├── asgi.py                   # ASGI config
│   └── wsgi.py                   # WSGI config
└── manage.py                     # Django CLI
```

---

## 🔄 Working Flow

### **1. User Authentication Flow**

```
┌─────────────┐
│   Landing   │
│    Page     │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌──────────────┐
│  Sign Up /  │────▶│   Firebase   │
│  Sign In    │     │    OAuth     │
└──────┬──────┘     └──────┬───────┘
       │                   │
       │◀──────────────────┘
       │ (Google Token)
       ▼
┌─────────────┐
│   Backend   │
│  Validates  │
│   Token     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  JWT Token  │
│  Generated  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Stored    │
│  in Zustand │
│   & Cookie  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Dashboard  │
│  Redirect   │
└─────────────┘
```

### **2. Property Listing Flow**

```
Owner Journey:
┌─────────────┐
│   Owner     │
│  Dashboard  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Add Property│
│    Form     │
│  (4 Steps)  │
└──────┬──────┘
       │
       ├─ Step 1: Property Type & Details
       ├─ Step 2: Location (Create/Select)
       ├─ Step 3: Pricing & Amenities
       └─ Step 4: Review & Submit
       │
       ▼
┌─────────────┐
│   Backend   │
│   Creates   │
│  Property   │
│ (DRAFT)     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Submit    │
│     for     │
│  Approval   │
│ (PENDING)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Admin    │
│  Activates  │
│  Property   │
│  (ACTIVE)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Visible    │
│     to      │
│   Tenants   │
└─────────────┘
```

### **3. Property Search Flow**

```
Tenant Journey:
┌─────────────┐
│   Browse    │
│ Properties  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Search    │
│   Filters   │
│  Applied    │
└──────┬──────┘
       │
       ├─ City
       ├─ Property Type
       ├─ Min/Max Rent
       └─ Search Query
       │
       ▼
┌─────────────┐
│   Backend   │
│   Filters   │
│  & Searches │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Property   │
│    List     │
│  Displayed  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Select    │
│  Property   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Property   │
│   Detail    │
│    Page     │
└──────┬──────┘
       │
       ├─ Add to Favorites
       └─ Chat with Owner
```

### **4. Real-time Chat Flow**

```
┌─────────────┐
│   Tenant    │
│   Clicks    │
│"Chat with   │
│   Owner"    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Create    │
│Conversation │
│  (REST API) │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Redirect   │
│     to      │
│ Chat Page   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  WebSocket  │
│ Connection  │
│  Established│
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌──────────────┐
│   Send      │────▶│   Django     │
│  Message    │     │  Channels    │
└─────────────┘     └──────┬───────┘
       ▲                   │
       │                   ▼
       │            ┌──────────────┐
       │            │    Redis     │
       │            │  Broadcasts  │
       │            └──────┬───────┘
       │                   │
       │                   ▼
       │            ┌──────────────┐
       └────────────│   Receive    │
                    │   Message    │
                    │ (Real-time)  │
                    └──────────────┘
```

### **5. Favorites Flow**

```
┌─────────────┐
│   Tenant    │
│   Clicks    │
│   Heart     │
│    Icon     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  POST /api/ │
│ favorites/  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Backend   │
│   Creates   │
│  Favorite   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Update    │
│     UI      │
│  (Filled    │
│   Heart)    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Visible    │
│     in      │
│  Dashboard  │
│  Wishlist   │
└─────────────┘
```

### **6. Analytics Flow**

```
┌─────────────┐
│    User     │
│   Action    │
└──────┬──────┘
       │
       ├─ Property View
       ├─ Favorite Added
       └─ Contact Created
       │
       ▼
┌─────────────┐
│   Backend   │
│  Increments │
│   Counters  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Property   │
│   Stats     │
│   Updated   │
└──────┬──────┘
       │
       ├─ total_views++
       ├─ total_favorites++
       └─ total_contacts++
       │
       ▼
┌─────────────┐
│   Owner     │
│  Dashboard  │
│   Shows     │
│   Stats     │
└─────────────┘
```

---

## 🔐 Security Features

### **Authentication & Authorization**
- JWT token-based authentication
- HTTP-only cookies for token storage
- Role-based access control (TENANT/OWNER)
- Protected routes with auth guards
- Token refresh mechanism

### **API Security**
- CORS configuration
- Rate limiting (throttling)
- Input validation
- SQL injection prevention (ORM)
- XSS protection

### **WebSocket Security**
- JWT authentication on connection
- User verification middleware
- Conversation access control
- Message validation

### **Data Protection**
- Password hashing (Django default)
- Sensitive data encryption
- Environment variable management
- Secure file uploads

---

## 🚀 Key Features

### **For Tenants**
- ✅ Browse properties with advanced filters
- ✅ Search by location, type, rent range
- ✅ Save favorite properties
- ✅ Real-time chat with owners
- ✅ View property details & images
- ✅ Track inquiries and responses
- ✅ Mobile-first responsive design

### **For Owners**
- ✅ List properties (4-step form)
- ✅ Manage property listings
- ✅ View analytics (views, favorites, contacts)
- ✅ Real-time chat with tenants
- ✅ Mark properties as rented
- ✅ Track property performance
- ✅ Dashboard with insights

### **Admin Features**
- ✅ Approve/reject property listings
- ✅ Manage users
- ✅ View system analytics
- ✅ Moderate content

---

## 📊 Database Schema

### **Core Models**

#### **User**
- id (UUID)
- email (unique)
- name
- phone
- role (TENANT/OWNER)
- location (FK)
- created_at, updated_at

#### **Property**
- id (UUID)
- owner (FK → User)
- location (FK → Location)
- title
- description
- property_type
- rent
- furnishing
- status (DRAFT/PENDING/ACTIVE/RENTED)
- total_views, total_favorites, total_contacts
- created_at, updated_at

#### **Conversation**
- id (UUID)
- property (FK → Property)
- tenant (FK → User)
- owner (FK → User)
- status (ACTIVE/ARCHIVED)
- message_count
- owner_unread_count, tenant_unread_count
- last_message_at

#### **Message**
- id (UUID)
- conversation (FK → Conversation)
- sender (FK → User)
- message_type (TEXT/IMAGE/SYSTEM)
- content
- is_read
- created_at

#### **Favorite**
- id (UUID)
- user (FK → User)
- property (FK → Property)
- created_at

---

## 🔧 Environment Configuration

### **Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
```

### **Backend (.env)**
```env
DEBUG=True
SECRET_KEY=your_secret_key
DATABASE_URL=postgresql://user:pass@localhost:5432/gharbazar
REDIS_URL=redis://localhost:6379/0
FIREBASE_CREDENTIALS_PATH=config/firebase-admin.json
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

---

## 🚀 Deployment

### **Frontend Deployment (Vercel)**
```bash
# Build
npm run build

# Deploy
vercel --prod
```

### **Backend Deployment (Railway/Heroku)**
```bash
# Collect static files
python manage.py collectstatic

# Run migrations
python manage.py migrate

# Start server
daphne -b 0.0.0.0 -p $PORT server.asgi:application
```

### **Required Services**
- PostgreSQL database
- Redis server
- Celery worker
- File storage (AWS S3/Cloudinary)

---

## 📈 Performance Optimizations

### **Frontend**
- Server-side rendering (SSR)
- Image optimization
- Code splitting
- Lazy loading
- React Query caching
- Debounced search

### **Backend**
- Database indexing
- Query optimization
- Redis caching
- Connection pooling
- Pagination
- Async tasks (Celery)

---

## 🧪 Testing

### **Frontend Tests**
```bash
npm test
```

### **Backend Tests**
```bash
python manage.py test
pytest
coverage run -m pytest
```

---

## 📝 API Documentation

Interactive API documentation available at:
- **Swagger UI**: `http://localhost:8000/api/schema/swagger-ui/`
- **ReDoc**: `http://localhost:8000/api/schema/redoc/`
- **OpenAPI Schema**: `http://localhost:8000/api/schema/`

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is proprietary and confidential.

---

## 👥 Team

- **Developer**: Durgesh
- **Project**: GharBazar Property Rental Marketplace
- **Year**: 2025

---

## 📞 Support

For issues or questions:
- Check documentation
- Review API docs
- Check server logs
- Review browser console

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
