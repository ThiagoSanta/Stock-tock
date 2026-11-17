'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, AlertTriangle, Info, Clock, ArrowRight, ShieldAlert } from 'lucide-react';
import { SystemAlert } from '@/core/domain/alerts/types';

interface AlertCardProps {
  alert: SystemAlert;
}

export function AlertCard({ alert }: AlertCardProps) {
  const isCritical = alert.severity === 'CRITICAL';
  const isWarning = alert.severity === 'WARNING';

  const badgeStyle = isCritical
    ? 'bg-rose-950/40 text-rose-400 border-rose-900/60'
    : isWarning
    ? 'bg-amber-950/40 text-amber-400 border-amber-900/60'
    : 'bg-sky-950/40 text-sky-400 border-sky-900/60';

  const borderStyle = isCritical
    ? 'border-rose-900/40 hover:border-rose-700/60'
    : isWarning
    ? 'border-amber-900/40 hover:border-amber-700/60'
    : 'border-zinc-800 hover:border-zinc-700';

  const IconComponent = () => {
    if (alert.type === 'PENDING_ORDER_RESERVATION') {
      return <Clock className="w-4 h-4 text-amber-400 shrink-0" />;
    }
    if (isCritical) {
      return <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />;
    }
    if (isWarning) {
      return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
    }
    return <Info className="w-4 h-4 text-sky-400 shrink-0" />;
  };

  return (
    <div
      className={`p-4 rounded-xl bg-[#121214] border ${borderStyle} transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-[#18181b] border border-[#27272a] mt-0.5">
          <IconComponent />
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-xs font-semibold text-zinc-100">{alert.title}</h4>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${badgeStyle}`}>
              {alert.severity}
            </span>
            {alert.warehouseName && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
                {alert.warehouseName}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">{alert.description}</p>
        </div>
      </div>

      <div className="shrink-0 flex items-center justify-end">
        <Link
          href={alert.actionUrl}
          className="h-8 px-3 rounded-lg bg-[#18181b] border border-[#27272a] hover:bg-zinc-800 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <span>{alert.actionLabel}</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#84cc16]" />
        </Link>
      </div>
    </div>
  );
}
