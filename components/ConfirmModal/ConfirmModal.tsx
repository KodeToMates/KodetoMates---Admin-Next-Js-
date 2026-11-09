"use client";

import React, { useEffect } from "react";
import styles from "./ConfirmModal.module.css";

export type ConfirmVariant = "danger" | "warning" | "info";

export interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  itemName?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  icon?: string;
  isAlertOnly?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  itemName,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  icon,
  isAlertOnly = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      } else if (e.key === "Enter") {
        e.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  // Determine icon class
  const defaultIcon =
    variant === "danger"
      ? "fa-solid fa-triangle-exclamation"
      : variant === "warning"
      ? "fa-solid fa-circle-exclamation"
      : "fa-solid fa-circle-info";

  const iconClass = icon || defaultIcon;

  // Determine variant styling classes
  const modalVariantClass =
    variant === "danger"
      ? styles.modalDanger
      : variant === "warning"
      ? styles.modalWarning
      : styles.modalInfo;

  const iconVariantClass =
    variant === "danger"
      ? styles.iconBadgeDanger
      : variant === "warning"
      ? styles.iconBadgeWarning
      : styles.iconBadgeInfo;

  const confirmBtnVariantClass =
    variant === "danger"
      ? styles.confirmBtnDanger
      : variant === "warning"
      ? styles.confirmBtnWarning
      : styles.confirmBtnInfo;

  return (
    <div
      className={styles.overlay}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className={`${styles.modal} ${modalVariantClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-right close button */}
        <button
          type="button"
          className={styles.closeButton}
          onClick={onCancel}
          aria-label="Close dialog"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className={styles.contentWrapper}>
          {/* Glowing Glass Icon Badge */}
          <div className={`${styles.iconBadge} ${iconVariantClass}`}>
            <i className={iconClass}></i>
          </div>

          {/* Dialog Title */}
          <h2 id="confirm-modal-title" className={styles.title}>
            {title}
          </h2>

          {/* Dialog Message */}
          <p className={styles.message}>{message}</p>

          {/* Optional Highlighted Item Callout */}
          {itemName && (
            <div className={styles.itemCallout}>
              <i className="fa-solid fa-trash-can"></i>
              <span>{itemName}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className={styles.actions}>
          {!isAlertOnly && (
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onCancel}
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            className={`${styles.confirmBtn} ${confirmBtnVariantClass}`}
            onClick={onConfirm}
            style={isAlertOnly ? { flex: 1 } : undefined}
            autoFocus
          >
            {variant === "danger" && <i className="fa-solid fa-trash-can" style={{ marginRight: 6 }}></i>}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

