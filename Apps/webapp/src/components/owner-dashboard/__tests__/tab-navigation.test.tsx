import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TabNavigation } from "../tab-navigation";
import type { DashboardTab } from "@/types/owner-dashboard";

describe("TabNavigation", () => {
  const mockTabs: DashboardTab[] = [
    { id: "overview", label: "Overview" },
    { id: "details", label: "Details" },
    { id: "enquiries", label: "Enquiries", count: 5 },
    { id: "bookings", label: "Bookings", count: 3 },
  ];

  const mockOnTabChange = vi.fn();

  beforeEach(() => {
    mockOnTabChange.mockClear();
  });

  it("renders all tabs", () => {
    render(
      <TabNavigation
        tabs={mockTabs}
        activeTab="overview"
        onTabChange={mockOnTabChange}
      />
    );

    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Details")).toBeInTheDocument();
    expect(screen.getByText("Enquiries")).toBeInTheDocument();
    expect(screen.getByText("Bookings")).toBeInTheDocument();
  });

  it("displays count badges for tabs with counts", () => {
    render(
      <TabNavigation
        tabs={mockTabs}
        activeTab="overview"
        onTabChange={mockOnTabChange}
      />
    );

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("highlights the active tab", () => {
    render(
      <TabNavigation
        tabs={mockTabs}
        activeTab="overview"
        onTabChange={mockOnTabChange}
      />
    );

    const overviewTab = screen.getByRole("tab", { name: /overview/i });
    expect(overviewTab).toHaveAttribute("aria-selected", "true");
  });

  it("calls onTabChange when a tab is clicked", () => {
    render(
      <TabNavigation
        tabs={mockTabs}
        activeTab="overview"
        onTabChange={mockOnTabChange}
      />
    );

    const detailsTab = screen.getByRole("tab", { name: /details/i });
    fireEvent.click(detailsTab);

    expect(mockOnTabChange).toHaveBeenCalledWith("details");
  });

  it("supports keyboard navigation with arrow keys", () => {
    render(
      <TabNavigation
        tabs={mockTabs}
        activeTab="overview"
        onTabChange={mockOnTabChange}
      />
    );

    const overviewTab = screen.getByRole("tab", { name: /overview/i });
    
    // Press ArrowRight to move to next tab
    fireEvent.keyDown(overviewTab, { key: "ArrowRight" });
    expect(mockOnTabChange).toHaveBeenCalledWith("details");

    // Press ArrowLeft to move to previous tab
    fireEvent.keyDown(overviewTab, { key: "ArrowLeft" });
    expect(mockOnTabChange).toHaveBeenCalledWith("bookings");
  });

  it("wraps around when navigating past the last tab", () => {
    render(
      <TabNavigation
        tabs={mockTabs}
        activeTab="bookings"
        onTabChange={mockOnTabChange}
      />
    );

    const bookingsTab = screen.getByRole("tab", { name: /bookings/i });
    
    // Press ArrowRight on last tab should wrap to first
    fireEvent.keyDown(bookingsTab, { key: "ArrowRight" });
    expect(mockOnTabChange).toHaveBeenCalledWith("overview");
  });

  it("does not display count badge when count is 0", () => {
    const tabsWithZeroCount: DashboardTab[] = [
      { id: "overview", label: "Overview" },
      { id: "enquiries", label: "Enquiries", count: 0 },
    ];

    render(
      <TabNavigation
        tabs={tabsWithZeroCount}
        activeTab="overview"
        onTabChange={mockOnTabChange}
      />
    );

    // Count badge should not be rendered for 0 count
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("displays 99+ for counts greater than 99", () => {
    const tabsWithHighCount: DashboardTab[] = [
      { id: "enquiries", label: "Enquiries", count: 150 },
    ];

    render(
      <TabNavigation
        tabs={tabsWithHighCount}
        activeTab="enquiries"
        onTabChange={mockOnTabChange}
      />
    );

    expect(screen.getByText("99+")).toBeInTheDocument();
  });
});
