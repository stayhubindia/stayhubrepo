import axios from "axios";

const stringifyErrorDetail = (detail: unknown): string | null => {
  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail.map((entry) => String(entry)).join(", ");
  }

  if (detail && typeof detail === "object") {
    const messages = Object.values(detail as Record<string, unknown>).flatMap((value) =>
      Array.isArray(value) ? value.map((entry) => String(entry)) : [String(value)],
    );
    return messages.join(", ");
  }

  return null;
};

export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as
      | { error?: { detail?: unknown }; detail?: unknown }
      | undefined;
    const detail = payload?.error?.detail ?? payload?.detail;
    const parsedMessage = stringifyErrorDetail(detail);
    if (parsedMessage) {
      return parsedMessage;
    }
    if (error.response?.status) {
      return `Request failed with status ${error.response.status}`;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
};
