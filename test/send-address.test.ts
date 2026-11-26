import { describe, expect, it } from "vitest";
import { parseFrom, toSendAddress } from "../src/sandbox-entry";

// Cloudflare's send_email binding rejects an address object without a string
// `name` ("Incorrect type for the 'name' field on 'EmailAddress'"), so a
// nameless sender must go out as a plain string.
describe("toSendAddress", () => {
  it("passes a nameless address as a plain string", () => {
    expect(toSendAddress({ email: "a@example.com" })).toBe("a@example.com");
    expect(toSendAddress({ email: "a@example.com" }, "")).toBe("a@example.com");
    expect(toSendAddress({ email: "a@example.com" }, "   ")).toBe("a@example.com");
  });

  it("uses the fallback name when the From value has none", () => {
    expect(toSendAddress({ email: "a@example.com" }, " Org ")).toEqual({ email: "a@example.com", name: "Org" });
  });

  it("prefers the name in the From value over the fallback", () => {
    expect(toSendAddress({ email: "a@example.com", name: "From" }, "Org")).toEqual({
      email: "a@example.com",
      name: "From",
    });
  });
});

describe("parseFrom", () => {
  it("reads a bare address", () => {
    expect(parseFrom("a@example.com")).toEqual({ email: "a@example.com" });
  });

  it("reads a display name, with or without quotes", () => {
    expect(parseFrom("Site <a@example.com>")).toEqual({ email: "a@example.com", name: "Site" });
    expect(parseFrom('"Site" <a@example.com>')).toEqual({ email: "a@example.com", name: "Site" });
  });

  it("rejects an invalid address", () => {
    expect(parseFrom("not an address")).toBeNull();
    expect(parseFrom("Site <nope>")).toBeNull();
  });

  it("never yields a nameless object once shaped for sending", () => {
    for (const input of ["a@example.com", "Site <a@example.com>"]) {
      const from = toSendAddress(parseFrom(input)!);
      if (typeof from !== "string") expect(typeof from.name).toBe("string");
    }
  });
});
