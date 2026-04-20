import type { AppUser } from "@/types/auth";

export const getMissingOwnerProfileFields = (user: AppUser | null): string[] => {
  if (!user) return ["profile"];

  const missing: string[] = [];

  if (!user.phone) {
    missing.push("phone number");
  }

  if (!user.location?.city) {
    missing.push("location");
  }

  return missing;
};
