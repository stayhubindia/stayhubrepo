import { MapPin, Phone, Mail, Instagram, Twitter, Facebook, Linkedin, Youtube } from "lucide-react";
import { Link } from "react-router";

export function Footer() {
  return (
    <footer style={{ backgroundColor: "#0F172A" }} className="text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1D4ED8, #3B82F6)" }}>
                <MapPin size={16} className="text-white" />
              </div>
              <span className="text-xl" style={{ fontWeight: 700 }}>
                Stay<span style={{ color: "#3B82F6" }}>Hub</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "#94A3B8" }}>
              India's most trusted platform for finding verified PGs, hostels, and budget rentals. No brokerage, easy booking.
            </p>
            <div className="flex gap-3">
              {[Instagram, Twitter, Facebook, Linkedin].map((Icon, i) => (
                <button
                  key={i}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                  style={{ backgroundColor: "#1E293B" }}
                >
                  <Icon size={16} style={{ color: "#94A3B8" }} />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm mb-4" style={{ fontWeight: 600, color: "#F1F5F9" }}>Quick Links</h4>
            <ul className="space-y-3">
              {["About Us", "Stays Near You", "Become a Host", "Blog", "Careers", "Press"].map((item) => (
                <li key={item}>
                  <Link to="/" className="text-sm transition-colors hover:text-white" style={{ color: "#64748B" }}>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm mb-4" style={{ fontWeight: 600, color: "#F1F5F9" }}>Support</h4>
            <ul className="space-y-3">
              {["Help Center", "Safety Tips", "Report a Listing", "Refund Policy", "Terms of Service", "Privacy Policy"].map((item) => (
                <li key={item}>
                  <Link to="/" className="text-sm transition-colors hover:text-white" style={{ color: "#64748B" }}>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm mb-4" style={{ fontWeight: 600, color: "#F1F5F9" }}>Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin size={15} style={{ color: "#3B82F6", marginTop: 2, flexShrink: 0 }} />
                <span className="text-sm" style={{ color: "#64748B" }}>
                  12th Floor, DLF Cyber City, Gurugram, Haryana 122002
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={15} style={{ color: "#3B82F6" }} />
                <span className="text-sm" style={{ color: "#64748B" }}>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={15} style={{ color: "#3B82F6" }} />
                <span className="text-sm" style={{ color: "#64748B" }}>hello@stayhub.in</span>
              </div>
            </div>

            {/* App Badges */}
            <div className="mt-6 space-y-2">
              {["Download on App Store", "Get it on Google Play"].map((label) => (
                <button
                  key={label}
                  className="w-full py-2.5 px-4 rounded-xl text-xs text-left transition-all hover:opacity-80"
                  style={{ backgroundColor: "#1E293B", color: "#94A3B8", fontWeight: 500, border: "1px solid #334155" }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: "#1E293B" }}>
          <p className="text-sm" style={{ color: "#475569" }}>
            © 2026 StayHub Technologies Pvt. Ltd. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Cookie Policy"].map((item) => (
              <Link key={item} to="/" className="text-sm hover:text-white transition-colors" style={{ color: "#475569" }}>
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
