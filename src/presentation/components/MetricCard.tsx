import React from 'react';
import { LucideIcon, AlertTriangle } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  trend?: string;
  isPositive?: boolean;
  isAlert?: boolean;
  subtitle?: string;
  icon?: LucideIcon;
}

export function MetricCard({
  title,
  value,
  trend,
  isPositive = true,
  isAlert = false,
  subtitle,
  icon: Icon,
}: MetricCardProps) {
  return (
    <article
      aria-label={`${title}: ${value}`}
      className="p-4 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors shadow-xs"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-600">{title}</span>
        {Icon && (
          <div
            aria-hidden="true"
            className="w-6 h-6 rounded-md bg-blue-50/80 border border-blue-100/60 flex items-center justify-center text-blue-700"
          >
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
          {value}
        </div>

        {trend && (
          <div
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${
              isAlert
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : isPositive
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : 'bg-rose-50 text-rose-900 border-rose-300'
            }`}
          >
            {isAlert && <AlertTriangle className="w-3 h-3" aria-hidden="true" />}
            <span>{trend}</span>
          </div>
        )}
      </div>

      {subtitle && (
        <div className="text-xs text-slate-600 mt-1.5 truncate font-medium">
          {subtitle}
        </div>
      )}
    </article>
  );
}
