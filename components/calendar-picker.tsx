'use client';

import { useState, useEffect, useRef } from 'react';

interface CalendarPickerProps {
  selectedDate: string; // YYYY-MM-DD
  onSelect: (date: string) => void;
  onClose: () => void;
}

const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function CalendarPicker({ selectedDate, onSelect, onClose }: CalendarPickerProps) {
  const today = new Date().toISOString().split('T')[0];
  const ref = useRef<HTMLDivElement>(null);

  const initial = new Date(selectedDate + 'T00:00:00');
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  // Close on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    // Delay so the opening click doesn't immediately close it
    const id = setTimeout(() => document.addEventListener('mousedown', handle), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('mousedown', handle);
    };
  }, [onClose]);

  const todayObj = new Date(today + 'T00:00:00');
  const atOrAfterTodayMonth =
    viewYear > todayObj.getFullYear() ||
    (viewYear === todayObj.getFullYear() && viewMonth >= todayObj.getMonth());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (atOrAfterTodayMonth) return;
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  // Build the day grid: nulls for empty leading cells, then day numbers
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-2xl shadow-2xl z-50 p-4 select-none"
    >
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-foreground">{monthLabel}</span>
        <button
          onClick={nextMonth}
          disabled={atOrAfterTodayMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map(d => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />;

          const cellDate = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isFuture = cellDate > today;
          const isSelected = cellDate === selectedDate;
          const isTodayCell = cellDate === today;

          return (
            <button
              key={idx}
              onClick={() => { if (!isFuture) { onSelect(cellDate); onClose(); } }}
              disabled={isFuture}
              className={`h-8 w-full flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                isSelected
                  ? 'bg-primary text-primary-foreground font-bold'
                  : isTodayCell
                  ? 'ring-2 ring-primary text-primary font-bold hover:bg-secondary'
                  : isFuture
                  ? 'text-muted-foreground/25 cursor-not-allowed'
                  : 'text-foreground hover:bg-secondary'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Footer shortcut */}
      <div className="mt-3 pt-3 border-t border-border flex justify-center">
        <button
          onClick={() => { onSelect(today); onClose(); }}
          className="text-xs font-medium text-primary hover:underline"
        >
          Go to Today
        </button>
      </div>
    </div>
  );
}
