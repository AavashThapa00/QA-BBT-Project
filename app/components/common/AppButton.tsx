import React from "react";

type AppButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "successSoft"
  | "dangerSoft";
type AppButtonSize = "md" | "sm" | "icon";

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AppButtonVariant;
  size?: AppButtonSize;
}

const VARIANT_CLASSES: Record<AppButtonVariant, string> = {
  primary:
    "bg-(--primary-color) text-white hover:bg-(--primary-hover-color) disabled:cursor-not-allowed disabled:opacity-50",
  secondary:
    "border border-(--border-color) bg-(--surface-soft) text-(--muted-color) hover:border-(--primary-color) hover:bg-emerald-50 hover:text-(--heading-color) disabled:cursor-not-allowed disabled:opacity-50",
  danger:
    "bg-(--danger-color) text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
  successSoft:
    "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50",
  dangerSoft:
    "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50",
};

const SIZE_CLASSES: Record<AppButtonSize, string> = {
  md: "px-4 py-2 text-sm font-semibold",
  sm: "px-3 py-1.5 text-xs font-semibold",
  icon: "h-8 w-8 p-0 text-xs",
};

function joinClasses(...classes: Array<string | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export default function AppButton({
  variant = "primary",
  size = "md",
  type,
  className,
  ...props
}: AppButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={joinClasses(
        "inline-flex items-center justify-center gap-2 rounded-lg transition-colors",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    />
  );
}
