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
  onClose 
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

  const bgColor = {
    success: "bg-green-900/40 border-green-800",
    error: "bg-red-900/40 border-red-800",
    info: "bg-blue-900/40 border-blue-800",
  }[type];

  const iconColor = {
    success: "text-green-400",
    error: "text-red-400",
    info: "text-blue-400",
  }[type];

  const textColor = {
    success: "text-green-200",
    error: "text-red-200",
    info: "text-blue-200",
  }[type];

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border ${bgColor} shadow-lg animate-in fade-in slide-in-from-top-2 duration-300`}>
      {type === "success" && <HiCheckCircle className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />}
      <span className={`text-sm font-medium ${textColor}`}>{message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          onClose?.();
        }}
        className={`ml-2 flex-shrink-0 hover:opacity-70 transition-opacity ${iconColor}`}
      >
        <HiX className="w-4 h-4" />
      </button>
    </div>
  );
}
