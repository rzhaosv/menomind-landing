import React from 'react';

export interface GreetingProps {
  name: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function Greeting({ name }: GreetingProps) {
  const greeting = getGreeting();
  const date = formatDate();
  const firstName = name.split(' ')[0] || 'there';

  return (
    <div className="mb-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">
        {greeting}, {firstName}
      </h1>
      <p className="text-gray-500 mt-1">{date}</p>
    </div>
  );
}

export { Greeting };
