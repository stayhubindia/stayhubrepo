"use client";

import {
  ArrowLeft,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  LoaderCircle,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { useRequireAuth } from "@/hooks/use-route-guard";
import { useIdempotentAction } from "@/hooks/use-idempotent-action";
import { getApiErrorMessage } from "@/lib/api-error";
import { useCreateContactLead } from "@/modules/contacts/hooks";
import { useFavoriteMutations, useFavorites } from "@/modules/favorites/hooks";
import { usePropertyDetail } from "@/modules/property/hooks";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-states";

const PropertyMiniMap = dynamic(
  () => import("@/components/maps/property-mini-map").then((m) => m.PropertyMiniMap),
  {
    ssr: false,
    loading: () => <div className="h-[240px] animate-pulse rounded-[22px] border border-slate-200 bg-slate-100" />,
  },
);

const formatCurrency = (value: string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const propertyId = params?.id ?? "";
  const { user, isAllowed } = useRequireAuth();
  const router = useRouter();

  const [notice, setNotice] = useState<string>("");
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [resolvedCoords, setResolvedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isResolvingCoords, setIsResolvingCoords] = useState(false);
  const [coordsResolveError, setCoordsResolveError] = useState<string>("");
  const detailQuery = usePropertyDetail(propertyId, Boolean(user));
  const favoritesQuery = useFavorites(user?.role === "TENANT");
  const { addMutation, removeMutation } = useFavoriteMutations();
  const contactMutation = useCreateContactLead();
  const { runOnce, isInFlight } = useIdempotentAction();

  const favoriteIds = useMemo(
    () => new Set((favoritesQuery.data ?? []).map((item) => item.property_id)),
    [favoritesQuery.data],
  );

  const property = detailQuery.data;
  const images = (property?.images ?? []).slice().sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return a.order - b.order;
  });

  const fullLocation = [
    property?.location?.address,
    property?.location?.locality,
    property?.location?.city,
    property?.location?.state,
    property?.location?.pincode,
  ]
    .filter(Boolean)
    .join(", ");
  const locationCoords = useMemo(() => {
    const lat = Number(property?.location?.latitude);
    const lng = Number(property?.location?.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    return { lat, lng };
  }, [property?.location?.latitude, property?.location?.longitude]);

  useEffect(() => {
    setCoordsResolveError("");
    setResolvedCoords(null);

    // If server already provides coordinates, no geocode lookup is needed.
    if (locationCoords || !fullLocation) {
      setIsResolvingCoords(false);
      return;
    }

    const cacheKey = property?.id ? `property-map-coords:${property.id}` : "";

    if (cacheKey) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached) as {
            fullLocation: string;
            lat: number;
            lng: number;
          };
          if (
            parsed.fullLocation === fullLocation &&
            Number.isFinite(parsed.lat) &&
            Number.isFinite(parsed.lng)
          ) {
            setResolvedCoords({ lat: parsed.lat, lng: parsed.lng });
            setIsResolvingCoords(false);
            return;
          }
        }
      } catch {
        // Ignore local cache parse errors and continue with geocoding.
      }
    }

    let cancelled = false;
    const controller = new AbortController();

    const resolveCoords = async () => {
      setIsResolvingCoords(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(fullLocation)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Unable to resolve map coordinates");
        }

        const rows = (await response.json()) as Array<{ lat: string; lon: string }>;
        const top = rows[0];

        if (!top) {
          throw new Error("Map coordinates unavailable for this address");
        }

        const lat = Number(top.lat);
        const lng = Number(top.lon);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          throw new Error("Invalid map coordinates received");
        }

        if (!cancelled) {
          setResolvedCoords({ lat, lng });
          setCoordsResolveError("");
          if (cacheKey) {
            localStorage.setItem(
              cacheKey,
              JSON.stringify({
                fullLocation,
                lat,
                lng,
              }),
            );
          }
        }
      } catch (error) {
        if (cancelled) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
        setCoordsResolveError("Could not place this address on map precisely.");
      } finally {
        if (!cancelled) {
          setIsResolvingCoords(false);
        }
      }
    };

    void resolveCoords();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [fullLocation, locationCoords, property?.id]);

  useEffect(() => {
    if (selectedImageIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedImageIndex(null);
        return;
      }

      if (!images.length) return;

      if (event.key === "ArrowRight") {
        setSelectedImageIndex((prev) => (prev === null ? 0 : (prev + 1) % images.length));
      }

      if (event.key === "ArrowLeft") {
        setSelectedImageIndex((prev) => (prev === null ? 0 : (prev - 1 + images.length) % images.length));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [images, selectedImageIndex]);

  if (!isAllowed || !user) {
    return null;
  }

  const isFavorite = property ? favoriteIds.has(property.id) : false;
  const canFavorite = user.role === "TENANT" && property?.owner !== user.id;
  const canContact = user.role === "TENANT" && property?.owner !== user.id;
  const primaryImage = images[0] ?? null;
  const galleryImages = images.slice(1, 5);
  const activeLightboxImage = selectedImageIndex !== null ? images[selectedImageIndex] ?? null : null;
  const mapCoords = locationCoords ?? resolvedCoords;
  const openStreetMapUrl = mapCoords
    ? `https://www.openstreetmap.org/?mlat=${mapCoords.lat}&mlon=${mapCoords.lng}#map=15/${mapCoords.lat}/${mapCoords.lng}`
    : fullLocation
      ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(fullLocation)}`
      : null;

  const toggleFavorite = async () => {
    if (!property) return;
    await runOnce(`favorite:toggle:${property.id}`, async () => {
      try {
        if (isFavorite) {
          await removeMutation.mutateAsync(property.id);
          setNotice("Removed from favorites.");
        } else {
          await addMutation.mutateAsync(property.id);
          setNotice("Added to favorites.");
        }
      } catch (error) {
        setNotice(getApiErrorMessage(error));
      }
    });
  };

  const contactOwner = async () => {
    if (!property) return;
    await runOnce(`contact:create:${property.id}`, async () => {
      try {
        await contactMutation.mutateAsync({
          property_id: property.id,
          contact_type: "CHAT",
        });
        toast.success("Opening chat with owner...");
        // Redirect to chat page
        setTimeout(() => {
          router.push("/chats");
        }, 500);
      } catch (error) {
        toast.error(getApiErrorMessage(error));
        setNotice(getApiErrorMessage(error));
      }
    });
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef2ff_0%,#f8fafc_18%,#f8fafc_100%)] px-4 py-8 md:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-indigo-200 hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to listings
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-indigo-200 hover:text-indigo-700"
          >
            Dashboard
          </Link>
        </div>

        {detailQuery.isLoading ? <LoadingState message="Loading property details..." className="py-6" /> : null}

        {detailQuery.isError ? <ErrorState message={getApiErrorMessage(detailQuery.error)} className="p-4" /> : null}

        {notice ? (
          <p className="mb-4 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700">{notice}</p>
        ) : null}

        {property ? (
          <div className="grid gap-6 lg:grid-cols-[1.55fr,0.8fr]">
            <div className="space-y-4">
              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="grid gap-3 border-b border-slate-200 bg-slate-950 p-3 md:grid-cols-[1.7fr,0.95fr]">
                  <div className="relative min-h-[320px] overflow-hidden rounded-[24px] bg-gradient-to-br from-slate-800 to-slate-900">
                    {primaryImage ? (
                      <button
                        type="button"
                        className="h-full w-full"
                        onClick={() => setSelectedImageIndex(0)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={primaryImage.image} alt={property.title} className="h-full w-full object-cover" />
                      </button>
                    ) : (
                      <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.45),_transparent_55%),linear-gradient(135deg,#0f172a,#1e293b)] text-[88px] opacity-80">
                        <Sparkles className="h-16 w-16 text-white/80" />
                      </div>
                    )}

                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                        {property.property_type}
                      </span>
                      {property.is_featured ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-100 backdrop-blur-sm">
                          <Sparkles className="h-3.5 w-3.5" /> Featured
                        </span>
                      ) : null}
                    </div>

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent p-5">
                      <p className="text-3xl font-black tracking-tight text-white md:text-4xl">
                        {formatCurrency(property.rent)}
                        <span className="ml-2 text-sm font-semibold text-slate-300">/ month</span>
                      </p>
                      <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-200">
                        <MapPin className="h-4 w-4 text-emerald-300" />
                        <span className="truncate">{fullLocation || "Location not set"}</span>
                      </p>
                      {images.length > 0 ? (
                        <span className="mt-3 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                          {images.length} photo{images.length === 1 ? "" : "s"}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-3 grid-cols-2 md:grid-cols-1">
                    {galleryImages.length ? (
                      galleryImages.map((image, index) => (
                        <button
                          key={image.id}
                          type="button"
                          className="overflow-hidden rounded-2xl bg-slate-800 text-left"
                          onClick={() => setSelectedImageIndex(index + 1)}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={image.image} alt={property.title} className="h-32 w-full object-cover md:h-[calc((320px-0.75rem)/2)]" />
                        </button>
                      ))
                    ) : (
                      <div className="col-span-2 flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900 text-sm font-medium text-slate-400 md:col-span-1">
                        No gallery images yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 md:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-500">Verified Listing</p>
                      <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">{property.title}</h1>
                      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{property.description}</p>
                    </div>

                    <div className="grid min-w-[220px] grid-cols-2 gap-3 self-stretch">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status</p>
                        <p className="mt-1 text-sm font-bold text-slate-900">{property.status}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Furnishing</p>
                        <p className="mt-1 text-sm font-bold text-slate-900">{property.furnishing}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Preferred Tenant</p>
                        <p className="mt-1 text-sm font-bold text-slate-900">{property.preferred_tenant}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Available From</p>
                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {property.available_from ? new Date(property.available_from).toLocaleDateString() : "Immediate"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[1.1fr,0.9fr]">
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                  <h2 className="text-lg font-black tracking-tight text-slate-950">Location & Availability</h2>
                  <div className="mt-4 space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <MapPin className="h-4 w-4 text-indigo-500" /> Address
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{fullLocation || "Location not set for this property."}</p>
                    </div>

                    {mapCoords ? (
                      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">Mini Map</p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              See the exact area before visiting and open the location in a full map if needed.
                            </p>
                          </div>
                          {openStreetMapUrl ? (
                            <a
                              href={openStreetMapUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-indigo-200 hover:text-indigo-700"
                            >
                              <MapPin className="h-3.5 w-3.5" />
                              Open full map
                            </a>
                          ) : null}
                        </div>

                        <div className="mt-4">
                          <PropertyMiniMap center={mapCoords} label={property.title} />
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium">
                            Lat {mapCoords.lat.toFixed(5)}
                          </span>
                          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium">
                            Lng {mapCoords.lng.toFixed(5)}
                          </span>
                          {!locationCoords ? (
                            <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 font-medium text-sky-700">
                              Estimated from address
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ) : isResolvingCoords ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <p className="text-sm font-medium text-slate-700">Resolving map location from address...</p>
                      </div>
                    ) : fullLocation ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <p className="text-sm text-slate-700">{coordsResolveError || "Map preview unavailable for this address."}</p>
                        {openStreetMapUrl ? (
                          <a
                            href={openStreetMapUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-indigo-200 hover:text-indigo-700"
                          >
                            <MapPin className="h-3.5 w-3.5" />
                            Open map search
                          </a>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <CalendarClock className="h-4 w-4 text-indigo-500" /> Move-in timeline
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {property.available_from
                          ? `Available from ${new Date(property.available_from).toLocaleDateString()}`
                          : "Available immediately unless the owner shares a different move-in date."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                  <h2 className="text-lg font-black tracking-tight text-slate-950">Amenities</h2>
                  {property.amenities.length ? (
                    <div className="mt-4 flex flex-wrap gap-2.5">
                      {property.amenities.map((amenity) => (
                        <span
                          key={amenity.id}
                          className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700"
                        >
                          {amenity.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                      Amenities have not been added yet for this listing.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="sticky top-24 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.12),_transparent_58%),linear-gradient(180deg,#ffffff_0%,#f8faff_100%)] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-500">Tenant Actions</p>
                  <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">Interested in this property?</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Save it to your shortlist or start a direct chat with the owner.</p>
                </div>

                <div className="p-5">
                  <div className="space-y-3">
                  {canFavorite ? (
                    <button
                      type="button"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-indigo-200 hover:text-indigo-700"
                      onClick={toggleFavorite}
                      disabled={
                        addMutation.isPending ||
                        removeMutation.isPending ||
                        (property ? isInFlight(`favorite:toggle:${property.id}`) : false)
                      }
                    >
                      {addMutation.isPending || removeMutation.isPending || (property ? isInFlight(`favorite:toggle:${property.id}`) : false) ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
                      )}
                      {isFavorite ? "Remove Favorite" : "Save to Favorites"}
                    </button>
                  ) : null}

                  {canContact ? (
                    <button
                      type="button"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-700 hover:to-sky-600"
                      onClick={contactOwner}
                      disabled={contactMutation.isPending || (property ? isInFlight(`contact:create:${property.id}`) : false)}
                    >
                      {contactMutation.isPending || (property ? isInFlight(`contact:create:${property.id}`) : false) ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <MessageCircle className="h-4 w-4" />
                      )}
                      Chat with Owner
                    </button>
                  ) : null}
                  </div>

                  <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                    <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800">
                      <ShieldCheck className="h-4 w-4" /> Platform assurance
                    </p>
                    <p className="mt-2 text-xs leading-6 text-emerald-700">
                      Stayhub lets you connect directly with owners and keeps discovery clean, transparent, and zero-brokerage.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-black tracking-tight text-slate-950">Quick Stats</h3>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      <Eye className="h-3.5 w-3.5" /> Views
                    </p>
                    <p className="mt-1 text-lg font-black text-slate-950">{property.total_views}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      <Heart className="h-3.5 w-3.5" /> Saves
                    </p>
                    <p className="mt-1 text-lg font-black text-slate-950">{property.total_favorites}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      <MessageCircle className="h-3.5 w-3.5" /> Enquiries
                    </p>
                    <p className="mt-1 text-lg font-black text-slate-950">{property.total_contacts}</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        ) : null}

        {!detailQuery.isLoading && !detailQuery.isError && !property ? (
          <div className="gb-card p-4">
            <EmptyState title="Property not found" description="This listing may have been removed or is unavailable." className="py-6" />
          </div>
        ) : null}
      </section>

      {activeLightboxImage ? (
        <div className="fixed inset-0 z-[90] bg-slate-950/92 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close gallery"
            className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-colors hover:bg-white/20"
            onClick={() => setSelectedImageIndex(null)}
          >
            <X className="h-5 w-5" />
          </button>

          {images.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous image"
                className="absolute left-4 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-colors hover:bg-white/20"
                onClick={() => setSelectedImageIndex((prev) => (prev === null ? 0 : (prev - 1 + images.length) % images.length))}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                aria-label="Next image"
                className="absolute right-4 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-colors hover:bg-white/20"
                onClick={() => setSelectedImageIndex((prev) => (prev === null ? 0 : (prev + 1) % images.length))}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}

          <div className="flex h-full flex-col items-center justify-center gap-5 px-4 py-16">
            <div className="w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/10 bg-slate-900 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={activeLightboxImage.image} alt={property?.title ?? "Property image"} className="max-h-[72vh] w-full object-contain bg-slate-950" />
            </div>

            <div className="flex w-full max-w-6xl items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">{property?.title}</p>
                <p className="text-xs text-slate-300">
                  Image {selectedImageIndex !== null ? selectedImageIndex + 1 : 1} of {images.length}
                </p>
              </div>

              {images.length > 1 ? (
                <div className="flex max-w-[60vw] gap-2 overflow-x-auto scrollbar-hide">
                  {images.map((image, index) => (
                    <button
                      key={image.id}
                      type="button"
                      className={`overflow-hidden rounded-xl border-2 transition-all ${
                        index === selectedImageIndex
                          ? "border-indigo-400"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                      onClick={() => setSelectedImageIndex(index)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.image} alt={property?.title ?? "Property thumbnail"} className="h-16 w-24 object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
