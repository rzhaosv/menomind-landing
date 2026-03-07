'use client';

import React, { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'pink' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  asChild?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-purple text-white hover:bg-brand-purple-dark focus-visible:ring-brand-purple shadow-sm',
  secondary:
    'border-2 border-brand-purple text-brand-purple bg-transparent hover:bg-brand-purple/5 focus-visible:ring-brand-purple',
  pink:
    'bg-brand-pink text-white hover:bg-brand-pink-light focus-visible:ring-brand-pink shadow-sm',
  ghost:
    'bg-transparent text-brand-dark hover:bg-brand-cream-dark focus-visible:ring-brand-purple',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-5 py-2.5 text-base gap-2',
  lg: 'px-7 py-3.5 text-lg gap-2.5',
};

function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin h-4 w-4 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      asChild = false,
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    const classes = [
      'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:pointer-events-none',
      variantClasses[variant],
      sizeClasses[size],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    if (asChild) {
      // When used as child, render children directly but wrap with styled span
      return (
        <span className={classes} role="presentation">
          {children}
        </span>
      );
    }

    return (
      <button
        ref={ref}
        className={classes}
        disabled={isDisabled}
        aria-busy={loading}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading && <Spinner />}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { Button };
