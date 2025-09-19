"use client"

import * as React from "react"
import { Toast } from "@/components/ui/toast"

type ToastVariant = "default" | "success" | "warning" | "destructive"

type ToastType = {
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

const ToastContext = React.createContext<{
  toast: (toast: ToastType) => void
}>({
  toast: () => {}
})

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const [toastProps, setToastProps] = React.useState<ToastType>({})
  
  const toast = React.useCallback((props: ToastType) => {
    setToastProps(props)
    setOpen(true)
  }, [])
  
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <Toast 
        open={open} 
        onOpenChange={setOpen} 
        {...toastProps} 
      />
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = React.useContext(ToastContext)
  
  if (context === undefined) {
    throw new Error("useToast deve ser usado dentro de um ToastProvider")
  }
  
  return context
} 