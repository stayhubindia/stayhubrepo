import { render, screen } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AddPropertyPage from "@/../app/dashboard/properties/add/page";

const mockUseRequireAuth = vi.fn();
const mockUseCreateProperty = vi.fn();
const mockUseSubmitProperty = vi.fn();
const mockUseIdempotentAction = vi.fn();

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

vi.mock("@/modules/properties/hooks", () => ({
  useCreateProperty: () => mockUseCreateProperty(),
  useSubmitProperty: () => mockUseSubmitProperty(),
}));

vi.mock("@/hooks/use-idempotent-action", () => ({
  useIdempotentAction: () => mockUseIdempotentAction(),
}));

vi.mock("@/lib/api-error", () => ({
  getApiErrorMessage: () => "Something went wrong",
}));

describe("AddPropertyPage profile completion guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCreateProperty.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    mockUseSubmitProperty.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    mockUseIdempotentAction.mockReturnValue({
      runOnce: vi.fn(),
      isInFlight: vi.fn(() => false),
    });
  });

  it("shows profile completion prompt when owner location is missing", () => {
    mockUseRequireAuth.mockReturnValue({
      isAllowed: true,
      user: {
        id: "1",
        email: "owner@example.com",
        phone: "9999999999",
        first_name: "Owner",
        last_name: "User",
        role: "OWNER",
        location: null,
        location_id: null,
        is_verified: true,
        date_joined: "2026-01-01",
      },
    });

    render(<AddPropertyPage />);

    expect(screen.getByText("Complete your owner profile first")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Complete profile/i })).toHaveAttribute(
      "href",
      "/owner-onboarding",
    );
    expect(screen.queryByText("Create a listing tenants can trust.")).not.toBeInTheDocument();
  });

  it("renders property wizard when owner profile is complete", () => {
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

    render(<AddPropertyPage />);

    expect(screen.getByText("Create a listing tenants can trust.")).toBeInTheDocument();
    expect(screen.queryByText("Complete your owner profile first")).not.toBeInTheDocument();
  });
});
