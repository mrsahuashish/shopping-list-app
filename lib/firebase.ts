// Demo shopping list - uses in-memory storage with localStorage persistence
let listData: ShoppingItem[] = [];

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  done: boolean;
  createdAt: number;
}

export interface DateDoc {
  items: ShoppingItem[];
  lastUpdated: number;
}

// Seed data for first launch
export const seedData: Record<string, ShoppingItem[]> = {
  'cleaning-supplies': [
    { id: '1', name: 'Dish soap', category: 'Cleaning Supplies', done: true, createdAt: Date.now() },
    { id: '2', name: 'Laundry detergent', category: 'Cleaning Supplies', done: true, createdAt: Date.now() },
    { id: '3', name: 'Paper towels', category: 'Cleaning Supplies', done: true, createdAt: Date.now() },
    { id: '4', name: 'Sponges', category: 'Cleaning Supplies', done: true, createdAt: Date.now() },
    { id: '5', name: 'Trash bags', category: 'Cleaning Supplies', done: true, createdAt: Date.now() },
    { id: '6', name: 'Bleach', category: 'Cleaning Supplies', done: true, createdAt: Date.now() },
  ],
  'kitchen': [
    { id: '7', name: 'Olive oil', category: 'Kitchen', done: true, createdAt: Date.now() },
    { id: '8', name: 'Salt & pepper', category: 'Kitchen', done: true, createdAt: Date.now() },
    { id: '9', name: 'Flour', category: 'Kitchen', done: true, createdAt: Date.now() },
    { id: '10', name: 'Sugar', category: 'Kitchen', done: true, createdAt: Date.now() },
    { id: '11', name: 'Butter', category: 'Kitchen', done: true, createdAt: Date.now() },
    { id: '12', name: 'Baking powder', category: 'Kitchen', done: true, createdAt: Date.now() },
  ],
  'produce': [
    { id: '13', name: 'Apples', category: 'Produce', done: false, createdAt: Date.now() },
    { id: '14', name: 'Bananas', category: 'Produce', done: false, createdAt: Date.now() },
    { id: '15', name: 'Carrots', category: 'Produce', done: false, createdAt: Date.now() },
    { id: '16', name: 'Broccoli', category: 'Produce', done: false, createdAt: Date.now() },
    { id: '17', name: 'Spinach', category: 'Produce', done: false, createdAt: Date.now() },
    { id: '18', name: 'Tomatoes', category: 'Produce', done: false, createdAt: Date.now() },
  ],
  'meat-fish': [
    { id: '19', name: 'Chicken breast', category: 'Meat & Fish', done: false, createdAt: Date.now() },
    { id: '20', name: 'Ground beef', category: 'Meat & Fish', done: false, createdAt: Date.now() },
    { id: '21', name: 'Salmon fillets', category: 'Meat & Fish', done: false, createdAt: Date.now() },
    { id: '22', name: 'Shrimp', category: 'Meat & Fish', done: false, createdAt: Date.now() },
    { id: '23', name: 'Bacon', category: 'Meat & Fish', done: false, createdAt: Date.now() },
  ],
  'dairy': [
    { id: '24', name: 'Milk', category: 'Dairy', done: false, createdAt: Date.now() },
    { id: '25', name: 'Cheese', category: 'Dairy', done: false, createdAt: Date.now() },
    { id: '26', name: 'Yogurt', category: 'Dairy', done: false, createdAt: Date.now() },
    { id: '27', name: 'Eggs', category: 'Dairy', done: false, createdAt: Date.now() },
    { id: '28', name: 'Cream', category: 'Dairy', done: false, createdAt: Date.now() },
  ],
  'frozen': [
    { id: '29', name: 'Frozen vegetables', category: 'Frozen', done: false, createdAt: Date.now() },
    { id: '30', name: 'Ice cream', category: 'Frozen', done: false, createdAt: Date.now() },
    { id: '31', name: 'Frozen pizza', category: 'Frozen', done: false, createdAt: Date.now() },
    { id: '32', name: 'Frozen berries', category: 'Frozen', done: false, createdAt: Date.now() },
  ],
  'snacks': [
    { id: '33', name: 'Chips', category: 'Snacks', done: false, createdAt: Date.now() },
    { id: '34', name: 'Crackers', category: 'Snacks', done: false, createdAt: Date.now() },
    { id: '35', name: 'Popcorn', category: 'Snacks', done: false, createdAt: Date.now() },
    { id: '36', name: 'Cookies', category: 'Snacks', done: false, createdAt: Date.now() },
    { id: '37', name: 'Granola bars', category: 'Snacks', done: false, createdAt: Date.now() },
  ],
  'beverages': [
    { id: '38', name: 'Coffee', category: 'Beverages', done: false, createdAt: Date.now() },
    { id: '39', name: 'Tea', category: 'Beverages', done: false, createdAt: Date.now() },
    { id: '40', name: 'Orange juice', category: 'Beverages', done: false, createdAt: Date.now() },
    { id: '41', name: 'Sparkling water', category: 'Beverages', done: false, createdAt: Date.now() },
  ],
};

export const categoryEmojis: Record<string, string> = {
  'Cleaning Supplies': '🧹',
  'Kitchen': '🍳',
  'Produce': '🥬',
  'Meat & Fish': '🍗',
  'Dairy': '🧈',
  'Frozen': '🧊',
  'Snacks': '🍪',
  'Beverages': '☕',
};

const listeners: Set<(items: ShoppingItem[]) => void> = new Set();

function notifyListeners() {
  listeners.forEach(callback => callback([...listData]));
  // Save to localStorage
  try {
    localStorage.setItem('shopping_list', JSON.stringify(listData));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

export async function initializeShoppingList(dateStr: string) {
  // Load from localStorage
  try {
    const saved = localStorage.getItem('shopping_list');
    if (saved) {
      listData = JSON.parse(saved);
    } else {
      // First time - seed with demo data
      listData = Object.values(seedData).flat();
      localStorage.setItem('shopping_list', JSON.stringify(listData));
    }
    notifyListeners();
  } catch (error) {
    console.error('Error initializing shopping list:', error);
    // Fallback to seed data
    listData = Object.values(seedData).flat();
    notifyListeners();
  }
}

export async function getShoppingList(dateStr: string): Promise<ShoppingItem[]> {
  return [...listData];
}

export async function addItem(dateStr: string, item: ShoppingItem) {
  listData.push(item);
  notifyListeners();
}

export async function toggleItem(dateStr: string, itemId: string) {
  const item = listData.find(i => i.id === itemId);
  if (item) {
    item.done = !item.done;
    notifyListeners();
  }
}

export async function deleteItem(dateStr: string, itemId: string) {
  listData = listData.filter(item => item.id !== itemId);
  notifyListeners();
}

export function subscribeToShoppingList(dateStr: string, callback: (items: ShoppingItem[]) => void) {
  listeners.add(callback);
  // Immediately call with current data
  callback([...listData]);
  
  // Return unsubscribe function
  return () => {
    listeners.delete(callback);
  };
}
