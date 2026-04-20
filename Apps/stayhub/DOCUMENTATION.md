# StayHub — Flutter Android App Documentation

> **App Name:** StayHub  
> **Platform:** Android (Flutter)  
> **Package ID:** `com.stayhub.app`  
> **Flutter SDK:** `^3.11.4`  
> **Dart SDK:** `^3.11.4`  
> **Version:** 1.0.0+1  
> **Backend:** GharBazar Django REST API (`/api/v1/`)  
> **Last Updated:** April 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [App Architecture](#3-app-architecture)
4. [Folder Structure](#4-folder-structure)
5. [Features & Screens](#5-features--screens)
6. [Navigation & Routing](#6-navigation--routing)
7. [Authentication Flow](#7-authentication-flow)
8. [API Integration](#8-api-integration)
9. [State Management](#9-state-management)
10. [Real-time Chat (WebSocket)](#10-real-time-chat-websocket)
11. [UI & Design Guidelines](#11-ui--design-guidelines)
12. [Build & Run](#12-build--run)
13. [Testing](#13-testing)
14. [Android Deployment](#14-android-deployment)
15. [Environment Configuration](#15-environment-configuration)
16. [Known Limitations & Roadmap](#16-known-limitations--roadmap)

---

## 1. Project Overview

StayHub mobile is the Android companion to the StayHub/GharBazar web platform — a broker-free property rental marketplace connecting property owners directly with tenants.

### What the app does

- Tenants can browse, search, and filter rental properties across cities
- Tenants can save favorites, chat with owners in real time, and track their inquiries
- Owners can list properties, manage their listings, view analytics, and respond to tenant messages
- Both roles authenticate through the same backend (JWT + Firebase Google OAuth)

### Platform Scope

| Platform | Status |
|---|---|
| Android | Primary target |
| iOS | Supported by Flutter (requires separate signing) |
| Web / Desktop | Not in scope for this release |

---

## 2. Tech Stack & Dependencies

### Core

| Package | Version | Purpose |
|---|---|---|
| `flutter` | SDK | UI framework |
| `dart` | ^3.11.4 | Language |
| `cupertino_icons` | ^1.0.8 | iOS-style icons |

### Recommended `pubspec.yaml` dependencies

```yaml
dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.8

  # State Management
  flutter_riverpod: ^2.5.1       # Primary state management
  riverpod_annotation: ^2.3.5    # Code gen annotations

  # Navigation
  go_router: ^14.2.7             # Declarative routing

  # HTTP & Networking
  dio: ^5.4.3                    # HTTP client (interceptors, retry)
  retrofit: ^4.1.0               # Type-safe REST API client (code gen)

  # WebSocket
  web_socket_channel: ^3.0.1     # WebSocket for real-time chat

  # Authentication
  firebase_core: ^3.6.0         # Firebase base
  firebase_auth: ^5.3.1         # Firebase Auth
  google_sign_in: ^6.2.1        # Google sign-in
  flutter_secure_storage: ^9.2.2 # Secure JWT token storage

  # Local Storage
  shared_preferences: ^2.3.2    # Lightweight key-value store

  # UI Utilities
  cached_network_image: ^3.4.1  # Image caching
  shimmer: ^3.0.0               # Skeleton loading states
  flutter_staggered_grid_view: ^0.7.0  # Property grid layout
  intl: ^0.19.0                 # Number/date formatting
  timeago: ^3.7.0               # "2 hours ago" timestamps

  # Image Handling
  image_picker: ^1.1.2          # Gallery / camera access
  image_cropper: ^8.0.2         # Crop & resize images

  # Maps & Location
  geolocator: ^13.0.2           # Device location
  geocoding: ^3.0.0             # Address → coordinates

  # Utilities
  equatable: ^2.0.7             # Value equality
  json_annotation: ^4.9.0       # JSON serialization
  freezed_annotation: ^2.4.4    # Immutable models
  logger: ^2.4.0                # Structured logging
  connectivity_plus: ^6.0.3     # Network connectivity status
  package_info_plus: ^8.1.1     # App version info

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^6.0.0
  build_runner: ^2.4.11         # Code generation runner
  riverpod_generator: ^2.4.3    # Riverpod code gen
  retrofit_generator: ^8.1.0    # Retrofit code gen
  freezed: ^2.5.7               # Freezed code gen
  json_serializable: ^6.8.0     # JSON code gen
  mockito: ^5.4.4               # Mocking for tests
```

---

## 3. App Architecture

The app follows **Clean Architecture** with a feature-first folder layout.

```
┌─────────────────────────────────────────────────────┐
│                   Presentation Layer                 │
│  Screens (widgets) + ViewModels (Riverpod providers) │
└─────────────────────┬───────────────────────────────┘
                      │ calls
┌─────────────────────▼───────────────────────────────┐
│                   Domain Layer                       │
│  Use Cases / Repositories (abstract interfaces)      │
└─────────────────────┬───────────────────────────────┘
                      │ implements
┌─────────────────────▼───────────────────────────────┐
│                    Data Layer                        │
│  Repository Impl → Remote Data Source (Dio/Retrofit) │
│                  → Local Data Source (SecureStorage) │
└─────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Contents |
|---|---|
| `presentation/` | Flutter screens, widgets, Riverpod providers/notifiers |
| `domain/` | Entity models, repository interfaces, use-case classes |
| `data/` | API clients, repository implementations, DTOs, mappers |
| `core/` | DI setup, router, theme, constants, shared utilities |

---

## 4. Folder Structure

```
lib/
├── main.dart                          # App entry point
├── app.dart                           # MaterialApp + router + providers setup
│
├── core/
│   ├── config/
│   │   ├── app_config.dart            # Base URL, env flags
│   │   └── firebase_options.dart      # Generated by flutterfire CLI
│   ├── constants/
│   │   ├── api_constants.dart         # API endpoint strings
│   │   ├── app_constants.dart         # App-wide constants
│   │   └── assets.dart                # Asset path strings
│   ├── di/
│   │   └── providers.dart             # Root Riverpod providers (Dio, StorageService)
│   ├── errors/
│   │   ├── app_exception.dart         # Custom exception types
│   │   └── failure.dart               # Failure sealed class
│   ├── network/
│   │   ├── dio_client.dart            # Dio instance + interceptors
│   │   ├── auth_interceptor.dart      # JWT attach + refresh logic
│   │   └── connectivity_service.dart  # Network state watcher
│   ├── router/
│   │   ├── app_router.dart            # GoRouter definition
│   │   └── route_names.dart           # Named route constants
│   ├── storage/
│   │   └── secure_storage_service.dart # JWT token read/write/clear
│   ├── theme/
│   │   ├── app_theme.dart             # MaterialTheme (light)
│   │   ├── app_colors.dart            # Brand color palette
│   │   └── app_text_styles.dart       # Text style presets
│   └── utils/
│       ├── extensions.dart            # String, DateTime, num extensions
│       └── formatters.dart            # Currency, area formatters
│
├── features/
│   │
│   ├── auth/
│   │   ├── data/
│   │   │   ├── auth_api.dart          # Retrofit interface
│   │   │   ├── auth_repository_impl.dart
│   │   │   └── models/
│   │   │       ├── login_request.dart
│   │   │       ├── register_request.dart
│   │   │       └── auth_response.dart
│   │   ├── domain/
│   │   │   ├── auth_repository.dart   # Abstract interface
│   │   │   └── entities/
│   │   │       └── app_user.dart
│   │   └── presentation/
│   │       ├── screens/
│   │       │   ├── splash_screen.dart
│   │       │   ├── login_screen.dart
│   │       │   ├── register_screen.dart
│   │       │   └── onboarding_screen.dart
│   │       └── providers/
│   │           └── auth_provider.dart
│   │
│   ├── home/
│   │   └── presentation/
│   │       ├── screens/
│   │       │   └── home_screen.dart   # Search + featured listings
│   │       └── providers/
│   │           └── home_provider.dart
│   │
│   ├── properties/
│   │   ├── data/
│   │   │   ├── properties_api.dart
│   │   │   ├── properties_repository_impl.dart
│   │   │   └── models/
│   │   │       ├── property_dto.dart
│   │   │       ├── property_filter.dart
│   │   │       └── paginated_response.dart
│   │   ├── domain/
│   │   │   ├── properties_repository.dart
│   │   │   └── entities/
│   │   │       └── property.dart
│   │   └── presentation/
│   │       ├── screens/
│   │       │   ├── property_list_screen.dart
│   │       │   ├── property_detail_screen.dart
│   │       │   └── property_search_screen.dart
│   │       ├── widgets/
│   │       │   ├── property_card.dart
│   │       │   ├── property_grid.dart
│   │       │   ├── filter_bottom_sheet.dart
│   │       │   └── amenity_chip.dart
│   │       └── providers/
│   │           ├── properties_provider.dart
│   │           └── property_detail_provider.dart
│   │
│   ├── dashboard/                     # Owner: manage listings
│   │   ├── data/ ...
│   │   ├── domain/ ...
│   │   └── presentation/
│   │       ├── screens/
│   │       │   ├── dashboard_screen.dart
│   │       │   ├── my_listings_screen.dart
│   │       │   ├── add_property_screen.dart  # 4-step wizard
│   │       │   └── property_analytics_screen.dart
│   │       └── providers/ ...
│   │
│   ├── favorites/
│   │   ├── data/ ...
│   │   ├── domain/ ...
│   │   └── presentation/
│   │       ├── screens/
│   │       │   └── favorites_screen.dart
│   │       ├── widgets/
│   │       │   └── favorite_button.dart
│   │       └── providers/
│   │           └── favorites_provider.dart
│   │
│   ├── chat/
│   │   ├── data/
│   │   │   ├── chat_api.dart
│   │   │   ├── chat_repository_impl.dart
│   │   │   ├── websocket_service.dart  # WebSocket connection manager
│   │   │   └── models/
│   │   │       ├── conversation_dto.dart
│   │   │       └── message_dto.dart
│   │   ├── domain/ ...
│   │   └── presentation/
│   │       ├── screens/
│   │       │   ├── conversations_screen.dart
│   │       │   └── chat_screen.dart
│   │       ├── widgets/
│   │       │   ├── message_bubble.dart
│   │       │   ├── chat_input_bar.dart
│   │       │   └── typing_indicator.dart
│   │       └── providers/
│   │           ├── conversations_provider.dart
│   │           └── chat_provider.dart
│   │
│   ├── notifications/
│   │   └── presentation/
│   │       ├── screens/
│   │       │   └── notifications_screen.dart
│   │       └── providers/
│   │           └── notifications_provider.dart
│   │
│   └── profile/
│       └── presentation/
│           ├── screens/
│           │   ├── profile_screen.dart
│           │   └── edit_profile_screen.dart
│           └── providers/
│               └── profile_provider.dart
│
test/
├── unit/
│   ├── auth/
│   └── properties/
├── widget/
│   └── property_card_test.dart
└── integration/
    └── auth_flow_test.dart
```

---

## 5. Features & Screens

### 5.1 Authentication

| Screen | Route | Description |
|---|---|---|
| Splash | `/` | Checks stored JWT, redirects to home or login |
| Login | `/login` | Email/password + Google sign-in |
| Register | `/register` | New account (email, name, role selection) |
| Onboarding | `/onboarding` | First-time role setup (Tenant / Owner) |

### 5.2 Tenant Features

| Screen | Route | Description |
|---|---|---|
| Home | `/home` | Search bar + featured + categories |
| Property Search | `/properties` | Full list with filters |
| Property Detail | `/properties/:id` | Photos, details, rent, "Chat with Owner", "Save" |
| Favorites | `/favorites` | Saved properties list |
| Conversations | `/chats` | List of all chat threads |
| Chat | `/chats/:id` | Real-time messaging with an owner |
| Notifications | `/notifications` | Activity feed |
| Profile | `/profile` | View and edit personal details |

### 5.3 Owner Features

| Screen | Route | Description |
|---|---|---|
| Dashboard | `/dashboard` | Stats overview (views, contacts, active listings) |
| My Listings | `/dashboard/listings` | All owned properties with status badges |
| Add Property | `/dashboard/listings/add` | 4-step wizard (details → location → pricing → review) |
| Property Analytics | `/dashboard/listings/:id/analytics` | Per-property views, favorites, contacts |
| Conversations | `/chats` | Shared with tenant (filtered by role context) |

### 5.4 Add Property — 4-Step Wizard

```
Step 1 — Property Info
  • Property Type (PG / 1RK / 1BHK / 2BHK / 3BHK / House / Commercial)
  • Title, Description
  • Bedrooms, Bathrooms, Area (sqft)
  • Furnishing (Furnished / Semi / Unfurnished)

Step 2 — Location
  • City, State selection
  • Address line (optional map pin)
  • Use device location shortcut

Step 3 — Pricing & Amenities
  • Monthly Rent (₹)
  • Security Deposit (₹)
  • Available From (date picker)
  • Preferred Tenant (Any / Male / Female) — for PG type
  • Amenities multi-select

Step 4 — Photos & Review
  • Upload up to 10 photos (gallery / camera)
  • Review all details before submit
  • Submit → status becomes PENDING (awaits admin approval)
```

---

## 6. Navigation & Routing

The app uses **GoRouter** with redirect-based auth guards.

### Route Tree

```
/ (splash)
├── /login
├── /register
├── /onboarding
└── /shell (bottom nav shell)
    ├── /home
    ├── /properties
    │   └── /properties/:id
    ├── /favorites
    ├── /chats
    │   └── /chats/:conversationId
    ├── /notifications
    ├── /profile
    │   └── /profile/edit
    └── /dashboard          [OWNER only]
        └── /dashboard/listings
            ├── /dashboard/listings/add
            └── /dashboard/listings/:id/analytics
```

### Auth Guard Logic

```dart
// core/router/app_router.dart (outline)
redirect: (context, state) {
  final isLoggedIn = ref.read(authProvider).isAuthenticated;
  final isOnAuthPage = state.matchedLocation.startsWith('/login')
      || state.matchedLocation.startsWith('/register');

  if (!isLoggedIn && !isOnAuthPage) return '/login';
  if (isLoggedIn && isOnAuthPage) return '/home';
  return null; // no redirect
},
```

### Bottom Navigation (Shell Route)

| Tab | Icon | Route | Visible to |
|---|---|---|---|
| Home | `home` | `/home` | All |
| Search | `search` | `/properties` | All |
| Saved | `favorite` | `/favorites` | Tenant |
| Dashboard | `dashboard` | `/dashboard` | Owner |
| Chats | `chat_bubble` | `/chats` | All |
| Profile | `person` | `/profile` | All |

---

## 7. Authentication Flow

### 7.1 Email / Password Login

```
User fills login form
        │
        ▼
POST /api/v1/auth/login/
  { email, password }
        │
        ▼
Backend returns { access, refresh, user }
        │
        ▼
Store access + refresh in FlutterSecureStorage
        │
        ▼
Set authProvider state → isAuthenticated = true
        │
        ▼
GoRouter redirect → /home
```

### 7.2 Google Sign-In (Firebase)

```
User taps "Continue with Google"
        │
        ▼
GoogleSignIn.signIn() → Google Account picker
        │
        ▼
firebase_auth.signInWithCredential(GoogleAuthProvider)
        │
        ▼
Get Firebase ID token (idToken)
        │
        ▼
POST /api/v1/auth/google/
  { id_token: idToken }
        │
        ▼
Backend verifies token with Firebase Admin SDK
Returns { access, refresh, user }
        │
        ▼
Store tokens → authProvider update → /home
```

### 7.3 Token Refresh

```
Dio request fails with 401
        │
        ▼
auth_interceptor.dart catches 401
        │
        ▼
POST /api/v1/auth/token/refresh/
  { refresh: storedRefreshToken }
        │
        ▼
New access token stored
        │
        ▼
Original request retried automatically
        │
        ▼ (if refresh also fails)
clearSession() + redirect to /login
```

### 7.4 JWT Storage

Tokens are stored using `flutter_secure_storage` (Android Keystore-backed):

```dart
// core/storage/secure_storage_service.dart
const _accessKey  = 'stayhub_access_token';
const _refreshKey = 'stayhub_refresh_token';

Future<void> saveTokens(String access, String refresh) async { ... }
Future<String?> getAccessToken() async { ... }
Future<String?> getRefreshToken() async { ... }
Future<void> clearTokens() async { ... }
```

---

## 8. API Integration

### 8.1 Base Configuration

```dart
// core/config/app_config.dart
class AppConfig {
  static const String baseUrl = 'http://10.0.2.2:8000'; // emulator
  // static const String baseUrl = 'https://api.stayhub.in'; // production
  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
```

> **Note:** Use `10.0.2.2` to reach `localhost:8000` from an Android emulator. Use your machine's LAN IP (e.g., `192.168.x.x`) for a physical device on the same network.

### 8.2 Endpoints Reference

#### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register/` | Create account (email + role) |
| POST | `/api/v1/auth/login/` | Email/password login |
| POST | `/api/v1/auth/google/` | Firebase Google token exchange |
| POST | `/api/v1/auth/token/refresh/` | Refresh JWT access token |
| POST | `/api/v1/auth/logout/` | Invalidate refresh token |
| GET | `/api/v1/auth/me/` | Get current user profile |
| PATCH | `/api/v1/auth/me/` | Update profile |

#### Properties

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/properties/` | List / search (supports filters) |
| POST | `/api/v1/properties/` | Create property (owner only) |
| GET | `/api/v1/properties/:id/` | Property detail |
| PATCH | `/api/v1/properties/:id/` | Update property (owner only) |
| DELETE | `/api/v1/properties/:id/` | Delete property |
| POST | `/api/v1/properties/:id/submit/` | Submit draft for approval |

**Property list query params:**

| Param | Type | Example |
|---|---|---|
| `city` | string | `Mumbai` |
| `property_type` | string | `2BHK` |
| `min_rent` | number | `8000` |
| `max_rent` | number | `25000` |
| `furnishing` | string | `FURNISHED` |
| `bedrooms` | number | `2` |
| `search` | string | `near metro` |
| `ordering` | string | `-rent`, `rent`, `-created_at` |
| `limit` | number | `20` |
| `offset` | number | `0` |

#### Favorites

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/favorites/` | List user's favorites |
| POST | `/api/v1/favorites/` | Add favorite `{ property_id }` |
| DELETE | `/api/v1/favorites/:id/` | Remove favorite |

#### Contacts / Leads

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/contacts/` | List contacts (owner: received; tenant: sent) |
| POST | `/api/v1/contacts/` | Express interest `{ property_id }` |

#### Chat

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/conversations/` | List user's conversations |
| POST | `/api/v1/conversations/` | Start a conversation `{ property_id }` |
| GET | `/api/v1/conversations/:id/messages/` | Message history |

**WebSocket URL:**

```
ws://10.0.2.2:8000/ws/chat/<conversation_id>/?token=<access_token>
```

#### Notifications

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/notifications/` | List notifications |
| PATCH | `/api/v1/notifications/:id/` | Mark as read |
| POST | `/api/v1/notifications/mark-all-read/` | Mark all read |

#### Analytics (Owner)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/analytics/properties/` | Owner portfolio stats |
| GET | `/api/v1/analytics/properties/:id/` | Single property analytics |

---

## 9. State Management

The app uses **Riverpod 2** with code generation for all state.

### Provider Hierarchy

```
authProvider (StateNotifier<AuthState>)
  └── manages login, logout, token refresh

propertiesProvider (AsyncNotifier<PaginatedProperties>)
  └── paginated list + filters

propertyDetailProvider(id) (AsyncNotifier<Property>)
  └── single property + view count trigger

favoritesProvider (AsyncNotifier<List<Property>>)
  └── favorited properties list

conversationsProvider (AsyncNotifier<List<Conversation>>)
  └── all chat threads

chatProvider(conversationId) (StateNotifier<ChatState>)
  └── messages list + WebSocket events

notificationsProvider (AsyncNotifier<List<Notification>>)
  └── unread count + list

profileProvider (AsyncNotifier<AppUser>)
  └── current user data
```

### Auth State

```dart
// features/auth/presentation/providers/auth_provider.dart

@freezed
class AuthState with _$AuthState {
  const factory AuthState.initial()                   = _Initial;
  const factory AuthState.loading()                   = _Loading;
  const factory AuthState.authenticated(AppUser user) = _Authenticated;
  const factory AuthState.unauthenticated()           = _Unauthenticated;
  const factory AuthState.error(String message)       = _Error;
}
```

### Chat State

```dart
@freezed
class ChatState with _$ChatState {
  const factory ChatState({
    required List<Message> messages,
    @Default(false) bool isConnected,
    @Default(false) bool isTyping,       // remote party typing
    @Default(false) bool isSending,
  }) = _ChatState;
}
```

---

## 10. Real-time Chat (WebSocket)

### Connection Lifecycle

```
chatProvider initialized for conversationId
        │
        ▼
websocketService.connect(conversationId, accessToken)
  ws://<host>/ws/chat/<id>/?token=<jwt>
        │
        ▼
onConnected → isConnected = true
        │
onMessage → parse JSON → append to messages list
        │
onTyping → isTyping = true → clear after 3s
        │
onDisconnected → reconnect with backoff (max 5 retries)
        │
chatProvider disposed → websocketService.disconnect()
```

### Message JSON Format

**Incoming (from server):**

```json
{
  "type": "chat_message",
  "message": {
    "id": "uuid",
    "sender_id": "uuid",
    "content": "Hello!",
    "created_at": "2026-04-18T10:30:00Z",
    "is_read": false
  }
}
```

**Outgoing (to server):**

```json
{
  "type": "chat_message",
  "content": "Is the flat still available?"
}
```

**Typing indicator:**

```json
{ "type": "typing" }
```

---

## 11. UI & Design Guidelines

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#16A34A` | Buttons, links, active states |
| `primaryLight` | `#DCFCE7` | Backgrounds, chips |
| `onPrimary` | `#FFFFFF` | Text on primary |
| `surface` | `#FFFFFF` | Card backgrounds |
| `background` | `#F7FCF8` | Page background |
| `textPrimary` | `#0F172A` | Headings |
| `textSecondary` | `#64748B` | Body / captions |
| `border` | `#E2E8F0` | Dividers, card borders |
| `error` | `#DC2626` | Error states |
| `warning` | `#F59E0B` | Pending status |

### Typography

| Style | Font | Size | Weight |
|---|---|---|---|
| Display | System default | 28 | Bold |
| Heading | System default | 22 | SemiBold |
| Title | System default | 18 | SemiBold |
| Body | System default | 14 | Regular |
| Caption | System default | 12 | Regular |
| Label | System default | 13 | Medium |

> Use **Space Grotesk** (matching the web) if added as a font asset for consistency. Fallback to system sans-serif.

### Component Patterns

**Property Card:**
- White card, 12px border-radius, subtle shadow
- Image at top (16:9, cached via `cached_network_image`)
- Title, location, price, property type chip
- Favorite heart icon top-right (filled/outlined)
- Tap → navigate to property detail

**Status Badges:**

| Status | Color |
|---|---|
| ACTIVE | Green |
| PENDING | Amber |
| RENTED | Blue |
| DRAFT | Grey |
| REJECTED | Red |

**Loading States:** Use `shimmer` package for skeleton placeholders on all list/detail screens — never show blank screens.

**Empty States:** Custom illustration + message + action button for Favorites, Chats, My Listings when list is empty.

---

## 12. Build & Run

### Prerequisites

| Tool | Version |
|---|---|
| Flutter | 3.24.x or above (stable) |
| Dart | 3.11.x |
| Android Studio | Hedgehog or above |
| Android SDK | API 21+ (minSdk) |
| Java | 17 (JVM target in Gradle) |

### Setup Steps

```bash
# 1. Navigate to app directory
cd Apps/stayhub

# 2. Install Flutter packages
flutter pub get

# 3. Run code generation (Riverpod, Retrofit, Freezed, JSON)
dart run build_runner build --delete-conflicting-outputs

# 4. Configure Firebase
# Install flutterfire CLI if not present:
dart pub global activate flutterfire_cli

# Connect to your Firebase project:
flutterfire configure --project=your-firebase-project-id

# This generates: lib/core/config/firebase_options.dart

# 5. Start the backend (in a separate terminal)
# From project root:
cd Server
python manage.py runserver 0.0.0.0:8000

# 6. Run the Flutter app
flutter run                        # on connected device / emulator
flutter run -d emulator-5554      # specific emulator
```

### Environment Switching

Update `lib/core/config/app_config.dart`:

```dart
// For emulator (reaches host machine localhost)
static const String baseUrl = 'http://10.0.2.2:8000';

// For physical device on same Wi-Fi
static const String baseUrl = 'http://192.168.1.100:8000';

// For production
static const String baseUrl = 'https://api.stayhub.in';
```

### Build APK

```bash
# Debug APK
flutter build apk --debug

# Release APK (requires signing config)
flutter build apk --release

# Split APKs by ABI (smaller download size)
flutter build apk --split-per-abi --release

# App Bundle (for Play Store)
flutter build appbundle --release
```

Output: `build/app/outputs/flutter-apk/app-release.apk`

---

## 13. Testing

### Test Categories

#### Unit Tests (`test/unit/`)

Test data layer (repository implementations, DTOs, mappers) and domain use cases independently.

```bash
flutter test test/unit/
```

Example:

```dart
// test/unit/auth/auth_repository_test.dart
void main() {
  late AuthRepositoryImpl repo;
  late MockAuthApi mockApi;

  setUp(() {
    mockApi = MockAuthApi();
    repo = AuthRepositoryImpl(mockApi);
  });

  test('login returns AppUser on success', () async {
    when(mockApi.login(any)).thenAnswer((_) async => fakeAuthResponse);
    final result = await repo.login('test@email.com', 'password');
    expect(result.email, equals('test@email.com'));
  });
}
```

#### Widget Tests (`test/widget/`)

Test individual widgets render correctly and respond to interactions.

```bash
flutter test test/widget/
```

#### Integration Tests (`test/integration/`)

End-to-end flows using `integration_test` package.

```bash
flutter test integration_test/auth_flow_test.dart
```

### Coverage

```bash
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html
open coverage/html/index.html
```

---

## 14. Android Deployment

### Signing the App

1. Generate a keystore:

```bash
keytool -genkey -v -keystore ~/stayhub-release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias stayhub
```

2. Create `android/key.properties`:

```properties
storePassword=<store-password>
keyPassword=<key-password>
keyAlias=stayhub
storeFile=/home/<user>/stayhub-release.jks
```

3. Update `android/app/build.gradle.kts` to reference `key.properties` in the release build type.

> **Security:** Never commit `key.properties` or the `.jks` file to version control. Add them to `.gitignore`.

### App Permissions (`android/app/src/main/AndroidManifest.xml`)

```xml
<!-- Required permissions -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Location (for property search near me) -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<!-- Image uploads -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.CAMERA" />
```

### Application ID

Update `android/app/build.gradle.kts`:

```kotlin
defaultConfig {
    applicationId = "com.stayhub.app"   // Change from com.example.stayhub
    minSdk = 21
    targetSdk = 35
    versionCode = 1
    versionName = "1.0.0"
}
```

### Play Store Checklist

- [ ] Application ID changed from `com.example.stayhub`
- [ ] `versionCode` and `versionName` set correctly
- [ ] App signed with release keystore
- [ ] `debuggable = false` in release build type
- [ ] App Bundle built (`flutter build appbundle`)
- [ ] Privacy policy URL configured in Play Console
- [ ] Firebase SHA-1 / SHA-256 certificates added in Firebase Console
- [ ] `google-services.json` placed at `android/app/google-services.json`

---

## 15. Environment Configuration

### Backend API Keys

The app needs the Firebase `google-services.json` file for Google Sign-In to work. Obtain from Firebase Console → Project Settings → Android app.

### `.env` equivalent in Flutter

Flutter does not support `.env` files natively. Use one of:

1. **`app_config.dart`** (build-time constants) — simple, used in this project
2. **`--dart-define`** at build time:

```bash
flutter run --dart-define=BASE_URL=https://api.stayhub.in
```

Then read in Dart:

```dart
const baseUrl = String.fromEnvironment('BASE_URL', defaultValue: 'http://10.0.2.2:8000');
```

3. **`flutter_dotenv`** package for `.env` file support.

---

## 16. Known Limitations & Roadmap

### Current State (v1.0.0)

The Flutter app scaffold (`lib/main.dart`) currently contains only the default Flutter counter demo. Full feature implementation follows the architecture described in this document.

### Development Priorities

| Priority | Feature | Notes |
|---|---|---|
| P0 | Auth screens + JWT flow | Prerequisite for all other screens |
| P0 | Property list + search | Core value, tenant-facing |
| P0 | Property detail screen | Matches backend model exactly |
| P1 | Real-time chat | WebSocket + Django Channels already ready |
| P1 | Favorites | Simple REST CRUD |
| P1 | Owner dashboard + add property wizard | 4-step matches backend submit flow |
| P2 | Push notifications | Firebase Cloud Messaging (FCM) |
| P2 | Offline support | Cache last-seen properties locally |
| P2 | Owner analytics screen | Chart widgets (fl_chart) |
| P3 | In-app map view | Google Maps / MapLibre |
| P3 | iOS release | Signing + App Store submission |

### Known Technical Constraints

- **Backend running locally:** The Django server must be running for the app to function in development. See `ServerCOMMAND.txt` for the exact start command.
- **WebSocket on Android emulator:** Use `ws://10.0.2.2:8000/ws/chat/...` — not `localhost`.
- **Image uploads:** Backend accepts multipart form data; Dio supports this natively with `FormData`.
- **Property approval:** Properties submitted by owners go to `PENDING` status — they are not immediately visible to tenants. Admin must approve via Django admin panel (`/admin/`).
- **Firebase credentials:** Ensure the Android SHA-1 from your debug keystore is registered in Firebase Console, otherwise Google Sign-In will fail at runtime.

---

## Appendix A — Backend Data Models (Quick Reference)

### User

```
id            UUID
email         string (unique, nullable)
phone         string (unique, nullable)
first_name    string
last_name     string
role          OWNER | TENANT | ADMIN
location_id   FK → Location
is_active     bool
created_at    datetime
```

### Property

```
id              UUID
owner_id        FK → User
location_id     FK → Location
title           string (max 255)
description     text
property_type   PG | 1RK | 1BHK | 2BHK | 3BHK | HOUSE | COMMERCIAL
furnishing      FURNISHED | SEMI | UNFURNISHED
rent            decimal
deposit         decimal (nullable)
bedrooms        int (nullable)
bathrooms       int (nullable)
area_sqft       int (nullable)
available_from  date (nullable)
preferred_tenant MALE | FEMALE | ANY
status          DRAFT | PENDING | ACTIVE | RENTED | EXPIRED | REJECTED
is_featured     bool
total_views     int
total_favorites int
total_contacts  int
created_at      datetime
```

### Conversation

```
id             UUID
property_id    FK → Property
tenant_id      FK → User
owner_id       FK → User
status         ACTIVE | ARCHIVED
message_count  int
created_at     datetime
```

### Message

```
id               UUID
conversation_id  FK → Conversation
sender_id        FK → User
content          text
is_read          bool
created_at       datetime
```

---

## Appendix B — Useful Commands

```bash
# Check Flutter doctor
flutter doctor -v

# List connected devices
flutter devices

# Clean build artifacts
flutter clean && flutter pub get

# Re-run code generation
dart run build_runner build --delete-conflicting-outputs

# Watch mode (auto re-generate on file changes)
dart run build_runner watch --delete-conflicting-outputs

# Analyze code
flutter analyze

# Format code
dart format lib/

# Run all tests
flutter test

# Check outdated packages
flutter pub outdated

# Upgrade packages
flutter pub upgrade
```

---

*Documentation maintained by the GharBazar development team.*  
*Refer to `docs/PROJECT_DOCUMENTATION.md` for the full system (backend + web) architecture.*
