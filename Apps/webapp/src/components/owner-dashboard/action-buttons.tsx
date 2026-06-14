"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Pencil, MoreHorizontal, Trash2, Copy, Flag } from "lucide-react";
import { useRouter } from "next/navigation";
import type { PropertyDetail } from "@/types/property";

interface ActionButtonsProps {
  property: PropertyDetail;
}

/**
 * ActionButtons Component
 *
 * Displays Preview Ad, Edit Property, and More options buttons
 * for quick property management actions.
 */
export function ActionButtons({ property }: ActionButtonsProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePreview = () => {
    window.open(`/properties/${property.id}`, "_blank", "noopener,noreferrer");
  };

  const handleEdit = () => {
    router.push(`/my-ads/${property.id}/edit`);
  };

  const moreOptions = [
    {
      label: "Duplicate listing",
      icon: <Copy className="h-4 w-4" />,
      onClick: () => {
        setIsMenuOpen(false);
        // TODO: implement duplicate
      },
    },
    {
      label: "Report an issue",
      icon: <Flag className="h-4 w-4" />,
      onClick: () => {
        setIsMenuOpen(false);
        router.push("/contact");
      },
    },
    {
      label: "Delete property",
      icon: <Trash2 className="h-4 w-4 text-red-500" />,
      className: "text-red-600 hover:bg-red-50",
      onClick: () => {
        setIsMenuOpen(false);
        // TODO: implement delete with confirmation
      },
    },
  ];

  return (
    <div className="flex items-center gap-2">
      {/* Preview Ad */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handlePreview}
        aria-label="Preview property listing"
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
      >
        <Eye className="h-4 w-4" />
        <span className="hidden sm:inline">Preview Ad</span>
      </motion.button>

      {/* Edit Property */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleEdit}
        aria-label="Edit property"
        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md"
      >
        <Pencil className="h-4 w-4" />
        <span className="hidden sm:inline">Edit Property</span>
      </motion.button>

      {/* More Options */}
      <div className="relative" ref={menuRef}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="More options"
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
        >
          <MoreHorizontal className="h-5 w-5 text-slate-600" />
        </motion.button>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.15 }}
              role="menu"
              className="absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
            >
              {moreOptions.map((option) => (
                <button
                  key={option.label}
                  role="menuitem"
                  onClick={option.onClick}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 ${option.className ?? ""}`}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
