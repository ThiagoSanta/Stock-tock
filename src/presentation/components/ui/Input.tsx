import React from 'react';

const baseControlClasses =
  'w-full h-8 px-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-colors focus:outline-none focus:border-lime-500 dark:focus:border-lime-400 focus:ring-1 focus:ring-lime-500/40 dark:focus:ring-lime-400/40 disabled:opacity-50 disabled:cursor-not-allowed';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  mono?: boolean;
}

/** Campo de texto estandarizado con etiqueta, icono izquierdo y estado de error. */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, mono = false, id, required, className = '', ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1"
          >
            {label} {required && <span className="text-rose-600 dark:text-rose-400">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span
              aria-hidden="true"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none flex items-center"
            >
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            aria-invalid={!!error}
            className={`${baseControlClasses} ${leftIcon ? 'pl-8' : ''} ${
              mono ? 'font-mono' : ''
            } ${error ? 'border-rose-500 dark:border-rose-500' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}
        {!error && hint && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

/** Selector desplegable estandarizado. */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, id, required, className = '', children, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1"
          >
            {label} {required && <span className="text-rose-600 dark:text-rose-400">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-invalid={!!error}
          className={`${baseControlClasses} ${
            error ? 'border-rose-500 dark:border-rose-500' : ''
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

/** Área de texto multilínea estandarizada. */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, id, required, className = '', ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1"
          >
            {label} {required && <span className="text-rose-600 dark:text-rose-400">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          required={required}
          aria-invalid={!!error}
          className={`${baseControlClasses} h-auto py-2 ${
            error ? 'border-rose-500 dark:border-rose-500' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
