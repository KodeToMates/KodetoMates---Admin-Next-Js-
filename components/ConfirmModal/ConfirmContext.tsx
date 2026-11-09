"use client";

import React, { createContext, useContext, useState, useRef, useCallback } from "react";
import { ConfirmModal, ConfirmVariant } from "./ConfirmModal";

export interface ConfirmOptions {
  title?: string;
  message?: string;
  itemName?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  icon?: string;
}

export interface AlertOptions {
  title?: string;
  message: string;
  confirmText?: string;
  variant?: ConfirmVariant;
  icon?: string;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (optionsOrMessage: AlertOptions | string) => Promise<void>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAlertOnly, setIsAlertOnly] = useState(false);
  const [modalProps, setModalProps] = useState<ConfirmOptions>({});
  const resolveRef = useRef<((val: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setIsAlertOnly(false);
      setModalProps(options);
      setIsOpen(true);
    });
  }, []);

  const alert = useCallback((optionsOrMessage: AlertOptions | string): Promise<void> => {
    return new Promise<void>((resolve) => {
      resolveRef.current = () => resolve();
      setIsAlertOnly(true);
      if (typeof optionsOrMessage === "string") {
        setModalProps({
          title: "Notice",
          message: optionsOrMessage,
          confirmText: "Got it",
          variant: "info",
        });
      } else {
        setModalProps({
          title: optionsOrMessage.title || "Notice",
          message: optionsOrMessage.message,
          confirmText: optionsOrMessage.confirmText || "Got it",
          variant: optionsOrMessage.variant || "info",
          icon: optionsOrMessage.icon,
        });
      }
      setIsOpen(true);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = null;
    }
  }, []);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm, alert }}>
      {children}
      <ConfirmModal
        isOpen={isOpen}
        title={modalProps.title}
        message={modalProps.message}
        itemName={modalProps.itemName}
        confirmText={modalProps.confirmText}
        cancelText={modalProps.cancelText}
        variant={modalProps.variant}
        icon={modalProps.icon}
        isAlertOnly={isAlertOnly}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
};

export const useConfirm = (): ConfirmContextType => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
};

