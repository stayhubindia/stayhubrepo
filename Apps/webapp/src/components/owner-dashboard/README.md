# Owner Dashboard Components

This directory contains all React components for the Owner Property Detail Dashboard feature.

## Overview

The Owner Property Dashboard provides property owners with a comprehensive interface to manage their listings, view analytics, respond to enquiries, and manage bookings.

**Route:** `/owner/properties/[id]`

## Component Structure

```
owner-dashboard/
├── property-hero.tsx          # Top section with images, title, specs, rent
├── tab-navigation.tsx         # 8-tab navigation with count badges
├── performance-metrics.tsx    # Right sidebar analytics card
├── status-card.tsx            # Active/Inactive toggle + Deactivate button
├── share-card.tsx             # Social sharing with copy link
├── action-buttons.tsx         # Preview, Edit, More options
├── support-card.tsx           # Contact support card
├── image-lightbox.tsx         # Full-screen image gallery viewer
├── dashboard-error-boundary.tsx # Error boundary with fallback UI
├── tabs/
│   ├── overview-tab.tsx       # Description, amenities, map, rules, highlights
│   ├── details-tab.tsx        # Property details (placeholder)
│   ├── amenities-tab.tsx      # Full amenities list
│   ├── location-tab.tsx       # Location with map
│   ├── house-rules-tab.tsx    # House rules list
│   ├── enquiries-tab.tsx      # Tenant enquiries list
│   ├── bookings-tab.tsx       # Property bookings list
│   └── activity-tab.tsx       # Activity log (placeholder)
└── README.md
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/properties/:id/` | GET | Fetch property details |
| `/api/v1/analytics/properties/:id/` | GET | Fetch performance analytics |
| `/api/v1/contacts/?property_id=:id` | GET | Fetch enquiries |
| `/api/v1/bookings/?property_id=:id` | GET | Fetch bookings |
| `/api/v1/properties/:id/` | PATCH | Update property status |
| `/api/v1/properties/:id/expire/` | POST | Expire/deactivate property |

## Data Fetching

All data fetching uses TanStack Query hooks from `src/modules/owner-dashboard/hooks.ts`:

```typescript
import {
  useOwnerPropertyDetail,    // staleTime: 5 min
  usePropertyAnalytics,      // staleTime: 2 min
  usePropertyEnquiries,      // staleTime: 1 min
  usePropertyBookings,       // staleTime: 1 min
  useUpdatePropertyStatus,   // mutation
  useExpireProperty,         // mutation
} from '@/modules/owner-dashboard/hooks';
```

## Component Props

### PropertyHero
```typescript
interface PropertyHeroProps {
  property: PropertyDetail;
}
```

### TabNavigation
```typescript
interface TabNavigationProps {
  tabs: DashboardTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}
```

### PerformanceMetrics
```typescript
interface PerformanceMetricsProps {
  propertyId: string;
}
```

### StatusCard
```typescript
interface StatusCardProps {
  property: PropertyDetail;
}
```

### ShareCard
```typescript
interface ShareCardProps {
  property: PropertyDetail;
}
```

### ActionButtons
```typescript
interface ActionButtonsProps {
  property: PropertyDetail;
}
```

### ImageLightbox
```typescript
interface ImageLightboxProps {
  images: PropertyImage[];
  initialIndex: number;
  onClose: () => void;
  propertyTitle: string;
}
```

## Usage Example

```tsx
import { PropertyHero } from '@/components/owner-dashboard/property-hero';
import { TabNavigation } from '@/components/owner-dashboard/tab-navigation';
import { PerformanceMetrics } from '@/components/owner-dashboard/performance-metrics';
import { StatusCard } from '@/components/owner-dashboard/status-card';

// In your page component:
<PropertyHero property={property} />
<TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
<PerformanceMetrics propertyId={propertyId} />
<StatusCard property={property} />
```

## Design System

- **Primary color:** Emerald green `#16A34A` (`emerald-600`)
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Styling:** Tailwind CSS
- **Border radius:** `rounded-xl`, `rounded-2xl`, `rounded-3xl`
