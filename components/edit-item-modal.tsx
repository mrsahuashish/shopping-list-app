'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ShoppingItem, categoryEmojis, getUserCategories, saveUserCategory } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { uploadToImgBB } from '@/lib/imgbb';

interface EditItemModalProps {
  item: ShoppingItem;
  onSave: (id: string, name: string, category: string, imageUrl?: string) => void;
  onClose: () => void;
}

const PRESET_CATEGORIES = Object.entries(categoryEmojis);

export default function EditItemModal({ item, onSave, onClose }: EditItemModalProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const presetNames = PRESET_CATEGORIES.map(([cat]) => cat);

  const [itemName, setItemName] = useState(item.name);
  const [selectedCategory, setSelectedCategory] = useState(item.category);
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  const [customCategory, setCustomCategory] = useState('');
  const [userCategories, setUserCategories] = useState<string[]>([]);

  // Image state
  const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>(item.imageUrl);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (user) getUserCategories(user.uid).then(setUserCategories);
  }, [user]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const selectPreset = (cat: string) => {
    setSelectedCategory(cat);
    setMode('preset');
    setCustomCategory('');
  };

  const activeFinalCategory = mode === 'custom' ? customCategory.trim() : selectedCategory;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setNewFile(file);
    setPreview(URL.createObjectURL(file));
    setImageRemoved(false);
    setUploadError('');
  };

  const handleRemoveImage = () => {
    if (preview) URL.revokeObjectURL(preview);
    setNewFile(null);
    setPreview(null);
    setCurrentImageUrl(undefined);
    setImageRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const displayImage = preview || currentImageUrl;
  const canSubmit = !!itemName.trim() && !!activeFinalCategory && !uploading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !activeFinalCategory || !user) return;

    if (mode === 'custom' && customCategory.trim()) {
      await saveUserCategory(user.uid, customCategory.trim());
    }

    let finalImageUrl: string | undefined;
    if (newFile) {
      setUploading(true);
      try {
        finalImageUrl = await uploadToImgBB(newFile);
      } catch {
        setUploadError('Upload failed. Previous photo kept.');
        finalImageUrl = item.imageUrl;
      } finally {
        setUploading(false);
      }
    } else if (!imageRemoved) {
      finalImageUrl = currentImageUrl;
    }

    onSave(item.id, itemName.trim(), activeFinalCategory, finalImageUrl);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50 md:items-center md:justify-center">
      <div className="bg-card w-full md:max-w-sm md:rounded-lg rounded-t-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div>
          <h2 className="text-xl font-bold text-foreground">Edit Item</h2>
          <p className="text-sm text-muted-foreground">Update the item details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Item Name</label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Category</label>

            <div className="flex flex-wrap gap-2 mb-2">
              {PRESET_CATEGORIES.map(([cat, emoji]) => (
                <button key={cat} type="button" onClick={() => selectPreset(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    mode === 'preset' && selectedCategory === cat
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-foreground hover:bg-secondary'
                  }`}>
                  {emoji} {cat}
                </button>
              ))}
              <button type="button" onClick={() => selectPreset('Other')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  mode === 'preset' && selectedCategory === 'Other'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-foreground hover:bg-secondary'
                }`}>
                📦 Other
              </button>
            </div>

            {userCategories.filter((c) => !presetNames.includes(c) && c !== 'Other').length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Your categories</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {userCategories.filter((c) => !presetNames.includes(c) && c !== 'Other').map((cat) => (
                    <button key={cat} type="button" onClick={() => selectPreset(cat)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        mode === 'preset' && selectedCategory === cat
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-foreground hover:bg-secondary'
                      }`}>
                      📦 {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button type="button"
              onClick={() => { setMode('custom'); setSelectedCategory(''); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                mode === 'custom'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-dashed border-border text-muted-foreground hover:bg-secondary'
              }`}>
              ✏️ Custom Category
            </button>

            {mode === 'custom' && (
              <input type="text" value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Type category name..." autoFocus
                className="w-full mt-2 px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            )}

            {activeFinalCategory && (
              <p className="text-xs text-muted-foreground mt-2">
                Selected: <span className="font-medium text-foreground">
                  {categoryEmojis[activeFinalCategory] ?? '📦'} {activeFinalCategory}
                </span>
              </p>
            )}
          </div>

          {/* Photo */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Photo <span className="text-muted-foreground font-normal">(optional)</span>
            </label>

            {!displayImage ? (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium">Add Photo</span>
              </button>
            ) : (
              <div className="relative w-full">
                <div className="relative w-full h-40 rounded-lg overflow-hidden border border-border">
                  <Image src={displayImage} alt="Preview" fill className="object-cover" unoptimized />
                </div>
                <div className="absolute top-2 right-2 flex gap-1">
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="px-2 py-1 bg-black/60 hover:bg-black/80 text-white rounded text-xs transition-colors">
                    Change
                  </button>
                  <button type="button" onClick={handleRemoveImage}
                    className="w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center text-sm transition-colors"
                    aria-label="Remove image">
                    ✕
                  </button>
                </div>
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            {uploadError && <p className="text-xs text-destructive mt-1">{uploadError}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 px-4 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!canSubmit}
              className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-medium">
              {uploading ? 'Uploading...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
