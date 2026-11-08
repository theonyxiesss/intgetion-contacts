import { describe, expect, it } from "vitest";
import { contactsInput } from "../service";

const valid = { email: "  Anna@Example.COM " };

describe("contacts input (D16)", () => {
  it("lowercases the email and clears empty optional fields", () => {
    expect(
      contactsInput.parse({
        ...valid,
        phone: null,
        telegram: undefined,
        linkedinUrl: "",
        websiteUrl: "https://anna.dev",
      }),
    ).toEqual({
      email: "anna@example.com",
      phone: null,
      telegram: null,
      linkedinUrl: null,
      websiteUrl: "https://anna.dev",
      extra: {},
    });
  });

  it("refuses a bad email, phone, Telegram name or link", () => {
    expect(contactsInput.safeParse({ email: "not-an-email" }).success).toBe(false);
    expect(contactsInput.safeParse({ ...valid, phone: "8 900 123" }).success).toBe(false);
    expect(contactsInput.safeParse({ ...valid, telegram: "ab" }).success).toBe(false);
    expect(
      contactsInput.safeParse({ ...valid, linkedinUrl: "javascript:alert(1)" }).success,
    ).toBe(false);
  });

  it("accepts an E.164 phone and a Telegram handle", () => {
    const parsed = contactsInput.parse({
      ...valid,
      phone: "+48123456789",
      telegram: "anna_dev",
    });
    expect(parsed.phone).toBe("+48123456789");
    expect(parsed.telegram).toBe("anna_dev");
  });

  it("keeps at most ten extra entries", () => {
    const extra = Object.fromEntries(
      Array.from({ length: 15 }, (_, i) => [`key${i}`, `value${i}`]),
    );
    expect(Object.keys(contactsInput.parse({ ...valid, extra }).extra)).toHaveLength(10);
  });
});
