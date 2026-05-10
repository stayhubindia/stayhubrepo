import { Link, useLocation } from "react-router";
import { Home, Search, Heart, Calendar, User } from "lucide-react";

const navItems = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Search", icon: Search, path: "/search" },
  { label: "Saved", icon: Heart, path: "/" },
  { label: "Bookings", icon: Calendar, path: "/" },
  { label: "Profile", icon: User, path: "/" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-xl">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ label, icon: Icon, path }) => {
          const isActive =
            path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
          return (
            <Link
              key={label}
              to={path}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={{
                  backgroundColor: isActive ? "#EFF6FF" : "transparent",
                }}
              >
                <Icon
                  size={20}
                  style={{ color: isActive ? "#1D4ED8" : "#94A3B8" }}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span
                className="text-xs"
                style={{
                  color: isActive ? "#1D4ED8" : "#94A3B8",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
