'use client';

import React from 'react';

export interface Conversation {
  id: string;
  title: string;
  lastMessageAt: string;
  messageCount: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeId?: string;
  onSelect: (id: string) => void;
  onNewConversation: () => void;
  loading?: boolean;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNewConversation,
  loading = false,
}: ConversationListProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <button
          type="button"
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark transition-colors text-sm font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Conversation
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-gray-400">No conversations yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Start a new conversation to get help
            </p>
          </div>
        ) : (
          <ul className="py-2" role="list" aria-label="Conversations">
            {conversations.map((conv) => (
              <li key={conv.id}>
                <button
                  type="button"
                  onClick={() => onSelect(conv.id)}
                  className={`w-full text-left px-4 py-3 transition-colors hover:bg-gray-50 ${
                    activeId === conv.id
                      ? 'bg-brand-purple/5 border-r-2 border-brand-purple'
                      : ''
                  }`}
                  aria-current={activeId === conv.id ? 'true' : undefined}
                >
                  <p
                    className={`text-sm truncate ${
                      activeId === conv.id
                        ? 'text-brand-purple font-medium'
                        : 'text-brand-dark'
                    }`}
                  >
                    {conv.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">
                      {formatDate(conv.lastMessageAt)}
                    </span>
                    <span className="text-xs text-gray-300">
                      {conv.messageCount} message{conv.messageCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export { ConversationList };
