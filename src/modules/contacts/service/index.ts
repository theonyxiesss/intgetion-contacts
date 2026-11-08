/**
 * Public service surface.
 * Other modules may import only this file, never this module's repo.
 * Reads and writes of candidate_contacts go through this service (D16).
 */
export type { ContactsDto } from "../api/dto";
export { CONTACTS_DTO_KEYS } from "../api/dto";
export { contactsInput } from "../schemas";
export type { ContactsInput } from "../schemas";
export {
  deleteContacts,
  findContactEmail,
  getOwnContacts,
  saveContacts,
} from "./contacts-service";
