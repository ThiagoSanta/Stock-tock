import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export interface PageHeaderProps {
  title: string;
  icon?: React.ReactNode;
  backTo?: string;
  backLabel?: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}

/** Encabezado estándar para todas las páginas principales del sistema. */
export function PageHeader({
  title,
  icon,
  backTo = '/',
  backLabel = 'Dashboard',
  subtitle,
  actions,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
      <div>
        {backTo && (
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-1">
            <Link
              to={backTo}
              className="hover:text-zinc-900 dark:hover:text-zinc-200 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{backLabel}</span>
            </Link>
          </div>
        )}
        {subtitle && (
          <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 mb-1">
            {subtitle}
          </div>
        )}
        <div className="flex items-center gap-2.5">
          {icon && (
            <div
              aria-hidden="true"
              className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center justify-center shrink-0"
            >
              {icon}
            </div>
          )}
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {title}
          </h1>
        </div>
      </div>

      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
