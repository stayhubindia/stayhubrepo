"use client";

import { useCallback, useState } from "react";

/**
 * Prevents duplicate execution of the same action key while it's still running.
 */
export function useIdempotentAction() {
  const [inFlight, setInFlight] = useState<Record<string, boolean>>({});

  const isInFlight = useCallback(
    (key: string) => Boolean(inFlight[key]),
    [inFlight],
  );

  const runOnce = useCallback(
    async <T>(key: string, action: () => Promise<T>): Promise<T | undefined> => {
      if (inFlight[key]) {
        return undefined;
      }

      setInFlight((prev) => ({ ...prev, [key]: true }));
      try {
        return await action();
      } finally {
        setInFlight((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [inFlight],
  );

  return { runOnce, isInFlight };
}
