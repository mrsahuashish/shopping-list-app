'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ShoppingItem } from '@/lib/firebase';

interface ItemRowProps {
  item: ShoppingItem;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onViewImage?: () => void;
}

export default function ItemRow({ item, onToggle, onDelete, onEdit, onViewImage }: ItemRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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
    <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:bg-secondary transition-colors">
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          item.done ? 'bg-primary border-primary' : 'border-border hover:border-primary'
        }`}
      >
        {item.done && <span className="text-white text-xs">✓</span>}
      </button>

      {/* Thumbnail — tap to view full image */}
      {item.imageUrl && (
        <button
          type="button"
          onClick={() => onViewImage?.()}
          className="flex-shrink-0 w-10 h-10 rounded-md overflow-hidden border border-border hover:opacity-80 transition-opacity"
          aria-label="View photo"
        >
          <Image
            src={item.imageUrl}
            alt={item.name}
            width={40}
            height={40}
            className="object-cover w-full h-full"
            unoptimized
          />
        </button>
      )}

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${
          item.done ? 'line-through text-muted-foreground' : 'text-foreground'
        }`}>
          {item.name}
        </p>
      </div>

      {/* Three-dot menu */}
      <div ref={menuRef} className="relative flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary transition-colors"
          aria-label="More options"
        >
          {/* Vertical dots icon */}
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-9 bg-card border border-border rounded-xl shadow-xl z-50 w-48 py-1 overflow-hidden">
            {/* Edit */}
            <button
              onClick={() => { setMenuOpen(false); onEdit(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
            >
              <span className="text-base">✏️</span>
              <span>Edit item</span>
            </button>

            {/* Google search */}
            <button
              onClick={handleGoogleSearch}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
            >
              <span className="text-base">🔍</span>
              <span>Search on Google</span>
            </button>

            {/* View photo — only if imageUrl exists */}
            {item.imageUrl && (
              <button
                onClick={() => { setMenuOpen(false); onViewImage?.(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
              >
                <span className="text-base">🖼️</span>
                <span>View photo</span>
              </button>
            )}

            <div className="border-t border-border my-1" />

            {/* Delete */}
            <button
              onClick={() => { setMenuOpen(false); onDelete(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
