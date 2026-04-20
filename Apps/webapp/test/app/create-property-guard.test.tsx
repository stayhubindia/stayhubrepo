import { render, screen } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CreatePropertyPage from "@/../app/properties/create/page";

const mockUseRequireAuth = vi.fn();
const mockUseCreateProperty = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) =>
    createElement("a", { href, ...props }, children),
}));

vi.mock("@/hooks/use-route-guard", () => ({
  useRequireAuth: () => mockUseRequireAuth(),
}));

vi.mock("@/modules/property/hooks", () => ({
  useCreateProperty: () => mockUseCreateProperty(),
}));

describe("CreatePropertyPage profile completion guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCreateProperty.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  it("shows profile completion prompt when owner phone/location are missing", () => {
    mockUseRequireAuth.mockReturnValue({
      isAllowed: true,
      user: {
        id: "1",
        email: "owner@example.com",
        phone: null,
        first_name: "Owner",
        last_name: "User",
        role: "OWNER",
        location: null,
        location_id: null,
        is_verified: true,
        date_joined: "2026-01-01",
      },
    });

    render(<CreatePropertyPage />);

    expect(screen.getByText("Complete Your Profile")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Complete Profile Now" })).toHaveAttribute(
      "href",
      "/owner-onboarding",
    );
    expect(screen.queryByText("Create Property Listing")).not.toBeInTheDocument();
  });

  it("renders create form when owner profile is complete", () => {
    mockUseRequireAuth.mockReturnValue({
      isAllowed: true,
      user: {
        id: "1",
        email: "owner@example.com",
        phone: "9999999999",
        first_name: "Owner",
        last_name: "User",
        role: "OWNER",
        location: { id: "loc-1", city: "Delhi" },
        location_id: "loc-1",
        is_verified: true,
        date_joined: "2026-01-01",
      },
    });

    render(<CreatePropertyPage />);

    expect(screen.getByText("Create Property Listing")).toBeInTheDocument();
    expect(screen.queryByText("Complete Your Profile")).not.toBeInTheDocument();
  });
});
