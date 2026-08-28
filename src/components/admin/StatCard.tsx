import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  note?: string;
  icon?: React.ReactNode;
  isCurrency?: boolean;
}

export function StatCard({
  title,
  value,
  change,
  note = "vs previous period",
  icon,
  isCurrency = false,
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change === undefined || change === 0;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3 relative overflow-hidden group">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</span>
        {icon && (
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            {icon}
          </div>
        )}
      </div>

      <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
        {isCurrency && typeof value === "number" ? `GH₵${value.toLocaleString()}` : value}
      </div>

      {change !== undefined && (
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span
            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-black ${
              isPositive
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                : isNegative
                ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                : "bg-slate-50 text-slate-600 border border-slate-200"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : isNegative ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            {change > 0 ? `+${change}%` : `${change}%`}
          </span>
          <span className="text-slate-400 text-[11px]">{note}</span>
        </div>
      )}
    </div>
  );
}
