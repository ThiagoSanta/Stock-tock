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
    <div className="p-4 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500">{title}</span>
        {Icon && (
          <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-600">
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-xl font-bold tracking-tight text-slate-900 font-mono">
          {value}
        </div>

        {trend && (
          <div
            className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded border ${
              isAlert
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : isPositive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {isAlert && <AlertTriangle className="w-3 h-3" />}
            <span>{trend}</span>
          </div>
        )}
      </div>

      {subtitle && (
        <div className="text-[11px] text-slate-500 mt-1 truncate">
          {subtitle}
        </div>
      )}
    </div>
  );
}
