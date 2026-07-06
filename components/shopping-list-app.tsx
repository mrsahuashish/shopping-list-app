'use client';

import { useEffect, useRef, useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ShoppingItem, subscribeToShoppingList, toggleItem, deleteItem, addItem, updateItem, reorderItems, initializeShoppingList, categoryEmojis } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import Header from './header';
import TabBar from './tab-bar';
import DateCard from './date-card';
import SortableItemRow from './sortable-item-row';
import AddItemModal from './add-item-modal';
import DeleteConfirmModal from './delete-confirm-modal';
import Toast from './toast';
import WelcomeScreen from './welcome-screen';
import RegisterScreen from './register-screen';
import LoginScreen from './login-screen';
import EmailVerificationScreen from './email-verification-screen';
import EditItemModal from './edit-item-modal';
import ImageViewModal from './image-view-modal';

type TabType = 'today' | 'all' | 'done';
type AuthScreen = 'welcome' | 'register' | 'login';

export default function ShoppingListApp() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const itemsRef = useRef<ShoppingItem[]>([]); // always holds latest items for drag handler
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<ShoppingItem | null>(null);
  const [viewImageItem, setViewImageItem] = useState<ShoppingItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateLoading, setDateLoading] = useState(false);
  const [authScreen, setAuthScreen] = useState<AuthScreen>('welcome');

  const today = new Date().toISOString().split('T')[0];
  const [dateStr, setDateStr] = useState(today);
  const isToday = dateStr === today;

  const goToPrevDay = () => {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setDateStr(d.toISOString().split('T')[0]);
  };

  const goToNextDay = () => {
    if (isToday) return;
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    setDateStr(d.toISOString().split('T')[0]);
  };

  // On date change: clear items, reset filters, switch to All tab on past dates
  useEffect(() => {
    setItems([]);
    itemsRef.current = [];
    setSelectedCategory(null);
    setDateLoading(true);
    // Past dates: default to All so done items aren't hidden by the Today (pending) filter
    setActiveTab(dateStr === today ? 'today' : 'all');
  }, [dateStr]); // today is stable within a session — intentionally omitted from deps

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        if (isToday) {
          // Only auto-create the document for today
          initializeShoppingList(dateStr, user.uid).then(() => setLoading(false));
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
  }, [dateStr, user, authLoading, isToday]);

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToShoppingList(dateStr, user.uid, (newItems) => {
        setItems(newItems);
        itemsRef.current = newItems;
        setDateLoading(false); // data arrived — clear the navigation loading state
      });
      return () => unsubscribe();
    }
  }, [dateStr, user]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSelectedCategory(null);
  };

  const handleCategoryDragEnd = async (event: DragEndEvent, category: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !user) return;

    // Use itemsRef so we always have the freshest items even if a snapshot fired mid-drag
    const currentItems = itemsRef.current;

    // Visible items for this category in the current display
    const currentTabItems = currentItems.filter(item => {
      if (activeTab === 'done') return item.done;
      if (activeTab === 'today') return !item.done;
      return true;
    });
    const visibleItems = currentTabItems.filter(i => i.category === category);

    const oldIndex = visibleItems.findIndex(i => i.id === active.id);
    const newIndex = visibleItems.findIndex(i => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newVisibleOrder = arrayMove(visibleItems, oldIndex, newIndex);
    const visibleIdSet = new Set(visibleItems.map(i => i.id));

    // Rebuild category order — preserve non-visible items (e.g. done items on Today tab)
    const allCategoryItems = currentItems.filter(i => i.category === category);
    let vi = 0;
    const newCategoryItems = allCategoryItems.map(item =>
      visibleIdSet.has(item.id) ? newVisibleOrder[vi++] : item
    );

    // Rebuild full items array
    let ci = 0;
    const newAllItems = currentItems.map(item =>
      item.category === category ? newCategoryItems[ci++] : item
    );

    // Optimistic update so the UI feels instant
    setItems(newAllItems);
    itemsRef.current = newAllItems;

    try {
      await reorderItems(dateStr, user.uid, newAllItems);
    } catch {
      // Rollback on failure so next load shows the correct (pre-drag) order
      setItems(currentItems);
      itemsRef.current = currentItems;
      setToastMessage('Could not save order. Please try again.');
    }
  };

  const handleAddItem = async (name: string, category: string, imageUrl?: string) => {
    if (!user) return;
    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      name,
      category,
      done: false,
      createdAt: Date.now(),
      ...(imageUrl ? { imageUrl } : {}),
    };
    await addItem(dateStr, user.uid, newItem);
    setShowAddModal(false);
    setToastMessage(`Added "${name}" to your list`);
  };

  const handleToggleItem = async (itemId: string) => {
    if (!user) return;
    await toggleItem(dateStr, user.uid, itemId);
    const item = items.find(i => i.id === itemId);
    if (item) {
      setToastMessage(item.done ? `"${item.name}" moved to today` : `"${item.name}" completed`);
    }
  };

  const handleUpdateItem = async (id: string, name: string, category: string, imageUrl?: string) => {
    if (!user) return;
    await updateItem(dateStr, user.uid, id, name, category, imageUrl);
    setEditItem(null);
    setToastMessage(`Updated "${name}"`);
  };

  const handleDeleteConfirm = async () => {
    if (!user || !deleteItemId) return;
    const item = items.find(i => i.id === deleteItemId);
    await deleteItem(dateStr, user.uid, deleteItemId);
    setDeleteItemId(null);
    if (item) {
      setToastMessage(`Deleted "${item.name}"`);
    }
  };

  // Items matching the active tab
  const tabItems = items.filter(item => {
    if (activeTab === 'done') return item.done;
    if (activeTab === 'today') return !item.done;
    return true;
  });

  // Unique categories present in the current tab, preserving insertion order
  const availableCategories = Array.from(new Set(tabItems.map(i => i.category)));

  // Further filter by selected category
  const filteredItems = selectedCategory
    ? tabItems.filter(i => i.category === selectedCategory)
    : tabItems;

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  const totalItems = items.length;
  const completedItems = items.filter(i => i.done).length;
  const progressPercent = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-border rounded-full animate-spin border-t-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (authScreen === 'welcome') {
      return (
        <WelcomeScreen
          onSignUp={() => setAuthScreen('register')}
          onLogin={() => setAuthScreen('login')}
        />
      );
    }
    if (authScreen === 'register') {
      return (
        <RegisterScreen
          onSuccess={() => setAuthScreen('welcome')}
          onBack={() => setAuthScreen('welcome')}
        />
      );
    }
    if (authScreen === 'login') {
      return (
        <LoginScreen
          onSuccess={() => setAuthScreen('welcome')}
          onBack={() => setAuthScreen('welcome')}
        />
      );
    }
  }

  if (user && !user.emailVerified) {
    return <EmailVerificationScreen email={user.email} uid={user.uid} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-border rounded-full animate-spin border-t-primary" />
          <p className="text-muted-foreground">Loading your list...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    setAuthScreen('welcome');
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header onLogout={handleLogout} onAddItem={() => setShowAddModal(true)} />

      <div className="flex-1 overflow-y-auto pb-16 px-4 pt-3 md:max-w-2xl md:mx-auto md:w-full">
        <DateCard
          date={dateStr}
          isToday={isToday}
          onPrev={goToPrevDay}
          onNext={goToNextDay}
          onSelectDate={setDateStr}
        />

        {/* Progress bar */}
        <div className="mt-3 px-3 py-2.5 bg-secondary rounded-lg">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Progress</span>
            <span className="text-xs text-muted-foreground">{completedItems} / {totalItems} items</span>
          </div>
          <div className="w-full bg-border rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Date navigation loading indicator */}
        {dateLoading && (
          <div className="flex items-center justify-center gap-2 mt-6 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-border rounded-full animate-spin border-t-primary" />
            <span className="text-sm">Loading items…</span>
          </div>
        )}

        {/* Category filter pills — only shown when 2+ categories exist and data is ready */}
        {!dateLoading && availableCategories.length > 1 && (
          <div className="mt-3 -mx-4 px-4 overflow-x-auto scrollbar-none">
            <div className="flex gap-1.5 pb-0.5" style={{ width: 'max-content' }}>
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                  !selectedCategory
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground'
                }`}
              >
                All
              </button>
              {availableCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                    selectedCategory === cat
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground'
                  }`}
                >
                  <span>{categoryEmojis[cat] || '📦'}</span>
                  <span>{cat}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Item list — hidden while date data is loading */}
        {!dateLoading && (
          Object.keys(groupedItems).length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-16 text-center px-6">
              {selectedCategory ? (
                <>
                  <div className="text-4xl mb-3">{categoryEmojis[selectedCategory] || '📦'}</div>
                  <p className="text-base font-semibold text-foreground mb-1">No items in {selectedCategory}</p>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="mt-3 px-4 py-1.5 text-xs font-medium border border-border rounded-full text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
                  >
                    Clear filter
                  </button>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-3">🛒</div>
                  <p className="text-base font-semibold text-foreground mb-1">
                    {isToday ? 'Your list is empty' : 'No items for this day'}
                  </p>
                  <p className="text-sm text-muted-foreground mb-5">
                    {isToday
                      ? 'Tap the + button in the top-right to add items.'
                      : 'Nothing was added on this date.'}
                  </p>
                  {isToday && (
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Add Item
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {Object.entries(groupedItems).map(([category, categoryItems]) => (
                <div key={category}>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5 px-0.5">
                    <span>{categoryEmojis[category] || '📦'}</span>
                    <span>{category}</span>
                    <span className="ml-auto font-normal normal-case tracking-normal">
                      {categoryItems.length}
                    </span>
                  </h3>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(e) => handleCategoryDragEnd(e, category)}
                  >
                    <SortableContext
                      items={categoryItems.map(i => i.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-1.5">
                        {categoryItems.map(item => (
                          <SortableItemRow
                            key={item.id}
                            item={item}
                            onToggle={() => handleToggleItem(item.id)}
                            onDelete={() => setDeleteItemId(item.id)}
                            onEdit={() => setEditItem(item)}
                            onViewImage={item.imageUrl ? () => setViewImageItem(item) : undefined}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />

      {showAddModal && (
        <AddItemModal
          onAdd={handleAddItem}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {deleteItemId && (
        <DeleteConfirmModal
          itemName={items.find(i => i.id === deleteItemId)?.name || 'item'}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteItemId(null)}
        />
      )}

      {editItem && (
        <EditItemModal
          item={editItem}
          onSave={handleUpdateItem}
          onClose={() => setEditItem(null)}
        />
      )}

      {viewImageItem?.imageUrl && (
        <ImageViewModal
          imageUrl={viewImageItem.imageUrl}
          itemName={viewImageItem.name}
          onClose={() => setViewImageItem(null)}
        />
      )}

      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}
