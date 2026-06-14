"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Bath,
  Bed,
  Calendar as CalendarIcon,
  Camera,
  CheckCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Home,
  IndianRupee,
  LoaderCircle,
  MapPin,
  Megaphone,
  RefreshCcw,
  ShieldCheck,
  SquareStack,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useIdempotentAction } from "@/hooks/use-idempotent-action";
import { useRequireAuth } from "@/hooks/use-route-guard";
import { getApiErrorMessage } from "@/lib/api-error";
import { getMissingOwnerProfileFields } from "@/lib/profile-completion";
import { useCreateProperty, useSubmitProperty, useUploadPropertyImage, useAmenities } from "@/modules/properties/hooks";

type PropertyType = "PG" | "1RK" | "1BHK" | "2BHK" | "3BHK" | "HOUSE" | "COMMERCIAL";
type Furnishing = "FURNISHED" | "SEMI" | "UNFURNISHED";
type PreferredTenant = "MALE" | "FEMALE" | "ANY";

const PROPERTY_TYPES: { value: PropertyType; label: string; icon: string }[] = [
  { value: "PG", label: "PG", icon: "🏠" },
  { value: "1RK", label: "1 RK", icon: "🛏️" },
  { value: "1BHK", label: "1 BHK", icon: "🏡" },
  { value: "2BHK", label: "2 BHK", icon: "🏘️" },
  { value: "3BHK", label: "3 BHK", icon: "🏢" },
  { value: "HOUSE", label: "Full House", icon: "🏠" },
  { value: "COMMERCIAL", label: "Commercial", icon: "🏗️" },
];

const FURNISHING_OPTIONS: { value: Furnishing; label: string; desc: string }[] = [
  { value: "FURNISHED", label: "Furnished", desc: "AC, furniture, appliances" },
  { value: "SEMI", label: "Semi-furnished", desc: "Basic fixtures only" },
  { value: "UNFURNISHED", label: "Unfurnished", desc: "Empty space" },
];

const TENANT_OPTIONS: { value: PreferredTenant; label: string }[] = [
  { value: "ANY", label: "Anyone" },
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
];

const formatINR = (v: string) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

const STEPS = [
  { id: 1, label: "Property", icon: Home, desc: "Type, title & description" },
  { id: 2, label: "Location", icon: MapPin, desc: "City & locality" },
  { id: 3, label: "Pricing", icon: IndianRupee, desc: "Rent, specs & preferences" },
  { id: 4, label: "Images", icon: Camera, desc: "Upload photos" },
  { id: 5, label: "Review", icon: CheckCircle2, desc: "Confirm & publish" },
];

export default function MyAdsNewPage() {
  const router = useRouter();
  const { user, isAllowed } = useRequireAuth({ roles: ["OWNER"] });
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    property_type: "" as PropertyType | "",
    title: "",
    description: "",
    city: "",
    locality: "",
    address: "",
    state: "",
    pincode: "",
    lat: null as number | null,
    lng: null as number | null,
    rent: "",
    deposit: "",
    furnishing: "" as Furnishing | "",
    bedrooms: "",
    bathrooms: "",
    area_sqft: "",
    preferred_tenant: "ANY" as PreferredTenant,
    available_from: "",
    amenity_ids: [] as number[],
    images: [] as File[],
  });

  const createMutation = useCreateProperty();
  const submitMutation = useSubmitProperty();
  const uploadMutation = useUploadPropertyImage();
  const { data: availableAmenities } = useAmenities();
  const { runOnce, isInFlight } = useIdempotentAction();
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const getCurrentLocation = () => {
    setIsFetchingLocation(true);
    if (!navigator.geolocation) {
      setError("Geolocation not supported by this browser.");
      setIsFetchingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
          const data = await res.json();
          setForm((prev) => ({
            ...prev,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            city: data.address?.city || data.address?.town || data.address?.village || prev.city,
            state: data.address?.state || prev.state,
            pincode: data.address?.postcode || prev.pincode,
            locality: data.address?.suburb || data.address?.neighbourhood || prev.locality,
            address: data.display_name || prev.address,
          }));
        } catch(e) {
          setForm((prev) => ({ ...prev, lat: position.coords.latitude, lng: position.coords.longitude }));
        }
        setIsFetchingLocation(false);
      },
      () => {
        setError("Unable to get location. Please enable location services.");
        setIsFetchingLocation(false);
      }
    );
  };

  const reviewRows = useMemo(
    () => [
      { label: "Type", value: form.property_type || "\u2014" },
      { label: "City", value: form.city || "\u2014" },
      { label: "Locality", value: form.locality || "Not specified" },
      { label: "Rent", value: form.rent ? `${formatINR(form.rent)}/mo` : "\u2014" },
      { label: "Deposit", value: form.deposit ? formatINR(form.deposit) : "Not specified" },
      { label: "Furnishing", value: form.furnishing ? FURNISHING_OPTIONS.find((f) => f.value === form.furnishing)?.label ?? form.furnishing : "\u2014" },
      {
        label: "Specs",
        value:
          [form.bedrooms && `${form.bedrooms} bed`, form.bathrooms && `${form.bathrooms} bath`, form.area_sqft && `${form.area_sqft} sqft`]
            .filter(Boolean)
            .join(" \u2022 ") || "\u2014",
      },
      { label: "Preferred tenant", value: form.preferred_tenant || "Any" },
    ],
    [form],
  );

  if (!isAllowed || !user) return null;

  const missingFields = getMissingOwnerProfileFields(user);
  if (missingFields.length > 0) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-white">Profile incomplete</h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Complete your{" "}
              <span className="font-semibold text-white">{missingFields.join(" and ")}</span> before
              posting so tenants see a trustworthy owner.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <Link
                href="/owner-onboarding"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Complete profile
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="/my-ads"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-white/80 hover:bg-white/5"
              >
                Back to My Ads
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const progress = (step / 5) * 100;
  const isBusy = createMutation.isPending || submitMutation.isPending || uploadMutation.isPending || isInFlight("my-ad:create-submit");

  const nextDisabled =
    (step === 1 && (!form.property_type || !form.title || !form.description)) ||
    (step === 2 && (!form.city || form.lat === null || form.lng === null)) ||
    (step === 3 && (!form.rent || !form.furnishing));

  const handleNext = () => setStep((s) => Math.min(s + 1, 5));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    await runOnce("my-ad:create-submit", async () => {
      setError("");
      try {
        const payload = {
          title: form.title,
          description: form.description,
          property_type: form.property_type as PropertyType,
          furnishing: form.furnishing as Furnishing,
          rent: Number(form.rent),
          deposit: form.deposit ? Number(form.deposit) : undefined,
          bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
          bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
          area_sqft: form.area_sqft ? Number(form.area_sqft) : undefined,
          address: form.address || undefined,
          city: form.city,
          state: form.state || undefined,
          pincode: form.pincode || undefined,
          locality: form.locality || undefined,
          lat: form.lat,
          lng: form.lng,
          preferred_tenant: form.preferred_tenant,
          available_from: form.available_from || undefined,
          amenity_ids: form.amenity_ids,
        };
        const property = await createMutation.mutateAsync(payload);
        
        if (form.images.length > 0) {
          for (let i = 0; i < form.images.length; i++) {
            await uploadMutation.mutateAsync({
              id: property.id,
              file: form.images[i],
              isPrimary: i === 0,
              order: i,
            });
          }
        }
        
        await submitMutation.mutateAsync(property.id);
        router.push("/my-ads");
      } catch (err) {
        setError(getApiErrorMessage(err));
      }
    });
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.12),_transparent_55%),linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_100%)] pb-32">
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-4 px-4">
          <Link
            href="/my-ads"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-indigo-300 hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Post an Ad</p>
            <p className="text-sm font-bold text-slate-900 leading-tight">
              Step {step} of 5 — {STEPS[step - 1].label}
            </p>
          </div>
          {/* progress bar */}
          <div className="hidden sm:flex items-center gap-2">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s.id < step
                    ? "w-6 bg-indigo-600"
                    : s.id === step
                      ? "w-10 bg-indigo-600"
                      : "w-2 bg-slate-200"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6">
        {/* ── Hero card ── */}
        <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.22)] sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,_rgba(99,102,241,0.3),_transparent_42%),radial-gradient(circle_at_80%_70%,_rgba(139,92,246,0.2),_transparent_38%)]" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-indigo-300">
                <Megaphone className="h-3.5 w-3.5" />
                New listing
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {form.title || "Name your listing"}
              </h1>
              <p className="mt-1.5 text-sm text-slate-400">
                {form.city
                  ? [form.city, form.locality].filter(Boolean).join(", ")
                  : "Location not set yet"}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-slate-500">Monthly rent</p>
              <p className="mt-1 text-3xl font-black text-indigo-300">
                {form.rent ? `${formatINR(form.rent)}/mo` : "—"}
              </p>
              {form.property_type && (
                <span className="mt-2 inline-block rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-0.5 text-xs font-semibold text-indigo-300">
                  {form.property_type}
                </span>
              )}
            </div>
          </div>

          {/* progress line */}
          <div className="relative mt-6">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-400"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
            <p className="mt-2 text-right text-xs text-slate-500">{Math.round(progress)}% complete</p>
          </div>
        </section>

        {/* ── Error ── */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
          >
            {error}
          </motion.div>
        )}

        {/* ── Step nav pills ── */}
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div
                key={s.id}
                className={`flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                  active
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                    : done
                      ? "border-slate-200 bg-slate-100 text-slate-700"
                      : "border-slate-200 bg-white text-slate-400"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                ) : (
                  <Icon className={`h-4 w-4 ${active ? "text-indigo-600" : "text-slate-400"}`} />
                )}
                {s.label}
              </div>
            );
          })}
        </div>

        {/* ── Form panel ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
            className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-7"
          >
            {/* ─ Step 1: Basics ─ */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Step 1</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">What are you renting out?</h2>
                  <p className="mt-1 text-sm text-slate-500">Choose the property type, add a catchy title and a clear description.</p>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-slate-700">Property type *</label>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {PROPERTY_TYPES.map((pt) => (
                      <button
                        key={pt.value}
                        type="button"
                        onClick={() => setForm({ ...form, property_type: pt.value })}
                        className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 px-3 py-4 text-sm font-semibold transition-all ${
                          form.property_type === pt.value
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-200 hover:bg-white"
                        }`}
                      >
                        <span className="text-xl">{pt.icon}</span>
                        {pt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Ad title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Spacious 2BHK with balcony near metro"
                    maxLength={120}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                  <p className="mt-1.5 text-right text-xs text-slate-400">{form.title.length}/120</p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe the layout, nearby facilities, building amenities, and what makes it a great place to live."
                    rows={5}
                    maxLength={1000}
                    className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                  <p className="mt-1.5 text-right text-xs text-slate-400">{form.description.length}/1000</p>
                </div>
              </div>
            )}

            {/* ─ Step 2: Location ─ */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Step 2</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">Where is it located?</h2>
                  <p className="mt-1 text-sm text-slate-500">A precise location helps tenants find your listing in their search.</p>
                </div>

                <div className={`p-4 rounded-xl border ${form.lat !== null ? 'bg-emerald-50 border-emerald-200' : 'bg-indigo-50 border-indigo-200'}`}>
                  <div className="flex items-start gap-3">
                    <MapPin className={`w-5 h-5 mt-0.5 ${form.lat !== null ? 'text-emerald-600' : 'text-indigo-600'}`} />
                    <div className="flex-1">
                      <h3 className={`font-semibold ${form.lat !== null ? 'text-emerald-900' : 'text-indigo-900'}`}>
                        {form.lat !== null ? 'GPS Location Acquired' : 'Mandatory GPS Location'}
                      </h3>
                      <p className={`mt-1 text-sm ${form.lat !== null ? 'text-emerald-700' : 'text-indigo-700'}`}>
                        {form.lat !== null 
                          ? `Coordinates: ${form.lat.toFixed(6)}, ${form.lng?.toFixed(6)}`
                          : 'We need your precise location to show the property accurately on the map. This will also auto-fill your address below.'}
                      </p>
                      <button
                        type="button"
                        onClick={getCurrentLocation}
                        disabled={isFetchingLocation}
                        className={`mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                          form.lat !== null 
                            ? 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        {isFetchingLocation ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                        {form.lat !== null ? 'Update Location' : 'Fetch Current Location'}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Street address <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Full street address"
                      className="w-full rounded-2xl border border-slate-300 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Locality / Area</label>
                    <input
                      type="text"
                      value={form.locality}
                      onChange={(e) => setForm({ ...form, locality: e.target.value })}
                      placeholder="e.g. Green Park, Sector 18"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">City <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="e.g. Delhi, Mumbai"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">State</label>
                    <input
                      type="text"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Pincode</label>
                    <input
                      type="text"
                      value={form.pincode}
                      onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ─ Step 3: Pricing & specs ─ */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Step 3</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">Rent, specs & preferences</h2>
                  <p className="mt-1 text-sm text-slate-500">Set a competitive price and share details that help tenants self-qualify.</p>
                </div>

                {/* Rent & deposit */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Monthly rent (₹) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <CircleDollarSign className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="number"
                        min={0}
                        value={form.rent}
                        onChange={(e) => setForm({ ...form, rent: e.target.value })}
                        placeholder="15000"
                        className="w-full rounded-2xl border border-slate-300 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    {form.rent && (
                      <p className="mt-1.5 text-xs text-slate-500">{formatINR(form.rent)} / month</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Security deposit (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.deposit}
                      onChange={(e) => setForm({ ...form, deposit: e.target.value })}
                      placeholder="30000"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                    {form.deposit && (
                      <p className="mt-1.5 text-xs text-slate-500">{formatINR(form.deposit)}</p>
                    )}
                  </div>
                </div>

                {/* Furnishing */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-slate-700">
                    Furnishing <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {FURNISHING_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm({ ...form, furnishing: opt.value })}
                        className={`rounded-2xl border-2 px-3 py-3.5 text-left transition-all ${
                          form.furnishing === opt.value
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-slate-200 bg-slate-50 hover:border-indigo-200 hover:bg-white"
                        }`}
                      >
                        <p className={`text-sm font-semibold ${form.furnishing === opt.value ? "text-indigo-700" : "text-slate-800"}`}>{opt.label}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferred tenant */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-slate-700">Preferred tenant</label>
                  <div className="flex gap-3">
                    {TENANT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm({ ...form, preferred_tenant: opt.value })}
                        className={`flex-1 rounded-2xl border-2 py-3 text-sm font-semibold transition-all ${
                          form.preferred_tenant === opt.value
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-200 hover:bg-white"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Room specs */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-slate-700">Property specs <span className="text-slate-400">(optional)</span></label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <Bed className="h-3.5 w-3.5" /> Bedrooms
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={form.bedrooms}
                        onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
                        placeholder="2"
                        className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <Bath className="h-3.5 w-3.5" /> Bathrooms
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={form.bathrooms}
                        onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
                        placeholder="2"
                        className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <SquareStack className="h-3.5 w-3.5" /> Area (sqft)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={form.area_sqft}
                        onChange={(e) => setForm({ ...form, area_sqft: e.target.value })}
                        placeholder="1200"
                        className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Available From */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Available from</label>
                  <div className="relative">
                    <CalendarIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      value={form.available_from}
                      onChange={(e) => setForm({ ...form, available_from: e.target.value })}
                      className="w-full rounded-2xl border border-slate-300 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                {/* Amenities */}
                {availableAmenities && availableAmenities.length > 0 && (
                  <div>
                    <label className="mb-3 block text-sm font-medium text-slate-700">Amenities</label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {availableAmenities.map((amenity) => (
                        <button
                          key={amenity.id}
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({
                              ...prev,
                              amenity_ids: prev.amenity_ids.includes(amenity.id)
                                ? prev.amenity_ids.filter((id) => id !== amenity.id)
                                : [...prev.amenity_ids, amenity.id],
                            }));
                          }}
                          className={`flex items-center justify-between rounded-xl border p-3 text-left transition-all ${
                            form.amenity_ids.includes(amenity.id)
                              ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                              : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200"
                          }`}
                        >
                          <span className="text-sm font-medium">{amenity.name}</span>
                          {form.amenity_ids.includes(amenity.id) && <CheckCircle className="h-4 w-4 text-indigo-600" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─ Step 4: Images ─ */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Step 4</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">Upload property photos</h2>
                  <p className="mt-1 text-sm text-slate-500">Listings with high-quality photos get more leads.</p>
                </div>

                <div className="mt-4">
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-indigo-200 rounded-2xl bg-indigo-50/50 hover:bg-indigo-50 cursor-pointer transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Camera className="w-8 h-8 mb-3 text-indigo-400" />
                      <p className="mb-2 text-sm text-slate-600"><span className="font-bold text-indigo-600">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-slate-500">PNG, JPG or WEBP (Max. 5MB)</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      multiple 
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files) {
                          const newFiles = Array.from(e.target.files);
                          setForm({ ...form, images: [...form.images, ...newFiles] });
                        }
                      }}
                    />
                  </label>
                </div>

                {form.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                    {form.images.map((file, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={`preview-${index}`} 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = [...form.images];
                            newImages.splice(index, 1);
                            setForm({ ...form, images: newImages });
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        {index === 0 && (
                          <div className="absolute bottom-0 left-0 right-0 bg-indigo-600/80 backdrop-blur-sm text-white text-[10px] font-bold text-center py-1">
                            COVER
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─ Step 5: Review ─ */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Step 5</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">Review before publishing</h2>
                  <p className="mt-1 text-sm text-slate-500">Double-check your ad details. Once submitted it goes for review before going live.</p>
                </div>

                {/* Title preview */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold text-slate-900">{form.title || "Untitled listing"}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {[form.city, form.locality].filter(Boolean).join(", ") || "No location"}
                      </p>
                    </div>
                    {form.property_type && (
                      <span className="shrink-0 rounded-xl bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700">
                        {form.property_type}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{form.description || "No description."}</p>
                </div>

                {/* Data grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {reviewRows.map((row) => (
                    <div key={row.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{row.label}</p>
                      <p className="mt-1 truncate text-sm font-semibold text-slate-900">{row.value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm leading-6 text-amber-800">
                  <strong className="font-semibold">Heads up:</strong> After you publish, your ad will be submitted for review. It becomes visible to tenants once approved.
                </div>
              </div>
            )}

            {/* ── Navigation ── */}
            <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-indigo-300 hover:text-indigo-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              ) : (
                <div />
              )}

              {step < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={nextDisabled}
                  className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isBusy}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-2.5 text-sm font-semibold text-white shadow-md hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isBusy ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Megaphone className="h-4 w-4" />
                  )}
                  Publish Ad
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
