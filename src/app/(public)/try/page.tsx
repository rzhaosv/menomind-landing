'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useCallback } from 'react';
import { ChatInterface } from '@/components/chat/chat-interface';
import Link from 'next/link';

function TryChatContent() {
  const searchParams = useSearchParams();
  const symptomsParam = searchParams.get('symptoms');
  const levelParam = searchParams.get('level');

  const [copied, setCopied] = useState(false);

  const handleEmailClick = useCallback(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      navigator.clipboard.writeText('hello@menomind.app').then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      window.location.href = 'mailto:hello@menomind.app';
    }
  }, []);

  const quizContext =
    symptomsParam && symptomsParam.length > 0
      ? {
          symptoms: symptomsParam.split(',').map((s) => s.trim()),
          level: levelParam || 'unknown',
        }
      : undefined;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Minimal header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center">
            <span className="text-white text-sm font-bold">M</span>
          </div>
          <span className="font-semibold text-brand-dark">MenoMind</span>
        </Link>
        <Link
          href="/pricing"
          className="text-sm text-brand-purple font-medium hover:underline"
        >
          Get your full plan — $1
        </Link>
      </header>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          anonymous
          quizContext={quizContext}
        />
      </div>

      {/* Footer */}
      <footer className="px-4 py-2 bg-white border-t border-gray-200 text-center">
        <p className="text-xs text-gray-400">
          Questions?{' '}
          <button
            onClick={handleEmailClick}
            className="text-brand-purple hover:underline cursor-pointer bg-transparent border-none p-0 text-xs"
          >
            {copied ? 'Copied!' : 'hello@menomind.app'}
          </button>
        </p>
      </footer>
    </div>
  );
}

export default function TryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full" />
        </div>
      }
    >
      <TryChatContent />
    </Suspense>
  );
}
