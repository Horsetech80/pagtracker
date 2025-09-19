import * as React from "react"
import { cn } from "../utils"

export interface SidebarItem {
  href: string
  label: string
  icon: React.ComponentType<any>
  isActive?: boolean
  onClick?: () => void
}

export interface SidebarProps {
  title: string
  items: SidebarItem[]
  user?: {
    name: string
    email: string
    avatar?: string
    wallet?: string
  }
  className?: string
  onItemClick?: (item: SidebarItem) => void
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ title, items, user, className, onItemClick }, ref) => {
    const handleItemClick = (item: SidebarItem) => {
      if (item.onClick) {
        item.onClick()
      } else if (onItemClick) {
        onItemClick(item)
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col w-64 bg-card border-r border-border",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center h-16 px-6 border-b border-border">
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-6 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-sm font-medium text-primary-foreground">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
            {user.wallet && (
              <div className="mt-4 p-3 bg-secondary rounded-lg">
                <p className="text-xs text-muted-foreground">Saldo disponível</p>
                <p className="text-lg font-semibold text-primary">{user.wallet}</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {items.map((item, index) => {
            const Icon = item.icon

            return (
              <button
                key={`${item.href}-${index}`}
                onClick={() => handleItemClick(item)}
                className={cn(
                  "w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-none transition-colors text-left",
                  item.isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>
    )
  }
)
Sidebar.displayName = "Sidebar"

export { Sidebar }