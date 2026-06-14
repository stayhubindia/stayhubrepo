"use client";

import type { FormEvent } from "react";
import {
  AirVent,
  Bath,
  Bed,
  Building2,
  CalendarClock,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Heart,
  LoaderCircle,
  Lock,
  MapPin,
  Menu,
  MessageCircle,
  MessageSquare,
  Search,
  Share2,
  ShieldCheck,
  Sofa,
  SquareArrowOutUpRight,
  Users,
  WashingMachine,
  Wifi,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

import AuthModal from "@/components/AuthModal";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { ProfileDropdown } from "@/components/layout/profile-dropdown";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-states";
import { useIdempotentAction } from "@/hooks/use-idempotent-action";
import { useUnreadCount } from "@/hooks/use-unread-count";
import { getApiErrorMessage } from "@/lib/api-error";
import { useCreateContactLead } from "@/modules/contacts/hooks";
import { useFavoriteMutations, useFavorites } from "@/modules/favorites/hooks";
import { usePropertyDetail } from "@/modules/property/hooks";
import { useAuthStore } from "@/store/auth-store";

const PropertyMiniMap = dynamic(
  () => import("@/components/maps/property-mini-map").then((m) => m.PropertyMiniMap),
  {
    ssr: false,
    loading: () => <div className="h-[260px] animate-pulse rounded-lg border border-slate-200 bg-slate-100" />,
  },
);

type GalleryImage = {
  id: string;
  image: string;
  order: number;
  is_primary?: boolean;
};

const formatCurrency = (value: string | number | null | undefined) => {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "Not specified";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return "Not specified";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const furnishingLabel = (value: string) => {
  if (value === "FURNISHED") return "Fully Furnished";
  if (value === "SEMI") return "Semi Furnished";
  return "Unfurnished";
};

const preferredTenantLabel = (value: string) => {
  if (value === "ANY") return "Family / Professionals";
  if (value === "MALE") return "Male tenants";
  if (value === "FEMALE") return "Female tenants";
  return value;
};

const getAmenityIcon = (name: string): LucideIcon => {
  const normalized = name.toLowerCase();
  if (normalized.includes("wifi")) return Wifi;
  if (normalized.includes("wash") || normalized.includes("laundry")) return WashingMachine;
  if (normalized.includes("air") || normalized.includes("ac")) return AirVent;
  if (normalized.includes("park")) return Car;
  if (normalized.includes("power") || normalized.includes("backup")) return Zap;
  if (normalized.includes("furnish") || normalized.includes("sofa")) return Sofa;
  if (normalized.includes("security") || normalized.includes("cctv")) return ShieldCheck;
  return Building2;
};

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const propertyId = params?.id ?? "";
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [resolvedCoords, setResolvedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isResolvingCoords, setIsResolvingCoords] = useState(false);
  const [coordsResolveError, setCoordsResolveError] = useState("");

  const detailQuery = usePropertyDetail(propertyId, true);
  const favoritesQuery = useFavorites(user?.role === "TENANT");
  const { addMutation, removeMutation } = useFavoriteMutations();
  const contactMutation = useCreateContactLead();
  const { runOnce, isInFlight } = useIdempotentAction();
  const { count: unreadCount, isLoading: unreadLoading, isError: unreadError } = useUnreadCount();

  const property = detailQuery.data;
  const isAuthenticated = Boolean(user);
  const favoriteIds = useMemo(
    () => new Set((favoritesQuery.data ?? []).map((item) => item.property_id)),
    [favoritesQuery.data],
  );

  const rawImages = useMemo(
    () =>
      (property?.images ?? []).slice().sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return a.order - b.order;
      }),
    [property?.images],
  );

  const galleryImages = rawImages;
  const activeGalleryImage = galleryImages[activeImageIndex] ?? galleryImages[0] ?? null;
  const activeLightboxImage = lightboxIndex !== null ? galleryImages[lightboxIndex] ?? null : null;

  const fullLocation = [
    property?.location?.address,
    property?.location?.locality,
    property?.location?.city,
    property?.location?.state,
    property?.location?.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  const publicLocation = [
    property?.location?.locality,
    property?.location?.city,
    property?.location?.state,
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

  const mapCoords = locationCoords ?? resolvedCoords;
  const isFavorite = property ? favoriteIds.has(property.id) : false;
  const canContact = Boolean(user && user.role === "TENANT" && property?.owner !== user.id);
  const displayAmenities = property?.amenities ?? [];
  const displayLocation = isAuthenticated
    ? fullLocation || publicLocation || "Location not set"
    : publicLocation || "Location available after sign in";
  const hasWifi = displayAmenities.some((amenity) => amenity.name.toLowerCase().includes("wifi"));

  useEffect(() => {
    if (activeImageIndex >= galleryImages.length) {
      setActiveImageIndex(0);
    }
  }, [activeImageIndex, galleryImages.length]);

  useEffect(() => {
    setCoordsResolveError("");
    setResolvedCoords(null);

    if (!isAuthenticated || locationCoords || !fullLocation) {
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
        // Continue with live geocoding if the local cache is malformed.
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
  }, [fullLocation, isAuthenticated, locationCoords, property?.id]);

  useEffect(() => {
    if (lightboxIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightboxIndex(null);
        return;
      }

      if (!galleryImages.length) return;

      if (event.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev === null ? 0 : (prev + 1) % galleryImages.length));
      }

      if (event.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev === null ? 0 : (prev - 1 + galleryImages.length) % galleryImages.length));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [galleryImages.length, lightboxIndex]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    router.push(trimmed ? `/properties?q=${encodeURIComponent(trimmed)}` : "/properties");
  };

  const showPreviousImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const showNextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const toggleFavorite = async () => {
    if (!property) return;
    await runOnce(`favorite:toggle:${property.id}`, async () => {
      try {
        if (isFavorite) {
          await removeMutation.mutateAsync(property.id);
          setNotice("Removed from saved homes.");
        } else {
          await addMutation.mutateAsync(property.id);
          setNotice("Saved to your wishlist.");
        }
      } catch (error) {
        setNotice(getApiErrorMessage(error));
      }
    });
  };

  const contactOwner = async () => {
    if (!property) return;

    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    await runOnce(`contact:create:${property.id}`, async () => {
      try {
        await contactMutation.mutateAsync({
          property_id: property.id,
          contact_type: "CHAT",
        });
        toast.success("Opening chat with owner...");
        setTimeout(() => {
          router.push("/chats");
        }, 500);
      } catch (error) {
        toast.error(getApiErrorMessage(error));
        setNotice(getApiErrorMessage(error));
      }
    });
  };

  const shareProperty = async () => {
    if (!property) return;

    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title: property.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Property link copied.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Could not share this property right now.");
    }
  };

  return (
    <>
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialRole="TENANT"
        redirectTo={`/properties/${propertyId}`}
      />

      <div className="flex min-h-screen bg-slate-50 text-slate-950">
        {isAuthenticated ? <DesktopSidebar /> : null}

        <main className="relative flex min-w-0 flex-1 flex-col pb-28">
          <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 backdrop-blur-xl lg:px-10">
            <div className="flex items-center gap-4 lg:hidden">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("toggle-mobile-sidebar"))}
                  className="-ml-2 rounded-xl p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              ) : null}
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10">
                <Building2 className="h-4 w-4 text-emerald-400" />
              </div>
            </div>

            <form onSubmit={handleSearch} className="hidden w-full max-w-md lg:block">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by location, property or category"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-12 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500/50"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                  ⌘K
                </span>
              </div>
            </form>

            <div className="ml-auto flex items-center gap-2 sm:gap-6">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/favorites"
                    className="group hidden flex-col items-center gap-1 sm:flex"
                  >
                    <Heart className="h-5 w-5 text-slate-500 transition-colors group-hover:text-slate-900" />
                    <span className="text-[10px] font-medium text-slate-500 group-hover:text-slate-900">Wishlist</span>
                  </Link>
                  <Link
                    href="/chats"
                    className="group relative hidden flex-col items-center gap-1 sm:flex"
                  >
                    <span className="relative">
                      <MessageSquare className="h-5 w-5 text-slate-500 transition-colors group-hover:text-slate-900" />
                      {!unreadLoading && !unreadError && unreadCount > 0 ? (
                        <span className="absolute -right-2 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-[8px] font-bold text-white shadow-sm">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1 text-[10px] font-medium text-slate-500 group-hover:text-slate-900">Messages</span>
                  </Link>
                  <NotificationDropdown variant="icon-label" className="hidden sm:flex" />
                  <div className="mx-2 hidden h-8 w-px bg-slate-100 sm:block" />
                  <ProfileDropdown />
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setAuthModalOpen(true)}
                    className="hidden h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 shadow-sm hover:text-emerald-700 sm:flex"
                  >
                    <Heart className="h-[18px] w-[18px]" />
                    Wishlist
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthModalOpen(true)}
                    className="h-11 rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </header>

          <section className="mx-auto w-full max-w-[1400px] px-6 py-6 pb-32 lg:px-10">
            {detailQuery.isLoading ? <LoadingState message="Loading property details..." className="py-20" /> : null}
            {detailQuery.isError ? <ErrorState message={getApiErrorMessage(detailQuery.error)} className="p-4" /> : null}

            {notice ? (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
              >
                {notice}
              </motion.div>
            ) : null}

            {property ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_416px]"
              >
                <div className="min-w-0">
                  <nav className="mb-5 hidden items-center gap-3 text-sm font-medium text-slate-500 md:flex">
                    <Link href="/" className="hover:text-emerald-600">Home</Link>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                    <Link href="/properties" className="hover:text-emerald-600">Properties</Link>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                    <span className="truncate text-slate-700">{property.title}</span>
                  </nav>

                  <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                    <div className="relative h-[285px] overflow-hidden bg-slate-900 sm:h-[360px] lg:h-[392px]">
                      {activeGalleryImage ? (
                        <button
                          type="button"
                          onClick={() => setLightboxIndex(activeImageIndex)}
                          className="h-full w-full"
                        >
                          <img
                            src={activeGalleryImage.image}
                            alt={property.title}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Building2 className="h-20 w-20 text-white/20" />
                        </div>
                      )}

                      <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                        {property.status === "ACTIVE" ? (
                          <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-emerald-600 px-3 text-xs font-black uppercase text-white shadow-lg shadow-emerald-950/10">
                            <Check className="h-4 w-4" />
                            Active
                          </span>
                        ) : null}
                        {property.is_featured ? (
                          <span className="inline-flex h-8 items-center rounded-full bg-amber-400 px-4 text-xs font-black uppercase text-slate-950 shadow-lg shadow-amber-950/10">
                            Featured
                          </span>
                        ) : null}
                      </div>

                      {galleryImages.length > 1 ? (
                        <>
                          <button
                            type="button"
                            onClick={showPreviousImage}
                            className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-950 shadow-lg hover:bg-slate-50"
                            aria-label="Previous image"
                          >
                            <ChevronLeft className="h-6 w-6" />
                          </button>
                          <button
                            type="button"
                            onClick={showNextImage}
                            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-950 shadow-lg hover:bg-slate-50"
                            aria-label="Next image"
                          >
                            <ChevronRight className="h-6 w-6" />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {galleryImages.length > 1 ? (
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                      {galleryImages.slice(0, 5).map((image, index) => {
                        const remaining = galleryImages.length - 4;
                        const showMoreTile = index === 4 && galleryImages.length > 5;

                        return (
                          <button
                            type="button"
                            key={image.id}
                            onClick={() => setActiveImageIndex(index)}
                            className={`relative h-[72px] overflow-hidden rounded-md border-2 bg-slate-900 sm:h-[84px] ${activeImageIndex === index ? "border-emerald-600" : "border-transparent hover:border-slate-300"}`}
                          >
                            <img src={image.image} alt="" className={`h-full w-full object-cover ${showMoreTile ? "opacity-55" : ""}`} />
                            {showMoreTile ? (
                              <span className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
                                <span className="text-2xl font-black">+{remaining}</span>
                                <span className="text-xs font-semibold">More photos</span>
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                  {galleryImages.length === 0 ? (
                    <div className="mt-2 flex h-[92px] items-center justify-center rounded-md border border-dashed border-slate-300 bg-white text-sm font-semibold text-slate-500">
                      No property images uploaded
                    </div>
                  ) : null}

                  <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-600">{property.property_type}</p>
                      <h1 className="text-[28px] font-black leading-tight tracking-tight text-slate-950">
                        {property.title}
                      </h1>
                      <p className="mt-3 flex items-start gap-2 text-sm font-medium text-slate-700">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-900" />
                        <span>{displayLocation}</span>
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <button
                        type="button"
                        onClick={() => (isAuthenticated ? toggleFavorite() : setAuthModalOpen(true))}
                        disabled={property ? isInFlight(`favorite:toggle:${property.id}`) : false}
                        className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-5 text-sm font-bold text-slate-800 shadow-sm hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Heart className={`h-[18px] w-[18px] ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`} />
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={shareProperty}
                        className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-5 text-sm font-bold text-slate-800 shadow-sm hover:border-slate-300"
                      >
                        <Share2 className="h-[18px] w-[18px]" />
                        Share
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 grid overflow-hidden rounded-md border border-slate-200 bg-white text-sm font-semibold text-slate-800 shadow-sm sm:grid-cols-3 lg:grid-cols-6">
                    {property.bedrooms !== null ? (
                      <div className="flex h-14 items-center justify-center gap-2 border-b border-slate-200 px-3 sm:border-r lg:border-b-0">
                        <Bed className="h-5 w-5 text-slate-700" />
                        {property.bedrooms} Beds
                      </div>
                    ) : null}
                    {property.bathrooms !== null ? (
                      <div className="flex h-14 items-center justify-center gap-2 border-b border-slate-200 px-3 sm:border-r lg:border-b-0">
                        <Bath className="h-5 w-5 text-slate-700" />
                        {property.bathrooms} Baths
                      </div>
                    ) : null}
                    {property.area_sqft !== null ? (
                      <div className="flex h-14 items-center justify-center gap-2 border-b border-slate-200 px-3 sm:border-r lg:border-b-0">
                        <SquareArrowOutUpRight className="h-5 w-5 text-slate-700" />
                        {property.area_sqft} sqft
                      </div>
                    ) : null}
                    <div className="flex h-14 items-center justify-center gap-2 border-b border-slate-200 px-3 sm:border-r sm:border-b-0">
                      <Sofa className="h-5 w-5 text-slate-700" />
                      {furnishingLabel(property.furnishing)}
                    </div>
                    {hasWifi ? (
                      <div className="flex h-14 items-center justify-center gap-2 px-3">
                        <Wifi className="h-5 w-5 text-slate-700" />
                        WiFi
                      </div>
                    ) : null}
                  </div>

                  <section className="mt-7">
                    <h2 className="text-lg font-black text-slate-950">About this property</h2>
                    <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-700">
                      {property.description || "No description provided by the owner."}
                    </p>
                  </section>

                  <div className="mt-5">
                    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                      <h2 className="text-lg font-black text-slate-950">Amenities</h2>
                      {displayAmenities.length > 0 ? (
                        <div className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                          {displayAmenities.map((amenity) => {
                            const Icon = getAmenityIcon(amenity.name);

                            return (
                              <div key={amenity.id} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                                <Icon className="h-5 w-5 text-slate-700" />
                                <span>{amenity.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="mt-4 text-sm font-medium text-slate-500">No amenities listed by the owner.</p>
                      )}
                    </section>
                  </div>
                </div>

                <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
                  <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-black tracking-tight text-slate-950">{formatCurrency(property.rent)}</span>
                      <span className="pb-1 text-base font-bold text-emerald-600">/ month</span>
                    </div>

                    <div className="my-5 h-px bg-slate-200" />

                    <div className="space-y-5">
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="flex items-center gap-3 font-semibold text-slate-700">
                          <Lock className="h-4 w-4 text-slate-700" />
                          Security Deposit
                        </span>
                        <span className="font-bold text-slate-950">{formatCurrency(property.deposit)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="flex items-center gap-3 font-semibold text-slate-700">
                          <CalendarClock className="h-4 w-4 text-slate-700" />
                          Available From
                        </span>
                        <span className="font-bold text-slate-950">{formatDate(property.available_from)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="flex items-center gap-3 font-semibold text-slate-700">
                          <Users className="h-4 w-4 text-slate-700" />
                          Preferred Tenants
                        </span>
                        <span className="text-right font-bold text-slate-950">{preferredTenantLabel(property.preferred_tenant)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="flex items-center gap-3 font-semibold text-slate-700">
                          <Building2 className="h-4 w-4 text-slate-700" />
                          Property ID
                        </span>
                        <span className="max-w-[180px] truncate text-right font-mono text-xs font-bold text-slate-950">{property.id}</span>
                      </div>
                    </div>

                    {property.status === "ACTIVE" ? (
                      <div className="mt-6 flex items-center gap-4 rounded-md border border-emerald-200 bg-emerald-50 p-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-emerald-600">
                          <ShieldCheck className="h-7 w-7" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-slate-950">Active Listing</p>
                          <p className="mt-1 text-xs font-medium leading-5 text-slate-700">Status: {property.status}</p>
                        </div>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600">
                          <Check className="h-4 w-4" />
                        </span>
                      </div>
                    ) : null}
                  </section>

                  <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                        <Users className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">Property Owner</p>
                        <div className="mt-1 flex items-center gap-2">
                          <h3 className="text-base font-black text-slate-950">Owner ID</h3>
                          <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        </div>
                        <p className="mt-1 max-w-[250px] truncate font-mono text-xs font-medium text-slate-500">{property.owner}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 rounded-md border border-slate-100 bg-slate-50 p-3 text-xs font-semibold text-slate-600">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {property.total_views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5" />
                        {property.total_favorites}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {property.total_contacts}
                      </span>
                    </div>

                    {!isAuthenticated ? (
                      <button
                        type="button"
                        onClick={() => setAuthModalOpen(true)}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-100"
                      >
                        <Lock className="h-4 w-4" />
                        Sign in to view details
                      </button>
                    ) : null}

                    <div className="mt-5">
                      <button
                        type="button"
                        onClick={contactOwner}
                        disabled={Boolean(isAuthenticated && (!canContact || contactMutation.isPending || (property ? isInFlight(`contact:create:${property.id}`) : false)))}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-black text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {contactMutation.isPending || (property ? isInFlight(`contact:create:${property.id}`) : false) ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <MessageCircle className="h-4 w-4" />
                        )}
                        Contact Owner
                      </button>
                    </div>

                    <p className="mt-5 flex items-center gap-2 text-xs font-medium text-slate-500">
                      <Clock3 className="h-4 w-4" />
                      Contact creates a chat request for this listing.
                    </p>
                  </section>

                  <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-lg font-black text-slate-950">Location</h2>
                      {mapCoords ? (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${mapCoords.lat},${mapCoords.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-bold text-emerald-600 hover:text-emerald-700"
                        >
                          View on map
                        </a>
                      ) : (
                        <span className="text-sm font-bold text-emerald-600">View on map</span>
                      )}
                    </div>
                    <p className="mb-4 text-sm font-medium leading-6 text-slate-700">{displayLocation}</p>

                    {isAuthenticated ? (
                      mapCoords ? (
                        <PropertyMiniMap center={mapCoords} label={property.title} height={260} />
                      ) : isResolvingCoords ? (
                        <div className="flex h-[260px] items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-500">
                          Resolving location...
                        </div>
                      ) : (
                        <div className="flex h-[260px] items-center justify-center rounded-md border border-slate-200 bg-slate-100">
                          <div className="rounded-md bg-white px-4 py-3 text-center shadow-sm">
                            <MapPin className="mx-auto mb-2 h-6 w-6 text-rose-500" />
                            <p className="text-sm font-bold text-slate-900">{coordsResolveError || "Map unavailable."}</p>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="flex h-[260px] items-center justify-center rounded-md border border-slate-200 bg-slate-100">
                        <button
                          type="button"
                          onClick={() => setAuthModalOpen(true)}
                          className="rounded-md bg-white px-5 py-4 text-center shadow-sm"
                        >
                          <Lock className="mx-auto mb-2 h-5 w-5 text-emerald-600" />
                          <span className="text-sm font-black text-slate-950">Sign in to unlock map</span>
                        </button>
                      </div>
                    )}
                  </section>
                </aside>
              </motion.div>
            ) : null}

            {!detailQuery.isLoading && !detailQuery.isError && !property ? (
              <div className="rounded-md border border-slate-200 bg-white p-8 shadow-sm">
                <EmptyState title="Property not found" description="This listing may have been removed or is unavailable." className="py-6" />
              </div>
            ) : null}
          </section>
        </main>
      </div>

      {isAuthenticated && canContact ? (
        <div className="fixed bottom-20 left-0 right-0 z-30 px-4 lg:hidden">
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-4 text-sm font-black text-white shadow-2xl shadow-emerald-500/30"
            onClick={contactOwner}
            disabled={contactMutation.isPending || (property ? isInFlight(`contact:create:${property.id}`) : false)}
          >
            {contactMutation.isPending || (property ? isInFlight(`contact:create:${property.id}`) : false) ? (
              <LoaderCircle className="h-5 w-5 animate-spin" />
            ) : (
              <MessageCircle className="h-5 w-5" />
            )}
            Contact Owner
          </button>
        </div>
      ) : null}

      {!isAuthenticated ? (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 px-4 pb-4 pt-3 backdrop-blur-sm lg:hidden">
          <button
            onClick={() => setAuthModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-4 text-sm font-black text-white shadow-lg shadow-emerald-500/25"
          >
            <MessageCircle className="h-5 w-5" />
            Sign in to Contact Owner
          </button>
        </div>
      ) : null}

      {activeLightboxImage ? (
        <div className="fixed inset-0 z-[90] bg-slate-950/95 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close gallery"
            className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-colors hover:bg-white/20"
            onClick={() => setLightboxIndex(null)}
          >
            <X className="h-5 w-5" />
          </button>

          {galleryImages.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous image"
                className="absolute left-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-5"
                onClick={() => setLightboxIndex((prev) => (prev === null ? 0 : (prev - 1 + galleryImages.length) % galleryImages.length))}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                aria-label="Next image"
                className="absolute right-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-5"
                onClick={() => setLightboxIndex((prev) => (prev === null ? 0 : (prev + 1) % galleryImages.length))}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          ) : null}

          <div className="flex h-full flex-col items-center justify-center gap-4 px-4 py-16">
            <div className="w-full max-w-6xl overflow-hidden rounded-md border border-white/10 bg-slate-900 shadow-2xl">
              <img
                src={activeLightboxImage.image}
                alt={property?.title ?? "Property image"}
                className="max-h-[70vh] w-full object-contain bg-slate-950"
              />
            </div>

            <div className="flex w-full max-w-6xl items-center justify-between gap-4">
              <div>
                <p className="line-clamp-1 text-sm font-bold text-white">{property?.title}</p>
                <p className="text-xs font-medium text-slate-400">
                  {lightboxIndex !== null ? lightboxIndex + 1 : 1} / {galleryImages.length}
                </p>
              </div>
              {galleryImages.length > 1 ? (
                <div className="flex max-w-[60vw] gap-2 overflow-x-auto scrollbar-hide">
                  {galleryImages.map((image, index) => (
                    <button
                      key={image.id}
                      type="button"
                      className={`shrink-0 overflow-hidden rounded-md border-2 transition-all ${index === lightboxIndex ? "border-emerald-400" : "border-transparent opacity-60 hover:opacity-100"}`}
                      onClick={() => setLightboxIndex(index)}
                    >
                      <img src={image.image} alt="" className="h-14 w-20 object-cover sm:h-16 sm:w-24" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
