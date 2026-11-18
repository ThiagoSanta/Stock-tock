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
    ? 'bg-rose-50 text-rose-700 border-rose-200'
    : isWarning
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-sky-50 text-sky-700 border-sky-200';

  const borderStyle = isCritical
    ? 'border-rose-200 bg-rose-50/20'
    : isWarning
    ? 'border-amber-200 bg-amber-50/20'
    : 'border-slate-200 bg-white';

  const IconComponent = () => {
    if (alert.type === 'PENDING_ORDER_RESERVATION') {
      return <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
    }
    if (isCritical) {
      return <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />;
    }
    if (isWarning) {
      return <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
    }
    return <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />;
  };

  return (
    <div
      className={`p-3.5 rounded-lg border ${borderStyle} transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs`}
    >
      <div className="flex items-start gap-2.5">
        <div className="p-1.5 rounded bg-white border border-slate-200 mt-0.5">
          <IconComponent />
        </div>
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <h4 className="text-xs font-semibold text-slate-900">{alert.title}</h4>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono border ${badgeStyle}`}>
              {alert.severity}
            </span>
            {alert.warehouseName && (
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 border border-slate-200 text-slate-600 font-mono">
                {alert.warehouseName}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed max-w-2xl">{alert.description}</p>
        </div>
      </div>

      <div className="shrink-0 flex items-center justify-end">
        <Link
          to={alert.actionUrl}
          className="h-7 px-2.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-medium flex items-center gap-1 transition-colors border border-slate-200"
        >
          <span>{alert.actionLabel}</span>
          <ArrowRight className="w-3 h-3 text-slate-500" />
        </Link>
      </div>
    </div>
  );
}
