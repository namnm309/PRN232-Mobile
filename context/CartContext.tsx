import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const CART_KEY = '@nongxanh:cart';

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  image: { uri: string } | number;
  weight?: string;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

async function loadCart(): Promise<CartItem[]> {
  try {
    const json = await AsyncStorage.getItem(CART_KEY);
    if (json) {
      const parsed = JSON.parse(json) as CartItem[];
      // image có thể là { uri: string } - JSON ok, hoặc number (require) - không serialize được
      // Khi load từ storage, image sẽ là { uri } nếu đã lưu. Nếu là number thì mất khi load.
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    // ignore
  }
  return [];
}

async function saveCart(items: CartItem[]) {
  try {
    // Chỉ lưu các field có thể serialize (bỏ qua image dạng number)
    const toSave = items.map(({ image, ...rest }) => ({
      ...rest,
      image: typeof image === 'object' && image?.uri ? image : { uri: '' },
    }));
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(toSave));
  } catch {
    // ignore
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadCart().then((loaded) => {
      setItems(loaded);
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveCart(items);
    }
  }, [items, isLoaded]);

  const addItem = useCallback(
    (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
      const qty = item.quantity ?? 1;
      setItems((prev) => {
        const idx = prev.findIndex((i) => i.productId === item.productId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
          return next;
        }
        return [...prev, { ...item, quantity: qty }];
      });
    },
    []
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.productId === productId
            ? { ...i, quantity: Math.max(0, i.quantity + delta) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      subtotal,
    }),
    [items, count, addItem, removeItem, updateQuantity, clearCart, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
