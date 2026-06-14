"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  MapPin, 
  Bed, 
  Bath, 
  Maximize, 
  Building2, 
  Layers,
  Calendar,
  Hash,
  ArrowLeft,
  Image as ImageIcon
} from "lucide-react";
import Link from "next/link";

import type { PropertyDetail } from "@/types/property";
import { ImageLightbox } from "./image-lightbox";

interface PropertyHeroProps {
  property: PropertyDetail;
}

/**
 * Property Hero Section Component
 * 
 * Displays the top section of the owner property dashboard with:
 * - Back to My Ads link
 * - Primary property image with photo count overlay
 * - Thumbnail gallery with "+N More" indicator
 * - Property title, address, and status badge
 * - Key specifications (bedrooms, bathrooms, area, type, floor)
 * - Rent amount with "For long stays" note
 * - Listing date and property ID
 * - Lightbox for viewing images
 */
export function PropertyHero({ property }: PropertyHeroProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Sort images by order and get primary image
  const sortedImages = [...property.images].sort((a, b) => a.order - b.order);
  const primaryImage = sortedImages.find(img => img.is_primary) || sortedImages[0];
  const thumbnailImages = sortedImages.slice(0, 4);
  const remainingCount = Math.max(0, sortedImages.length - 4);

  // Status badge configuration
  const statusConfig: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: "Active", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    DRAFT: { label: "Draft", className: "bg-slate-100 text-slate-700 border-slate-200" },
    PENDING: { label: "Pending Review", className: "bg-amber-100 text-amber-700 border-amber-200" },
    RENTED: { label: "Rented", className: "bg-blue-100 text-blue-700 border-blue-200" },
    EXPIRED: { label: "Inactive", className: "bg-red-100 text-red-700 border-red-200" },
    REJECTED: { label: "Rejected", className: "bg-red-100 text-red-700 border-red-200" },
  };

  const status = statusConfig[property.status] || statusConfig.DRAFT;

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", { 
      day: "numeric", 
      month: "short", 
      year: "numeric" 
    });
  };

  // Handle image click
  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setLightboxOpen(true);
  };

  // Format rent
  const rent = Number(property.rent);
  const formattedRent = rent.toLocaleString("en-IN");

  // Get full address
  const getFullAddress = () => {
    if (!property.location) return "Address not available";
    const { address, locality, city, state, pincode } = property.location;
    const parts = [address, locality, city, state, pincode].filter(Boolean);
    return parts.join(", ");
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Back Link */}
        <Link
          href="/my-ads"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Ads
        </Link>

        {/* Main Hero Card */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          {/* Image Gallery Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
            {/* Primary Image */}
            <div className="relative md:col-span-2 lg:col-span-1">
              <button
                onClick={() => handleImageClick(0)}
                className="relative w-full h-64 md:h-80 lg:h-96 rounded-2xl overflow-hidden group"
              >
                {primaryImage ? (
                  <img
                    src={primaryImage.image}
                    alt={property.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Building2 className="w-24 h-24 text-white opacity-20" />
                  </div>
                )}
                
                {/* View Photos Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white">
                    <ImageIcon className="h-5 w-5" />
                    <span className="text-sm font-semibold">
                      View Photos ({sortedImages.length})
                    </span>
                  </div>
                </div>
              </button>
            </div>

            {/* Thumbnail Grid */}
            <div className="grid grid-cols-3 gap-2 md:col-span-2 lg:col-span-1">
              {thumbnailImages.slice(1, 4).map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => handleImageClick(index + 1)}
                  className="relative h-20 md:h-24 lg:h-[calc((24rem-1rem)/3)] rounded-xl overflow-hidden group"
                >
                  <img
                    src={image.image}
                    alt={`${property.title} - Image ${index + 2}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  {/* "+N More" overlay on last thumbnail */}
                  {index === 2 && remainingCount > 0 && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <span className="text-white text-lg font-bold">
                        +{remainingCount} More
                      </span>
                    </div>
                  )}
                </button>
              ))}
              
              {/* Fill empty slots if less than 4 images */}
              {thumbnailImages.length < 4 && Array.from({ length: 4 - thumbnailImages.length }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="h-20 md:h-24 lg:h-[calc((24rem-1rem)/3)] rounded-xl bg-slate-100 flex items-center justify-center"
                >
                  <ImageIcon className="h-6 w-6 text-slate-300" />
                </div>
              ))}
            </div>
          </div>

          {/* Property Information Section */}
          <div className="p-6 md:p-8 space-y-6">
            {/* Title, Address, and Status */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 flex-1">
                  {property.title}
                </h1>
                <span className={`px-3 py-1.5 rounded-xl text-sm font-semibold border ${status.className}`}>
                  {status.label}
                </span>
              </div>

              <div className="flex items-start gap-2 text-slate-600">
                <MapPin className="h-5 w-5 shrink-0 mt-0.5" />
                <p className="text-sm md:text-base">
                  {getFullAddress()}
                </p>
              </div>
            </div>

            {/* Key Specifications */}
            <div className="flex flex-wrap gap-4 md:gap-6">
              {property.bedrooms !== null && (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Bed className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Bedrooms</p>
                    <p className="text-sm font-bold text-slate-900">{property.bedrooms}</p>
                  </div>
                </div>
              )}

              {property.bathrooms !== null && (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Bath className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Bathrooms</p>
                    <p className="text-sm font-bold text-slate-900">{property.bathrooms}</p>
                  </div>
                </div>
              )}

              {property.area_sqft !== null && (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <Maximize className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Area</p>
                    <p className="text-sm font-bold text-slate-900">{property.area_sqft} sqft</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Type</p>
                  <p className="text-sm font-bold text-slate-900">{property.property_type}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                  <Layers className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Furnishing</p>
                  <p className="text-sm font-bold text-slate-900">{property.furnishing}</p>
                </div>
              </div>
            </div>

            {/* Rent and Metadata */}
            <div className="pt-6 border-t border-slate-200">
              <div className="flex flex-wrap items-end justify-between gap-4">
                {/* Rent */}
                <div>
                  <p className="text-3xl md:text-4xl font-black text-emerald-600">
                    ₹{formattedRent}
                    <span className="text-base font-semibold text-emerald-600/70 ml-2">
                      / month
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-slate-500">For long stays</p>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>Listed {formatDate(property.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Hash className="h-4 w-4 text-slate-400" />
                    <span className="font-mono text-xs">{property.id.slice(0, 8)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Image Lightbox */}
      {lightboxOpen && (
        <ImageLightbox
          images={sortedImages}
          initialIndex={selectedImageIndex}
          onClose={() => setLightboxOpen(false)}
          propertyTitle={property.title}
        />
      )}
    </>
  );
}
