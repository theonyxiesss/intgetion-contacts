import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((value) => (value ? value : null));

export const contactsInput = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "invalid_email" }).max(254)),
  phone: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{6,14}$/, { error: "invalid_phone" })
    .nullable()
    .optional()
    .transform((value) => value ?? null),
  telegram: z
    .string()
    .trim()
    .regex(/^[A-Za-z][A-Za-z0-9_]{4,31}$/, { error: "invalid_telegram" })
    .nullable()
    .optional()
    .transform((value) => value ?? null),
  linkedinUrl: optionalText(300).refine(
    (value) => value === null || /^https?:\/\//.test(value),
    { error: "invalid_url" },
  ),
  websiteUrl: optionalText(300).refine(
    (value) => value === null || /^https?:\/\//.test(value),
    { error: "invalid_url" },
  ),
  extra: z
    .record(z.string().trim().min(1).max(40), z.string().trim().max(200))
    .optional()
    .transform((value) => {
      const entries = Object.entries(value ?? {}).slice(0, 10);
      return Object.fromEntries(entries);
    }),
});

export type ContactsInput = z.infer<typeof contactsInput>;
