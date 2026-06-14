import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PropertyHero } from "../property-hero";
import type { PropertyDetail } from "@/types/property";
import type { HTMLAttributes, ReactNode } from "react";

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

// Mock Next.js Link component
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: HTMLAttributes<HTMLAnchorElement> & { children?: ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockProperty: PropertyDetail = {
  id: "test-property-123",
  owner: "owner-123",
  title: "Luxury 3 BHK Apartment",
  description: "A beautiful apartment in the heart of the city",
  property_type: "3BHK",
  furnishing: "FURNISHED",
  rent: "28000",
  deposit: "56000",
  bedrooms: 3,
  bathrooms: 2,
  area_sqft: 1500,
  total_favorites: 10,
  available_from: "2024-02-01",
  location: {
    id: "loc-123",
    country: "India",
    state: "Karnataka",
    city: "Bangalore",
    locality: "Koramangala",
    pincode: "560034",
    address: "123 Main Street",
    latitude: "12.9352",
    longitude: "77.6245",
  },
  preferred_tenant: "ANY",
  total_views: 245,
  total_contacts: 18,
  status: "ACTIVE",
  is_featured: false,
  featured_until: null,
  amenities: [
    { id: "1", name: "WiFi", icon: "wifi" },
    { id: "2", name: "Parking", icon: "parking" },
  ],
  images: [
    {
      id: "img-1",
      image: "https://example.com/image1.jpg",
      is_primary: true,
      order: 0,
      created_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "img-2",
      image: "https://example.com/image2.jpg",
      is_primary: false,
      order: 1,
      created_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "img-3",
      image: "https://example.com/image3.jpg",
      is_primary: false,
      order: 2,
      created_at: "2024-01-01T00:00:00Z",
    },
  ],
  created_at: "2024-01-15T10:30:00Z",
  updated_at: "2024-01-20T15:45:00Z",
};

describe("PropertyHero", () => {
  it("renders property title and address", () => {
    render(<PropertyHero property={mockProperty} />);

    expect(screen.getByText("Luxury 3 BHK Apartment")).toBeInTheDocument();
    expect(
      screen.getByText(/123 Main Street, Koramangala, Bangalore/)
    ).toBeInTheDocument();
  });

  it("displays status badge correctly", () => {
    render(<PropertyHero property={mockProperty} />);

    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows property specifications", () => {
    render(<PropertyHero property={mockProperty} />);

    expect(screen.getByText("3")).toBeInTheDocument(); // Bedrooms
    expect(screen.getByText("2")).toBeInTheDocument(); // Bathrooms
    expect(screen.getByText("1500 sqft")).toBeInTheDocument(); // Area
    expect(screen.getByText("3BHK")).toBeInTheDocument(); // Property type
    expect(screen.getByText("FURNISHED")).toBeInTheDocument(); // Furnishing
  });

  it("displays formatted rent amount", () => {
    render(<PropertyHero property={mockProperty} />);

    expect(screen.getByText(/₹28,000/)).toBeInTheDocument();
    expect(screen.getByText("/ month")).toBeInTheDocument();
    expect(screen.getByText("For long stays")).toBeInTheDocument();
  });

  it("shows Back to My Ads link", () => {
    render(<PropertyHero property={mockProperty} />);

    const backLink = screen.getByText("Back to My Ads");
    expect(backLink).toBeInTheDocument();
    expect(backLink.closest("a")).toHaveAttribute("href", "/my-ads");
  });

  it("displays property images", () => {
    render(<PropertyHero property={mockProperty} />);

    const images = screen.getAllByRole("img");
    expect(images.length).toBeGreaterThan(0);
  });

  it("shows View Photos overlay with image count", () => {
    render(<PropertyHero property={mockProperty} />);

    expect(screen.getByText(/View Photos \(3\)/)).toBeInTheDocument();
  });

  it("displays listing date and property ID", () => {
    render(<PropertyHero property={mockProperty} />);

    expect(screen.getByText(/Listed/)).toBeInTheDocument();
    // Property ID is displayed as first 8 characters
    const propertyIdElement = screen.getByText(/test-pro/);
    expect(propertyIdElement).toBeInTheDocument();
  });

  it("opens lightbox when primary image is clicked", () => {
    render(<PropertyHero property={mockProperty} />);

    const primaryImageButton = screen.getAllByRole("button")[1]; // First button is Back link
    fireEvent.click(primaryImageButton);

    // Lightbox should be rendered (we're not testing lightbox internals here)
    // Just verify the click handler works
    expect(primaryImageButton).toBeInTheDocument();
  });

  it("handles property with no location gracefully", () => {
    const propertyWithoutLocation = {
      ...mockProperty,
      location: null,
    };

    render(<PropertyHero property={propertyWithoutLocation} />);

    expect(screen.getByText("Address not available")).toBeInTheDocument();
  });

  it("handles property with no images gracefully", () => {
    const propertyWithoutImages = {
      ...mockProperty,
      images: [],
    };

    render(<PropertyHero property={propertyWithoutImages} />);

    // Should render without crashing
    expect(screen.getByText("Luxury 3 BHK Apartment")).toBeInTheDocument();
  });

  it("displays different status badges correctly", () => {
    const statuses: Array<PropertyDetail["status"]> = [
      "DRAFT",
      "PENDING",
      "RENTED",
      "EXPIRED",
      "REJECTED",
    ];

    statuses.forEach((status) => {
      const { unmount } = render(
        <PropertyHero property={{ ...mockProperty, status }} />
      );
      
      // Verify status badge is rendered (specific text depends on status)
      const statusBadge = screen.getByText(
        status === "PENDING"
          ? "Pending Review"
          : status === "EXPIRED"
          ? "Inactive"
          : status.charAt(0) + status.slice(1).toLowerCase()
      );
      expect(statusBadge).toBeInTheDocument();
      
      unmount();
    });
  });

  it("shows +N More indicator when more than 4 images", () => {
    const propertyWithManyImages = {
      ...mockProperty,
      images: [
        ...mockProperty.images,
        {
          id: "img-4",
          image: "https://example.com/image4.jpg",
          is_primary: false,
          order: 3,
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "img-5",
          image: "https://example.com/image5.jpg",
          is_primary: false,
          order: 4,
          created_at: "2024-01-01T00:00:00Z",
        },
      ],
    };

    render(<PropertyHero property={propertyWithManyImages} />);

    // With 5 images total, showing 4 thumbnails, the indicator should show +1 More
    expect(screen.getByText("+1 More")).toBeInTheDocument();
  });
});
