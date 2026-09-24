const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export type MenuItem = {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  priceCents: number;
  imageEmoji: string;
  available: number;
  sortOrder?: number;
};

export type Category = {
  id: number;
  name: string;
  sortOrder: number;
  items: MenuItem[];
};

export type User = {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  createdAt: string;
};

export type OrderItem = {
  id: number;
  menuItemId: number | null;
  name: string;
  unitPriceCents: number;
  quantity: number;
};

export type Order = {
  id: number;
  userId: number | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  fulfillment: 'pickup' | 'delivery';
  address: string | null;
  notes: string | null;
  status: string;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  createdAt: string;
  items: OrderItem[];
};

function authHeaders(token?: string | null): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function parse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

export async function fetchMenu(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/api/menu`);
  const data = await parse<{ categories: Category[] }>(res);
  return data.categories;
}

export async function signup(body: {
  email: string;
  password: string;
  name: string;
  phone?: string;
}): Promise<{ token: string; user: User }> {
  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return parse(res);
}

export async function login(body: {
  email: string;
  password: string;
}): Promise<{ token: string; user: User }> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return parse(res);
}

export async function fetchMe(token: string): Promise<User> {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: authHeaders(token),
  });
  const data = await parse<{ user: User }>(res);
  return data.user;
}

export async function placeOrder(
  body: {
    items: { menuItemId: number; quantity: number }[];
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    fulfillment: 'pickup' | 'delivery';
    address?: string;
    notes?: string;
  },
  token?: string | null
): Promise<Order> {
  const res = await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  const data = await parse<{ order: Order }>(res);
  return data.order;
}

export async function fetchMyOrders(token: string): Promise<Order[]> {
  const res = await fetch(`${API_BASE}/api/orders/mine`, {
    headers: authHeaders(token),
  });
  const data = await parse<{ orders: Order[] }>(res);
  return data.orders;
}

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}
