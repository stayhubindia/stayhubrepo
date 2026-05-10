import { useState } from "react";
import { Heart, Star, MapPin, Zap, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router";

export interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  tags: string[];
  type: string;
  verified: boolean;
  instantBooking?: boolean;
}

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const [wishlisted, setWishlisted] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:-translate-y-1"
      style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.08)" }}
      onClick={() => navigate(`/property/${property.id}`)}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: "200px" }}>
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Wishlist */}
        <button
          className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110 z-10"
          onClick={(e) => {
            e.stopPropagation();
            setWishlisted(!wishlisted);
          }}
        >
          <Heart
            size={17}
            style={{
              color: wishlisted ? "#EF4444" : "#94A3B8",
              fill: wishlisted ? "#EF4444" : "none",
            }}
          />
        </button>
        {/* Tags overlay */}
        <div className="absolute bottom-3 left-3 flex gap-2 flex-wrap">
          {property.verified && (
            <span
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-white"
              style={{ backgroundColor: "rgba(29,78,216,0.85)", fontWeight: 600, backdropFilter: "blur(4px)" }}
            >
              <ShieldCheck size={11} /> Verified
            </span>
          )}
          {property.instantBooking && (
            <span
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-white"
              style={{ backgroundColor: "rgba(34,197,94,0.9)", fontWeight: 600, backdropFilter: "blur(4px)" }}
            >
              <Zap size={11} /> Instant
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Type badge */}
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-xs px-2.5 py-1 rounded-lg"
            style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontWeight: 600 }}
          >
            {property.type}
          </span>
          <div className="flex items-center gap-1">
            <Star size={14} style={{ fill: "#F59E0B", color: "#F59E0B" }} />
            <span className="text-sm" style={{ color: "#0F172A", fontWeight: 600 }}>
              {property.rating}
            </span>
            <span className="text-xs" style={{ color: "#94A3B8" }}>({property.reviews})</span>
          </div>
        </div>

        <h3 className="text-sm mb-1 line-clamp-1" style={{ color: "#0F172A", fontWeight: 600 }}>
          {property.title}
        </h3>

        <div className="flex items-center gap-1 mb-3">
          <MapPin size={12} style={{ color: "#94A3B8" }} />
          <span className="text-xs" style={{ color: "#64748B" }}>{property.location}</span>
        </div>

        {/* Property tags */}
        <div className="flex gap-2 flex-wrap mb-3">
          {property.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-lg"
              style={{ backgroundColor: "#F1F5F9", color: "#475569" }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div>
            <span className="text-lg" style={{ color: "#0F172A", fontWeight: 700 }}>
              ₹{property.price.toLocaleString("en-IN")}
            </span>
            <span className="text-xs ml-1" style={{ color: "#94A3B8" }}>/month</span>
          </div>
          <button
            className="px-4 py-2 text-xs text-white rounded-xl transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: "#1D4ED8", fontWeight: 600 }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/property/${property.id}`);
            }}
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
}
