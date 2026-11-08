import { beforeEach, describe, expect, it, vi } from "vitest";

const service = vi.hoisted(() => ({
  getOwnContacts: vi.fn(async (): Promise<unknown> => null),
  saveContacts: vi.fn(async (_id: string, input: unknown) => input),
  findContactEmail: vi.fn(async () => "anna@example.com"),
  deleteContacts: vi.fn(async () => true),
}));

vi.mock("../modules/contacts/service", async (orig) => ({
  ...(await orig<typeof import("../modules/contacts/service")>()),
  ...service,
}));

const { createApp } = await import("./app");

const TOKEN = "test-contacts-token";
const USER = "22222222-2222-4222-8222-222222222222";
const handle = createApp({ serviceToken: TOKEN });

function call(path: string, init: RequestInit & { user?: string } = {}) {
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${TOKEN}`);
  if (init.user) headers.set("x-user-id", init.user);
  return handle(new Request(`http://contacts${path}`, { ...init, headers }));
}

beforeEach(() => vi.clearAllMocks());

describe("contacts service HTTP", () => {
  it("refuses a wrong token and needs the person on own routes", async () => {
    const refused = await handle(
      new Request("http://contacts/v1/me/contacts", {
        headers: { authorization: "Bearer nope", "x-user-id": USER },
      }),
    );
    expect(refused.status).toBe(401);
    expect((await call("/v1/me/contacts")).status).toBe(401);
  });

  it("answers 404 when the person has no contacts yet", async () => {
    expect((await call("/v1/me/contacts", { user: USER })).status).toBe(404);
  });

  it("validates before saving and saves the parsed form", async () => {
    const bad = await call("/v1/me/contacts", {
      method: "PUT",
      user: USER,
      body: JSON.stringify({ email: "nope" }),
    });
    expect(bad.status).toBe(400);
    expect(service.saveContacts).not.toHaveBeenCalled();

    const ok = await call("/v1/me/contacts", {
      method: "PUT",
      user: USER,
      body: JSON.stringify({ email: "Anna@Example.com" }),
    });
    expect(ok.status).toBe(200);
    expect(service.saveContacts).toHaveBeenCalledWith(
      USER,
      expect.objectContaining({ email: "anna@example.com" }),
    );
    expect(ok.headers.get("cache-control")).toBe("no-store");
  });

  it("serves the email and deletes for other modules", async () => {
    expect(await (await call(`/v1/contacts/${USER}/email`)).json()).toEqual({
      email: "anna@example.com",
    });
    const deleted = await call(`/v1/contacts/${USER}`, { method: "DELETE" });
    expect(await deleted.json()).toEqual({ deleted: true });
    expect((await call("/v1/contacts/not-a-uuid/email")).status).toBe(404);
  });
});
