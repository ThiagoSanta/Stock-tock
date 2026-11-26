import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Info, Clock, ArrowRight, ShieldAlert } from 'lucide-react';
import { SystemAlert } from '@/core/domain/alerts/types';

interface AlertCardProps {
  alert: SystemAlert;
}

export function AlertCard({ alert }: AlertCardProps) {
  const isCritical = alert.severity === 'CRITICAL';
  const isWarning = alert.severity === 'WARNING';

  const badgeStyle = isCritical
    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/70 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800'
    : isWarning
    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/70 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800'
    : 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800/70 dark:bg-sky-950/80 dark:text-sky-300 dark:border-sky-800';

  const borderStyle = isCritical
    ? 'border-rose-200 dark:border-rose-800/70 bg-white dark:bg-zinc-900 dark:border-rose-500/50 dark:bg-zinc-900'
    : isWarning
    ? 'border-amber-200 dark:border-amber-800/70 bg-white dark:bg-zinc-900 dark:border-amber-500/50 dark:bg-zinc-900'
    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:border-zinc-800 dark:bg-zinc-900';

  const IconComponent = () => {
    if (alert.type === 'PENDING_ORDER_RESERVATION') {
      return <Clock className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" aria-hidden="true" />;
    }
    if (isCritical) {
      return <ShieldAlert className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0" aria-hidden="true" />;
    }
    if (isWarning) {
      return <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" aria-hidden="true" />;
    }
    return <Info className="w-4 h-4 text-sky-700 dark:text-sky-400 shrink-0" aria-hidden="true" />;
  };

  return (
    <article
      aria-label={`${alert.severity}: ${alert.title}`}
      className={`p-3.5 rounded-lg border ${borderStyle} transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs`}
    >
      <div className="flex items-start gap-2.5">
        <div className="p-1.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 mt-0.5 shrink-0">
          <IconComponent />
        </div>
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{alert.title}</h4>
            <span className={`px-2 py-0.5 rounded-md text-xs font-mono font-semibold border ${badgeStyle}`}>
              {alert.severity}
            </span>
            {alert.warehouseName && (
              <span className="px-2 py-0.5 rounded-md text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-300 font-mono font-medium">
                {alert.warehouseName}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-700 dark:text-zinc-400 leading-relaxed max-w-2xl font-medium">{alert.description}</p>
        </div>
      </div>

      <div className="shrink-0 flex items-center justify-end">
        <Link
          to={alert.actionUrl}
          aria-label={`${alert.actionLabel} para alerta ${alert.title}`}
          className="h-8 px-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-zinc-300 dark:border-zinc-700 focus-visible:ring-2 focus-visible:ring-lime-500"
        >
          <span>{alert.actionLabel}</span>
          <ArrowRight className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
