import { deleteZohoLead } from "@/lib/contactApi";
import type { DirectoryContact } from "@/lib/contactsDirectory";
import { invalidateContactsDirectory } from "@/lib/contactsDirectory";
import {
  deleteStoredContact,
  getStoredContactById,
  removeQueueItem,
} from "@/lib/indexeddb";

function notifyContactsListChanged(): void {
  invalidateContactsDirectory();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cs-contacts-updated"));
    window.dispatchEvent(new CustomEvent("cs-queue-updated"));
  }
}

/** Delete by Contacts table row (Zoho CRM, offline queue, or device cache). */
export async function deleteDirectoryContact(contact: DirectoryContact): Promise<void> {
  if (contact.source === "queue") {
    await removeQueueItem(contact.id);
    notifyContactsListChanged();
    return;
  }

  if (contact.source === "zoho") {
    await deleteZohoLead(contact.id);
    notifyContactsListChanged();
    return;
  }

  if (contact.source === "indexeddb" || contact.source === "localdb") {
    const stored = await getStoredContactById(contact.id);
    const zohoLeadId = String(contact.zohoLeadId || stored?.zohoLeadId || "").trim();
    await deleteStoredContact(contact.id);
    if (zohoLeadId) {
      try {
        await deleteZohoLead(zohoLeadId);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Zoho delete failed";
        throw new Error(
          `Removed on this device, but Zoho delete failed: ${message}`,
        );
      }
    }
    notifyContactsListChanged();
    return;
  }

  throw new Error("Unknown contact source — cannot delete.");
}
