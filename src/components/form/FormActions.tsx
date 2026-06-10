import { Button } from "@/components/common/Button";

export const FormActions = ({
  onReset,
  onSave,
  saving,
  saveDisabled,
  saveHint,
}: {
  onReset: () => void;
  onSave: () => void;
  saving: boolean;
  saveDisabled?: boolean;
  saveHint?: string;
}) => (
  <div className="sticky bottom-0 z-20 mt-6 space-y-2 bg-background/90 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:static sm:bg-transparent sm:p-0">
    {saveHint ? (
      <p className="text-center text-xs text-amber-700 dark:text-amber-300 sm:text-left">{saveHint}</p>
    ) : null}
    <div className="flex gap-3">
      <Button variantType="secondary" className="flex-1 sm:flex-none" onClick={onReset}>
        Discard
      </Button>
      <Button
        variantType="primary"
        className="flex-1 sm:flex-none"
        onClick={onSave}
        disabled={saving || saveDisabled}
      >
        {saving ? "Saving..." : "Save Lead"}
      </Button>
    </div>
  </div>
);
