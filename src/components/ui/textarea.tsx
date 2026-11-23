import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--ink)] shadow-none transition-colors placeholder:text-[color-mix(in_srgb,var(--muted)_70%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-400)] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
