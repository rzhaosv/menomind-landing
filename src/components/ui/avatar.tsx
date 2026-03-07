import React from 'react';

type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps {
  name?: string;
  src?: string;
  alt?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function Avatar({ name, src, alt, size = 'md', className = '' }: AvatarProps) {
  const label = alt || name || 'User avatar';

  if (src) {
    return (
      <img
        src={src}
        alt={label}
        className={`rounded-full object-cover flex-shrink-0 ${sizeClasses[size]} ${className}`}
      />
    );
  }

  const initials = name ? getInitials(name) : '?';

  return (
    <span
      className={[
        'inline-flex items-center justify-center rounded-full flex-shrink-0',
        'bg-brand-purple text-white font-medium',
        sizeClasses[size],
        className,
      ].join(' ')}
      role="img"
      aria-label={label}
    >
      {initials}
    </span>
  );
}

export { Avatar };
