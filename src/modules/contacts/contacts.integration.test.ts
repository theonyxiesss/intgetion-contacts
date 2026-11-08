import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getDb } from "@intgetion/kit";
import {
  contactsInput,
  deleteContacts,
  findContactEmail,
  getOwnContacts,
  saveContacts,
} from "./service";

const migrationUrl = process.env.DATABASE_MIGRATION_URL;
if (!migrationUrl) throw new Error("Integration tests need DATABASE_MIGRATION_URL.");

const candidate = randomUUID();
const stranger = randomUUID();
const admin = new pg.Client({ connectionString: migrationUrl });

beforeAll(async () => {
  await admin.connect();
  await getDb().execute(sql`
    insert into public.users (id, auth_uid) values (${candidate}, ${randomUUID()}), (${stranger}, ${randomUUID()})
  `);
  await getDb().execute(sql`insert into public.candidate_profiles (user_id) values (${candidate})`);
});

afterAll(async () => {
  await getDb().execute(sql`delete from public.users where id in (${candidate}, ${stranger})`);
  await admin.end();
});

describe("candidate contacts in Postgres", () => {
  it("saves, updates and reads one row per candidate", async () => {
    await saveContacts(candidate, contactsInput.parse({ email: "Anna@Example.com" }));
    const updated = await saveContacts(
      candidate,
      contactsInput.parse({ email: "anna@example.com", telegram: "anna_dev" }),
    );
    expect(updated).toMatchObject({ email: "anna@example.com", telegram: "anna_dev" });
    expect(await getOwnContacts(candidate)).toEqual(updated);
    expect(await findContactEmail(candidate)).toBe("anna@example.com");
  });

  it("refuses contacts for someone without a candidate profile", async () => {
    await expect(
      saveContacts(stranger, contactsInput.parse({ email: "x@example.com" })),
    ).rejects.toThrow();
    expect(await getOwnContacts(stranger)).toBeNull();
  });

  it("enforces the phone format in the database too", async () => {
    await expect(
      getDb().execute(
        sql`update public.candidate_contacts set phone = '12345' where candidate_id = ${candidate}`,
      ),
    ).rejects.toThrow();
  });

  it("hides contacts from anon", async () => {
    await admin.query("BEGIN");
    try {
      await admin.query("SET LOCAL ROLE anon");
      const visible = await admin.query("SELECT email FROM public.candidate_contacts");
      expect(visible.rowCount).toBe(0);
    } finally {
      await admin.query("ROLLBACK");
    }
  });

  it("deletes the row with the account data", async () => {
    expect(await deleteContacts(candidate)).toBe(true);
    expect(await getOwnContacts(candidate)).toBeNull();
    expect(await deleteContacts(candidate)).toBe(false);
  });
});
