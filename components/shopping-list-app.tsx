'use client';

import { useEffect, useState } from 'react';
import { ShoppingItem, subscribeToShoppingList, toggleItem, deleteItem, addItem, updateItem, initializeShoppingList, categoryEmojis } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import Header from './header';
import TabBar from './tab-bar';
import DateCard from './date-card';
import ItemRow from './item-row';
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
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<ShoppingItem | null>(null);
  const [viewImageItem, setViewImageItem] = useState<ShoppingItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authScreen, setAuthScreen] = useState<AuthScreen>('welcome');

  const dateStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        initializeShoppingList(dateStr, user.uid).then(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }
  }, [dateStr, user, authLoading]);

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToShoppingList(dateStr, user.uid, (newItems) => {
        setItems(newItems);
      });
      return () => unsubscribe();
    }
  }, [dateStr, user]);

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

  const filteredItems = items.filter(item => {
    if (activeTab === 'done') return item.done;
    if (activeTab === 'today') return !item.done;
    return true;
  });

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  const totalItems = items.length;
  const completedItems = items.filter(i => i.done).length;
  const progressPercent = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  // Show loading until auth state is determined
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-border rounded-full animate-spin border-t-primary"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth screens if not logged in
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

  // User exists but email not yet verified
  if (user && !user.emailVerified) {
    return <EmailVerificationScreen email={user.email} uid={user.uid} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-border rounded-full animate-spin border-t-primary"></div>
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
        <DateCard date={dateStr} />

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

        {Object.keys(groupedItems).length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-16 text-center px-6">
            <div className="text-5xl mb-3">🛒</div>
            <p className="text-base font-semibold text-foreground mb-1">Your list is empty</p>
            <p className="text-sm text-muted-foreground mb-5">Tap the + button in the top-right to add items.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Add Item
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              <div key={category}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5 px-0.5">
                  <span>{categoryEmojis[category] || '📦'}</span>
                  <span>{category}</span>
                </h3>
                <div className="space-y-1.5">
                  {categoryItems.map(item => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onToggle={() => handleToggleItem(item.id)}
                      onDelete={() => setDeleteItemId(item.id)}
                      onEdit={() => setEditItem(item)}
                      onViewImage={item.imageUrl ? () => setViewImageItem(item) : undefined}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

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
