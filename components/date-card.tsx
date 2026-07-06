'use client';

import { useState } from 'react';
import CalendarPicker from './calendar-picker';

interface DateCardProps {
  date: string;
  isToday: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSelectDate: (date: string) => void;
}

function getRelativeLabel(date: string, today: string): string {
  const diffMs = new Date(today + 'T00:00:00').getTime() - new Date(date + 'T00:00:00').getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 6) return `${diffDays} days ago`;
  return '';
}

export default function DateCard({ date, isToday, onPrev, onNext, onSelectDate }: DateCardProps) {
  const today = new Date().toISOString().split('T')[0];
  const [calendarOpen, setCalendarOpen] = useState(false);

  const dateObj = new Date(date + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const label = getRelativeLabel(date, today);

  return (
    <div className="relative">
      <div className="flex items-center gap-1 px-1 py-1.5">
        {/* Prev day */}
        <button
          onClick={onPrev}
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="Previous day"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Date display — tap to open calendar */}
        <button
          onClick={() => setCalendarOpen(o => !o)}
          className={`flex-1 flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg border transition-colors ${
            calendarOpen
              ? 'bg-primary/10 border-primary/40 text-primary'
              : 'bg-accent/20 border-accent/40 hover:border-primary/40 hover:bg-accent/30'
          }`}
          aria-label="Open date picker"
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs font-semibold text-foreground">{formattedDate}</span>
          {label && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
              isToday
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground'
            }`}>
              {label}
            </span>
          )}
          <svg className="w-3 h-3 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Next day */}
        <button
          onClick={onNext}
          disabled={isToday}
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next day"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar dropdown */}
      {calendarOpen && (
        <CalendarPicker
          selectedDate={date}
          onSelect={(d) => { onSelectDate(d); }}
          onClose={() => setCalendarOpen(false)}
        />
      )}
    </div>
  );
}
