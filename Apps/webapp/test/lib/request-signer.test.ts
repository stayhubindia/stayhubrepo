import { describe, expect, it } from "vitest";

import { getSignablePath } from "@/lib/request-signer";

describe("getSignablePath", () => {
  const baseUrl = "https://api.stayhubindia.com/api/v1";

  it("keeps the api prefix for leading-slash request paths", () => {
    expect(getSignablePath("/favorites/", baseUrl)).toBe("/api/v1/favorites/");
  });

  it("drops query params while preserving the api prefix", () => {
    expect(getSignablePath("/properties/?mine=true", baseUrl)).toBe("/api/v1/properties/");
  });

  it("supports relative request paths", () => {
    expect(getSignablePath("properties/trending/?limit=6", baseUrl)).toBe("/api/v1/properties/trending/");
  });

  it("uses the absolute request url path when provided", () => {
    expect(getSignablePath("https://api.stayhubindia.com/api/v1/favorites/", baseUrl)).toBe("/api/v1/favorites/");
  });
});
