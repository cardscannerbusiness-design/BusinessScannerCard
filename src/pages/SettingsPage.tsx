import { useEffect, useMemo, useState } from "react";
import { Mail, MessageCircle, Moon, Bell, User, Loader2, Trash2 } from "lucide-react";
import { clearLocalQueueOnly, wipeAllAppData } from "@/lib/wipeAllData";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageShell } from "@/components/layout/PageShell";
import { PAGE } from "@/constants/navigation";
import { toast } from "sonner";
import { useConfirmModal } from "@/components/ui/confirm-modal";
import {
  DEFAULT_USER_SETTINGS,
  getUserInitials,
  loadUserSettings,
  saveUserSettings,
  type UserSettings,
} from "@/lib/settingsStorage";
export function SettingsPage() {
  const { confirm } = useConfirmModal();
  const [profile, setProfile] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [dark, setDark] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isWiping, setIsWiping] = useState(false);
  const [isClearingQueue, setIsClearingQueue] = useState(false);

  const initials = useMemo(() => getUserInitials(profile.fullName), [profile.fullName]);

  useEffect(() => {
    setProfile(loadUserSettings());

    const stored = localStorage.getItem("cs-dark") === "1";
    setDark(stored);
    document.documentElement.classList.toggle("dark", stored);

  }, []);

  const updateProfileField = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const toggleDark = (v: boolean) => {
    setDark(v);
    document.documentElement.classList.toggle("dark", v);
    localStorage.setItem("cs-dark", v ? "1" : "0");
  };

  const handleSaveProfile = () => {
    setIsSaving(true);
    try {
      saveUserSettings(profile);
      toast.success("Profile saved to this device.");
    } catch {
      toast.error("Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearQueue = async () => {
    const ok = await confirm({
      title: "Clear offline queue?",
      description:
        "Clear the offline sync queue on this device? Contacts already saved elsewhere are not removed.",
      confirmLabel: "Clear queue",
      destructive: true,
    });
    if (!ok) return;
    setIsClearingQueue(true);
    try {
      await clearLocalQueueOnly();
      toast.success("Offline queue cleared on this device.");
    } catch {
      toast.error("Failed to clear queue.");
    } finally {
      setIsClearingQueue(false);
    }
  };

  const handleWipeAll = async () => {
    const ok = await confirm({
      title: "Delete all data?",
      description:
        "Delete ALL contacts and queue data on this device?\n\nThis cannot be undone.",
      confirmLabel: "Delete all",
      destructive: true,
    });
    if (!ok) return;
    setIsWiping(true);
    try {
      await wipeAllAppData();
      toast.success("All contacts and queue data cleared on this device.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Wipe failed.");
    } finally {
      setIsWiping(false);
    }
  };

  const toggleNotifications = (enabled: boolean) => {
    updateProfileField("notificationsEnabled", enabled);
    saveUserSettings({ notificationsEnabled: enabled });
    toast.success(enabled ? "Notifications enabled." : "Notifications disabled.");
  };

  const toggleEmailNotifications = (enabled: boolean) => {
    updateProfileField("emailNotificationsEnabled", enabled);
    saveUserSettings({ emailNotificationsEnabled: enabled });
    toast.success(enabled ? "Email notifications enabled." : "Email notifications disabled.");
  };

  const toggleWhatsappNotifications = (enabled: boolean) => {
    updateProfileField("whatsappNotificationsEnabled", enabled);
    saveUserSettings({ whatsappNotificationsEnabled: enabled });
    toast.success(enabled ? "WhatsApp notifications enabled." : "WhatsApp notifications disabled.");
  };

  return (
    <PageShell title={PAGE.preferences.title} description={PAGE.preferences.description}>
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Profile */}
        <Card className="rounded-2xl border-border/60 p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <User className="h-4 w-4 text-primary" /> Profile
          </div>
          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary text-lg font-semibold text-primary-foreground shadow-glow">
              {initials}
            </div>
            <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs text-muted-foreground">Full name</Label>
                <Input
                  value={profile.fullName}
                  onChange={(e) => updateProfileField("fullName", e.target.value)}
                  className="mt-1.5 h-10 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <Input
                  value={profile.email}
                  onChange={(e) => updateProfileField("email", e.target.value)}
                  className="mt-1.5 h-10 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Role</Label>
                <Input
                  value={profile.role}
                  onChange={(e) => updateProfileField("role", e.target.value)}
                  className="mt-1.5 h-10 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Timezone</Label>
                <Input
                  value={profile.timezone}
                  onChange={(e) => updateProfileField("timezone", e.target.value)}
                  className="mt-1.5 h-10 rounded-xl"
                />
              </div>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <Button onClick={handleSaveProfile} disabled={isSaving} className="rounded-xl bg-gradient-primary shadow-glow">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </Card>

        {/* Appearance */}
        <Card className="rounded-2xl border-border/60 p-6 shadow-soft h-full flex flex-col">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Moon className="h-4 w-4 text-primary" /> Appearance
          </div>
          <div className="mt-5 flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-4">
            <div>
              <div className="text-sm font-medium">Dark mode</div>
              <div className="text-[11px] text-muted-foreground">Use a darker palette across the app</div>
            </div>
            <Switch checked={dark} onCheckedChange={toggleDark} />
          </div>
        </Card>

        {/* Notifications */}
        <Card className="rounded-2xl border-border/60 p-6 shadow-soft h-full flex flex-col">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Bell className="h-4 w-4 text-primary" /> Notifications
          </div>
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-4">
              <div>
                <div className="text-sm font-medium">Sync alerts</div>
                <div className="text-[11px] text-muted-foreground">Show toasts when contacts sync or fail</div>
              </div>
              <Switch
                checked={profile.notificationsEnabled}
                onCheckedChange={toggleNotifications}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">Email notifications</div>
                  <div className="text-[11px] text-muted-foreground">Follow-up emails after saving a contact</div>
                </div>
              </div>
              <Switch
                checked={profile.emailNotificationsEnabled}
                onCheckedChange={toggleEmailNotifications}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/10 text-success">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">WhatsApp notifications</div>
                  <div className="text-[11px] text-muted-foreground">Thank-you messages via WhatsApp Business</div>
                </div>
              </div>
              <Switch
                checked={profile.whatsappNotificationsEnabled}
                onCheckedChange={toggleWhatsappNotifications}
              />
            </div>
          </div>
        </Card>

        {/* Danger zone */}
        <Card className="rounded-2xl border-destructive/20 bg-destructive/5 p-6 shadow-soft lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-destructive">Danger zone</div>
              <div className="text-xs text-muted-foreground">Irreversible actions affecting the entire workspace.</div>
            </div>
            <div className="flex flex-col w-full sm:w-auto sm:flex-row gap-2 mt-4 sm:mt-0">
              <Button
                variant="outline"
                className="w-full sm:w-auto rounded-xl"
                onClick={handleClearQueue}
                disabled={isClearingQueue || isWiping}
              >
                {isClearingQueue ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : null}
                Clear local queue
              </Button>
              <Button
                variant="destructive"
                className="w-full sm:w-auto rounded-xl"
                onClick={handleWipeAll}
                disabled={isWiping || isClearingQueue}
              >
                {isWiping ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Trash2 className="mr-1.5 h-3 w-3" />}
                Delete all data
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
