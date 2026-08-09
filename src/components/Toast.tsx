"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastTone = "success" | "error";

type NotifyOptions = {
  tone?: ToastTone;
  undoLabel?: string;
  onUndo?: () => void;
};

type ToastEntry = {
  id: number;
  message: string;
  tone: ToastTone;
  undoLabel: string;
  onUndo?: () => void;
};

type ToastContextValue = {
  notify: (message: string, options?: NotifyOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const VISIBLE_MS = 6000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastEntry | null>(null);
  const counter = useRef(0);

  const notify = useCallback((message: string, options?: NotifyOptions) => {
    counter.current += 1;
    setToast({
      id: counter.current,
      message,
      tone: options?.tone ?? "success",
      undoLabel: options?.undoLabel ?? "Undo",
      onUndo: options?.onUndo,
    });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const value = useMemo<ToastContextValue>(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] print:hidden"
      >
        {toast && (
          <div
            key={toast.id}
            className={`hotel-toast pointer-events-auto flex w-full max-w-md items-center gap-3 ${
              toast.tone === "error" ? "hotel-toast-error" : "hotel-toast-success"
            }`}
          >
            <p className="min-w-0 flex-1 text-sm font-medium">{toast.message}</p>
            {toast.onUndo && (
              <button
                type="button"
                className="hotel-toast-action"
                onClick={() => {
                  toast.onUndo?.();
                  setToast(null);
                }}
              >
                {toast.undoLabel}
              </button>
            )}
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Close message"
              className="hotel-toast-close"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
