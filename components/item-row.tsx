import { ShoppingItem } from '@/lib/firebase';

interface ItemRowProps {
  item: ShoppingItem;
  onToggle: () => void;
  onDelete: () => void;
}

export default function ItemRow({ item, onToggle, onDelete }: ItemRowProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:bg-secondary transition-colors">
      <button
        onClick={onToggle}
        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          item.done
            ? 'bg-primary border-primary'
            : 'border-border hover:border-primary'
        }`}
      >
        {item.done && <span className="text-white text-sm">✓</span>}
      </button>
      
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${
            item.done ? 'line-through text-muted-foreground' : 'text-foreground'
          }`}
        >
          {item.name}
        </p>
      </div>

      <button
        onClick={onDelete}
        className="flex-shrink-0 text-destructive hover:text-destructive/80 transition-colors p-2"
        aria-label="Delete item"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
