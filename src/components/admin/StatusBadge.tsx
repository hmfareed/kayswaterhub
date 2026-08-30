import React from "react";

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, className = "", size = "md" }: StatusBadgeProps) {
  const norm = status?.toUpperCase() || "UNKNOWN";

  let styles = "bg-slate-100 text-slate-700 border-slate-200";

  // Orders
  if (norm === "DELIVERED" || norm === "SUCCESS" || norm === "IN_STOCK" || norm === "PUBLISHED" || norm === "ACTIVE") {
    styles = "bg-emerald-50 text-emerald-700 border-emerald-200/80";
  } else if (
    norm === "PROCESSING" ||
    norm === "CONFIRMED" ||
    norm === "READY_FOR_DELIVERY" ||
    norm === "DRIVER_ASSIGNED" ||
    norm === "PICKED_UP"
  ) {
    styles = "bg-blue-50 text-blue-700 border-blue-200/80";
  } else if (norm === "OUT_FOR_DELIVERY" || norm === "IN_TRANSIT") {
    styles = "bg-purple-50 text-purple-700 border-purple-200/80";
  } else if (norm === "PENDING" || norm === "PENDING_PAYMENT" || norm === "LOW_STOCK") {
    styles = "bg-amber-50 text-amber-700 border-amber-200/80";
  } else if (norm === "CANCELLED" || norm === "FAILED" || norm === "OUT_OF_STOCK" || norm === "REPORTED" || norm === "DISABLED") {
    styles = "bg-rose-50 text-rose-700 border-rose-200/80";
  } else if (norm === "REFUNDED" || norm === "REFUND_PENDING" || norm === "HIDDEN") {
    styles = "bg-slate-100 text-slate-600 border-slate-300";
  }

  const formatText = (txt: string) => {
    return txt.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const sizeClass = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center font-bold tracking-tight rounded-full border whitespace-nowrap shrink-0 ${sizeClass} ${styles} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75 shrink-0"></span>
      {formatText(status)}
    </span>
  );
}
