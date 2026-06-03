import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Inbox,
  ArrowRight,
  Loader2,
  Trash2,
  HardDrive,
  Save,
  CalendarDays,
  TrendingUp,
} from "lucide-react";
import { buildQueuePipelineSnapshot } from "@/lib/queueAnalytics";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/PageShell";
import { PAGE } from "@/constants/navigation";
import { useConfirmModal } from "@/components/ui/confirm-modal";
import { QueueAnalyticsSection } from "@/components/queue/QueueAnalyticsSection";
import {
  getQueueItems,
  updateQueueItem,
  removeQueueItem,
  type QueueItem,
} from "@/lib/indexeddb";
import {
  listContacts,
  syncAllQueueItemsToZoho,
  syncQueueItemToZoho,
  type StoredContact,
} from "@/lib/contactStorage";
import { toast } from "sonner";

function queueItemName(item: QueueItem): string {
  const d = item.contact_data;
  return String(d?.fullName || d?.name || "Unnamed Contact");
}

function isSavedOnDevice(contact: StoredContact): boolean {
  return contact.syncStatus === "synced" || contact.syncStatus === "synced_zoho";
}

export function QueuePage() {
  const { confirm } = useConfirmModal();
  const [contacts, setContacts] = useState<StoredContact[]>([]);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [syncingQueueId, setSyncingQueueId] = useState<string | null>(null);

  const loadData = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    try {
      if (!silent) setIsLoading(true);
      setContacts(await listContacts());
      setQueueItems(await getQueueItems());
    } catch (e) {
      console.error("Failed to load queue data:", e);
      if (!silent) toast.error("Failed to refresh queue.");
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();

    const refresh = () => void loadData({ silent: true });

    window.addEventListener("cs-queue-updated", refresh);
    window.addEventListener("cs-contacts-updated", refresh);
    window.addEventListener("focus", refresh);

    const intervalId = window.setInterval(refresh, 15000);

    return () => {
      window.removeEventListener("cs-queue-updated", refresh);
      window.removeEventListener("cs-contacts-updated", refresh);
      window.removeEventListener("focus", refresh);
      window.clearInterval(intervalId);
    };
  }, [loadData]);

  const notifyUpdated = () => {
    window.dispatchEvent(new CustomEvent("cs-contacts-updated"));
    window.dispatchEvent(new CustomEvent("cs-queue-updated"));
  };

  const syncOneQueueItem = async (item: QueueItem): Promise<boolean> => {
    await updateQueueItem({
      ...item,
      status: "retrying",
      last_attempt: new Date().toISOString(),
    });

    try {
      await syncQueueItemToZoho(item);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Save failed";
      const nextRetryCount = item.retry_count + 1;
      await updateQueueItem({
        ...item,
        status: nextRetryCount >= 5 ? "failed" : "pending",
        retry_count: nextRetryCount,
        last_attempt: new Date().toISOString(),
        error_message: message,
      });
      throw err;
    }
  };

  const saveAllFromQueue = async () => {
    if (isSavingAll) return;

    const unsynced = queueItems.filter(
      (i) => i.status === "pending" || i.status === "retrying",
    );
    if (unsynced.length === 0) {
      toast.info("Queue is empty — nothing waiting to save.");
      return;
    }

    setIsSavingAll(true);
    toast.info(`Saving ${unsynced.length} contact(s) on this device...`);
    try {
      const { synced, total } = await syncAllQueueItemsToZoho();
      if (synced > 0) {
        toast.success(`Saved ${synced} of ${total} to this device.`);
      } else {
        toast.error("Could not save any contacts. Check the failed section.");
      }
    } finally {
      await loadData({ silent: true });
      notifyUpdated();
      setIsSavingAll(false);
    }
  };

  const handleSaveQueueItem = async (item: QueueItem) => {
    setSyncingQueueId(item.id);
    try {
      await syncOneQueueItem(item);
      toast.success(`Saved on device: ${queueItemName(item)}`);
      await loadData({ silent: true });
      notifyUpdated();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Save failed";
      toast.error(message);
      await loadData({ silent: true });
    } finally {
      setSyncingQueueId(null);
    }
  };

  const handleRemoveQueueItem = async (item: QueueItem) => {
    const ok = await confirm({
      title: "Remove from queue?",
      description: `Remove "${queueItemName(item)}" from the queue?`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
    try {
      await removeQueueItem(item.id);
      toast.success("Removed from queue.");
      await loadData({ silent: true });
      notifyUpdated();
    } catch {
      toast.error("Failed to remove queue item.");
    }
  };

  const stats = useMemo(() => {
    const waiting = queueItems.filter(
      (i) => i.status === "pending" || i.status === "retrying",
    ).length;
    const savedOnDevice = contacts.filter(isSavedOnDevice).length;
    const snapshot = buildQueuePipelineSnapshot(contacts, queueItems);

    return {
      waiting,
      savedOnDevice,
      savesToday: snapshot.savesToday,
      savesThisWeek: snapshot.savesThisWeek,
    };
  }, [queueItems, contacts]);

  const statWidgets = useMemo(
    () => [
      {
        label: "In queue",
        value: stats.waiting,
        icon: Inbox,
        tone: "text-warning",
      },
      {
        label: "Saved on device",
        value: stats.savedOnDevice,
        icon: HardDrive,
        tone: "text-primary",
      },
      {
        label: "Saves today",
        value: stats.savesToday,
        icon: CalendarDays,
        tone: "text-primary",
      },
      {
        label: "Saves this week",
        value: stats.savesThisWeek,
        icon: TrendingUp,
        tone: "text-success",
      },
    ],
    [stats],
  );

  const stages = [
    {
      label: "Waiting in queue",
      count: stats.waiting,
      icon: Inbox,
      tone: "warning" as const,
    },
    {
      label: "Saved on device",
      count: stats.savedOnDevice,
      icon: CheckCircle2,
      tone: "success" as const,
    },
  ];

  const pendingList = useMemo(
    () => queueItems.filter((i) => i.status === "pending" || i.status === "retrying"),
    [queueItems],
  );

  const failedList = useMemo(
    () => queueItems.filter((i) => i.status === "failed"),
    [queueItems],
  );

  const isBusy = isSavingAll;

  return (
    <div className="page-bottom-safe lg:pb-0">
      <PageShell title={PAGE.syncQueue.title} description={PAGE.syncQueue.description}>
        <Card className="sticky top-0 z-10 rounded-2xl border-border/60 bg-card/95 p-3 shadow-soft backdrop-blur-md sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground sm:text-sm">
              Move offline captures from the queue into your contact directory on this device.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => void saveAllFromQueue()}
                disabled={isBusy || isLoading || stats.waiting === 0}
                className="h-10 min-w-0 flex-1 rounded-xl bg-gradient-primary shadow-glow disabled:opacity-50 sm:flex-none"
              >
                {isSavingAll ? (
                  <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4 shrink-0" />
                )}
                Save all from queue
                {stats.waiting > 0 && (
                  <span className="ml-1.5 rounded-full bg-primary-foreground/20 px-1.5 text-[10px]">
                    {stats.waiting}
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => void loadData()}
                disabled={isLoading}
                className="h-10 min-w-0 flex-1 rounded-xl sm:flex-none"
              >
                <RefreshCw className={`mr-2 h-4 w-4 shrink-0 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </Card>

        {isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-5 sm:space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
              {statWidgets.map((s) => (
                <Card key={s.label} className="rounded-2xl border-border/60 p-4 shadow-soft sm:p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                    <s.icon className={`h-4 w-4 ${s.tone}`} />
                  </div>
                  <div className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                    {s.value}
                  </div>
                </Card>
              ))}
            </div>

            <Card className="overflow-hidden rounded-2xl border-border/60 p-4 shadow-soft sm:p-6">
              <div className="mb-3 flex flex-col gap-1 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-medium">Offline → online (this device)</div>
                  <div className="text-xs text-muted-foreground">
                    Captures held offline move into your saved contacts when you save them here.
                  </div>
                </div>
                <Activity className="hidden h-4 w-4 text-primary sm:block" />
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
                {stages.map((s, i) => (
                  <div key={s.label} className="flex flex-1 items-center gap-2">
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="relative flex flex-1 items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-soft sm:p-4"
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${
                          s.tone === "success"
                            ? "bg-success/10 text-success"
                            : "bg-warning/15 text-warning-foreground"
                        }`}
                      >
                        <s.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground sm:text-[11px]">
                          {s.label}
                        </div>
                        <div className="font-display text-lg font-semibold tracking-tight sm:text-xl">
                          {s.count}
                        </div>
                      </div>
                    </motion.div>
                    {i < stages.length - 1 && (
                      <ArrowRight className="hidden h-4 w-4 shrink-0 text-muted-foreground md:block" />
                    )}
                  </div>
                ))}
              </div>

              <QueueAnalyticsSection contacts={contacts} queueItems={queueItems} />
            </Card>

            <Card className="rounded-2xl border-border/60 p-4 shadow-soft sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Queue — pending</div>
                  <div className="text-xs text-muted-foreground">
                    Captured while offline or before save — tap Save to store on this device
                  </div>
                </div>
                <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning">
                  {pendingList.length}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {pendingList.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border/60 bg-card/40 p-3"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{queueItemName(item)}</div>
                        <div className="truncate text-[11px] text-muted-foreground">
                          {item.contact_data.company || "No company"} ·{" "}
                          {item.contact_data.email || item.contact_data.phone || "No contact info"}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                          <span
                            className={`rounded-full px-2 py-0.5 font-semibold ${
                              item.status === "retrying"
                                ? "bg-primary/10 text-primary"
                                : "bg-warning/10 text-warning"
                            }`}
                          >
                            {item.status}
                          </span>
                          <span>Retries: {item.retry_count}/5</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => void handleSaveQueueItem(item)}
                          disabled={syncingQueueId === item.id || isBusy}
                          className="h-9 flex-1 rounded-lg text-xs sm:flex-none"
                        >
                          {syncingQueueId === item.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <Save className="mr-1.5 h-3 w-3" />
                              Save
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void handleRemoveQueueItem(item)}
                          className="h-9 rounded-lg text-xs text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {pendingList.length === 0 && (
                  <p className="py-2 text-xs italic text-muted-foreground">
                    No pending items — queue is clear.
                  </p>
                )}
              </div>
            </Card>

            <Card className="rounded-2xl border-destructive/20 bg-destructive/5 p-4 shadow-soft sm:p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Failed saves
                <span className="ml-auto rounded-full bg-destructive/10 px-2 py-0.5 text-[11px]">
                  {failedList.length}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {failedList.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{queueItemName(item)}</div>
                      <div className="mt-0.5 text-[11px] text-destructive">
                        {item.error_message || "Unknown error"}
                      </div>
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        Retries: {item.retry_count}/5
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleSaveQueueItem(item)}
                        disabled={syncingQueueId === item.id || isBusy}
                        className="h-9 rounded-lg text-xs"
                      >
                        {syncingQueueId === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <RefreshCw className="mr-1.5 h-3 w-3" />
                            Retry
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void handleRemoveQueueItem(item)}
                        className="h-9 rounded-lg text-xs"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {failedList.length === 0 && (
                  <p className="py-2 text-xs italic text-muted-foreground">No failed items.</p>
                )}
              </div>
            </Card>
          </div>
        )}
      </PageShell>
    </div>
  );
}
