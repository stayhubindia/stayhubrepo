"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Loader2, User } from "lucide-react";
import { useRequireAuth } from "@/hooks/use-route-guard";
import { useUpdateMe } from "@/modules/users/hooks";
import { getApiErrorMessage } from "@/lib/api-error";

export default function TenantOnboardingPage() {
  const router = useRouter();
  const { user, isAllowed } = useRequireAuth();
  const updateProfileMutation = useUpdateMe();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    locality: "",
    lat: null as number | null,
    lng: null as number | null,
  });

  if (!isAllowed || !user) return null;

  const getLocation = () => {
    setLoading(true);
    setError("");
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          setFormData(prev => ({
            ...prev,
            city: data.address.city || data.address.town || data.address.village || "",
            state: data.address.state || "",
            country: data.address.country || "India",
            pincode: data.address.postcode || "",
            locality: data.address.suburb || data.address.neighbourhood || "",
            lat: latitude,
            lng: longitude,
          }));
        } catch {
          setError("Failed to get location details");
        }
        setLoading(false);
      },
      () => {
        setError("Unable to retrieve your location");
        setLoading(false);
      }
    );
  };

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.city || !formData.address) {
      setError("City and Address are required");
      return;
    }

    try {
      await updateProfileMutation.mutateAsync(formData);
      router.push("/dashboard");
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <section className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-lime-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {step === 1 ? <User className="w-8 h-8 text-emerald-600" /> : <MapPin className="w-8 h-8 text-emerald-600" />}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {step === 1 ? "Complete Your Profile" : "Set Your Location"}
            </h1>
            <p className="text-sm text-gray-600">
              Step {step} of 2 • {step === 1 ? "Optional" : "Required"}
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

              <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNext(); } : handleSubmit} className="space-y-5">
            {step === 1 ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">First Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="John"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Doe"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-4 py-3 bg-gradient-to-r from-lime-400 to-emerald-500 text-white rounded-xl font-semibold hover:from-lime-500 hover:to-emerald-600 transition-all"
                >
                  Next
                </button>
                
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard")}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Skip for now, I&apos;ll complete this later →
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Address <span className="text-red-500">*</span></label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="House/Flat No, Street Name"
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">City <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Mumbai"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">State</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Maharashtra"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Pincode</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="400001"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Locality</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Andheri"
                      value={formData.locality}
                      onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={getLocation}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-emerald-50 text-emerald-600 rounded-xl font-medium hover:bg-emerald-100 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Getting location...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-5 h-5" />
                      Auto-fill with Current Location
                    </>
                  )}
                </button>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-lime-400 to-emerald-500 text-white rounded-xl font-semibold hover:from-lime-500 hover:to-emerald-600 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {updateProfileMutation.isPending && <Loader2 className="w-5 h-5 animate-spin" />}
                    Complete
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}
