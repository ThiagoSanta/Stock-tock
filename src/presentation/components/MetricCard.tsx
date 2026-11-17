import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

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
    <div className="p-5 rounded-xl bg-[#121214] border border-[#222226] hover:border-[#2e2e34] transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-zinc-400">{title}</span>
        {Icon && (
          <div className="w-7 h-7 rounded-lg bg-[#1a1a1e] border border-[#27272a] flex items-center justify-center text-zinc-300">
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold tracking-tight text-zinc-100 font-mono">
          {value}
        </div>

        {trend && (
          <div
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              isAlert
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : isPositive
                ? 'bg-[#84cc16]/10 text-[#84cc16] border-[#84cc16]/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
          >
            {isAlert ? (
              <AlertTriangle className="w-3 h-3" />
            ) : isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{trend}</span>
          </div>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-[11px] text-zinc-500 font-normal">
          {subtitle}
        </p>
      )}
    </div>
  );
}
