import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft, Star, MapPin, Heart, Share2, Shield, Wifi, Wind, UtensilsCrossed,
  WashingMachine, Car, Dumbbell, ChevronLeft, ChevronRight, CheckCircle2,
  MessageCircle, Calendar, Phone, ExternalLink, X, Users, Clock
} from "lucide-react";
import { properties, trendingProperties } from "../data/mockData";

const ALL_PROPERTIES = [...properties, ...trendingProperties].filter(
  (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i
);

const GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
  "https://images.unsplash.com/photo-1774578342100-f779e988c83d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
  "https://images.unsplash.com/photo-1543709525-e8764409abff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
  "https://images.unsplash.com/photo-1765728617352-895327fcf036?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
  "https://images.unsplash.com/photo-1764006195843-e6f9a5781500?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
];

const AMENITY_LIST = [
  { icon: Wifi, label: "High-Speed WiFi", available: true },
  { icon: Wind, label: "Air Conditioning", available: true },
  { icon: UtensilsCrossed, label: "Food Included", available: true },
  { icon: WashingMachine, label: "Laundry", available: true },
  { icon: Car, label: "Parking", available: false },
  { icon: Dumbbell, label: "Gym", available: false },
];

const REVIEWS = [
  {
    name: "Sneha R.",
    avatar: "https://images.unsplash.com/photo-1544264796-acfb69e05b37?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100",
    rating: 5,
    date: "March 2026",
    text: "Absolutely loved my stay here! The room was spacious, the food was great, and the owner was super responsive. Will highly recommend to anyone moving to the city.",
  },
  {
    name: "Arjun K.",
    avatar: "https://images.unsplash.com/photo-1647934729813-804092aef42d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100",
    rating: 4,
    date: "February 2026",
    text: "Great value for money. The location is perfect — close to the metro and a lot of food options nearby. WiFi could be a bit faster but overall a great place.",
  },
];

export function PropertyDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeImage, setActiveImage] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("");

  const property = ALL_PROPERTIES.find((p) => p.id === id) || ALL_PROPERTIES[0];
  const heroImage = property.image;
  const images = [heroImage, ...GALLERY_IMAGES.slice(0, 4)];

  const prevImage = () => setActiveImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const nextImage = () => setActiveImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));

  return (
    <div style={{ backgroundColor: "#F8FAFC", minHeight: "100vh", paddingBottom: "100px" }}>
      {/* Back Bar */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm hover:gap-3 transition-all"
            style={{ color: "#0F172A", fontWeight: 500 }}
          >
            <ArrowLeft size={18} /> Back to results
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setWishlisted(!wishlisted)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50 transition-all"
              style={{ color: wishlisted ? "#EF4444" : "#64748B" }}
            >
              <Heart size={15} style={{ fill: wishlisted ? "#EF4444" : "none", color: wishlisted ? "#EF4444" : "#64748B" }} />
              {wishlisted ? "Saved" : "Save"}
            </button>
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50 transition-all"
              style={{ color: "#64748B" }}
            >
              <Share2 size={15} /> Share
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Content */}
          <div className="flex-1 min-w-0">
            {/* Image Gallery */}
            <div className="rounded-2xl overflow-hidden mb-6" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
              {/* Main Image */}
              <div className="relative" style={{ height: "clamp(260px, 45vw, 520px)" }}>
                <img
                  src={images[activeImage]}
                  alt={property.title}
                  className="w-full h-full object-cover transition-all duration-500"
                />
                {/* Nav arrows */}
                <button
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-all"
                >
                  <ChevronLeft size={18} style={{ color: "#0F172A" }} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-all"
                >
                  <ChevronRight size={18} style={{ color: "#0F172A" }} />
                </button>
                {/* Counter */}
                <div
                  className="absolute bottom-3 right-3 px-3 py-1 rounded-full text-xs text-white"
                  style={{ backgroundColor: "rgba(0,0,0,0.55)", fontWeight: 600 }}
                >
                  {activeImage + 1} / {images.length}
                </div>
              </div>
              {/* Thumbnails */}
              <div className="flex gap-2 p-3" style={{ backgroundColor: "#0F172A" }}>
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className="flex-1 overflow-hidden rounded-lg transition-all"
                    style={{
                      height: "60px",
                      border: `2px solid ${i === activeImage ? "#3B82F6" : "transparent"}`,
                      opacity: i === activeImage ? 1 : 0.6,
                    }}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Property Info */}
            <div className="bg-white rounded-2xl p-6 mb-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2.5 py-1 rounded-lg" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 600 }}>
                      {property.type}
                    </span>
                    {property.verified && (
                      <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg" style={{ backgroundColor: "#F0FDF4", color: "#16A34A", fontWeight: 600 }}>
                        <Shield size={11} /> Verified
                      </span>
                    )}
                  </div>
                  <h1 style={{ color: "#0F172A", fontWeight: 700, fontSize: "clamp(1.2rem, 3vw, 1.6rem)" }}>
                    {property.title}
                  </h1>
                  <div className="flex items-center gap-2 mt-2">
                    <MapPin size={14} style={{ color: "#94A3B8" }} />
                    <span className="text-sm" style={{ color: "#64748B" }}>{property.location}</span>
                    <button className="flex items-center gap-1 text-xs ml-1" style={{ color: "#1D4ED8" }}>
                      <ExternalLink size={11} /> View on Map
                    </button>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-2xl" style={{ color: "#0F172A", fontWeight: 800 }}>
                    ₹{property.price.toLocaleString("en-IN")}
                  </div>
                  <div className="text-xs" style={{ color: "#94A3B8" }}>per month</div>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <Star size={14} style={{ fill: "#F59E0B", color: "#F59E0B" }} />
                    <span className="text-sm" style={{ fontWeight: 700 }}>{property.rating}</span>
                    <span className="text-xs" style={{ color: "#94A3B8" }}>({property.reviews} reviews)</span>
                  </div>
                </div>
              </div>

              {/* Quick tags */}
              <div className="flex flex-wrap gap-2 py-4 border-t border-b border-gray-50">
                {property.tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl" style={{ backgroundColor: "#F1F5F9", color: "#475569", fontWeight: 500 }}>
                    <CheckCircle2 size={11} style={{ color: "#22C55E" }} />
                    {tag}
                  </span>
                ))}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                {[
                  { label: "Available From", value: "May 1, 2026", icon: Calendar },
                  { label: "Occupancy", value: "Single / Double", icon: Users },
                  { label: "Notice Period", value: "1 Month", icon: Clock },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="text-center">
                    <Icon size={18} className="mx-auto mb-1" style={{ color: "#1D4ED8" }} />
                    <p className="text-xs" style={{ color: "#94A3B8" }}>{label}</p>
                    <p className="text-sm" style={{ color: "#0F172A", fontWeight: 600 }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-6 mb-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <h2 className="text-base mb-3" style={{ color: "#0F172A", fontWeight: 700 }}>About This Property</h2>
              <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>
                Welcome to {property.title} — one of the most sought-after accommodations in {property.location}. This fully managed property features premium amenities, 24/7 security, and a warm community of like-minded residents.
              </p>
              <p className="text-sm leading-relaxed mt-3" style={{ color: "#475569" }}>
                Strategically located with easy access to public transport, restaurants, and IT hubs, this stay is perfect for working professionals and students alike. The property is thoroughly verified by StayHub's inspection team and comes with a hassle-free stay guarantee.
              </p>
              <ul className="mt-4 space-y-2">
                {["No brokerage, direct owner deal", "Monthly rent includes utilities", "Zero deposit option available", "Flexible notice period"].map((point) => (
                  <li key={point} className="flex items-center gap-2 text-sm" style={{ color: "#334155" }}>
                    <CheckCircle2 size={14} style={{ color: "#22C55E" }} />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-2xl p-6 mb-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <h2 className="text-base mb-4" style={{ color: "#0F172A", fontWeight: 700 }}>Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {AMENITY_LIST.map(({ icon: Icon, label, available }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ backgroundColor: available ? "#F0FDF4" : "#F8FAFC", opacity: available ? 1 : 0.5 }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: available ? "#DCFCE7" : "#F1F5F9" }}
                    >
                      <Icon size={18} style={{ color: available ? "#16A34A" : "#94A3B8" }} />
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: available ? "#0F172A" : "#94A3B8", fontWeight: 500 }}>{label}</p>
                      <p className="text-xs" style={{ color: available ? "#16A34A" : "#CBD5E1" }}>{available ? "Available" : "Not available"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="bg-white rounded-2xl overflow-hidden mb-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div className="p-5 pb-0">
                <h2 className="text-base mb-1" style={{ color: "#0F172A", fontWeight: 700 }}>Location</h2>
                <p className="text-sm" style={{ color: "#94A3B8" }}>{property.location}</p>
              </div>
              <div
                className="relative mx-5 my-4 rounded-xl overflow-hidden flex items-center justify-center"
                style={{ height: "240px", backgroundColor: "#E2E8F0" }}
              >
                <img
                  src={`https://images.unsplash.com/photo-1764996915324-91919cee14d3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800`}
                  alt="Map"
                  className="w-full h-full object-cover opacity-40"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: "#1D4ED8" }}>
                    <MapPin size={20} className="text-white" />
                  </div>
                  <span className="text-sm" style={{ color: "#0F172A", fontWeight: 600 }}>
                    {property.location}
                  </span>
                  <button
                    className="mt-3 px-4 py-2 rounded-xl text-sm text-white"
                    style={{ backgroundColor: "#1D4ED8", fontWeight: 600 }}
                  >
                    Open in Maps
                  </button>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-2xl p-6" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base" style={{ color: "#0F172A", fontWeight: 700 }}>
                  Reviews ({property.reviews})
                </h2>
                <div className="flex items-center gap-1.5">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={14} style={{ fill: "#F59E0B", color: "#F59E0B" }} />
                    ))}
                  </div>
                  <span className="text-sm" style={{ fontWeight: 700 }}>{property.rating}</span>
                </div>
              </div>
              <div className="space-y-5">
                {REVIEWS.map((review, i) => (
                  <div key={i} className="pb-5 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      <img
                        src={review.avatar}
                        alt={review.name}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm" style={{ color: "#0F172A", fontWeight: 600 }}>{review.name}</p>
                          <span className="text-xs" style={{ color: "#94A3B8" }}>{review.date}</span>
                        </div>
                        <div className="flex gap-0.5 mt-1 mb-2">
                          {Array(review.rating).fill(0).map((_, j) => (
                            <Star key={j} size={12} style={{ fill: "#F59E0B", color: "#F59E0B" }} />
                          ))}
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>{review.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Booking Panel — Desktop */}
          <div className="hidden lg:block flex-shrink-0" style={{ width: "360px" }}>
            <div className="sticky" style={{ top: "128px" }}>
              <div className="bg-white rounded-2xl p-6" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }}>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl" style={{ color: "#0F172A", fontWeight: 800 }}>
                    ₹{property.price.toLocaleString("en-IN")}
                  </span>
                  <span className="text-sm" style={{ color: "#94A3B8" }}>/month</span>
                </div>
                <div className="flex items-center gap-1 mb-5">
                  <Star size={14} style={{ fill: "#F59E0B", color: "#F59E0B" }} />
                  <span className="text-sm" style={{ fontWeight: 600 }}>{property.rating}</span>
                  <span className="text-xs" style={{ color: "#94A3B8" }}>· {property.reviews} reviews</span>
                </div>

                {/* Move-in Date */}
                <div className="mb-4 p-3 rounded-xl border border-gray-200">
                  <label className="text-xs block mb-1" style={{ color: "#94A3B8", fontWeight: 600, textTransform: "uppercase" }}>
                    Move-in Date
                  </label>
                  <input
                    type="date"
                    className="w-full text-sm outline-none"
                    style={{ color: "#0F172A" }}
                  />
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 py-4 border-t border-b border-gray-50 mb-4">
                  {[
                    { label: "Monthly Rent", value: `₹${property.price.toLocaleString("en-IN")}` },
                    { label: "Security Deposit", value: "₹0 (Zero Deposit)" },
                    { label: "Brokerage", value: "₹0 (Free)" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: "#64748B" }}>{label}</span>
                      <span className="text-sm" style={{ color: "#0F172A", fontWeight: 600 }}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* CTAs */}
                <div className="space-y-3">
                  <button
                    onClick={() => setShowBookingModal(true)}
                    className="w-full py-4 rounded-2xl text-white transition-all hover:opacity-90 active:scale-98"
                    style={{ backgroundColor: "#1D4ED8", fontWeight: 700, fontSize: "0.95rem", boxShadow: "0 4px 16px rgba(29,78,216,0.35)" }}
                  >
                    Book Now
                  </button>
                  <button
                    onClick={() => setShowVisitModal(true)}
                    className="w-full py-3.5 rounded-2xl transition-all hover:bg-blue-50 text-sm"
                    style={{ border: "2px solid #1D4ED8", color: "#1D4ED8", fontWeight: 700 }}
                  >
                    📅 Schedule a Visit
                  </button>
                  <a
                    href="https://wa.me/919876543210"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm transition-all hover:opacity-90"
                    style={{ backgroundColor: "#22C55E", color: "white", fontWeight: 700, textDecoration: "none" }}
                  >
                    <MessageCircle size={17} />
                    Chat on WhatsApp
                  </a>
                </div>

                <p className="text-center text-xs mt-4" style={{ color: "#94A3B8" }}>
                  You won't be charged yet. Review before confirming.
                </p>
              </div>

              {/* Owner Card */}
              <div className="bg-white rounded-2xl p-5 mt-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src="https://images.unsplash.com/photo-1647934729813-804092aef42d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100"
                    alt="Owner"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm" style={{ color: "#0F172A", fontWeight: 600 }}>Rajesh Kumar</p>
                    <p className="text-xs" style={{ color: "#94A3B8" }}>Property Owner</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Shield size={11} style={{ color: "#22C55E" }} />
                      <span className="text-xs" style={{ color: "#22C55E", fontWeight: 500 }}>Identity Verified</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm border border-gray-200 hover:bg-gray-50" style={{ color: "#0F172A", fontWeight: 500 }}>
                    <Phone size={14} />
                    Call Now
                  </button>
                  <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm" style={{ backgroundColor: "#25D366", color: "white", fontWeight: 600 }}>
                    <MessageCircle size={14} />
                    WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky CTA */}
      <div
        className="lg:hidden fixed bottom-14 left-0 right-0 z-40 px-4 pb-2 pt-3"
        style={{ background: "linear-gradient(to top, white, white 80%, transparent)" }}
      >
        <div className="flex gap-3">
          <button
            onClick={() => setShowVisitModal(true)}
            className="flex-1 py-3.5 rounded-2xl text-sm border-2"
            style={{ borderColor: "#1D4ED8", color: "#1D4ED8", fontWeight: 700 }}
          >
            Schedule Visit
          </button>
          <button
            onClick={() => setShowBookingModal(true)}
            className="flex-1 py-3.5 rounded-2xl text-sm text-white"
            style={{ backgroundColor: "#1D4ED8", fontWeight: 700, boxShadow: "0 4px 16px rgba(29,78,216,0.35)" }}
          >
            Book Now
          </button>
          <a
            href="https://wa.me/919876543210"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 flex items-center justify-center rounded-2xl flex-shrink-0"
            style={{ backgroundColor: "#22C55E" }}
          >
            <MessageCircle size={20} className="text-white" />
          </a>
        </div>
      </div>

      {/* Book Now Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBookingModal(false)} />
          <div className="relative bg-white rounded-3xl p-7 w-full max-w-md shadow-2xl">
            <button onClick={() => setShowBookingModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100">
              <X size={16} style={{ color: "#64748B" }} />
            </button>
            <h2 className="text-lg mb-1" style={{ color: "#0F172A", fontWeight: 700 }}>Confirm Booking</h2>
            <p className="text-sm mb-6" style={{ color: "#94A3B8" }}>{property.title}</p>

            <div className="space-y-4 mb-6">
              {[
                { label: "Monthly Rent", value: `₹${property.price.toLocaleString("en-IN")}`, highlight: false },
                { label: "Security Deposit", value: "₹0 (Zero Deposit)", highlight: false },
                { label: "Brokerage", value: "₹0 (Free!)", highlight: true },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-sm" style={{ color: "#64748B" }}>{label}</span>
                  <span className="text-sm" style={{ color: highlight ? "#22C55E" : "#0F172A", fontWeight: 700 }}>{value}</span>
                </div>
              ))}
            </div>

            <button
              className="w-full py-4 rounded-2xl text-white"
              style={{ backgroundColor: "#1D4ED8", fontWeight: 700 }}
              onClick={() => setShowBookingModal(false)}
            >
              Proceed to Payment →
            </button>
          </div>
        </div>
      )}

      {/* Schedule Visit Modal */}
      {showVisitModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowVisitModal(false)} />
          <div className="relative bg-white rounded-3xl p-7 w-full max-w-md shadow-2xl">
            <button onClick={() => setShowVisitModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100">
              <X size={16} style={{ color: "#64748B" }} />
            </button>
            <h2 className="text-lg mb-1" style={{ color: "#0F172A", fontWeight: 700 }}>📅 Schedule a Visit</h2>
            <p className="text-sm mb-6" style={{ color: "#94A3B8" }}>Pick a date and time that works for you</p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs block mb-2" style={{ color: "#94A3B8", fontWeight: 600, textTransform: "uppercase" }}>Visit Date</label>
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full text-sm px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-blue-500"
                  style={{ color: "#0F172A" }}
                />
              </div>
              <div>
                <label className="text-xs block mb-2" style={{ color: "#94A3B8", fontWeight: 600, textTransform: "uppercase" }}>Preferred Time</label>
                <div className="grid grid-cols-3 gap-2">
                  {["10:00 AM", "12:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM"].map((time) => (
                    <button
                      key={time}
                      onClick={() => setVisitTime(time)}
                      className="py-2 rounded-xl text-xs transition-all"
                      style={{
                        border: `1.5px solid ${visitTime === time ? "#1D4ED8" : "#E2E8F0"}`,
                        backgroundColor: visitTime === time ? "#EFF6FF" : "white",
                        color: visitTime === time ? "#1D4ED8" : "#64748B",
                        fontWeight: visitTime === time ? 600 : 400,
                      }}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              className="w-full py-4 rounded-2xl text-white"
              style={{ backgroundColor: "#1D4ED8", fontWeight: 700 }}
              onClick={() => setShowVisitModal(false)}
            >
              Confirm Visit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
