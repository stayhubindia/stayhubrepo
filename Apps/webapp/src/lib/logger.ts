import { APP_ENV, ENABLE_DEBUG_LOGS } from "@/config/env";

type LogMeta = Record<string, unknown>;

const shouldLogDebug = ENABLE_DEBUG_LOGS || APP_ENV !== "production";

// Strip newline/carriage-return chars to prevent log injection (CWE-117)
const sanitize = (val: string) => val.replace(/[\r\n]/g, " ");

const stringify = (meta?: LogMeta) => (meta ? JSON.stringify(meta) : "");

export const logger = {
  debug(message: string, meta?: LogMeta) {
    if (!shouldLogDebug) return;
    // eslint-disable-next-line no-console
    console.debug(`[DEBUG] ${sanitize(message)}`, stringify(meta));
  },
  info(message: string, meta?: LogMeta) {
    // eslint-disable-next-line no-console
    console.info(`[INFO] ${sanitize(message)}`, stringify(meta));
  },
  warn(message: string, meta?: LogMeta) {
    // eslint-disable-next-line no-console
    console.warn(`[WARN] ${sanitize(message)}`, stringify(meta));
  },
  error(message: string, meta?: LogMeta) {
    // Avoid noisy Next.js dev overlays for expected API failures.
    if (APP_ENV === "development" || APP_ENV === "local") {
      // eslint-disable-next-line no-console
      console.warn(`[ERROR] ${sanitize(message)}`, stringify(meta));
      return;
    }
    // eslint-disable-next-line no-console
    console.error(`[ERROR] ${sanitize(message)}`, stringify(meta));
  },
};
