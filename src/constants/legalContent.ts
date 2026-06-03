export type LegalSection = { heading: string; body: string };

export const PRIVACY_POLICY_SECTIONS: LegalSection[] = [
  {
    heading: "Overview",
    body:
      "CardSync AI processes business card images and contact details on your device. This policy explains what we store locally, how long it is kept, and the choices you control in Preferences.",
  },
  {
    heading: "Data we store on your device",
    body:
      "Contacts, scan queue entries, profile preferences, and OCR results are saved in your browser (IndexedDB and local storage). We do not transmit this data to our servers in this frontend-only build unless you connect an external service in a future release.",
  },
  {
    heading: "How we use your information",
    body:
      "Information is used solely to capture leads, display your directory, manage the sync queue, and show in-app notifications you have enabled. We do not sell personal data.",
  },
  {
    heading: "Your rights",
    body:
      "You may export or delete data at any time via Preferences → Danger zone. You can disable notifications, limit cookies, and turn off optional analytics storage in Preferences.",
  },
  {
    heading: "Contact",
    body:
      "For privacy questions, email privacy@cardsync.ai. We will respond within a reasonable timeframe.",
  },
];

export const TERMS_AND_CONDITIONS_SECTIONS: LegalSection[] = [
  {
    heading: "Agreement",
    body:
      "By using CardSync AI you agree to these Terms and Conditions. If you do not agree, do not use the application. We may update these terms; continued use after changes constitutes acceptance.",
  },
  {
    heading: "Service description",
    body:
      "CardSync AI helps you capture business card images, extract contact details with on-device OCR, and manage leads in a local directory and sync queue. This build runs in your browser without a connected backend unless stated otherwise.",
  },
  {
    heading: "Your responsibilities",
    body:
      "You are responsible for the accuracy of data you enter, obtaining consent before storing others’ personal information, and complying with applicable privacy and marketing laws. Do not use the app for unlawful purposes.",
  },
  {
    heading: "Intellectual property",
    body:
      "CardSync AI, its branding, and software remain our property or our licensors’. You receive a limited, non-exclusive licence to use the app for your internal business purposes.",
  },
  {
    heading: "Disclaimer",
    body:
      "The app is provided “as is”. OCR results may contain errors; always review extracted fields before saving. We do not guarantee uninterrupted or error-free operation.",
  },
  {
    heading: "Limitation of liability",
    body:
      "To the fullest extent permitted by law, we are not liable for indirect, incidental, or consequential damages arising from use of the app. Our total liability is limited to the amount you paid for the service in the twelve months before the claim, or zero for free use.",
  },
  {
    heading: "Termination",
    body:
      "You may stop using the app at any time and delete local data via Preferences. We may suspend access if you breach these terms.",
  },
  {
    heading: "Contact",
    body:
      "Questions about these terms: legal@cardsync.ai.",
  },
];

export const COOKIE_POLICY_SECTIONS: LegalSection[] = [
  {
    heading: "What are cookies?",
    body:
      "Cookies and similar technologies are small files stored in your browser. CardSync uses them to remember layout preferences and optional analytics choices.",
  },
  {
    heading: "Essential cookies",
    body:
      "Required for the app to function. Includes sidebar open/collapsed state (sidebar_state) so navigation stays consistent between visits. These cannot be disabled while using the app.",
  },
  {
    heading: "Preference storage",
    body:
      "We store your profile, notification toggles, and consent choices in local storage (cs-user-settings, cs-cookie-consent). This is not shared with third parties in this build.",
  },
  {
    heading: "Optional analytics",
    body:
      "If enabled in Preferences, anonymous usage events may be stored locally to improve the product. No advertising cookies are used.",
  },
  {
    heading: "Managing cookies",
    body:
      "Use the cookie icon at the bottom-right or open Preferences → Legal & cookies to update choices. Clearing browser data removes all stored cookies and local app data.",
  },
];
