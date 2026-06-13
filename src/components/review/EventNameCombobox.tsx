import { useId } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { listEventNames, getExampleEventName } from "@/lib/eventStorage";

type EventNameComboboxProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
};

export function EventNameCombobox({
  value,
  onChange,
  error,
  disabled = false,
}: EventNameComboboxProps) {
  const listId = useId();
  const eventNames = listEventNames();

  return (
    <div className="space-y-2">
      <label htmlFor={listId} className="text-sm font-medium text-foreground">
        Event name <span className="text-destructive">*</span>
      </label>
      <Input
        id={listId}
        type="text"
        list={`${listId}-events`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Type event name (e.g. ${getExampleEventName()})`}
        disabled={disabled}
        autoComplete="off"
        className={cn(
          "h-11 rounded-xl border-border/60 bg-background",
          error && "border-destructive/60",
        )}
      />
      {eventNames.length > 0 ? (
        <datalist id={`${listId}-events`}>
          {eventNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Saved to Zoho Features column as Event: name. Events page groups leads by this event.
      </p>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
