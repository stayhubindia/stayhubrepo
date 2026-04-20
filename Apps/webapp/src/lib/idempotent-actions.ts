/**
 * Idempotent Action Guard
 * 
 * Prevents duplicate submissions of high-impact mutations (property creation, leads, contacts, etc)
 * by tracking in-flight requests and blocking concurrent submissions same action.
 * 
 * Pattern:
 * const guard = createIdempotentGuard('createProperty');
 * const result = await guard.execute(() => mutate(data), { timeout: 5000 });
 */

interface GuardConfig {
  timeout?: number; // ms to wait before allowing retry (default: 3000)
  onDuplicate?: () => void; // callback if duplicate attempt is blocked
}

class IdempotentGuard {
  private isExecuting = false;
  private lastResult: unknown = null;
  private lastError: unknown = null;
  private readonly timeout: number;
  private readonly onDuplicate?: () => void;

  constructor(config: GuardConfig = {}) {
    this.timeout = config.timeout ?? 3000;
    this.onDuplicate = config.onDuplicate;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Block concurrent executions
    if (this.isExecuting) {
      this.onDuplicate?.();
      throw new Error("Action already in progress. Please wait.");
    }

    this.isExecuting = true;

    try {
      const result = await fn();
      this.lastResult = result;
      this.lastError = null;
      return result;
    } catch (error) {
      this.lastError = error;
      throw error;
    } finally {
      // Wait timeout before allowing next execution
      await new Promise((resolve) => setTimeout(resolve, this.timeout));
      this.isExecuting = false;
    }
  }

  reset() {
    this.isExecuting = false;
    this.lastResult = null;
    this.lastError = null;
  }

  getLastResult() {
    return this.lastResult;
  }

  getLastError() {
    return this.lastError;
  }
}

// Global registry of guards per action
const guardRegistry = new Map<string, IdempotentGuard>();
const GUARD_REGISTRY_MAX_SIZE = 50;

// Evict the oldest entry when the registry exceeds max size (TASK-23)
function evictOldestGuard() {
  if (guardRegistry.size >= GUARD_REGISTRY_MAX_SIZE) {
    const oldest = guardRegistry.keys().next().value;
    if (oldest) guardRegistry.delete(oldest);
  }
}

/**
 * Create or get an idempotent guard for a specific action
 * @param actionName - Unique identifier for the action (e.g., 'createProperty', 'createLead')
 * @param config - Configuration for the guard
 */
export function createIdempotentGuard(actionName: string, config?: GuardConfig): IdempotentGuard {
  if (!guardRegistry.has(actionName)) {
    evictOldestGuard();
    guardRegistry.set(actionName, new IdempotentGuard(config));
  }
  return guardRegistry.get(actionName)!;
}

/**
 * Reset a specific guard (useful for cleanup or testing)
 */
export function resetIdempotentGuard(actionName: string) {
  const guard = guardRegistry.get(actionName);
  if (guard) {
    guard.reset();
  }
}

/**
 * Reset all guards (useful for testing or logout)
 */
export function resetAllIdempotentGuards() {
  guardRegistry.forEach((guard) => guard.reset());
  guardRegistry.clear();
}

/**
 * Hook-friendly wrapper: Use in React components
 * 
 * Example:
 * const createProperty = useIdempotentMutation(
 *   () => createProperty(data),
 *   'createProperty'
 * );
 */
export function useIdempotentAction(
  actionName: string,
  config?: GuardConfig & { onError?: (error: Error) => void }
) {
  const guard = createIdempotentGuard(actionName, config);

  return async <T,>(fn: () => Promise<T>): Promise<T> => {
    try {
      return await guard.execute(fn);
    } catch (error) {
      // Use a static fallback message — never pass String(error) to dynamic
      // execution contexts; this prevents code injection (CWE-94, TASK-05).
      const err = error instanceof Error ? error : new Error("Action failed. Please try again.");
      config?.onError?.(err);
      throw err;
    }
  };
}
