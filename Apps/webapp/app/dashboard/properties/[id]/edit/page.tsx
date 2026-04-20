"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Save } from "lucide-react";

import { useRequireAuth } from "@/hooks/use-route-guard";
import { useIdempotentAction } from "@/hooks/use-idempotent-action";
import { getApiErrorMessage } from "@/lib/api-error";
import { usePropertyDetail } from "@/modules/property/hooks";
import { useSubmitProperty, useUpdateProperty } from "@/modules/properties/hooks";
import { ErrorState, LoadingState } from "@/components/ui/query-states";

type PropertyType = "PG" | "1RK" | "1BHK" | "2BHK" | "3BHK" | "HOUSE" | "COMMERCIAL";
type Furnishing = "FURNISHED" | "SEMI" | "UNFURNISHED";
type PreferredTenant = "MALE" | "FEMALE" | "ANY";

type FormState = {
  property_type: PropertyType | "";
  title: string;
  description: string;
  city: string;
  locality: string;
  rent: string;
  deposit: string;
  furnishing: Furnishing | "";
  bedrooms: string;
  bathrooms: string;
  area_sqft: string;
  preferred_tenant: PreferredTenant;
};

const DEFAULT_FORM: FormState = {
  property_type: "",
  title: "",
  description: "",
  city: "",
  locality: "",
  rent: "",
  deposit: "",
  furnishing: "",
  bedrooms: "",
  bathrooms: "",
  area_sqft: "",
  preferred_tenant: "ANY",
};

export default function EditPropertyPage() {
  const params = useParams<{ id: string }>();
  const propertyId = params?.id ?? "";
  const router = useRouter();
  const { user, isAllowed } = useRequireAuth({ roles: ["OWNER"] });

  const detailQuery = usePropertyDetail(propertyId, Boolean(propertyId && user));
  const updateMutation = useUpdateProperty();
  const submitMutation = useSubmitProperty();
  const { runOnce, isInFlight } = useIdempotentAction();

  const [formData, setFormData] = useState<FormState>(DEFAULT_FORM);
  const [error, setError] = useState("");
  const [initialized, setInitialized] = useState(false);

  const property = detailQuery.data;

  useEffect(() => {
    if (!property || initialized) {
      return;
    }

    setFormData({
      property_type: property.property_type,
      title: property.title ?? "",
      description: property.description ?? "",
      city: property.location?.city ?? "",
      locality: property.location?.locality ?? "",
      rent: property.rent ?? "",
      deposit: property.deposit ?? "",
      furnishing: property.furnishing,
      bedrooms: property.bedrooms !== null ? String(property.bedrooms) : "",
      bathrooms: property.bathrooms !== null ? String(property.bathrooms) : "",
      area_sqft: property.area_sqft !== null ? String(property.area_sqft) : "",
      preferred_tenant: property.preferred_tenant ?? "ANY",
    });
    setInitialized(true);
  }, [property, initialized]);

  const canSubmitForReview = useMemo(() => {
    const status = property?.status;
    return status === "DRAFT" || status === "REJECTED";
  }, [property?.status]);

  if (!isAllowed || !user) {
    return null;
  }

  const isOwnerOfProperty = property?.owner === user.id;

  const saveChanges = async () => {
    if (!propertyId) return;

    await runOnce(`property:update:${propertyId}`, async () => {
      setError("");
      try {
        await updateMutation.mutateAsync({
          id: propertyId,
          data: {
            title: formData.title,
            description: formData.description,
            property_type: formData.property_type || undefined,
            furnishing: formData.furnishing || undefined,
            rent: formData.rent ? Number(formData.rent) : undefined,
            deposit: formData.deposit ? Number(formData.deposit) : undefined,
            bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
            bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
            area_sqft: formData.area_sqft ? Number(formData.area_sqft) : undefined,
            city: formData.city,
            locality: formData.locality || undefined,
            preferred_tenant: formData.preferred_tenant,
          },
        });
        router.push("/dashboard/properties");
      } catch (err) {
        setError(getApiErrorMessage(err));
      }
    });
  };

  const saveAndSubmit = async () => {
    if (!propertyId) return;

    await runOnce(`property:update-submit:${propertyId}`, async () => {
      setError("");
      try {
        await updateMutation.mutateAsync({
          id: propertyId,
          data: {
            title: formData.title,
            description: formData.description,
            property_type: formData.property_type || undefined,
            furnishing: formData.furnishing || undefined,
            rent: formData.rent ? Number(formData.rent) : undefined,
            deposit: formData.deposit ? Number(formData.deposit) : undefined,
            bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
            bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
            area_sqft: formData.area_sqft ? Number(formData.area_sqft) : undefined,
            city: formData.city,
            locality: formData.locality || undefined,
            preferred_tenant: formData.preferred_tenant,
          },
        });

        if (canSubmitForReview) {
          await submitMutation.mutateAsync(propertyId);
        }

        router.push("/dashboard/properties");
      } catch (err) {
        setError(getApiErrorMessage(err));
      }
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/dashboard/properties" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
            ← Back to My Properties
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Edit Property</h1>
          <p className="text-gray-600 mt-2">Update your ad details and save changes</p>
        </div>

        {detailQuery.isLoading ? <LoadingState message="Loading property..." className="py-8" /> : null}
        {detailQuery.isError ? <ErrorState message={getApiErrorMessage(detailQuery.error)} className="p-4" /> : null}

        {property && !isOwnerOfProperty ? (
          <ErrorState message="You can only edit your own properties." className="p-4" />
        ) : null}

        {error ? (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
        ) : null}

        {property && isOwnerOfProperty ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Type *</label>
                <select
                  value={formData.property_type}
                  onChange={(e) => setFormData({ ...formData, property_type: e.target.value as PropertyType })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select</option>
                  <option value="PG">PG</option>
                  <option value="1RK">1RK</option>
                  <option value="1BHK">1BHK</option>
                  <option value="2BHK">2BHK</option>
                  <option value="3BHK">3BHK</option>
                  <option value="HOUSE">HOUSE</option>
                  <option value="COMMERCIAL">COMMERCIAL</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Furnishing *</label>
                <select
                  value={formData.furnishing}
                  onChange={(e) => setFormData({ ...formData, furnishing: e.target.value as Furnishing })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select</option>
                  <option value="FURNISHED">FURNISHED</option>
                  <option value="SEMI">SEMI</option>
                  <option value="UNFURNISHED">UNFURNISHED</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Locality</label>
                <input
                  type="text"
                  value={formData.locality}
                  onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rent *</label>
                <input
                  type="number"
                  value={formData.rent}
                  onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deposit</label>
                <input
                  type="number"
                  value={formData.deposit}
                  onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                <input
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                <input
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Area (sqft)</label>
                <input
                  type="number"
                  value={formData.area_sqft}
                  onChange={(e) => setFormData({ ...formData, area_sqft: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Tenant</label>
              <select
                value={formData.preferred_tenant}
                onChange={(e) => setFormData({ ...formData, preferred_tenant: e.target.value as PreferredTenant })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="ANY">ANY</option>
                <option value="MALE">MALE</option>
                <option value="FEMALE">FEMALE</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={saveChanges}
                disabled={updateMutation.isPending || isInFlight(`property:update:${propertyId}`)}
                className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all disabled:opacity-60 inline-flex items-center gap-2"
              >
                {(updateMutation.isPending || isInFlight(`property:update:${propertyId}`)) ? (
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </button>

              <button
                type="button"
                onClick={saveAndSubmit}
                disabled={
                  updateMutation.isPending ||
                  submitMutation.isPending ||
                  isInFlight(`property:update-submit:${propertyId}`)
                }
                className="px-6 py-3 bg-gradient-to-r from-lime-400 to-emerald-500 text-white rounded-xl font-semibold hover:from-lime-500 hover:to-emerald-600 transition-all disabled:opacity-60 inline-flex items-center gap-2"
              >
                {(updateMutation.isPending || submitMutation.isPending || isInFlight(`property:update-submit:${propertyId}`)) && (
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                )}
                {canSubmitForReview ? "Save & Submit for Review" : "Save & Continue"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
