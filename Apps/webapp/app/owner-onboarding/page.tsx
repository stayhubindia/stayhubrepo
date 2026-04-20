"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Phone, MapPin, CheckCircle } from "lucide-react";
import { useRequireAuth } from "@/hooks/use-route-guard";
import { useUpdateMe } from "@/modules/users/hooks";
import { getApiErrorMessage } from "@/lib/api-error";

export default function OwnerOnboardingPage() {
  const router = useRouter();
  const { user, isAllowed } = useRequireAuth();
  const updateProfileMutation = useUpdateMe();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
    locality: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    lat: null as number | null,
    lng: null as number | null,
  });

  if (!isAllowed || !user) return null;

  const handleNext = () => {
    setError("");
    if (!formData.phone) {
      setError("Phone number is required");
      return;
    }
    if (step < 2) setStep(step + 1);
  };

  const handleSubmit = async () => {
    setError("");
    
    if (!formData.city || !formData.address) {
      setError("Address and city are required");
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        pincode: formData.pincode,
        locality: formData.locality,
        lat: formData.lat,
        lng: formData.lng,
      });
      router.push("/dashboard");
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => setError("Unable to get location")
    );
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/70 via-green-900/60 to-emerald-950/70" />
      </div>

      <section className="relative z-10 mx-auto max-w-lg w-full">
        <div className="bg-gradient-to-br from-emerald-900/50 to-green-900/40 backdrop-blur-2xl rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.2)] p-8 md:p-10 border border-emerald-400/30">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-900/50 rounded-full border border-emerald-400/20 mb-4">
              <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-white">Step {step} of 2</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Complete Your Profile</h1>
            <p className="text-sm text-white/80">This helps tenants trust your listings</p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-400/30 bg-red-500/20 backdrop-blur-sm px-4 py-3 text-sm text-white">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-lime-500/20 rounded-full flex items-center justify-center">
                  <Phone className="w-5 h-5 text-lime-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Contact Details</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">First Name</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="Enter first name"
                    className="w-full px-4 py-3 rounded-xl bg-emerald-950/50 border border-emerald-300/30 text-white placeholder:text-emerald-200/40 focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Enter last name"
                    className="w-full px-4 py-3 rounded-xl bg-emerald-950/50 border border-emerald-300/30 text-white placeholder:text-emerald-200/40 focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-xl bg-emerald-950/50 border border-emerald-300/30 text-white placeholder:text-emerald-200/40 focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400/50 transition-all"
                  />
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-emerald-950/30 border border-emerald-400/20">
                <p className="text-xs text-white/70">
                  📞 Tenants will use this number to contact you about properties
                </p>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="w-full px-6 py-3.5 bg-gradient-to-r from-lime-400 to-emerald-500 text-white rounded-xl font-semibold hover:from-lime-500 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-500/30"
              >
                Continue →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-lime-500/20 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-lime-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Your Location</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Full Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="House/Flat No, Building, Street"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-emerald-950/50 border border-emerald-300/30 text-white placeholder:text-emerald-200/40 focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400/50 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Delhi"
                      className="w-full px-4 py-3 rounded-xl bg-emerald-950/50 border border-emerald-300/30 text-white placeholder:text-emerald-200/40 focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="Delhi"
                      className="w-full px-4 py-3 rounded-xl bg-emerald-950/50 border border-emerald-300/30 text-white placeholder:text-emerald-200/40 focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400/50 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="110001"
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-xl bg-emerald-950/50 border border-emerald-300/30 text-white placeholder:text-emerald-200/40 focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Locality</label>
                  <input
                    type="text"
                    value={formData.locality}
                    onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                    placeholder="Green Park, Sector 18"
                    className="w-full px-4 py-3 rounded-xl bg-emerald-950/50 border border-emerald-300/30 text-white placeholder:text-emerald-200/40 focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="India"
                    className="w-full px-4 py-3 rounded-xl bg-emerald-950/50 border border-emerald-300/30 text-white placeholder:text-emerald-200/40 focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Precise Location (Optional)</label>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="w-full px-4 py-3 rounded-xl bg-emerald-900/50 border border-emerald-300/40 text-white hover:bg-emerald-800/60 transition-all flex items-center justify-center gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    {formData.lat ? "Location Captured ✓" : "Get Current Location"}
                  </button>
                  {formData.lat && (
                    <p className="text-xs text-white/60 mt-2">
                      Lat: {formData.lat.toFixed(6)}, Lng: {formData.lng?.toFixed(6)}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-400/20">
                <p className="text-xs text-blue-200">
                  📍 Precise location helps tenants find properties near them
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border border-emerald-300/30 text-white rounded-xl hover:bg-emerald-900/40 transition-all"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={updateProfileMutation.isPending}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-lime-400 to-emerald-500 text-white rounded-xl font-semibold hover:from-lime-500 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  {updateProfileMutation.isPending ? (
                    <LoaderCircle className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  Complete Setup
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
