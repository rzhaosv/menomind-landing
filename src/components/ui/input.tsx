'use client';

import React, { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  wrapperClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, id, wrapperClassName = '', className = '', ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`flex flex-col gap-1.5 ${wrapperClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-brand-dark"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={[
              'w-full rounded-lg border bg-white px-4 py-2.5 text-brand-dark text-sm',
              'placeholder:text-gray-400',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              icon ? 'pl-10' : '',
              error
                ? 'border-red-400 focus:ring-red-300'
                : 'border-gray-300 focus:border-brand-purple focus:ring-brand-purple/30',
              'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
              className,
            ].join(' ')}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error && inputId ? `${inputId}-error` : undefined}
            {...props}
          />
        </div>
        {error && (
          <p
            id={inputId ? `${inputId}-error` : undefined}
            className="text-sm text-red-500"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export { Input };
