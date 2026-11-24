"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;

const SELECT_TRIGGER_CLASS =
  "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm leading-normal text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--wine-700)]/20 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 [&>span]:min-w-0 [&>span]:flex-1 [&>span]:text-left";

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(SELECT_TRIGGER_CLASS, className)}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "z-50 max-h-72 min-w-[8rem] overflow-hidden rounded-md border border-[var(--line)] bg-white text-[var(--ink)] shadow-md",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
        className,
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm leading-normal outline-none focus:bg-[var(--wine-50)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-[var(--wine-700)]" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

export type FormSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

const EMPTY = "__empty__";

/** Select shadcn (Radix) con `name` oculto para FormData. */
export function FormSelect({
  id,
  name,
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Selecciona…",
  required,
  disabled,
  className,
  triggerClassName,
}: {
  id?: string;
  name?: string;
  options: FormSelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
}) {
  const [uncontrolled, setUncontrolled] = React.useState(
    () => defaultValue ?? "",
  );
  const current = value !== undefined ? value : uncontrolled;
  const radixValue = current === "" ? EMPTY : current;

  const items = React.useMemo(() => {
    const hasEmpty = options.some((o) => o.value === "");
    const mapped = options.map((o) =>
      o.value === "" ? { ...o, value: EMPTY } : o,
    );
    if (!hasEmpty && (placeholder || !required)) {
      return [{ value: EMPTY, label: placeholder, disabled: required }, ...mapped];
    }
    return mapped;
  }, [options, placeholder, required]);

  function handleChange(next: string) {
    const real = next === EMPTY ? "" : next;
    if (value === undefined) setUncontrolled(real);
    onValueChange?.(real);
  }

  return (
    <div className={cn("w-full min-w-0", className)}>
      {name ? (
        <input type="hidden" name={name} value={current} required={required} />
      ) : null}
      <Select
        value={radixValue}
        onValueChange={handleChange}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger id={id} className={triggerClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {items.map((o) => (
            <SelectItem
              key={o.value}
              value={o.value}
              disabled={o.disabled}
            >
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** @deprecated Prefer FormSelect; se mantiene para wrappers puntuales. */
export function NativeSelect({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-10 w-full appearance-none rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm leading-normal text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--wine-700)]/20 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
};
