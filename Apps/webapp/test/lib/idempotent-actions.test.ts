import { describe, it, expect, beforeEach } from "vitest";
import {
  createIdempotentGuard,
  resetIdempotentGuard,
  resetAllIdempotentGuards,
} from "@/lib/idempotent-actions";

describe("Idempotent Actions Guard", () => {
  beforeEach(() => {
    resetAllIdempotentGuards();
  });

  it("should allow single execution", async () => {
    const guard = createIdempotentGuard("test-action");
    const mockFn = async () => "success";
    const result = await guard.execute(mockFn);
    expect(result).toBe("success");
  });

  it("should block concurrent executions", async () => {
    const guard = createIdempotentGuard("test-action", { timeout: 100 });
    const mockFn = async () => "success";

    // Start first execution but don't wait
    const promise1 = guard.execute(mockFn);

    // Try to execute while first is running
    await expect(guard.execute(mockFn)).rejects.toThrow(
      "Action already in progress"
    );

    // First execution should complete
    const result = await promise1;
    expect(result).toBe("success");
  });

  it("should track last result", async () => {
    const guard = createIdempotentGuard("test-action");
    const mockFn = async () => ({ id: 1, name: "test" });

    await guard.execute(mockFn);
    expect(guard.getLastResult()).toEqual({ id: 1, name: "test" });
  });

  it("should track last error", async () => {
    const guard = createIdempotentGuard("test-action");
    const mockFn = async () => {
      throw new Error("Test error");
    };

    await expect(guard.execute(mockFn)).rejects.toThrow("Test error");
    expect(guard.getLastError()).toBeInstanceOf(Error);
  });

  it("should allow execution after timeout", async () => {
    const guard = createIdempotentGuard("test-action", { timeout: 50 });
    let callCount = 0;

    const mockFn = async () => {
      callCount++;
      return "success";
    };

    // First execution
    await guard.execute(mockFn);
    expect(callCount).toBe(1);

    // Wait for timeout
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Second execution should be allowed
    const result = await guard.execute(mockFn);
    expect(result).toBe("success");
    expect(callCount).toBe(2);
  });

  it("should call onDuplicate callback", async () => {
    let callbackCalled = false;
    const guard = createIdempotentGuard("test-action", {
      timeout: 100,
      onDuplicate: () => {
        callbackCalled = true;
      },
    });

    const mockFn = async () => "success";

    // Start first execution
    const promise1 = guard.execute(mockFn);

    // Try duplicate - should trigger callback
    await expect(guard.execute(mockFn)).rejects.toThrow();
    expect(callbackCalled).toBe(true);

    await promise1;
  });

  it(
    "should reset guard state",
    { timeout: 15000 },
    async () => {
      const guard = createIdempotentGuard("test-action", { timeout: 50 });
      const mockFn = async () => "success";

      // Execute once
      await guard.execute(mockFn);

      // Reset immediately (doesn't wait for timeout)
      resetIdempotentGuard("test-action");

      // Should be able to execute immediately
      const result = await guard.execute(mockFn);
      expect(result).toBe("success");
    }
  );

  it("should maintain separate guard instances", async () => {
    const guard1 = createIdempotentGuard("action-1", { timeout: 100 });
    const guard2 = createIdempotentGuard("action-2", { timeout: 100 });

    const mockFn = async () => "success";

    // Execute action-1
    const promise1 = guard1.execute(mockFn);

    // Execute action-2 should work (different guard)
    const promise2 = guard2.execute(mockFn);

    const [result1, result2] = await Promise.all([promise1, promise2]);
    expect(result1).toBe("success");
    expect(result2).toBe("success");
  });
});
