'use client';

import React, { useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

function Dialog({ open, onClose, title, children, className = '' }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  // Trap focus inside dialog
  useEffect(() => {
    if (!open) return;

    document.addEventListener('keydown', handleKeyDown);
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Prevent body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the dialog
    requestAnimationFrame(() => {
      contentRef.current?.focus();
    });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      previouslyFocused?.focus();
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  const dialog = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
        tabIndex={-1}
        className={[
          'relative w-full max-w-lg bg-white rounded-xl shadow-xl',
          'p-6 focus:outline-none',
          'max-h-[85vh] overflow-y-auto',
          className,
        ].join(' ')}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
          aria-label="Close dialog"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {title && (
          <h2 className="text-lg font-semibold text-brand-dark pr-8 mb-4">
            {title}
          </h2>
        )}

        {children}
      </div>
    </div>
  );

  if (typeof window === 'undefined') return null;
  return createPortal(dialog, document.body);
}

export { Dialog };
