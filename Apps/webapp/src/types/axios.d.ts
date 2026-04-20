import "axios";

declare module "axios" {
  export interface InternalAxiosRequestConfig {
    metadata?: {
      requestId?: string;
      startedAt?: number;
      queuedReplay?: boolean;
    };
  }
}
