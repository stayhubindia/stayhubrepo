"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Camera,
  CheckCircle,
  CircleDollarSign,
  LoaderCircle,
  MapPin,
  RefreshCcw,
  Save,
  Star,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import { useRequireAuth } from "@/hooks/use-route-guard";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  useProperty,
  useUpdateProperty,
  useUploadPropertyImage,
  useDeletePropertyImage,
  useSetPrimaryPropertyImage,
  useAmenities,
} from "@/modules/properties/hooks";

type PropertyType = "PG" | "1RK" | "1BHK" | "2BHK" | "3BHK" | "HOUSE" | "COMMERCIAL";
type Furnishing = "FURNISHED" | "SEMI" | "UNFURNISHED";
type PreferredTenant = "MALE" | "FEMALE" | "ANY";

const PROPERTY_TYPES = [
  { value: "PG", label: "PG" },
  { value: "1RK", label: "1 RK" },
  { value: "1BHK", label: "1 BHK" },
  { value: "2BHK", label: "2 BHK" },
  { value: "3BHK", label: "3 BHK" },
  { value: "HOUSE", label: "Full House" },
  { value: "COMMERCIAL", label: "Commercial" },
];

const FURNISHING_OPTIONS = [
  { value: "FURNISHED", label: "Furnished" },
  { value: "SEMI", label: "Semi-furnished" },
  { value: "UNFURNISHED", label: "Unfurnished" },
];

export default function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isAllowed } = useRequireAuth({ roles: ["OWNER"] });
  const [error, setError] = useState("");

  const { data: property, isLoading, isError } = useProperty(id);
  const { data: availableAmenities } = useAmenities();
  const updateMutation = useUpdateProperty();
  const uploadMutation = useUploadPropertyImage();
  const deleteImageMutation = useDeletePropertyImage();
  const setPrimaryMutation = useSetPrimaryPropertyImage();

  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    property_type: "" as PropertyType | "",
    furnishing: "" as Furnishing | "",
    rent: "",
    deposit: "",
    bedrooms: "",
    bathrooms: "",
    area_sqft: "",
    city: "",
    locality: "",
    address: "",
    state: "",
    pincode: "",
    lat: null as number | null,
    lng: null as number | null,
    preferred_tenant: "ANY" as PreferredTenant,
    available_from: "",
    amenity_ids: [] as number[],
    images: [] as File[],
  });

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

  useEffect(() => {
    if (property) {
      setForm({
        title: property.title || "",
        description: property.description || "",
        property_type: (property.property_type as PropertyType) || "",
        furnishing: (property.furnishing as Furnishing) || "",
        rent: property.rent ? String(property.rent) : "",
        deposit: property.deposit ? String(property.deposit) : "",
        bedrooms: property.bedrooms ? String(property.bedrooms) : "",
        bathrooms: property.bathrooms ? String(property.bathrooms) : "",
        area_sqft: property.area_sqft ? String(property.area_sqft) : "",
        city: property.location?.city || "",
        locality: property.location?.locality || "",
        address: property.location?.address || "",
        state: (property as any).state || "",
        pincode: (property as any).pincode || "",
        lat: (property as any).lat ? Number((property as any).lat) : null,
        lng: (property as any).lng ? Number((property as any).lng) : null,
        preferred_tenant: (property as any).preferred_tenant || "ANY",
        available_from: (property as any).available_from || "",
        amenity_ids: property.amenities?.map(a => Number(a.id)) || [],
        images: [],
      });
    }
  }, [property]);

  if (!isAllowed || !user) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoaderCircle className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (isError || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">Property not found or you don&apos;t have access.</p>
      </div>
    );
  }

  const handleSave = async () => {
    setError("");
    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          title: form.title,
          description: form.description,
          property_type: form.property_type,
          furnishing: form.furnishing,
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
        },
      });

      // Upload new images
      if (form.images.length > 0) {
        for (let i = 0; i < form.images.length; i++) {
          await uploadMutation.mutateAsync({
            id,
            file: form.images[i],
            isPrimary: property.images?.length === 0 && i === 0, // Make primary if no images exist
          });
        }
      }

      toast.success("Property updated successfully");
      router.push("/my-ads");
    } catch (err) {
      setError(getApiErrorMessage(err));
      toast.error("Failed to update property");
    }
  };

  const isBusy = updateMutation.isPending || uploadMutation.isPending || deleteImageMutation.isPending || setPrimaryMutation.isPending;

  return (
    <main className="min-h-screen bg-slate-50 pb-32">
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-4 px-4">
          <Link
            href="/my-ads"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-900">Edit Property</h1>
            <p className="text-xs text-slate-500 truncate">{property.title}</p>
          </div>
          <button
            onClick={handleSave}
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {isBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 pt-8">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-8">
          {/* ── Basic Info ── */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="mb-6 text-xl font-bold text-slate-900">Basic Information</h2>
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Property Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Type</label>
                  <select
                    value={form.property_type}
                    onChange={(e) => setForm({ ...form, property_type: e.target.value as PropertyType })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-emerald-500 outline-none bg-white"
                  >
                    {PROPERTY_TYPES.map((pt) => (
                      <option key={pt.value} value={pt.value}>{pt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Furnishing</label>
                  <select
                    value={form.furnishing}
                    onChange={(e) => setForm({ ...form, furnishing: e.target.value as Furnishing })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-emerald-500 outline-none bg-white"
                  >
                    {FURNISHING_OPTIONS.map((fo) => (
                      <option key={fo.value} value={fo.value}>{fo.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* ── Location ── */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="mb-6 text-xl font-bold text-slate-900">Location Details</h2>
            <div className="space-y-6">
              <div className={`p-4 rounded-xl border ${form.lat !== null ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-start gap-3">
                  <MapPin className={`w-5 h-5 mt-0.5 ${form.lat !== null ? 'text-emerald-600' : 'text-slate-600'}`} />
                  <div className="flex-1">
                    <h3 className={`font-semibold ${form.lat !== null ? 'text-emerald-900' : 'text-slate-900'}`}>
                      {form.lat !== null ? 'GPS Location Acquired' : 'GPS Location Missing'}
                    </h3>
                    <p className={`mt-1 text-sm ${form.lat !== null ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {form.lat !== null 
                        ? `Coordinates: ${form.lat.toFixed(6)}, ${form.lng?.toFixed(6)}`
                        : 'Update location for accurate map plotting.'}
                    </p>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={isFetchingLocation}
                      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {isFetchingLocation ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                      Update Coordinates
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
                    className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
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
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">City <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-emerald-500 outline-none"
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
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Pincode</label>
                  <input
                    type="text"
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ── Pricing & Specs ── */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="mb-6 text-xl font-bold text-slate-900">Pricing & Details</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Monthly Rent (₹)</label>
                <div className="relative">
                  <CircleDollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    value={form.rent}
                    onChange={(e) => setForm({ ...form, rent: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Security Deposit (₹)</label>
                <input
                  type="number"
                  value={form.deposit}
                  onChange={(e) => setForm({ ...form, deposit: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Bedrooms</label>
                <input
                  type="number"
                  value={form.bedrooms}
                  onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Bathrooms</label>
                <input
                  type="number"
                  value={form.bathrooms}
                  onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Available from</label>
                <div className="relative">
                  <CalendarIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={form.available_from}
                    onChange={(e) => setForm({ ...form, available_from: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {availableAmenities && availableAmenities.length > 0 && (
              <div className="mt-8">
                <h3 className="mb-4 font-semibold text-slate-900">Amenities</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
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
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                          : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200"
                      }`}
                    >
                      <span className="text-sm font-medium">{amenity.name}</span>
                      {form.amenity_ids.includes(amenity.id) && <CheckCircle className="h-4 w-4 text-emerald-600" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ── Images ── */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="mb-6 text-xl font-bold text-slate-900">Manage Images</h2>
            
            {/* Existing Images */}
            {property.images && property.images.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Current Images</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {property.images.map((img) => (
                    <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                      <img src={img.image} alt="Property" className="w-full h-full object-cover" />
                      
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {!img.is_primary && (
                          <button
                            onClick={() => setPrimaryMutation.mutate({ propertyId: id, imageId: img.id })}
                            className="p-2 bg-white text-emerald-600 rounded-full hover:bg-emerald-50"
                            title="Set as cover"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm("Delete this image?")) {
                              deleteImageMutation.mutate({ propertyId: id, imageId: img.id });
                            }
                          }}
                          className="p-2 bg-white text-red-600 rounded-full hover:bg-red-50"
                          title="Delete image"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {img.is_primary && (
                        <div className="absolute bottom-0 left-0 right-0 bg-emerald-600/90 text-white text-[10px] font-bold text-center py-1">
                          COVER
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload New */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Upload New Images</h3>
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-emerald-200 rounded-2xl bg-emerald-50/50 hover:bg-emerald-50 cursor-pointer transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Camera className="w-8 h-8 mb-3 text-emerald-400" />
                  <p className="mb-2 text-sm text-slate-600"><span className="font-bold text-emerald-600">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-slate-500">PNG, JPG or WEBP (Max. 5MB)</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  multiple 
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      setForm({ ...form, images: [...form.images, ...Array.from(e.target.files)] });
                    }
                  }}
                />
              </label>

              {form.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                  {form.images.map((file, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                      <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        onClick={() => {
                          const newImages = [...form.images];
                          newImages.splice(index, 1);
                          setForm({ ...form, images: newImages });
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-slate-900/80 text-white text-[10px] font-bold text-center py-1">
                        TO BE UPLOADED
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
