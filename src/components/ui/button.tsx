import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--cf-radius-button)] text-sm font-medium transition-[background-color,color,border-color,transform] duration-[var(--cf-dur-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cf-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-cf-canvas disabled:pointer-events-none disabled:opacity-50 active:translate-y-px [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-cf-primary text-cf-on-accent font-semibold hover:bg-cf-primary-hover",
        secondary: "bg-cf-surface-2 text-cf-text border border-cf-border hover:border-cf-border-strong hover:bg-white/70",
        outline: "border border-cf-border bg-transparent text-cf-text hover:border-cf-border-strong hover:bg-cf-surface-2/70",
        ghost: "text-cf-text-dim hover:text-cf-text hover:bg-cf-surface-2/75",
        destructive: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100",
        link: "text-cf-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-[var(--cf-radius-button)] px-3 text-xs",
        lg: "h-11 rounded-[var(--cf-radius-button)] px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
