'use client';

import React from 'react';

export interface ActionItemData {
  id: string;
  description: string;
  time?: string;
  duration?: string;
  completed: boolean;
}

interface ActionItemProps {
  item: ActionItemData;
  onToggle: (id: string) => void;
  disabled?: boolean;
}

function ActionItem({ item, onToggle, disabled = false }: ActionItemProps) {
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
        item.completed ? 'bg-green-50/50' : 'bg-white hover:bg-gray-50'
      }`}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={() => onToggle(item.id)}
        disabled={disabled}
        className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded-md border-2 transition-all flex items-center justify-center ${
          item.completed
            ? 'bg-brand-purple border-brand-purple'
            : 'border-gray-300 hover:border-brand-purple'
        } disabled:cursor-not-allowed disabled:opacity-50`}
        aria-label={`Mark "${item.description}" as ${item.completed ? 'incomplete' : 'complete'}`}
        role="checkbox"
        aria-checked={item.completed}
      >
        {item.completed && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-relaxed ${
            item.completed
              ? 'text-gray-400 line-through'
              : 'text-brand-dark'
          }`}
        >
          {item.description}
        </p>

        {/* Time / Duration metadata */}
        {(item.time || item.duration) && (
          <div className="flex items-center gap-3 mt-1">
            {item.time && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {item.time}
              </span>
            )}
            {item.duration && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 22h14" />
                  <path d="M5 2h14" />
                  <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
                  <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
                </svg>
                {item.duration}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export { ActionItem };
