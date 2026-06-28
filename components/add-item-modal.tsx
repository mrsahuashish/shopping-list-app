'use client';

import { useState, useEffect } from 'react';
import { categoryEmojis, getUserCategories, saveUserCategory } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';

interface AddItemModalProps {
  onAdd: (name: string, category: string) => void;
  onClose: () => void;
}

const PRESET_CATEGORIES = Object.entries(categoryEmojis);

export default function AddItemModal({ onAdd, onClose }: AddItemModalProps) {
  const { user } = useAuth();
  const [itemName, setItemName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Produce');
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  const [customCategory, setCustomCategory] = useState('');
  const [userCategories, setUserCategories] = useState<string[]>([]);

  // Load this user's saved custom categories
  useEffect(() => {
    if (user) {
      getUserCategories(user.uid).then(setUserCategories);
    }
  }, [user]);

  const selectPreset = (cat: string) => {
    setSelectedCategory(cat);
    setMode('preset');
    setCustomCategory('');
  };

  const activeFinalCategory =
    mode === 'custom' ? customCategory.trim() : selectedCategory;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !activeFinalCategory || !user) return;

    // Persist new custom category to this user's Firestore doc
    if (mode === 'custom' && customCategory.trim()) {
      await saveUserCategory(user.uid, customCategory.trim());
      setUserCategories((prev) =>
        prev.includes(customCategory.trim()) ? prev : [...prev, customCategory.trim()]
      );
    }

    onAdd(itemName.trim(), activeFinalCategory);
    setItemName('');
    setSelectedCategory('Produce');
    setMode('preset');
    setCustomCategory('');
  };

  const canSubmit = !!itemName.trim() && !!activeFinalCategory;

  const presetNames = PRESET_CATEGORIES.map(([cat]) => cat);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50 md:items-center md:justify-center">
      <div className="bg-card w-full md:max-w-sm md:rounded-lg rounded-t-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div>
          <h2 className="text-xl font-bold text-foreground">Add Item</h2>
          <p className="text-sm text-muted-foreground">Add a new item to your shopping list</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Item Name
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g., Milk, Bread..."
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Category
            </label>

            {/* Preset pills */}
            <div className="flex flex-wrap gap-2 mb-2">
              {PRESET_CATEGORIES.map(([cat, emoji]) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => selectPreset(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    mode === 'preset' && selectedCategory === cat
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-foreground hover:bg-secondary'
                  }`}
                >
                  {emoji} {cat}
                </button>
              ))}

              {/* Other preset */}
              <button
                type="button"
                onClick={() => selectPreset('Other')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  mode === 'preset' && selectedCategory === 'Other'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-foreground hover:bg-secondary'
                }`}
              >
                📦 Other
              </button>
            </div>

            {/* User's saved custom categories — only shown if they have any */}
            {userCategories.filter((c) => !presetNames.includes(c) && c !== 'Other').length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Your categories</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {userCategories
                    .filter((c) => !presetNames.includes(c) && c !== 'Other')
                    .map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => selectPreset(cat)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                          mode === 'preset' && selectedCategory === cat
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border text-foreground hover:bg-secondary'
                        }`}
                      >
                        📦 {cat}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Custom category input */}
            <button
              type="button"
              onClick={() => {
                setMode('custom');
                setSelectedCategory('');
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                mode === 'custom'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-dashed border-border text-muted-foreground hover:bg-secondary'
              }`}
            >
              ✏️ Add Custom Category
            </button>

            {mode === 'custom' && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Type your category name..."
                autoFocus
                className="w-full mt-2 px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            )}

            {/* Selected label */}
            {activeFinalCategory && (
              <p className="text-xs text-muted-foreground mt-2">
                Selected:{' '}
                <span className="font-medium text-foreground">
                  {categoryEmojis[activeFinalCategory] ?? '📦'} {activeFinalCategory}
                </span>
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
