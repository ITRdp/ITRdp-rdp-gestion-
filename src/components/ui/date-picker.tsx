"use client";

import type { InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** DatePicker tematizado (input date con locale es-CO vía lang del documento). */
export function DatePicker({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Input
      type="date"
      lang="es-CO"
      className={cn("tabular-nums", className)}
      {...props}
    />
  );
}

export function DateTimePicker({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Input
      type="datetime-local"
      lang="es-CO"
      className={cn("tabular-nums", className)}
      {...props}
    />
  );
}
