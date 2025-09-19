import React from 'react';

interface ToastProps {
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  title?: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  duration?: number;
}

export function Toast({ 
  variant = 'default', 
  title, 
  description, 
  className = '', 
  children,
  open = true,
  onOpenChange,
  duration = 5000
}: ToastProps) {
  const [isVisible, setIsVisible] = React.useState(open);

  React.useEffect(() => {
    if (isVisible !== open) {
      setIsVisible(open);
    }
  }, [open, isVisible]);

  React.useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onOpenChange?.(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onOpenChange]);

  if (!isVisible) return null;

  const variantClasses = {
    default: 'bg-white border-gray-300',
    success: 'bg-green-50 border-green-300 text-green-800',
    warning: 'bg-yellow-50 border-yellow-300 text-yellow-800',
    destructive: 'bg-red-50 border-red-300 text-red-800'
  };

  const handleClose = () => {
    setIsVisible(false);
    onOpenChange?.(false);
  };

  return (
    <div className={`fixed top-4 right-4 z-50 relative rounded-md border p-4 shadow-md ${variantClasses[variant]} ${className}`}>
      {title && (
        <div className="font-semibold mb-1">
          {title}
        </div>
      )}
      {description && (
        <div className="text-sm">
          {description}
        </div>
      )}
      {children}
      <button
        onClick={handleClose}
        className="absolute right-2 top-2 rounded-md p-1 text-gray-500 hover:text-gray-700"
        aria-label="Close"
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  );
}

interface ToastActionProps {
  altText?: string;
  onClick?: () => void;
  children: React.ReactNode;
}

export function ToastAction({ altText, onClick, children }: ToastActionProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium hover:bg-gray-100"
      aria-label={altText}
    >
      {children}
    </button>
  );
}

interface ToastCloseProps {
  onClick?: () => void;
}

export function ToastClose({ onClick }: ToastCloseProps) {
  return (
    <button
      onClick={onClick}
      className="absolute right-2 top-2 rounded-md p-1 text-gray-500 hover:text-gray-700"
      aria-label="Close"
    >
      <span aria-hidden="true">&times;</span>
    </button>
  );
}

interface ToastTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function ToastTitle({ children, className = '' }: ToastTitleProps) {
  return (
    <div className={`font-semibold ${className}`}>
      {children}
    </div>
  );
}

interface ToastDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function ToastDescription({ children, className = '' }: ToastDescriptionProps) {
  return (
    <div className={`text-sm ${className}`}>
      {children}
    </div>
  );
}