import { sql } from "drizzle-orm";
import {
  check,
  customType,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const citext = customType<{ data: string }>({
  dataType() {
    return "extensions.citext";
  },
});

export const candidateContacts = pgTable(
  "candidate_contacts",
  {
    candidateId: uuid("candidate_id").primaryKey(),
    email: citext("email").notNull(),
    phone: text("phone"),
    telegram: text("telegram"),
    linkedinUrl: text("linkedin_url"),
    websiteUrl: text("website_url"),
    extra: jsonb("extra").$type<Record<string, string>>().notNull().default({}),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "candidate_contacts_phone_check",
      sql`${table.phone} is null or ${table.phone} ~ '^\\+[1-9][0-9]{6,14}$'`,
    ),
    check(
      "candidate_contacts_telegram_check",
      sql`${table.telegram} is null or ${table.telegram} ~ '^[A-Za-z][A-Za-z0-9_]{4,31}$'`,
    ),
    check(
      "candidate_contacts_linkedin_check",
      sql`${table.linkedinUrl} is null or (
        char_length(${table.linkedinUrl}) <= 300
        and ${table.linkedinUrl} ~ '^https?://'
      )`,
    ),
    check(
      "candidate_contacts_website_check",
      sql`${table.websiteUrl} is null or (
        char_length(${table.websiteUrl}) <= 300
        and ${table.websiteUrl} ~ '^https?://'
      )`,
    ),
  ],
);
