import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Search, MapPin, Calendar, Users, Navigation, Star, Shield, DollarSign, Headphones, Eye,
  ChevronRight, ArrowRight, TrendingUp, CheckCircle2, Building2, Home, Bed, UsersRound, Handshake,
} from "lucide-react";
import { PropertyCard } from "../components/PropertyCard";
import { properties, testimonials, categories, trendingProperties } from "../data/mockData";

function HeroSection() {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [guests, setGuests] = useState("1 Guest");

  const handleSearch = () => {
    navigate("/search");
  };

  return (
    <section className="relative overflow-hidden" style={{ minHeight: "92vh" }}>
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1764996915324-91919cee14d3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1920"
          alt="Modern apartment"
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, rgba(15,23,42,0.82) 0%, rgba(29,78,216,0.45) 100%)" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-32 pb-24">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
          style={{ backgroundColor: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)" }}
        >
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#22C55E" }} />
          <span className="text-white text-sm" style={{ fontWeight: 500 }}>
            50,000+ Verified Stays Across India
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-white mb-4 max-w-4xl" style={{ fontSize: "clamp(2rem, 5vw, 3.75rem)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
          Find PG, Hostels &{" "}
          <span style={{ color: "#60A5FA" }}>Rooms Near You</span>
        </h1>

        <p className="mb-10 max-w-xl" style={{ color: "rgba(255,255,255,0.8)", fontSize: "clamp(1rem, 2vw, 1.2rem)", lineHeight: 1.6 }}>
          Verified stays, no brokerage, easy booking. Your next home is just a search away.
        </p>

        {/* Search Card */}
        <div
          className="w-full max-w-4xl rounded-2xl p-2"
          style={{ backgroundColor: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", boxShadow: "0 24px 80px rgba(0,0,0,0.25)" }}
        >
          <div className="flex flex-col lg:flex-row gap-2">
            {/* Location */}
            <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-gray-100">
              <MapPin size={18} style={{ color: "#1D4ED8", flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <div className="text-xs mb-0.5" style={{ color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Location</div>
                <input
                  type="text"
                  placeholder="Bengaluru, Mumbai, Delhi..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full text-sm outline-none bg-transparent"
                  style={{ color: "#0F172A" }}
                />
              </div>
              <button
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all hover:opacity-80"
                style={{ color: "#1D4ED8", backgroundColor: "#EFF6FF", fontWeight: 600, flexShrink: 0 }}
                onClick={() => setLocation("Current Location")}
              >
                <Navigation size={11} />
                Detect
              </button>
            </div>

            {/* Check-in */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-gray-100 lg:w-44">
              <Calendar size={18} style={{ color: "#1D4ED8", flexShrink: 0 }} />
              <div>
                <div className="text-xs mb-0.5" style={{ color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Move-in</div>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="text-sm outline-none bg-transparent w-full"
                  style={{ color: checkIn ? "#0F172A" : "#94A3B8" }}
                />
              </div>
            </div>

            {/* Guests */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-gray-100 lg:w-36">
              <Users size={18} style={{ color: "#1D4ED8", flexShrink: 0 }} />
              <div>
                <div className="text-xs mb-0.5" style={{ color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Guests</div>
                <select
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="text-sm outline-none bg-transparent"
                  style={{ color: "#0F172A" }}
                >
                  {["1 Guest", "2 Guests", "3+ Guests"].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="flex items-center justify-center gap-2 px-8 py-3 text-white rounded-xl transition-all duration-200 hover:opacity-90 active:scale-98 whitespace-nowrap"
              style={{ backgroundColor: "#1D4ED8", fontWeight: 700, minWidth: "140px", boxShadow: "0 4px 16px rgba(29,78,216,0.4)" }}
            >
              <Search size={18} />
              Search Stays
            </button>
          </div>
        </div>

        {/* Quick filters */}
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          {["PG for Boys", "PG for Girls", "Hostels", "Under ₹8000", "Near Metro"].map((filter) => (
            <button
              key={filter}
              onClick={handleSearch}
              className="px-4 py-2 rounded-full text-sm transition-all hover:bg-white hover:text-blue-700"
              style={{
                backgroundColor: "rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.9)",
                border: "1px solid rgba(255,255,255,0.25)",
                backdropFilter: "blur(8px)",
                fontWeight: 500,
              }}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 mt-12">
          {[
            { value: "50K+", label: "Verified Listings" },
            { value: "₹0", label: "Brokerage" },
            { value: "25+", label: "Cities" },
            { value: "4.8★", label: "Avg Rating" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-white mb-0.5" style={{ fontSize: "1.5rem", fontWeight: 800 }}>{value}</div>
              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.8rem" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoriesSection() {
  const navigate = useNavigate();
  const categoryIcons = [Building2, Home, Bed, Building2, UsersRound];
  const categoryColors = ["#1D4ED8", "#7C3AED", "#EA580C", "#0891B2", "#16A34A"];
  const categoryBg = ["#EFF6FF", "#F5F3FF", "#FFF7ED", "#ECFEFF", "#F0FDF4"];

  return (
    <section className="py-16 px-4" style={{ backgroundColor: "#F8FAFC" }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm mb-1" style={{ color: "#1D4ED8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Browse By Type</p>
            <h2 style={{ color: "#0F172A", fontWeight: 700, fontSize: "clamp(1.3rem, 3vw, 1.8rem)" }}>Find Your Perfect Stay</h2>
          </div>
          <button
            className="hidden sm:flex items-center gap-2 text-sm hover:gap-3 transition-all"
            style={{ color: "#1D4ED8", fontWeight: 600 }}
            onClick={() => navigate("/search")}
          >
            View All <ArrowRight size={16} />
          </button>
        </div>

        {/* Desktop: 5 columns | Mobile: horizontal scroll */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
          {categories.map((cat, i) => {
            const Icon = categoryIcons[i];
            return (
              <button
                key={cat.label}
                onClick={() => navigate("/search")}
                className="group flex-none snap-start rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
                style={{
                  backgroundColor: "white",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                  minWidth: "160px",
                  flex: "1 0 160px",
                  maxWidth: "calc(20% - 16px)",
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all group-hover:scale-110"
                  style={{ backgroundColor: categoryBg[i] }}
                >
                  <Icon size={26} style={{ color: categoryColors[i] }} />
                </div>
                <div className="text-2xl mb-2">{cat.emoji}</div>
                <p className="text-sm mb-1" style={{ color: "#0F172A", fontWeight: 600 }}>{cat.label}</p>
                <p className="text-xs" style={{ color: "#94A3B8" }}>{cat.count} stays</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TrendingSection() {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm mb-1" style={{ color: "#22C55E", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>🔥 Hot Right Now</p>
            <h2 style={{ color: "#0F172A", fontWeight: 700, fontSize: "clamp(1.3rem, 3vw, 1.8rem)" }}>Trending in Your City</h2>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={18} style={{ color: "#22C55E" }} />
            <span className="text-sm" style={{ color: "#64748B" }}>Updated daily</span>
          </div>
        </div>

        {/* Trend badges */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {[
            { label: "Under ₹8000", icon: "💰", color: "#22C55E", bg: "#F0FDF4" },
            { label: "Near Metro", icon: "🚇", color: "#1D4ED8", bg: "#EFF6FF" },
            { label: "Best Rated", icon: "⭐", color: "#F59E0B", bg: "#FFFBEB" },
            { label: "Food Included", icon: "🍱", color: "#EA580C", bg: "#FFF7ED" },
            { label: "Girls Only", icon: "👩", color: "#EC4899", bg: "#FDF2F8" },
          ].map(({ label, icon, color, bg }) => (
            <div
              key={label}
              className="flex-none flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-all hover:shadow-md"
              style={{ backgroundColor: bg, border: `1px solid ${color}30` }}
            >
              <span>{icon}</span>
              <span className="text-sm whitespace-nowrap" style={{ color, fontWeight: 600 }}>{label}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {trendingProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PopularStaysSection() {
  const navigate = useNavigate();

  return (
    <section className="py-16 px-4" style={{ backgroundColor: "#F8FAFC" }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm mb-1" style={{ color: "#1D4ED8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Popular Stays</p>
            <h2 style={{ color: "#0F172A", fontWeight: 700, fontSize: "clamp(1.3rem, 3vw, 1.8rem)" }}>Loved by Thousands</h2>
          </div>
          <button
            className="flex items-center gap-2 text-sm hover:gap-3 transition-all"
            style={{ color: "#1D4ED8", fontWeight: 600 }}
            onClick={() => navigate("/search")}
          >
            View All <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyChooseUs() {
  const features = [
    {
      icon: Shield,
      title: "Verified Listings",
      desc: "Every property is physically inspected and digitally verified by our team before listing.",
      color: "#1D4ED8",
      bg: "#EFF6FF",
    },
    {
      icon: DollarSign,
      title: "Zero Brokerage",
      desc: "Connect directly with property owners. No middlemen, no hidden charges, ever.",
      color: "#22C55E",
      bg: "#F0FDF4",
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      desc: "Our dedicated support team is always available to help you find your perfect stay.",
      color: "#7C3AED",
      bg: "#F5F3FF",
    },
    {
      icon: Eye,
      title: "Visit Before Booking",
      desc: "Schedule a property visit at your convenience before making any commitment.",
      color: "#EA580C",
      bg: "#FFF7ED",
    },
  ];

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm mb-2" style={{ color: "#1D4ED8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Why StayHub?</p>
          <h2 style={{ color: "#0F172A", fontWeight: 700, fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)" }}>The Smarter Way to Find Your Home</h2>
          <p className="mt-3 max-w-xl mx-auto" style={{ color: "#64748B", lineHeight: 1.7 }}>
            We've reimagined the rental experience in India — transparent, trustworthy, and tenant-first.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc, color, bg }) => (
            <div
              key={title}
              className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
              style={{ backgroundColor: "#F8FAFC", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                style={{ backgroundColor: bg }}
              >
                <Icon size={26} style={{ color }} />
              </div>
              <h3 className="mb-2" style={{ color: "#0F172A", fontWeight: 700, fontSize: "1rem" }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#64748B" }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BecomeHostSection() {
  return (
    <section className="py-8 px-4" style={{ backgroundColor: "#F8FAFC" }}>
      <div className="max-w-7xl mx-auto">
        <div
          className="rounded-3xl overflow-hidden relative"
          style={{ background: "linear-gradient(135deg, #1D4ED8 0%, #1E40AF 50%, #1E3A8A 100%)", boxShadow: "0 20px 60px rgba(29,78,216,0.3)" }}
        >
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }}
          />
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between p-10 lg:p-16 gap-8">
            <div className="text-center lg:text-left max-w-xl">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
                style={{ backgroundColor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}
              >
                <Handshake size={14} className="text-white" />
                <span className="text-white text-xs" style={{ fontWeight: 600 }}>For Property Owners</span>
              </div>
              <h2 className="text-white mb-4" style={{ fontWeight: 800, fontSize: "clamp(1.5rem, 4vw, 2.5rem)", lineHeight: 1.2 }}>
                Earn Money by Listing Your Property
              </h2>
              <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.7, fontSize: "1rem" }}>
                Join 10,000+ property owners on StayHub. Get verified tenants, guaranteed rent, and zero hassle. Start earning today!
              </p>
              <div className="flex flex-wrap gap-4 mt-6 justify-center lg:justify-start">
                {["Free Listing", "Verified Tenants", "Instant Payouts"].map((benefit) => (
                  <div key={benefit} className="flex items-center gap-2">
                    <CheckCircle2 size={16} style={{ color: "#22C55E" }} />
                    <span className="text-white text-sm" style={{ fontWeight: 500 }}>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3 flex-shrink-0">
              <button
                className="px-8 py-4 rounded-2xl transition-all duration-200 hover:bg-gray-50 active:scale-95"
                style={{ backgroundColor: "white", color: "#1D4ED8", fontWeight: 700, fontSize: "1rem", minWidth: "200px", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}
              >
                List Your Property →
              </button>
              <button
                className="px-8 py-3 rounded-2xl transition-all hover:bg-white/20 text-sm"
                style={{ border: "1.5px solid rgba(255,255,255,0.4)", color: "white", fontWeight: 500 }}
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm mb-2" style={{ color: "#1D4ED8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Testimonials</p>
          <h2 style={{ color: "#0F172A", fontWeight: 700, fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)" }}>
            What Our Users Say 💬
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
              style={{ backgroundColor: "#F8FAFC", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array(t.rating).fill(0).map((_, i) => (
                  <Star key={i} size={15} style={{ fill: "#F59E0B", color: "#F59E0B" }} />
                ))}
              </div>

              <p className="text-sm leading-relaxed mb-6" style={{ color: "#334155" }}>
                "{t.text}"
              </p>

              <div className="flex items-center gap-3">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-white"
                  style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                />
                <div>
                  <p className="text-sm" style={{ color: "#0F172A", fontWeight: 600 }}>{t.name}</p>
                  <p className="text-xs" style={{ color: "#94A3B8" }}>{t.role}</p>
                </div>
                <div className="ml-auto">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#EFF6FF" }}
                  >
                    <CheckCircle2 size={16} style={{ color: "#1D4ED8" }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* City tags */}
        <div className="flex flex-wrap justify-center gap-3 mt-12">
          {["Bengaluru", "Mumbai", "Delhi NCR", "Hyderabad", "Chennai", "Pune", "Kolkata", "Ahmedabad"].map((city) => (
            <div
              key={city}
              className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ backgroundColor: "#F1F5F9", color: "#475569" }}
            >
              <MapPin size={12} style={{ color: "#1D4ED8" }} />
              <span className="text-sm" style={{ fontWeight: 500 }}>{city}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomePage() {
  return (
    <div>
      <HeroSection />
      <CategoriesSection />
      <TrendingSection />
      <PopularStaysSection />
      <WhyChooseUs />
      <BecomeHostSection />
      <TestimonialsSection />
    </div>
  );
}