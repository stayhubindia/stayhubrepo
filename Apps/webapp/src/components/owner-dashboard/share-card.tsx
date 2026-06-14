"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Share2, Copy, Check, Mail } from "lucide-react";
import toast from "react-hot-toast";
import type { PropertyDetail } from "@/types/property";

interface ShareCardProps {
  property: PropertyDetail;
}

/**
 * ShareCard Component
 *
 * Displays a shareable property link with copy button and
 * social media share buttons (WhatsApp, Facebook, Twitter, Email).
 */
export function ShareCard({ property }: ShareCardProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/properties/${property.id}`
      : `/properties/${property.id}`;

  const shareTitle = `Check out this property: ${property.title}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const socialPlatforms = [
    {
      name: "WhatsApp",
      color: "bg-[#25D366] hover:bg-[#1ebe5d]",
      textColor: "text-white",
      getUrl: () =>
        `https://wa.me/?text=${encodeURIComponent(`${shareTitle} ${shareUrl}`)}`,
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
    },
    {
      name: "Facebook",
      color: "bg-[#1877F2] hover:bg-[#0d6efd]",
      textColor: "text-white",
      getUrl: () =>
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: "Twitter",
      color: "bg-[#1DA1F2] hover:bg-[#0c8de4]",
      textColor: "text-white",
      getUrl: () =>
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`,
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: "Email",
      color: "bg-slate-600 hover:bg-slate-700",
      textColor: "text-white",
      getUrl: () =>
        `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareTitle}\n\n${shareUrl}`)}`,
      icon: <Mail className="h-4 w-4" />,
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <Share2 className="h-5 w-5 text-slate-600" />
        <h3 className="text-sm font-bold text-slate-900">Share your property</h3>
      </div>

      <div className="space-y-4 px-5 py-4">
        {/* Shareable Link */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
          <p className="flex-1 truncate text-xs text-slate-600 px-2">{shareUrl}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            aria-label="Copy link"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              copied
                ? "bg-emerald-600 text-white"
                : "bg-white border border-slate-200 text-slate-700 hover:border-emerald-300"
            }`}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </motion.button>
        </div>

        {/* Social Share Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {socialPlatforms.map((platform) => (
            <motion.a
              key={platform.name}
              href={platform.getUrl()}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              aria-label={`Share on ${platform.name}`}
              className={`flex items-center justify-center rounded-xl p-2.5 ${platform.color} ${platform.textColor} transition-all`}
            >
              {platform.icon}
            </motion.a>
          ))}
        </div>

        <p className="text-center text-xs text-slate-400">
          Share with potential tenants
        </p>
      </div>
    </div>
  );
}
