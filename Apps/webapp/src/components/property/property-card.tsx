import { Eye, Heart, MapPin, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import type { PropertyListItem } from "@/types/property";
import { useAuthStore } from "@/store/auth-store";
import { useCreateConversation } from "@/modules/communication/hooks";

interface PropertyCardProps {
  property: PropertyListItem;
  isFavorite?: boolean;
  canFavorite?: boolean;
  onToggleFavorite?: (propertyId: string, nextState: boolean) => void;
}

const FURNISHING_LABELS: Record<PropertyListItem["furnishing"], string> = {
  FURNISHED: "Furnished",
  SEMI: "Semi-furnished",
  UNFURNISHED: "Unfurnished",
};

const TYPE_GRADIENTS: Record<string, string> = {
  PG:         "from-blue-500 to-indigo-600",
  "1RK":      "from-violet-500 to-purple-600",
  "1BHK":     "from-rose-500 to-pink-600",
  "2BHK":     "from-emerald-500 to-teal-600",
  "3BHK":     "from-amber-500 to-orange-600",
  HOUSE:      "from-teal-500 to-cyan-600",
  COMMERCIAL: "from-slate-500 to-slate-700",
};

const TYPE_ICONS: Record<string, string> = {
  PG: "🏠", "1RK": "🛏️", "1BHK": "🏢", "2BHK": "🏡", "3BHK": "🏡", HOUSE: "🏰", COMMERCIAL: "🏬",
};

export function PropertyCard({ property, isFavorite = false, canFavorite = false, onToggleFavorite }: PropertyCardProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const canContact = user?.role === "TENANT";
  const createConversationMutation = useCreateConversation();

  const handleContact = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await createConversationMutation.mutateAsync(property.id);
      toast.success("Opening chat...");
      router.push("/chats");
    } catch {
      // Error handled by mutation
    }
  };

  const grad = TYPE_GRADIENTS[property.property_type] ?? "from-slate-400 to-slate-500";
  const icon = TYPE_ICONS[property.property_type] ?? "🏠";

  return (
    <Link href={`/properties/${property.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-emerald-300 hover:shadow-xl shadow-sm transition-all duration-300 hover:-translate-y-1">
        {/* Image / placeholder with gradient */}
        <div className={`h-44 bg-gradient-to-br ${grad} relative flex flex-col justify-between p-4`}>
          {/* Top badges */}
          <div className="flex items-start justify-between">
            <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {property.property_type}
            </span>
            {canFavorite && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onToggleFavorite?.(property.id, !isFavorite);
                }}
                className="w-8 h-8 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
              >
                <Heart className={`w-4 h-4 text-white ${isFavorite ? "fill-white" : ""}`} />
              </button>
            )}
          </div>

          {/* Central icon */}
          <div className="absolute inset-0 flex items-center justify-center opacity-25 text-7xl select-none pointer-events-none">{icon}</div>

          {/* Bottom: rent */}
          <div>
            <p className="text-white font-black text-2xl leading-none">
              ₹{Number(property.rent).toLocaleString("en-IN")}
              <span className="text-sm font-normal text-white/80 ml-1">/mo</span>
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors mb-1">
            {property.title}
          </h3>

          <p className="text-sm text-slate-500 flex items-center gap-1 mb-3">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{property.locality}, {property.city}</span>
          </p>

          {/* Furnishing and featured badges */}
          <div className="flex items-center gap-2 mb-3">
            {property.furnishing && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {FURNISHING_LABELS[property.furnishing]}
              </span>
            )}
            {property.is_featured && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">⭐ Featured</span>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{property.total_views}</span>
            <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{property.total_favorites}</span>
            <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{property.total_contacts}</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            <button
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors"
              onClick={(e) => e.preventDefault()}
            >
              View Details
            </button>
            {canContact && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleContact(e);
                }}
                disabled={createConversationMutation.isPending}
                className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium text-sm hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                {createConversationMutation.isPending ? "..." : "Chat"}
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
