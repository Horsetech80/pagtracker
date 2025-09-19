import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// COMPONENTE ISOLADO PARA PAINEL ADMINISTRATIVO
// Este componente é uma cópia isolada do badge.tsx do painel cliente
// Mantém a mesma funcionalidade mas evita conflitos entre painéis

const adminBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-success text-success-foreground hover:bg-success/80",
        warning:
          "border-transparent bg-warning text-warning-foreground hover:bg-warning/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface AdminBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof adminBadgeVariants> {}

function AdminBadge({ className, variant, ...props }: AdminBadgeProps) {
  return (
    <div className={cn(adminBadgeVariants({ variant }), className)} {...props} />
  );
}

export { AdminBadge, adminBadgeVariants };