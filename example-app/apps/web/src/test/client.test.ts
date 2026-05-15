import { describe, it, expect } from "vitest";
import * as api from "@/api/client";

describe("API client", () => {
  it("exports loginWithPassword but not legacy login", () => {
    expect(typeof api.loginWithPassword).toBe("function");
    expect(typeof api.demoLogin).toBe("function");
    expect(typeof api.register).toBe("function");
    // The legacy `login(email)` function should have been removed
    expect((api as any).login).toBeUndefined();
  });
});
