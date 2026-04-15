"use client";

import React, { useEffect, useState } from "react";
import { HiCheckCircle, HiX } from "react-icons/hi";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number; // in milliseconds, 0 = no auto-dismiss
  onClose?: () => void;
}

export default function Toast({
  message,
  type = "success",
  duration = 3000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!isVisible) return null;

  const styles = {
    success: {
      borderColor: "var(--success-color)",
      iconColor: "var(--success-color)",
    },
    error: {
      borderColor: "var(--danger-color)",
      iconColor: "var(--danger-color)",
    },
    info: {
      borderColor: "var(--info-color)",
      iconColor: "var(--info-color)",
    },
  }[type];

  return (
    <div
      className="fixed right-4 top-4 z-50 flex items-center gap-3 rounded-lg border bg-(--surface-elevated) px-4 py-3 shadow-card animate-in fade-in slide-in-from-top-2 duration-300"
      style={{ borderColor: styles.borderColor }}
    >
      {type === "success" && (
        <HiCheckCircle
          className="h-5 w-5 shrink-0"
          style={{ color: styles.iconColor }}
        />
      )}
      <span className="text-sm font-medium text-(--heading-color)">
        {message}
      </span>
      <button
        onClick={() => {
          setIsVisible(false);
          onClose?.();
        }}
        className="ml-2 shrink-0 transition-opacity hover:opacity-70"
        style={{ color: styles.iconColor }}
      >
        <HiX className="w-4 h-4" />
      </button>
    </div>
  );
}
