"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Home,
  IndianRupee,
  LoaderCircle,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { useIdempotentAction } from "@/hooks/use-idempotent-action";
import { useRequireAuth } from "@/hooks/use-route-guard";
import { getApiErrorMessage } from "@/lib/api-error";
import { getMissingOwnerProfileFields } from "@/lib/profile-completion";
import { useCreateProperty, useSubmitProperty } from "@/modules/properties/hooks";

type PropertyType = "PG" | "1RK" | "1BHK" | "2BHK" | "3BHK" | "HOUSE" | "COMMERCIAL";
type Furnishing = "FURNISHED" | "SEMI" | "UNFURNISHED";
type PreferredTenant = "MALE" | "FEMALE" | "ANY";

const PROPERTY_TYPES: PropertyType[] = ["PG", "1RK", "1BHK", "2BHK", "3BHK", "HOUSE", "COMMERCIAL"];
const FURNISHING_TYPES: Furnishing[] = ["FURNISHED", "SEMI", "UNFURNISHED"];
const TENANT_TYPES: PreferredTenant[] = ["MALE", "FEMALE", "ANY"];

const formatCurrency = (value: string) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

export default function AddPropertyPage() {
  const router = useRouter();
  const { user, isAllowed } = useRequireAuth({ roles: ["OWNER"] });
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    property_type: "" as PropertyType | "",
    title: "",
    description: "",
    city: "",
    locality: "",
    rent: "",
    deposit: "",
    furnishing: "" as Furnishing | "",
    bedrooms: "",
    bathrooms: "",
    area_sqft: "",
    preferred_tenant: "ANY" as PreferredTenant,
  });

  const createMutation = useCreateProperty();
  const submitMutation = useSubmitProperty();
  const { runOnce, isInFlight } = useIdempotentAction();

  const summaryRows = useMemo(
    () => [
      { label: "Type", value: formData.property_type || "Not selected" },
      { label: "City", value: formData.city || "Not added" },
      { label: "Locality", value: formData.locality || "Not added" },
      { label: "Rent", value: formData.rent ? `${formatCurrency(formData.rent)}/mo` : "Not added" },
      {
        label: "Details",
        value: [formData.bedrooms && `${formData.bedrooms} bed`, formData.bathrooms && `${formData.bathrooms} bath`, formData.area_sqft && `${formData.area_sqft} sqft`]
          .filter(Boolean)
          .join(" \u2022 ") || "Basic specs not added",
      },
      { label: "Preferred tenant", value: formData.preferred_tenant },
    ],
    [formData],
  );

  if (!isAllowed || !user) return null;

  const missingFields = getMissingOwnerProfileFields(user);
  if (missingFields.length > 0) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef7f3_100%)] px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
            <div className="relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.24),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(45,212,191,0.15),_transparent_28%)]" />
              <div className="relative p-8 text-center">
                <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-emerald-300">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Complete your owner profile first</h1>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300">
                  Add your {missingFields.join(" and ")} before publishing a property so tenants see a more trustworthy owner profile.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link
                    href="/owner-onboarding"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                  >
                    Complete profile
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 hover:bg-white/10"
                  >
                    Back to dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const progress = (step / 4) * 100;
  const isBusy = createMutation.isPending || submitMutation.isPending || isInFlight("property:create-and-submit");

  const stepItems = [
    { step: 1, title: "Basics", sub: "Property type, title, and description", icon: Home },
    { step: 2, title: "Location", sub: "City and locality details", icon: MapPin },
    { step: 3, title: "Pricing", sub: "Rent, furnishing, and preferences", icon: IndianRupee },
    { step: 4, title: "Review", sub: "Final check before submission", icon: CheckCircle2 },
  ];

  const currentStepMeta = stepItems[step - 1];

  const nextDisabled =
    (step === 1 && (!formData.property_type || !formData.title || !formData.description)) ||
    (step === 2 && !formData.city) ||
    (step === 3 && (!formData.rent || !formData.furnishing));

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    await runOnce("property:create-and-submit", async () => {
      setError("");
      try {
        const payload = {
          title: formData.title,
          description: formData.description,
          property_type: formData.property_type as PropertyType,
          furnishing: formData.furnishing as Furnishing,
          rent: Number(formData.rent),
          deposit: formData.deposit ? Number(formData.deposit) : undefined,
          bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
          bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
          area_sqft: formData.area_sqft ? Number(formData.area_sqft) : undefined,
          city: formData.city,
          locality: formData.locality || undefined,
          preferred_tenant: formData.preferred_tenant,
        };

        const property = await createMutation.mutateAsync(payload);
        await submitMutation.mutateAsync(property.id);
        router.push("/dashboard");
      } catch (err) {
        setError(getApiErrorMessage(err));
      }
    });
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef7f3_100%)] px-4 py-5 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-5 pb-28">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
          <div className="relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.24),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(45,212,191,0.16),_transparent_28%)]" />
            <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.35fr_0.9fr] lg:items-end">
              <div>
                <Link href="/dashboard/properties" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 hover:text-emerald-200">
                  <ChevronLeft className="h-4 w-4" />
                  Back to properties
                </Link>

                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  Add property flow
                </div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Create a listing tenants can trust.</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  Add the essentials clearly now, then submit for review so your property can go live with a stronger first impression.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
                <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-400">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-4 text-lg font-bold text-white">Step {step}: {currentStepMeta.title}</p>
                <p className="mt-1 text-sm text-slate-300">{currentStepMeta.sub}</p>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        )}

        <section className="grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">
          <aside className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Workflow</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">Listing steps</h2>

            <div className="mt-5 space-y-3">
              {stepItems.map((item) => {
                const Icon = item.icon;
                const isCurrent = step === item.step;
                const isComplete = step > item.step;
                return (
                  <div
                    key={item.step}
                    className={`rounded-[22px] border p-4 transition-all ${
                      isCurrent
                        ? "border-emerald-200 bg-emerald-50"
                        : isComplete
                          ? "border-slate-200 bg-slate-50"
                          : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isCurrent ? "bg-emerald-600 text-white" : isComplete ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>
                        {isComplete ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{item.title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{item.sub}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-[24px] bg-slate-950 p-5 text-white">
              <p className="text-sm text-slate-300">Live preview</p>
              <p className="mt-2 text-lg font-bold">{formData.title || "Your listing title will appear here"}</p>
              <p className="mt-2 text-sm text-slate-400">{[formData.city, formData.locality].filter(Boolean).join(", ") || "Location details pending"}</p>
              <p className="mt-4 text-2xl font-black text-emerald-300">{formData.rent ? `${formatCurrency(formData.rent)}/mo` : "Add rent"}</p>
            </div>
          </aside>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-6">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Basics</p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-950">Set the first impression</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Pick the property type and write a clear title and description so tenants understand the offer fast.</p>
                </div>

                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  {PROPERTY_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, property_type: type })}
                      className={`rounded-2xl border-2 px-4 py-4 text-sm font-semibold transition-all ${
                        formData.property_type === type
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-200 hover:bg-white"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Property title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Spacious 2BHK near metro and market"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Description *</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Mention layout, building highlights, nearby landmarks, and what makes the property attractive."
                      rows={5}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Location</p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-950">Place the listing accurately</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Clear city and locality details help tenants discover your listing in relevant searches.</p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">City *</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Delhi"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Locality</label>
                    <input
                      type="text"
                      value={formData.locality}
                      onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                      placeholder="e.g. Green Park, Sector 18"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
                  Accurate location makes your listing easier to trust and improves visibility in city and locality filters.
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Pricing and specs</p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-950">Add rent and living details</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">This step helps tenants quickly judge affordability, furnishing level, and fit.</p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Monthly rent *</label>
                    <input
                      type="number"
                      value={formData.rent}
                      onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
                      placeholder="15000"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Security deposit</label>
                    <input
                      type="number"
                      value={formData.deposit}
                      onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                      placeholder="30000"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Furnishing *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {FURNISHING_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, furnishing: type })}
                        className={`rounded-2xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                          formData.furnishing === type
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-200 hover:bg-white"
                        }`}
                      >
                        {type === "SEMI" ? "Semi" : type.charAt(0) + type.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Preferred tenant</label>
                  <div className="grid grid-cols-3 gap-3">
                    {TENANT_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, preferred_tenant: type })}
                        className={`rounded-2xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                          formData.preferred_tenant === type
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-200 hover:bg-white"
                        }`}
                      >
                        {type === "ANY" ? "Any" : type.charAt(0) + type.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Bedrooms</label>
                    <input
                      type="number"
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                      placeholder="2"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Bathrooms</label>
                    <input
                      type="number"
                      value={formData.bathrooms}
                      onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                      placeholder="2"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Area (sqft)</label>
                    <input
                      type="number"
                      value={formData.area_sqft}
                      onChange={(e) => setFormData({ ...formData, area_sqft: e.target.value })}
                      placeholder="1200"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Review</p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-950">Check everything before submission</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Your listing will be submitted for review after publishing.</p>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-lg font-bold text-slate-950">{formData.title || "Untitled property"}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{formData.description || "No description added yet."}</p>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {summaryRows.map((row) => (
                      <div key={row.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{row.label}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{row.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-800">
                  Your property will be submitted for approval and becomes visible once verified.
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={nextDisabled}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isBusy}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isBusy && <LoaderCircle className="h-4 w-4 animate-spin" />}
                  Publish property
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}