import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { MenuItem } from '../lib/api';

export type CartLine = {
  menuItemId: number;
  name: string;
  priceCents: number;
  imageEmoji: string;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  itemCount: number;
  subtotalCents: number;
  addItem: (item: MenuItem, qty?: number) => void;
  setQuantity: (menuItemId: number, quantity: number) => void;
  removeItem: (menuItemId: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'nonnas_cart_v1';

function loadCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(loadCart);

  const persist = useCallback((next: CartLine[]) => {
    setLines(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addItem = useCallback(
    (item: MenuItem, qty = 1) => {
      persist(
        (() => {
          const existing = lines.find((l) => l.menuItemId === item.id);
          if (existing) {
            return lines.map((l) =>
              l.menuItemId === item.id
                ? { ...l, quantity: Math.min(99, l.quantity + qty) }
                : l
            );
          }
          return [
            ...lines,
            {
              menuItemId: item.id,
              name: item.name,
              priceCents: item.priceCents,
              imageEmoji: item.imageEmoji,
              quantity: qty,
            },
          ];
        })()
      );
    },
    [lines, persist]
  );

  const setQuantity = useCallback(
    (menuItemId: number, quantity: number) => {
      if (quantity < 1) {
        persist(lines.filter((l) => l.menuItemId !== menuItemId));
        return;
      }
      persist(
        lines.map((l) =>
          l.menuItemId === menuItemId
            ? { ...l, quantity: Math.min(99, quantity) }
            : l
        )
      );
    },
    [lines, persist]
  );

  const removeItem = useCallback(
    (menuItemId: number) => {
      persist(lines.filter((l) => l.menuItemId !== menuItemId));
    },
    [lines, persist]
  );

  const clear = useCallback(() => persist([]), [persist]);

  const itemCount = useMemo(
    () => lines.reduce((s, l) => s + l.quantity, 0),
    [lines]
  );
  const subtotalCents = useMemo(
    () => lines.reduce((s, l) => s + l.priceCents * l.quantity, 0),
    [lines]
  );

  const value = useMemo(
    () => ({
      lines,
      itemCount,
      subtotalCents,
      addItem,
      setQuantity,
      removeItem,
      clear,
    }),
    [lines, itemCount, subtotalCents, addItem, setQuantity, removeItem, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
