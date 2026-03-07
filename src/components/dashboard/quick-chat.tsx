'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';

const SUGGESTIONS = [
  'Why are my hot flashes worse at night?',
  'What foods help with menopause symptoms?',
  'How can I sleep better?',
  'Tell me about HRT options',
];

function QuickChat() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/chat?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push('/chat');
    }
  }

  function handleSuggestion(suggestion: string) {
    router.push(`/chat?q=${encodeURIComponent(suggestion)}`);
  }

  return (
    <Card className="bg-gradient-to-br from-brand-purple to-brand-purple-dark text-white">
      <CardContent>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Ask MenoMind</h3>
            <p className="text-white/70 text-sm">Get instant, personalized answers</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask me anything about menopause..."
              className="w-full px-4 py-3 pr-12 rounded-xl bg-white/15 text-white placeholder:text-white/50 border border-white/20 focus:bg-white/20 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Start chat"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </button>
          </div>
        </form>

        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSuggestion(suggestion)}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/15 hover:bg-white/25 border border-white/20 transition-colors truncate max-w-full"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export { QuickChat };
