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
      className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-lime-500/50 dark:hover:border-lime-500/40 transition-colors shadow-xs"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">{title}</span>
        {Icon && (
          <div
            aria-hidden="true"
            className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300"
          >
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
          {value}
        </div>

        {trend && (
          <div
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md border ${
              isAlert
                ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70'
                : isPositive
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70'
                : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/70'
            }`}
          >
            {isAlert && <AlertTriangle className="w-3 h-3" aria-hidden="true" />}
            <span>{trend}</span>
          </div>
        )}
      </div>

      {subtitle && (
        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 truncate font-medium">
          {subtitle}
        </div>
      )}
    </article>
  );
}
