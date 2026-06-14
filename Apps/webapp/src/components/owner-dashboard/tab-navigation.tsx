"use client";

import { motion } from "framer-motion";
import type { DashboardTab } from "@/types/owner-dashboard";

interface TabNavigationProps {
  /** Array of tabs to display */
  tabs: DashboardTab[];
  /** Currently active tab ID */
  activeTab: string;
  /** Callback when a tab is clicked */
  onTabChange: (tabId: string) => void;
}

/**
 * TabNavigation Component
 * 
 * Displays a horizontal tab navigation bar with count badges, keyboard navigation,
 * and smooth transitions. Supports horizontal scrolling on mobile devices.
 * 
 * Features:
 * - 8 tabs: Overview, Details, Amenities, Location, House Rules, Enquiries, Bookings, Activity
 * - Count badges for Enquiries and Bookings tabs
 * - Emerald green highlight for active tab
 * - Horizontal scroll on mobile
 * - Keyboard navigation (Arrow keys)
 * - Smooth animations with Framer Motion
 * 
 * @example
 * ```tsx
 * <TabNavigation
 *   tabs={tabs}
 *   activeTab="overview"
 *   onTabChange={(tabId) => setActiveTab(tabId)}
 * />
 * ```
 */
export function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  /**
   * Handle keyboard navigation
   * - ArrowRight: Move to next tab
   * - ArrowLeft: Move to previous tab
   */
  const handleKeyDown = (e: React.KeyboardEvent, currentTabId: string) => {
    const currentIndex = tabs.findIndex((t) => t.id === currentTabId);

    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % tabs.length;
      onTabChange(tabs[nextIndex].id);
      // Focus the next tab button
      const nextButton = document.querySelector(
        `[data-tab-id="${tabs[nextIndex].id}"]`
      ) as HTMLButtonElement;
      nextButton?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      onTabChange(tabs[prevIndex].id);
      // Focus the previous tab button
      const prevButton = document.querySelector(
        `[data-tab-id="${tabs[prevIndex].id}"]`
      ) as HTMLButtonElement;
      prevButton?.focus();
    }
  };

  return (
    <div
      className="border-b border-slate-200 bg-white"
      role="tablist"
      aria-label="Property information tabs"
    >
      {/* Horizontal scrollable container for mobile */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex min-w-max gap-1 px-4 md:gap-2 md:px-6">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;

            return (
              <button
                key={tab.id}
                data-tab-id={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => onTabChange(tab.id)}
                onKeyDown={(e) => handleKeyDown(e, tab.id)}
                className={`
                  relative flex items-center gap-2 whitespace-nowrap px-4 py-4 text-sm font-semibold
                  transition-colors duration-200
                  ${
                    isActive
                      ? "text-emerald-700"
                      : "text-slate-600 hover:text-slate-900"
                  }
                  focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
                `}
              >
                {/* Tab Icon (if provided) */}
                {tab.icon && (
                  <span className="flex-shrink-0">
                    <tab.icon />
                  </span>
                )}

                {/* Tab Label */}
                <span>{tab.label}</span>

                {/* Count Badge */}
                {tab.count !== undefined && tab.count > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-100 px-1.5 text-xs font-bold text-emerald-700"
                  >
                    {tab.count > 99 ? "99+" : tab.count}
                  </motion.span>
                )}

                {/* Active Tab Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
