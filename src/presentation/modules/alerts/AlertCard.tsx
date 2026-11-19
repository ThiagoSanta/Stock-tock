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
    ? 'bg-rose-50 text-rose-900 border-rose-300'
    : isWarning
    ? 'bg-amber-50 text-amber-900 border-amber-300'
    : 'bg-sky-50 text-sky-900 border-sky-300';

  const borderStyle = isCritical
    ? 'border-rose-300 bg-rose-50/30'
    : isWarning
    ? 'border-amber-300 bg-amber-50/30'
    : 'border-slate-200 bg-white';

  const IconComponent = () => {
    if (alert.type === 'PENDING_ORDER_RESERVATION') {
      return <Clock className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />;
    }
    if (isCritical) {
      return <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" aria-hidden="true" />;
    }
    if (isWarning) {
      return <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />;
    }
    return <Info className="w-4 h-4 text-sky-700 shrink-0" aria-hidden="true" />;
  };

  return (
    <article
      aria-label={`${alert.severity}: ${alert.title}`}
      className={`p-3.5 rounded-lg border ${borderStyle} transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs`}
    >
      <div className="flex items-start gap-2.5">
        <div className="p-1.5 rounded bg-white border border-slate-300 mt-0.5 shrink-0">
          <IconComponent />
        </div>
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <h4 className="text-xs font-bold text-slate-900">{alert.title}</h4>
            <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${badgeStyle}`}>
              {alert.severity}
            </span>
            {alert.warehouseName && (
              <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 border border-slate-300 text-slate-800 font-mono font-medium">
                {alert.warehouseName}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-700 leading-relaxed max-w-2xl font-medium">{alert.description}</p>
        </div>
      </div>

      <div className="shrink-0 flex items-center justify-end">
        <Link
          to={alert.actionUrl}
          aria-label={`${alert.actionLabel} para alerta ${alert.title}`}
          className="h-8 px-3 rounded bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-300 focus-visible:ring-2 focus-visible:ring-slate-900"
        >
          <span>{alert.actionLabel}</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
