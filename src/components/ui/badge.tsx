import React, { type HTMLAttributes, type ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'info';
type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-brand-purple/10 text-brand-purple',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-orange-100 text-orange-700',
  info: 'bg-blue-100 text-blue-700',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

function Badge({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center font-medium rounded-full whitespace-nowrap',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge };
