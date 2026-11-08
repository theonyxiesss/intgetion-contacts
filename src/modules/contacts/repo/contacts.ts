import { eq } from "drizzle-orm";
import { getDb } from "@intgetion/kit";
import { candidateContacts } from "../../../db/contacts-schema";
import type { ContactsDto } from "../api/dto";
import type { ContactsInput } from "../schemas";

type Database = ReturnType<typeof getDb>;
type AppTx = Parameters<Parameters<Database["transaction"]>[0]>[0];
type Conn = Database | AppTx;

function toDto(row: typeof candidateContacts.$inferSelect): ContactsDto {
  return {
    email: row.email,
    phone: row.phone,
    telegram: row.telegram,
    linkedinUrl: row.linkedinUrl,
    websiteUrl: row.websiteUrl,
    extra: row.extra ?? {},
  };
}

export async function findContactEmail(
  candidateId: string,
  conn: Conn = getDb(),
): Promise<string | null> {
  const [row] = await conn
    .select({ email: candidateContacts.email })
    .from(candidateContacts)
    .where(eq(candidateContacts.candidateId, candidateId))
    .limit(1);
  return row?.email ?? null;
}

export async function findContacts(
  candidateId: string,
  conn: Conn = getDb(),
): Promise<ContactsDto | null> {
  const [row] = await conn
    .select()
    .from(candidateContacts)
    .where(eq(candidateContacts.candidateId, candidateId))
    .limit(1);
  return row ? toDto(row) : null;
}

export async function upsertContacts(
  candidateId: string,
  input: ContactsInput,
  conn: Conn = getDb(),
): Promise<ContactsDto> {
  const values = {
    candidateId,
    email: input.email,
    phone: input.phone,
    telegram: input.telegram,
    linkedinUrl: input.linkedinUrl,
    websiteUrl: input.websiteUrl,
    extra: input.extra,
  };
  const [row] = await conn
    .insert(candidateContacts)
    .values(values)
    .onConflictDoUpdate({
      target: candidateContacts.candidateId,
      set: {
        email: input.email,
        phone: input.phone,
        telegram: input.telegram,
        linkedinUrl: input.linkedinUrl,
        websiteUrl: input.websiteUrl,
        extra: input.extra,
      },
    })
    .returning();
  if (!row) throw new Error("candidate_contacts row missing after upsert");
  return toDto(row);
}

/** Removes the row; returns whether there was one (account deletion, 17-gdpr). */
export async function deleteContacts(
  candidateId: string,
  conn: Conn = getDb(),
): Promise<boolean> {
  const rows = await conn
    .delete(candidateContacts)
    .where(eq(candidateContacts.candidateId, candidateId))
    .returning({ id: candidateContacts.candidateId });
  return rows.length > 0;
}
