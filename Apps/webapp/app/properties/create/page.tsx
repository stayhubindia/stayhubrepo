"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { useRequireAuth } from "@/hooks/use-route-guard";
import { useCreateProperty } from "@/modules/property/hooks";
import { getMissingOwnerProfileFields } from "@/lib/profile-completion";

export default function CreatePropertyPage() {
  const router = useRouter();
  const { user, isAllowed } = useRequireAuth({ roles: ["OWNER"] });
  const { mutate: createProperty, isPending } = useCreateProperty();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    property_type: "1BHK",
    furnishing: "UNFURNISHED",
    rent: "",
    deposit: "",
    bedrooms: 1,
    bathrooms: 1,
    area_sqft: "",
    preferred_tenant: "ANY",
    available_from: "",
    city: "",
    locality: "",
    address: "",
    pincode: "",
  });
  
  if (!isAllowed || !user) return null;

  const missingFields = getMissingOwnerProfileFields(user);

  if (missingFields.length > 0) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
          <p className="text-gray-600 mb-6">
            Please add your {missingFields.join(" and ")} before listing a property. This helps tenants contact you.
          </p>
          <Link
            href="/owner-onboarding"
            className="inline-block px-6 py-3 bg-gradient-to-r from-lime-400 to-emerald-500 text-white rounded-xl font-semibold hover:from-lime-500 hover:to-emerald-600 transition-all shadow-lg"
          >
            Complete Profile Now
          </Link>
          <Link
            href="/dashboard"
            className="block mt-4 text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProperty(formData, {
      onSuccess: () => {
        router.push("/properties");
      },
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Create Property Listing</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Property Type</label>
              <select
                name="property_type"
                value={formData.property_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="PG">PG</option>
                <option value="1RK">1RK</option>
                <option value="1BHK">1BHK</option>
                <option value="2BHK">2BHK</option>
                <option value="3BHK">3BHK</option>
                <option value="HOUSE">House</option>
                <option value="COMMERCIAL">Commercial</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Furnishing</label>
              <select
                name="furnishing"
                value={formData.furnishing}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="FURNISHED">Furnished</option>
                <option value="SEMI">Semi-Furnished</option>
                <option value="UNFURNISHED">Unfurnished</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rent (₹)</label>
              <input
                type="number"
                name="rent"
                value={formData.rent}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Deposit (₹)</label>
              <input
                type="number"
                name="deposit"
                value={formData.deposit}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Bedrooms</label>
              <input
                type="number"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bathrooms</label>
              <input
                type="number"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Area (sqft)</label>
              <input
                type="number"
                name="area_sqft"
                value={formData.area_sqft}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Locality</label>
              <input
                type="text"
                name="locality"
                value={formData.locality}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Pincode</label>
            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Create Property"}
          </button>
        </form>
      </div>
    </div>
  );
}
