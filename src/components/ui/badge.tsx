import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/common/utils/cn.util";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-slate-900 bg-slate-900 text-white",
        secondary: "border-slate-200 bg-slate-100 text-slate-600",
        outline: "border-slate-200 bg-white text-slate-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
