import { API_BASE_URL } from "@/config/env";

/**
 * Resolves a potentially relative image URL to an absolute URL pointing to the backend.
 * Required because Django serializers without request context return relative paths (e.g. /media/properties/x.jpg).
 */
export function getImageUrl(path: string | undefined | null): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  
  // Strip /api/v1 from the end of the base URL to get the root domain
  const baseUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}
