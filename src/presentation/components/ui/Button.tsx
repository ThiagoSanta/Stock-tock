import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 text-white dark:bg-zinc-100 dark:hover:bg-white dark:active:bg-zinc-200 dark:text-zinc-950 border border-transparent shadow-xs',
  secondary:
    'bg-white hover:bg-zinc-50 active:bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:active:bg-zinc-800/80 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 shadow-2xs',
  ghost:
    'bg-transparent hover:bg-zinc-100 active:bg-zinc-200 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 dark:active:bg-zinc-700 border border-transparent',
  danger:
    'bg-rose-700 hover:bg-rose-800 active:bg-rose-900 text-white dark:bg-rose-600 dark:hover:bg-rose-500 border border-transparent shadow-xs',
  success:
    'bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 border border-transparent shadow-xs',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-xs gap-2',
};

/** Botón base estandarizado del sistema con soporte nativo Light/Dark. */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'sm',
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      type = 'button',
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center rounded-lg font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 dark:focus-visible:ring-lime-400 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" aria-hidden="true" />
        ) : (
          leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && <span className="shrink-0 flex items-center">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
