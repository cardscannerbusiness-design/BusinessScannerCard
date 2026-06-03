import { setConnectionMode } from "@/lib/connectionMode";

export type UserSettings = {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  timezone: string;
  notificationsEnabled: boolean;
  queueNotificationsEnabled: boolean;
  captureNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  whatsappNotificationsEnabled: boolean;
  autoSyncQueueWhenOnline: boolean;
  showCaptureTips: boolean;
  confirmBeforeDelete: boolean;
  preferOfflineCapture: boolean;
  cookiesAccepted: boolean;
  analyticsCookiesEnabled: boolean;
  /** @deprecated legacy fields — merged on load */
  whatsappPhone?: string;
  integrationEmail?: string;
};

const STORAGE_KEY = "cs-user-settings";

export const TIMEZONE_OPTIONS = [
  "Pacific Time (US)",
  "Mountain Time (US)", 
  "Central Time (US)",
  "Eastern Time (US)",
  "GMT / UTC",
  "Central European Time",
  "India Standard Time",
  "Singapore Time",
  "Japan Standard Time",
] as const;

export const DEFAULT_USER_SETTINGS: UserSettings = {
  fullName: "Alex Kim",
  email: "alex@cardsync.ai",
  phone: "+1 415 555 0142",
  company: "CardSync AI",
  role: "Workspace owner",
  timezone: "Pacific Time (US)",
  notificationsEnabled: true,
  queueNotificationsEnabled: true,
  captureNotificationsEnabled: true,
  emailNotificationsEnabled: false,
  whatsappNotificationsEnabled: false,
  cookiesAccepted: false,
  analyticsCookiesEnabled: false,
  autoSyncQueueWhenOnline: true,
  showCaptureTips: true,
  confirmBeforeDelete: true,
  preferOfflineCapture: false,
};

export function loadUserSettings(): UserSettings {
  if (typeof window === "undefined") {
    return { ...DEFAULT_USER_SETTINGS };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_USER_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return { ...DEFAULT_USER_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_USER_SETTINGS };
  }
}

export function saveUserSettings(settings: Partial<UserSettings>): UserSettings {
  const next = { ...loadUserSettings(), ...settings };
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("cs-settings-updated", { detail: next }));
  }
  return next;
}

export function applyWorkModePreference(preferOffline: boolean): void {
  if (typeof window === "undefined" || !navigator.onLine) return;
  setConnectionMode(preferOffline ? "offline" : "online");
}

export function getUserInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export function getUserFirstName(fullName: string): string {
  const first = fullName.trim().split(/\s+/).filter(Boolean)[0];
  return first || DEFAULT_USER_SETTINGS.fullName.split(/\s+/)[0] || "User";
}
