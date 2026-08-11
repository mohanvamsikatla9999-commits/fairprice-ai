"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "default" | "success" | "warning" | "destructive";

export interface ToastProps {
  id?: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  open?: boolean;
  onClose?: () => void;
  className?: string;
}

const variantStyles: Record<ToastVariant, string> = {
  default: "border-border bg-white",
  success: "border-emerald-200 bg-emerald-50",
  warning: "border-amber-200 bg-amber-50",
  destructive: "border-red-200 bg-red-50",
};

export function Toast({
  title,
  description,
  variant = "default",
  open = true,
  onClose,
  className,
}: ToastProps) {
  if (!open) return null;

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border p-4 shadow-xl",
        variantStyles[variant],
        className,
      )}
    >
      <div className="flex-1 space-y-1">
        {title ? <p className="text-sm font-semibold text-foreground">{title}</p> : null}
        {description ? (
          <p className="text-sm text-foreground-muted">{description}</p>
        ) : null}
      </div>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-foreground-muted transition hover:bg-black/5 hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

export function ToastViewport({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed bottom-20 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 sm:bottom-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

type ToastItem = ToastProps & { id: string };

type ToastContextValue = {
  toasts: ToastItem[];
  push: (toast: Omit<ToastProps, "id" | "open">) => string;
  dismiss: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = React.useCallback(
    (toast: Omit<ToastProps, "id" | "open">) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { ...toast, id, open: true }]);
      window.setTimeout(() => dismiss(id), 4000);
      return id;
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toasts, push, dismiss }}>
      {children}
      <ToastViewport>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={() => dismiss(toast.id)} />
        ))}
      </ToastViewport>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
