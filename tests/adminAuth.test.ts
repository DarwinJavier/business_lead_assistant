import { afterEach, describe, expect, it, vi } from "vitest";
import { adminAuthHeader, isAdminRequestAuthorized } from "../lib/adminAuth";

describe("isAdminRequestAuthorized", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects requests when no admin secret is configured", () => {
    vi.stubEnv("ADMIN_DASHBOARD_SECRET", "");
    vi.stubEnv("NODE_ENV", "production");

    expect(isAdminRequestAuthorized(new Request("https://example.com/api/leads/123"))).toBe(false);
  });

  it("requires the matching admin key in production", () => {
    vi.stubEnv("ADMIN_DASHBOARD_SECRET", "correct-secret");
    vi.stubEnv("NODE_ENV", "production");

    expect(isAdminRequestAuthorized(new Request("https://example.com/api/leads/123"))).toBe(false);
    expect(
      isAdminRequestAuthorized(
        new Request("https://example.com/api/leads/123", {
          headers: { [adminAuthHeader]: "wrong-secret" },
        }),
      ),
    ).toBe(false);
    expect(
      isAdminRequestAuthorized(
        new Request("https://example.com/api/leads/123", {
          headers: { [adminAuthHeader]: "correct-secret" },
        }),
      ),
    ).toBe(true);
  });
});
