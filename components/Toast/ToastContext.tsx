"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import styles from "./Toast.module.css";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  message: string;
  title?: string;
  type?: ToastType;
  duration?: number; // in milliseconds, default 3500ms
}

export interface ToastItem extends ToastOptions {
  id: string;
  isHiding?: boolean;
}

interface ToastHelpers {
  success: (message: string, title?: string, duration?: number) => void;
  error: (message: string, title?: string, duration?: number) => void;
  warning: (message: string, title?: string, duration?: number) => void;
  info: (message: string, title?: string, duration?: number) => void;
}

interface ToastContextType {
  showToast: (options: ToastOptions | string) => void;
  dismissToast: (id: string) => void;
  toast: ToastHelpers;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const dismissToast = useCallback((id: string) => {
    // Start exit animation
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isHiding: true } : t))
    );

    // Remove from state after exit animation finishes (240ms)
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      const timer = timeoutsRef.current.get(id);
      if (timer) {
        clearTimeout(timer);
        timeoutsRef.current.delete(id);
      }
    }, 240);
  }, []);

  const showToast = useCallback(
    (options: ToastOptions | string) => {
      const opts: ToastOptions =
        typeof options === "string" ? { message: options, type: "info" } : options;

      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const duration = opts.duration ?? 3500;
      const type = opts.type ?? "info";

      const newToast: ToastItem = {
        id,
        message: opts.message,
        title: opts.title,
        type,
        duration,
      };

      setToasts((prev) => [newToast, ...prev].slice(0, 5)); // Keep max 5 active toasts

      if (duration > 0) {
        const timer = setTimeout(() => {
          dismissToast(id);
        }, duration);
        timeoutsRef.current.set(id, timer);
      }
    },
    [dismissToast]
  );

  const toastHelpers: ToastHelpers = {
    success: useCallback(
      (message: string, title?: string, duration?: number) =>
        showToast({ message, title: title ?? "Success", type: "success", duration }),
      [showToast]
    ),
    error: useCallback(
      (message: string, title?: string, duration?: number) =>
        showToast({ message, title: title ?? "Error", type: "error", duration }),
      [showToast]
    ),
    warning: useCallback(
      (message: string, title?: string, duration?: number) =>
        showToast({ message, title: title ?? "Notice", type: "warning", duration }),
      [showToast]
    ),
    info: useCallback(
      (message: string, title?: string, duration?: number) =>
        showToast({ message, title: title ?? "Info", type: "info", duration }),
      [showToast]
    ),
  };

  const getIcon = (type?: ToastType) => {
    switch (type) {
      case "success":
        return "fa-solid fa-circle-check";
      case "error":
        return "fa-solid fa-circle-exclamation";
      case "warning":
        return "fa-solid fa-triangle-exclamation";
      case "info":
      default:
        return "fa-solid fa-circle-info";
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, dismissToast, toast: toastHelpers }}>
      {children}
      {/* Toast Notification Mount Viewport */}
      {toasts.length > 0 && (
        <div className={styles.container} role="region" aria-label="Notifications">
          {toasts.map((item) => {
            const variantClass = styles[item.type ?? "info"] || styles.info;
            const hidingClass = item.isHiding ? styles.hiding : "";

            return (
              <div
                key={item.id}
                className={`${styles.toast} ${variantClass} ${hidingClass}`}
                role="alert"
              >
                <div className={styles.iconWrapper}>
                  <i className={getIcon(item.type)} />
                </div>
                <div className={styles.content}>
                  {item.title && <div className={styles.title}>{item.title}</div>}
                  <div className={styles.message}>{item.message}</div>
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(item.id)}
                  className={styles.closeBtn}
                  aria-label="Close notification"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
                {item.duration && item.duration > 0 && (
                  <div
                    className={styles.progressBar}
                    style={{ animationDuration: `${item.duration}ms` }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
