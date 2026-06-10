import React from "react";
import { clsx } from "clsx";

interface BadgeProps {
  color?: "blue" | "green" | "yellow" | "red" | "cyan" | "gray";
  children: React.ReactNode;
  className?: string;
}

const COLORS = {
  blue: "bg-[#4f6ef7]/15 text-[#4f6ef7]",
  green: "bg-[#22c55e]/15 text-[#22c55e]",
  yellow: "bg-[#f59e0b]/15 text-[#f59e0b]",
  red: "bg-[#ef4444]/15 text-[#ef4444]",
  cyan: "bg-[#06b6d4]/15 text-[#06b6d4]",
  gray: "bg-wb-elevated text-wb-text2",
};

export const Badge: React.FC<BadgeProps> = ({ color = "gray", children, className }) => (
  <span className={clsx("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold", COLORS[color], className)}>
    {children}
  </span>
);
