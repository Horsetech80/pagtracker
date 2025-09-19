import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// COMPONENTE ISOLADO PARA PAINEL ADMINISTRATIVO
// Este componente é uma cópia isolada do label.tsx do painel cliente
// Mantém a mesma funcionalidade mas evita conflitos entre painéis

const adminLabelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

const AdminLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof adminLabelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(adminLabelVariants(), className)}
    {...props}
  />
));
AdminLabel.displayName = LabelPrimitive.Root.displayName;

export { AdminLabel };