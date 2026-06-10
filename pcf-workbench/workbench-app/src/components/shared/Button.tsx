import React from "react";
import { clsx } from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "secondary", size = "md", loading, children, className, disabled, ...rest
}) => {
  const base = "inline-flex items-center gap-1.5 font-medium rounded transition-colors focus:outline-none";
  const variants = {
    primary: "bg-[#4f6ef7] text-white hover:bg-[#3b5ce5] disabled:opacity-50",
    secondary: "bg-wb-elevated text-wb-text2 hover:text-wb-text border border-wb-border hover:border-wb-border2 disabled:opacity-50",
    danger: "bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20 disabled:opacity-50",
    ghost: "text-wb-text2 hover:text-wb-text hover:bg-wb-elevated disabled:opacity-50",
  };
  const sizes = { sm: "px-2 py-1 text-xs", md: "px-3 py-1.5 text-sm", lg: "px-4 py-2 text-base" };
  return (
    <button className={clsx(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...rest}>
      {loading ? <span className="animate-spin">⏳</span> : null}
      {children}
    </button>
  );
};
