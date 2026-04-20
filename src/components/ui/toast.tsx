"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { JSX } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { cn } from "@/common/utils/cn.util";

type ToastTone = "success" | "error";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
};

type ToastContextValue = {
  toastSuccess: (title: string, description?: string) => void;
  toastError: (title: string, description?: string) => void;
};

const toastLifetimeMs = 3600;
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((toastId: string): void => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== toastId),
    );
  }, []);

  const addToast = useCallback(
    (tone: ToastTone, title: string, description?: string): void => {
      const toastId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      setToasts((currentToasts) => [
        ...currentToasts,
        {
          id: toastId,
          title,
          description,
          tone,
        },
      ]);

      window.setTimeout(() => {
        removeToast(toastId);
      }, toastLifetimeMs);
    },
    [removeToast],
  );

  const contextValue = useMemo<ToastContextValue>(
    () => ({
      toastSuccess: (title, description) => addToast("success", title, description),
      toastError: (title, description) => addToast("error", title, description),
    }),
    [addToast],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4 sm:justify-end sm:px-6">
        <div className="flex w-full max-w-md flex-col gap-3">
          {toasts.map((toast) => (
            <ToastCard
              key={toast.id}
              toast={toast}
              onDismiss={() => removeToast(toast.id)}
            />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: () => void;
}): JSX.Element {
  const icon =
    toast.tone === "success" ? (
      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
    ) : (
      <CircleAlert className="h-5 w-5 text-rose-600" />
    );

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-2xl border bg-white/95 px-4 py-3 shadow-[0_16px_48px_rgba(15,23,42,0.16)] backdrop-blur",
        toast.tone === "success"
          ? "border-emerald-200"
          : "border-rose-200",
      )}
      role="status"
      aria-live="polite"
    >
      <div className="mt-0.5">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-slate-950">{toast.title}</div>
        {toast.description ? (
          <div className="mt-1 text-sm leading-5 text-slate-600">
            {toast.description}
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider.");
  }

  return context;
}
