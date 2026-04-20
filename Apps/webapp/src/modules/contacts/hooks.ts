import { useMutation, useQuery } from "@tanstack/react-query";

import { createContactLead, listOwnerLeads, type ContactCreatePayload } from "./api";
import { createIdempotentGuard } from "@/lib/idempotent-actions";

export const useCreateContactLead = () => {
  const guard = createIdempotentGuard("createContactLead", { timeout: 3000 });

  return useMutation({
    mutationFn: (payload: ContactCreatePayload) =>
      guard.execute(() => createContactLead(payload)),
  });
};

export const useOwnerLeads = (enabled = true) =>
  useQuery({
    queryKey: ["contacts", "owner-leads"],
    queryFn: listOwnerLeads,
    enabled,
  });
