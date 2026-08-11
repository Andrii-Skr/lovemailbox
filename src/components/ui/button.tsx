import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wine)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[var(--wine)] text-white shadow-[0_12px_30px_rgba(112,43,54,.24)] hover:-translate-y-0.5 hover:bg-[#853544]",
        outline: "border border-[rgba(92,54,44,.2)] bg-white/55 text-[var(--ink)] hover:bg-white/85",
        ghost: "text-[var(--muted)] hover:bg-black/5 hover:text-[var(--ink)]",
        danger: "text-[#9d3344] hover:bg-[#9d3344]/8",
      },
      size: { default: "h-11", sm: "h-10 px-4 text-xs", icon: "size-11 p-0" },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild, ...props }: Props) {
  const Component = asChild ? Slot : "button";
  return <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
