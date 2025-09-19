import * as React from "react"
import { cn } from "../utils"

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    value: string
    isPositive?: boolean
  }
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ className, title, value, subtitle, icon, trend, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-card p-6 shadow-card transition-shadow hover:shadow-card-hover",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="h-8 w-8 text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1">
          <span
            className={cn(
              "text-xs font-medium",
              trend.isPositive
                ? "text-success"
                : "text-destructive"
            )}
          >
            {trend.isPositive ? "+" : ""}{trend.value}
          </span>
          <span className="text-xs text-muted-foreground">vs período anterior</span>
        </div>
      )}
    </div>
  )
)
MetricCard.displayName = "MetricCard"

export { MetricCard } 