'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ShoppingItem, categoryEmojis } from '@/lib/firebase';

interface ItemRowProps {
  item: ShoppingItem;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onViewImage?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  isDragging?: boolean;
}

export default function ItemRow({
  item,
  onToggle,
  onDelete,
  onEdit,
  onViewImage,
  dragHandleProps,
  isDragging,
}: ItemRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [menuOpen]);

  const handleGoogleSearch = () => {
    setMenuOpen(false);
    window.open(
      `https://www.google.com/search?q=${encodeURIComponent(item.name)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div className={`flex items-center gap-2 px-2.5 py-2 bg-card border rounded-lg transition-all ${
      isDragging
        ? 'border-primary/40 shadow-lg ring-1 ring-primary/20 opacity-60'
        : 'border-border/70 hover:border-border'
    }`}>

      {/* Drag handle */}
      {dragHandleProps && (
        <div
          {...dragHandleProps}
          className="flex-shrink-0 p-1 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors touch-none select-none"
          aria-label="Drag to reorder"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
            <circle cx="5.5" cy="3.5" r="1.2" />
            <circle cx="10.5" cy="3.5" r="1.2" />
            <circle cx="5.5" cy="8" r="1.2" />
            <circle cx="10.5" cy="8" r="1.2" />
            <circle cx="5.5" cy="12.5" r="1.2" />
            <circle cx="10.5" cy="12.5" r="1.2" />
          </svg>
        </div>
      )}

      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
          item.done ? 'bg-primary border-primary' : 'border-border hover:border-primary'
        }`}
      >
        {item.done && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Thumbnail */}
      {item.imageUrl && (
        <button
          type="button"
          onClick={() => onViewImage?.()}
          className="flex-shrink-0 w-9 h-9 rounded-md overflow-hidden border border-border/50 hover:opacity-80 transition-opacity"
          aria-label="View photo"
        >
          <Image
            src={item.imageUrl}
            alt={item.name}
            width={36}
            height={36}
            className="object-cover w-full h-full"
            unoptimized
          />
        </button>
      )}

      {/* Name + category */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-snug line-clamp-2 ${
          item.done ? 'line-through text-muted-foreground' : 'text-foreground'
        }`}>
          {item.name}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-0.5">
          {categoryEmojis[item.category] || '📦'} {item.category}
        </p>
      </div>

      {/* Three-dot menu */}
      <div ref={menuRef} className="relative flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-secondary transition-colors"
          aria-label="More options"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-8 bg-card border border-border rounded-xl shadow-xl z-50 w-44 py-1 overflow-hidden">
            <button
              onClick={() => { setMenuOpen(false); onEdit(); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
            >
              <span>✏️</span><span>Edit item</span>
            </button>
            <button
              onClick={handleGoogleSearch}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
            >
              <span>🔍</span><span>Search on Google</span>
            </button>
            {item.imageUrl && (
              <button
                onClick={() => { setMenuOpen(false); onViewImage?.(); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
              >
                <span>🖼️</span><span>View photo</span>
              </button>
            )}
            <div className="border-t border-border my-1" />
            <button
              onClick={() => { setMenuOpen(false); onDelete(); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
