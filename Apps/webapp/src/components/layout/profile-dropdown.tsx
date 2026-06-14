"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Settings, UserCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useAuthStore } from "@/store/auth-store";

export function ProfileDropdown() {
  const { user, clearSession } = useAuthStore();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const firstName = user?.first_name ?? user?.email?.split("@")[0] ?? "User";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    clearSession();
    router.push("/");
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <div 
        className="flex items-center gap-3 cursor-pointer group p-1.5 rounded-xl hover:bg-slate-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm text-white">
          <span className="text-sm font-bold">
            {firstName[0]?.toUpperCase()}
          </span>
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-bold text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors">{firstName}</p>
          <p className="text-[10px] text-slate-500 leading-tight font-medium mt-0.5">View profile <ChevronDown className="inline w-3 h-3" /></p>
        </div>
      </div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50"
          >
            <div className="p-4 border-b border-slate-50">
              <p className="text-sm font-bold text-slate-900 truncate">
                {user.first_name ? `${user.first_name} ${user.last_name || ""}` : firstName}
              </p>
              <p className="text-xs text-slate-500 truncate">{user.email || user.phone}</p>
            </div>
            <div className="p-2 space-y-1">
              <Link href="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors">
                <UserCircle className="w-4 h-4" /> My Profile
              </Link>
              <Link href="/account" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition-colors">
                <Settings className="w-4 h-4" /> Account Settings
              </Link>
            </div>
            <div className="p-2 border-t border-slate-50">
              <button 
                onClick={handleSignOut}
                className="flex items-center gap-3 px-3 py-2.5 w-full text-left rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
