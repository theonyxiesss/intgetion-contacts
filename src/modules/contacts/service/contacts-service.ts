import type { ContactsDto } from "../api/dto";
import * as contacts from "../repo/contacts";
import type { ContactsInput } from "../schemas";

type Conn = Parameters<typeof contacts.upsertContacts>[2];

export async function findContactEmail(
  candidateId: string,
): Promise<string | null> {
  return contacts.findContactEmail(candidateId);
}

export async function getOwnContacts(
  candidateId: string,
): Promise<ContactsDto | null> {
  return contacts.findContacts(candidateId);
}

export async function saveContacts(
  candidateId: string,
  input: ContactsInput,
  conn?: Conn,
): Promise<ContactsDto> {
  return contacts.upsertContacts(candidateId, input, conn);
}

export async function deleteContacts(candidateId: string): Promise<boolean> {
  return contacts.deleteContacts(candidateId);
}
