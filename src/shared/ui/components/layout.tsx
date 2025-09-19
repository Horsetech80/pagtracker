import * as React from "react"
import { cn } from "../utils"
import { Sidebar, SidebarProps } from "./sidebar"
import { Header, HeaderProps } from "./header"

export interface LayoutProps {
  sidebar: SidebarProps
  header?: HeaderProps
  children: React.ReactNode
  className?: string
}

const Layout = React.forwardRef<HTMLDivElement, LayoutProps>(
  ({ sidebar, header, children, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex h-screen bg-background", className)}
      >
        {/* Sidebar */}
        <Sidebar {...sidebar} />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          {header && <Header {...header} />}
          
          {/* Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    )
  }
)
Layout.displayName = "Layout"

export { Layout } 