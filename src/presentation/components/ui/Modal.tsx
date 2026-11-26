import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  size?: ModalSize;
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnOverlayClick?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
};

/** Contenedor de diálogo modal accesible con soporte Light/Dark y cierre con Escape. */
export function Modal({
  isOpen,
  onClose,
  title,
  icon,
  size = 'lg',
  children,
  footer,
  closeOnOverlayClick = true,
}: ModalProps) {
  const titleId = React.useId();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div
        className={`w-full ${sizeClasses[size]} rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-12 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/90 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {icon && (
              <div
                aria-hidden="true"
                className="w-6 h-6 rounded-md bg-zinc-900 dark:bg-zinc-800 text-white dark:text-lime-400 border border-transparent dark:border-zinc-700 flex items-center justify-center shrink-0"
              >
                {icon}
              </div>
            )}
            <h3
              id={titleId}
              className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider truncate"
            >
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Cerrar ${title}`}
            className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 p-1.5 rounded-lg hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 flex items-center justify-end gap-2 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
