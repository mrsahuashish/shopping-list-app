import ShoppingListApp from '@/components/shopping-list-app';
import { AuthProvider } from '@/lib/auth-context';

export default function Page() {
  return (
    <AuthProvider>
      <main>
        <ShoppingListApp />
      </main>
    </AuthProvider>
  )
}
