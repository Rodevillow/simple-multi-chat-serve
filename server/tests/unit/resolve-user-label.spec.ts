import { describe, expect, it } from "vitest";
import { resolveUserLabel } from "../../src/domain/entities/User.js";

describe("resolveUserLabel", () => {
  it("returns nickname when present", () => {
    expect(
      resolveUserLabel({
        email: "u@example.com",
        nickname: "fox",
        firstName: "John",
        lastName: "Snow"
      })
    ).toBe("fox");
  });

  it("falls back to full name", () => {
    expect(
      resolveUserLabel({
        email: "u@example.com",
        nickname: null,
        firstName: "John",
        lastName: "Snow"
      })
    ).toBe("John Snow");
  });

  it("falls back to email", () => {
    expect(
      resolveUserLabel({
        email: "u@example.com",
        nickname: null,
        firstName: null,
        lastName: null
      })
    ).toBe("u@example.com");
  });
});
