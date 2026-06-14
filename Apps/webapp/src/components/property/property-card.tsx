import { Building2, Eye, Heart, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

import type { PropertyListItem } from "@/types/property";
import { getImageUrl } from "@/lib/image";

interface PropertyCardProps {
  property: PropertyListItem;
  isFavorite?: boolean;
  canFavorite?: boolean;
  onToggleFavorite?: (propertyId: string, nextState: boolean) => void;
}

const FURNISHING_LABELS: Record<string, string> = {
  FURNISHED: "Fully Furnished",
  SEMI: "Semi Furnished",
  UNFURNISHED: "Unfurnished",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  RENTED: "Rented",
  PENDING: "Pending",
  DRAFT: "Draft",
  EXPIRED: "Expired",
  REJECTED: "Rejected",
};

const formatCurrency = (value: string) => {
  const rent = Number(value);

  if (!Number.isFinite(rent)) return value;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rent);
};

const formatLocation = (property: PropertyListItem) =>
  [property.locality, property.city, property.state].filter(Boolean).join(", ") || "Location not available";

export function PropertyCard({ property, isFavorite = false, canFavorite = false, onToggleFavorite }: PropertyCardProps) {
  const router = useRouter();
  const primaryImage = property.images?.find((image) => image.is_primary) ?? property.images?.[0];
  const location = formatLocation(property);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button")) {
      e.preventDefault();
      return;
    }
    router.push(`/properties/${property.id}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="group block cursor-pointer bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-emerald-200 hover:shadow-xl shadow-sm transition-all duration-300"
    >
      <div className="relative h-56 w-full overflow-hidden bg-slate-100">
        {primaryImage ? (
          <img
            src={getImageUrl(primaryImage.image)}
            alt={property.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-slate-400">
            <Building2 className="h-12 w-12" />
            <span className="text-xs font-semibold">No image uploaded</span>
          </div>
        )}
        
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded bg-slate-950/75 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm backdrop-blur">
            {STATUS_LABELS[property.status] ?? property.status}
          </span>
          {property.is_featured && (
            <span className="rounded bg-emerald-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
              Featured
            </span>
          )}
        </div>

        {canFavorite && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite?.(property.id, !isFavorite);
            }}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-emerald-500 hover:text-white transition-colors border border-white/20 shadow-sm"
            aria-label={isFavorite ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? "fill-white text-white" : ""}`} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-emerald-600 transition-colors mb-1">
          {property.title}
        </h3>
        <p className="text-slate-500 text-xs flex items-center gap-1.5 mb-3">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{location}</span>
        </p>

        <div className="mb-4">
          <p className="text-xl font-bold text-emerald-500">
            {formatCurrency(property.rent)}
            <span className="text-xs font-medium text-emerald-500/70 ml-1">/ month</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600 mb-4">
          <span className="px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200">{property.property_type}</span>
          {property.furnishing && (
            <span className="px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200">
              {FURNISHING_LABELS[property.furnishing] || property.furnishing}
            </span>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1 font-medium">
            <Eye className="h-3.5 w-3.5" />
            {property.total_views.toLocaleString("en-IN")} views
          </span>
          <span className="flex items-center gap-1 font-medium">
            <Heart className="h-3.5 w-3.5" />
            {property.total_favorites.toLocaleString("en-IN")} saved
          </span>
        </div>
      </div>
    </div>
  );
}
