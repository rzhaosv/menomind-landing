'use client';

import React from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface MessageBubbleProps {
  message: ChatMessage;
  isFirstAssistant?: boolean;
}

function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function MessageBubble({ message, isFirstAssistant = false }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[85%] md:max-w-[70%]`}>
        {/* Avatar row */}
        <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              isUser
                ? 'bg-brand-purple text-white'
                : 'bg-brand-pink-light text-white'
            }`}
            aria-hidden="true"
          >
            {isUser ? 'U' : 'M'}
          </div>

          {/* Bubble */}
          <div
            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              isUser
                ? 'bg-brand-purple text-white rounded-br-md'
                : 'bg-white text-brand-dark border border-gray-100 rounded-bl-md shadow-sm'
            }`}
          >
            {isFirstAssistant && !isUser && (
              <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                <strong>Medical Disclaimer:</strong> I am an AI assistant. The information I provide is for educational and informational purposes only and should not replace professional medical advice. Always consult your healthcare provider for medical decisions.
              </div>
            )}
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
        </div>

        {/* Timestamp + disclaimer */}
        <div className={`mt-1 flex items-center gap-2 ${isUser ? 'justify-end pr-10' : 'justify-start pl-10'}`}>
          <span className="text-[11px] text-gray-400">{formatTime(message.createdAt)}</span>
          {!isUser && (
            <span className="text-[10px] text-gray-400 italic">
              For informational purposes only.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export { MessageBubble };
