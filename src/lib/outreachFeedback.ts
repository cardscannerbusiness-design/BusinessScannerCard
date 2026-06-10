import { toast } from "sonner";
import type { ZohoSyncResult } from "@/lib/contactApi";
import type { UserSettings } from "@/lib/settingsStorage";

const WHATSAPP_VISIBILITY_HINT_KEY = "cs-whatsapp-visibility-hint-shown";

/** Show thank-you email/WhatsApp result after Zoho sync (from API response body). */
export function notifyOutreachAfterSync(
  settings: UserSettings,
  result?: ZohoSyncResult | null,
): void {
  if (!result) return;

  if (settings.emailNotificationsEnabled) {
    const sent = result.emailSent || Boolean(result.emailTo && !result.emailError);
    if (sent) {
      const to = result.emailTo || result.emailExtracted || "contact";
      const extracted = result.emailExtracted;
      const deliveredToExtracted =
        extracted &&
        to &&
        String(to).trim().toLowerCase() === String(extracted).trim().toLowerCase();
      if (deliveredToExtracted) {
        toast.success(`Thank-you email sent to ${to}.`);
      } else if (extracted) {
        toast.success(
          `Thank-you email sent (dev test inbox: ${to}). Card email: ${extracted}.`,
        );
      } else {
        toast.success(`Thank-you email sent to ${to}.`);
      }
    } else if (result.emailSkipped) {
      toast.info("Email skipped — enable Email follow-ups in Settings.");
    } else if (result.emailError) {
      toast.error(`Email not sent: ${result.emailError}`);
    } else if (!result.emailExtracted) {
      toast.error(
        "Email not sent: add an email on the Review page (check the Email field is filled and included in the picker).",
      );
    }
  }

  if (settings.whatsappNotificationsEnabled) {
    if (result.whatsappSent) {
      const to = result.whatsappTo ? ` to ${result.whatsappTo}` : "";
      const delivery = (result.whatsappDeliveryStatus || "").toLowerCase();

      if (delivery === "failed") {
        toast.error(`WhatsApp delivery failed${to}. Check Meta Message logs.`);
        return;
      }

      if (delivery === "delivered" || delivery === "read") {
        toast.success(`Thank-you WhatsApp delivered${to}.`, {
          description:
            "Recipient may find it under WhatsApp Updates. Search BusinessCardScanner or +91 74483 64850.",
          duration: 8000,
        });
        return;
      }

      toast.success(`Thank-you WhatsApp queued${to}.`, {
        description:
          "Meta accepted the send. Recipient should check WhatsApp Updates (not only Chats) and search BusinessCardScanner or +91 74483 64850.",
        duration: 10000,
      });

      if (typeof window !== "undefined" && !sessionStorage.getItem(WHATSAPP_VISIBILITY_HINT_KEY)) {
        sessionStorage.setItem(WHATSAPP_VISIBILITY_HINT_KEY, "1");
        toast.info("WhatsApp tip", {
          description:
            "First business messages often appear in the Updates tab until the contact replies to your business number.",
          duration: 12000,
        });
      }
    } else if (result.whatsappError) {
      toast.error(`WhatsApp not sent: ${result.whatsappError}`);
    } else {
      toast.warning(
        "WhatsApp status unknown — the server did not return send confirmation. Check backend logs.",
      );
    }
  } else {
    toast.info("WhatsApp off — turn on Auto thank-you on WhatsApp in Settings.");
  }
}
