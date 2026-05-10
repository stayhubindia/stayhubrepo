import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Menu, X, MapPin, ChevronDown } from "lucide-react";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1D4ED8, #3B82F6)" }}>
              <MapPin size={16} className="text-white" />
            </div>
            <span className="text-xl" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, color: "#0F172A" }}>
              Stay<span style={{ color: "#1D4ED8" }}>Hub</span>
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Home", path: "/" },
              { label: "Stays", path: "/search" },
              { label: "Become a Host", path: "/" },
              { label: "About", path: "/" },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className="text-sm transition-colors duration-200 hover:text-blue-700"
                style={{ color: "#0F172A", fontWeight: 500 }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button className="px-4 py-2 text-sm rounded-xl transition-colors hover:bg-gray-100" style={{ color: "#0F172A", fontWeight: 500 }}>
              Login
            </button>
            <button
              className="px-5 py-2 text-sm text-white rounded-xl transition-all duration-200 hover:opacity-90 shadow-sm"
              style={{ backgroundColor: "#1D4ED8", fontWeight: 600 }}
              onClick={() => navigate("/search")}
            >
              Sign Up
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={22} style={{ color: "#0F172A" }} /> : <Menu size={22} style={{ color: "#0F172A" }} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-6 pt-4 space-y-4 shadow-lg">
          {[
            { label: "Home", path: "/" },
            { label: "Stays", path: "/search" },
            { label: "Become a Host", path: "/" },
            { label: "About", path: "/" },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className="block py-2 text-sm border-b border-gray-50"
              style={{ color: "#0F172A", fontWeight: 500 }}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="flex gap-3 pt-2">
            <button className="flex-1 py-2.5 text-sm rounded-xl border border-gray-200 hover:bg-gray-50" style={{ color: "#0F172A" }}>
              Login
            </button>
            <button
              className="flex-1 py-2.5 text-sm text-white rounded-xl"
              style={{ backgroundColor: "#1D4ED8", fontWeight: 600 }}
            >
              Sign Up
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
