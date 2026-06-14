import Link from "next/link";
import { MapPin, Calendar, Clock, MessageSquare, Building2, ChevronRight } from "lucide-react";
import type { SavedProperty, BookingConversation } from "@/modules/bookings/types";

type BookingCardItem = SavedProperty | BookingConversation;

// A single horizontal card for the bookings page
export function BookingCard({ 
  item, 
  type 
}: { 
  item: BookingCardItem; 
  type: "upcoming" | "completed" | "cancelled" | "saved" 
}) {
  const isSaved = type === "saved";
  const savedItem = isSaved ? item as SavedProperty : null;
  const conversationItem = !isSaved ? item as BookingConversation : null;
  
  // Real data mapping based on interface
  const title = savedItem ? savedItem.property_title : conversationItem?.property?.title || "Property";
  const rent = savedItem ? savedItem.property_rent : null;
  const city = savedItem ? savedItem.property_city : null;
  const createdAt = new Date(item.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  
  const statusColor = type === "upcoming" ? "bg-emerald-500" : type === "cancelled" ? "bg-red-500" : "bg-slate-500";
  const statusText = type === "upcoming" ? "Active" : type === "cancelled" ? "Archived" : type === "saved" ? "Saved" : "Completed";

  return (
    <div className="flex flex-col sm:flex-row bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-emerald-200 transition-all duration-300 shadow-sm hover:shadow-md mb-4">
      {/* Image / Placeholder Side */}
      <div className="relative w-full sm:w-[240px] h-[180px] sm:h-auto shrink-0 bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center">
        <Building2 className="w-16 h-16 text-white/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute top-4 left-4">
          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold text-white shadow-sm uppercase tracking-wide ${statusColor}`}>
            {statusText}
          </span>
        </div>
      </div>

      {/* Content Side */}
      <div className="flex-1 p-5 flex flex-col sm:flex-row gap-6">
        {/* Left Content */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
            {city && (
              <p className="text-sm text-slate-500 flex items-center gap-1.5 mb-4">
                <MapPin className="w-4 h-4 text-slate-400" />
                {city}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 py-4 border-t border-slate-100 mt-auto">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Added On</p>
                <p className="text-xs font-semibold text-slate-900">{createdAt}</p>
              </div>
            </div>
            
            {conversationItem?.last_message_at && (
              <div className="flex items-center gap-2 ml-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase">Last Message</p>
                  <p className="text-xs font-semibold text-slate-900">
                    {new Date(conversationItem.last_message_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Content / Action */}
        <div className="sm:w-[200px] sm:border-l border-slate-100 sm:pl-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div>
              {rent && !isNaN(Number(rent)) ? (
                <>
                  <p className="text-2xl font-black text-slate-900">
                    ₹{Number(rent).toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">Monthly Rent</p>
                </>
              ) : (
                <p className="text-sm font-semibold text-slate-400">Rent upon request</p>
              )}
            </div>
          </div>

          <div className="space-y-2 mt-auto">
            {type === "upcoming" ? (
              <button className="w-full py-2.5 flex justify-center items-center gap-2 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-sm hover:bg-emerald-100 transition-colors">
                View Chat <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button className="w-full py-2.5 flex justify-center items-center gap-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors">
                View Details
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
