import * as React from "react"
import { cn } from "../utils"

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  breadcrumbs?: Array<{
    label: string
    href?: string
    onClick?: () => void
  }>
}

const Header = React.forwardRef<HTMLElement, HeaderProps>(
  ({ className, title, subtitle, actions, breadcrumbs, children, ...props }, ref) => {
    return (
      <header
        ref={ref}
        className={cn(
          "flex items-center justify-between px-6 py-4 bg-background border-b border-border",
          className
        )}
        {...props}
      >
        <div className="flex flex-col">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span>/</span>}
                  {crumb.href || crumb.onClick ? (
                    <button
                      onClick={crumb.onClick}
                      className="hover:text-foreground transition-colors"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className="text-foreground font-medium">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}
          
          {title && (
            <h1 className="text-2xl font-semibold text-foreground">
              {title}
            </h1>
          )}
          
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">
              {subtitle}
            </p>
          )}
          
          {children}
        </div>
        
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </header>
    )
  }
)
Header.displayName = "Header"

export { Header } 