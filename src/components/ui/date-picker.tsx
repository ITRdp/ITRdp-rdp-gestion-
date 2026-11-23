"use client";

import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { es } from "react-day-picker/locale";
import { DayPicker } from "react-day-picker";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import "react-day-picker/style.css";

function toISODate(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function fromISODate(value?: string) {
  if (!value) return undefined;
  const d = parse(value, "yyyy-MM-dd", new Date());
  return isValid(d) ? d : undefined;
}

function formatDisplay(value?: string) {
  const d = fromISODate(value);
  if (!d) return "";
  return format(d, "d MMM yyyy", { locale: es });
}

/** DatePicker del sistema (calendario ES, valor ISO yyyy-MM-dd vía input hidden). */
export function DatePicker({
  id,
  name,
  defaultValue,
  value: valueProp,
  onChange,
  required,
  disabled,
  className,
}: {
  id?: string;
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [uncontrolled, setUncontrolled] = React.useState(
    () => defaultValue ?? "",
  );
  const value = valueProp !== undefined ? valueProp : uncontrolled;
  const selected = fromISODate(value);

  function setValue(next: string) {
    if (valueProp === undefined) setUncontrolled(next);
    onChange?.({ target: { value: next, name } });
  }

  return (
    <div className={cn("w-full min-w-0", className)}>
      {name ? (
        <input type="hidden" name={name} value={value} required={required} />
      ) : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            id={id}
            variant="secondary"
            disabled={disabled}
            aria-label={value ? `Fecha ${formatDisplay(value)}` : "Elegir fecha"}
            className={cn(
              "h-10 w-full justify-start gap-2 px-3 font-normal",
              !value && "text-[var(--muted)]",
            )}
          >
            <CalendarIcon className="h-4 w-4 shrink-0 opacity-60" />
            <span className="truncate">
              {value ? formatDisplay(value) : "Elegir fecha"}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="rdp-root p-2">
          <DayPicker
            mode="single"
            locale={es}
            selected={selected}
            defaultMonth={selected}
            onSelect={(day) => {
              if (!day) {
                setValue("");
                return;
              }
              setValue(toISODate(day));
              setOpen(false);
            }}
            className="text-sm"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

/** DateTime local tematizado (sigue usando datetime-local para precisión de hora). */
export function DateTimePicker({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Input
      type="datetime-local"
      lang="es-CO"
      className={cn("h-10 leading-normal tabular-nums", className)}
      {...props}
    />
  );
}
