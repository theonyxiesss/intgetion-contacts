export type ContactsDto = {
  email: string;
  phone: string | null;
  telegram: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  extra: Record<string, string>;
};

export const CONTACTS_DTO_KEYS = [
  "email",
  "phone",
  "telegram",
  "linkedinUrl",
  "websiteUrl",
  "extra",
] as const satisfies readonly (keyof ContactsDto)[];
