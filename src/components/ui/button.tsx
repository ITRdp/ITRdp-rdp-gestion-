import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-400)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--wine-900)] text-[var(--surface)] hover:bg-[var(--wine-700)]",
        secondary:
          "border border-[color-mix(in_srgb,var(--wine-900)_28%,transparent)] bg-transparent text-[var(--wine-900)] hover:bg-[color-mix(in_srgb,var(--wine-900)_6%,transparent)]",
        gold: "bg-[var(--gold-400)] text-[var(--wine-900)] hover:bg-[var(--gold-500)] hover:text-[var(--surface)]",
        ghost:
          "text-[var(--muted)] hover:bg-[color-mix(in_srgb,var(--wine-900)_6%,transparent)] hover:text-[var(--wine-900)]",
        destructive:
          "bg-[var(--danger)] text-[var(--surface)] hover:opacity-90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
