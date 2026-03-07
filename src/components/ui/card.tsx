import React, { type HTMLAttributes, type ReactNode } from 'react';

type CardVariant = 'default' | 'bordered' | 'elevated';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children: ReactNode;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-white rounded-xl shadow-sm',
  bordered: 'bg-white rounded-xl border border-gray-200',
  elevated: 'bg-white rounded-xl shadow-lg',
};

function Card({
  variant = 'default',
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`p-6 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

function CardHeader({ className = '', children, ...props }: CardHeaderProps) {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

function CardTitle({ className = '', children, ...props }: CardTitleProps) {
  return (
    <h3 className={`text-lg font-semibold text-brand-dark ${className}`} {...props}>
      {children}
    </h3>
  );
}

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

function CardContent({ className = '', children, ...props }: CardContentProps) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export { Card, CardHeader, CardTitle, CardContent };
