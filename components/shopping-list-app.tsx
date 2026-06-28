'use client';

import { useEffect, useState } from 'react';
import { ShoppingItem, subscribeToShoppingList, toggleItem, deleteItem, addItem, initializeShoppingList, categoryEmojis } from '@/lib/firebase';
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

type TabType = 'today' | 'all' | 'done';
type AuthScreen = 'welcome' | 'register' | 'login';

export default function ShoppingListApp() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authScreen, setAuthScreen] = useState<AuthScreen>('welcome');

  const dateStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        initializeShoppingList(dateStr).then(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }
  }, [dateStr, user, authLoading]);

  useEffect(() => {
    const unsubscribe = subscribeToShoppingList(dateStr, (newItems) => {
      setItems(newItems);
    });
    return () => unsubscribe();
  }, [dateStr]);

  const handleAddItem = async (name: string, category: string) => {
    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      name,
      category,
      done: false,
      createdAt: Date.now(),
    };
    await addItem(dateStr, newItem);
    setShowAddModal(false);
    setToastMessage(`Added "${name}" to your list`);
  };

  const handleToggleItem = async (itemId: string) => {
    await toggleItem(dateStr, itemId);
    const item = items.find(i => i.id === itemId);
    if (item) {
      setToastMessage(item.done ? `"${item.name}" moved to today` : `"${item.name}" completed`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteItemId) {
      const item = items.find(i => i.id === deleteItemId);
      await deleteItem(dateStr, deleteItemId);
      setDeleteItemId(null);
      if (item) {
        setToastMessage(`Deleted "${item.name}"`);
      }
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
      <Header onLogout={handleLogout} />
      
      <div className="flex-1 overflow-y-auto pb-20 px-4 pt-4 md:max-w-2xl md:mx-auto md:w-full">
        <DateCard date={dateStr} />
        
        <div className="mt-4 p-3 bg-secondary rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-foreground">Progress</span>
            <span className="text-xs text-muted-foreground">{completedItems}/{totalItems}</span>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {Object.keys(groupedItems).length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-12 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <p className="text-muted-foreground">
              {activeTab === 'done' ? 'No completed items yet.' : 'No items to show.'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-primary hover:underline text-sm font-medium"
            >
              Add your first item
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                  <span>{categoryEmojis[category] || '📦'}</span>
                  <span>{category}</span>
                </h3>
                <div className="space-y-2">
                  {categoryItems.map(item => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onToggle={() => handleToggleItem(item.id)}
                      onDelete={() => setDeleteItemId(item.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl shadow-lg hover:shadow-xl transition-shadow"
      >
        +
      </button>

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

      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}
