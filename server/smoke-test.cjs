/**
 * End-to-end API smoke test (no browser).
 * Expects API running on PORT (default 4000) and seeded DB.
 */
const PORT = process.env.PORT || 4000;
const BASE = `http://localhost:${PORT}/api`;

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  console.log('Smoke test against', BASE);

  const health = await req('GET', '/health');
  console.log('✓ health', health.restaurant);

  const menu = await req('GET', '/menu');
  if (!menu.categories?.length) throw new Error('No categories');
  const firstItem = menu.categories.flatMap((c) => c.items)[0];
  if (!firstItem) throw new Error('No menu items');
  console.log('✓ menu', menu.categories.length, 'categories, first item:', firstItem.name);

  const signupEmail = `smoke_${Date.now()}@example.com`;
  const auth = await req('POST', '/auth/signup', {
    email: signupEmail,
    password: 'smoke1234',
    name: 'Smoke Tester',
    phone: '555-9999',
  });
  console.log('✓ signup', auth.user.email);

  const me = await req('GET', '/auth/me', null, auth.token);
  console.log('✓ me', me.user.name);

  const login = await req('POST', '/auth/login', {
    email: 'demo@nonnas.example',
    password: 'demo1234',
  });
  console.log('✓ demo login', login.user.email);

  const order = await req(
    'POST',
    '/orders',
    {
      items: [{ menuItemId: firstItem.id, quantity: 2 }],
      customerName: 'Smoke Tester',
      customerPhone: '555-9999',
      customerEmail: signupEmail,
      fulfillment: 'pickup',
      notes: 'smoke test order',
    },
    auth.token
  );
  console.log('✓ place order', order.order.id, 'total cents', order.order.totalCents);

  const history = await req('GET', '/orders/mine', null, auth.token);
  if (!history.orders.some((o) => o.id === order.order.id)) {
    throw new Error('Order missing from history');
  }
  console.log('✓ order history', history.orders.length, 'order(s)');

  console.log('\nAll smoke checks passed.');
}

main().catch((err) => {
  console.error('SMOKE FAILED:', err.message);
  process.exit(1);
});
