import { Building2, CalendarClock, Eye, Heart, MapPin, MessageCircle } from "lucide-react";
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

const formatCurrency = (value: string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));

const formatDate = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const STATUS_STYLES: Record<PropertyListItem["status"], string> = {
  DRAFT: "border-slate-200 bg-slate-100 text-slate-700",
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
  RENTED: "border-indigo-200 bg-indigo-50 text-indigo-700",
  EXPIRED: "border-rose-200 bg-rose-50 text-rose-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
};

const FURNISHING_LABELS: Record<PropertyListItem["furnishing"], string> = {
  FURNISHED: "Furnished",
  SEMI: "Semi-furnished",
  UNFURNISHED: "Unfurnished",
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

  const availableFrom = formatDate(property.available_from);

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50">
      <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-500" />

      <div className="p-4 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                {property.property_type}
              </span>
              {property.is_featured ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-700">
                  <Building2 className="h-3 w-3" />
                  Featured
                </span>
              ) : null}
            </div>

            <Link
              href={`/properties/${property.id}`}
              className="line-clamp-1 text-base font-bold tracking-tight text-slate-900 transition-colors group-hover:text-indigo-700"
            >
              {property.title}
            </Link>
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <MapPin className="h-3.5 w-3.5" />
              {property.locality || property.city}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canFavorite ? (
              <button
                type="button"
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
                  isFavorite
                    ? "border-rose-200 bg-rose-50 text-rose-600"
                    : "border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:text-indigo-600"
                }`}
                onClick={() => onToggleFavorite?.(property.id, !isFavorite)}
              >
                <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
              </button>
            ) : null}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <p className="text-2xl font-extrabold tracking-tight text-slate-900">
            {formatCurrency(property.rent)}
            <span className="ml-1 text-sm font-semibold text-slate-500">/ month</span>
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${STATUS_STYLES[property.status]}`}>
              {property.status}
            </span>
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-700">
              {FURNISHING_LABELS[property.furnishing]}
            </span>
            {availableFrom ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-semibold text-sky-700">
                <CalendarClock className="h-3 w-3" />
                From {availableFrom}
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
              <Eye className="h-3.5 w-3.5" /> Views
            </p>
            <p className="mt-0.5 text-sm font-bold text-slate-900">{property.total_views}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
              <Heart className="h-3.5 w-3.5" /> Saves
            </p>
            <p className="mt-0.5 text-sm font-bold text-slate-900">{property.total_favorites}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
              <MessageCircle className="h-3.5 w-3.5" /> Enquiries
            </p>
            <p className="mt-0.5 text-sm font-bold text-slate-900">{property.total_contacts}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/properties/${property.id}`}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-indigo-200 hover:text-indigo-700"
          >
            View Details
          </Link>

          {canContact ? (
            <button
              onClick={handleContact}
              disabled={createConversationMutation.isPending}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition-all hover:from-indigo-700 hover:to-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <MessageCircle className="w-4 h-4" />
              {createConversationMutation.isPending ? "Opening..." : "Chat with Owner"}
            </button>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      </div>
    </article>
  );
}
