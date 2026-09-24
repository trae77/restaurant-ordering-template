/**
 * Express API for restaurant ordering template.
 * Endpoints under /api/*
 */
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const PORT = Number(process.env.PORT) || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me-nonnas-kitchen';
const TAX_RATE = 0.08;
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'data.db');

if (!fs.existsSync(dbPath)) {
  console.error('Database not found. Run: npm run init-db');
  process.exit(1);
}

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

const app = express();
app.use(cors());
app.use(express.json());

function authOptional(req, _res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.slice(7), JWT_SECRET);
    } catch {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

function authRequired(req, res, next) {
  authOptional(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  });
}

function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone || null,
    createdAt: row.created_at,
  };
}

// --- Health ---
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, restaurant: process.env.VITE_RESTAURANT_NAME || "Nonna's Kitchen" });
});

// --- Menu ---
app.get('/api/menu', (_req, res) => {
  const categories = db
    .prepare('SELECT id, name, sort_order AS sortOrder FROM categories ORDER BY sort_order, id')
    .all();
  const items = db
    .prepare(
      `SELECT id, category_id AS categoryId, name, description, price_cents AS priceCents,
              image_emoji AS imageEmoji, available, sort_order AS sortOrder
       FROM menu_items WHERE available = 1 ORDER BY sort_order, id`
    )
    .all();
  const byCat = categories.map((c) => ({
    ...c,
    items: items.filter((i) => i.categoryId === c.id),
  }));
  res.json({ categories: byCat });
});

app.get('/api/menu/items/:id', (req, res) => {
  const item = db
    .prepare(
      `SELECT id, category_id AS categoryId, name, description, price_cents AS priceCents,
              image_emoji AS imageEmoji, available
       FROM menu_items WHERE id = ?`
    )
    .get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
});

// --- Auth ---
app.post('/api/auth/signup', (req, res) => {
  const { email, password, name, phone } = req.body || {};
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'email, password, and name are required' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(String(email).trim());
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  const hash = bcrypt.hashSync(String(password), 10);
  const result = db
    .prepare('INSERT INTO users (email, password_hash, name, phone) VALUES (?, ?, ?, ?)')
    .run(String(email).trim().toLowerCase(), hash, String(name).trim(), phone ? String(phone).trim() : null);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: publicUser(user) });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).trim().toLowerCase());
  if (!user || !bcrypt.compareSync(String(password), user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: publicUser(user) });
});

app.get('/api/auth/me', authRequired, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(401).json({ error: 'User not found' });
  res.json({ user: publicUser(user) });
});

// --- Orders ---
app.post('/api/orders', authOptional, (req, res) => {
  const {
    items,
    customerName,
    customerPhone,
    customerEmail,
    fulfillment,
    address,
    notes,
  } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }
  if (!customerName || !customerPhone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }
  if (!['pickup', 'delivery'].includes(fulfillment)) {
    return res.status(400).json({ error: 'fulfillment must be pickup or delivery' });
  }
  if (fulfillment === 'delivery' && !address) {
    return res.status(400).json({ error: 'Address is required for delivery' });
  }

  const getItem = db.prepare(
    'SELECT id, name, price_cents FROM menu_items WHERE id = ? AND available = 1'
  );

  let subtotal = 0;
  const lines = [];
  for (const line of items) {
    const qty = Number(line.quantity);
    if (!line.menuItemId || !Number.isInteger(qty) || qty < 1 || qty > 99) {
      return res.status(400).json({ error: 'Invalid cart item' });
    }
    const menuItem = getItem.get(line.menuItemId);
    if (!menuItem) {
      return res.status(400).json({ error: `Menu item ${line.menuItemId} not available` });
    }
    subtotal += menuItem.price_cents * qty;
    lines.push({
      menuItemId: menuItem.id,
      name: menuItem.name,
      unitPriceCents: menuItem.price_cents,
      quantity: qty,
    });
  }

  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax;
  const userId = req.user ? req.user.id : null;

  const place = db.transaction(() => {
    const result = db
      .prepare(
        `INSERT INTO orders
          (user_id, customer_name, customer_phone, customer_email, fulfillment, address, notes,
           subtotal_cents, tax_cents, total_cents)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        userId,
        String(customerName).trim(),
        String(customerPhone).trim(),
        customerEmail ? String(customerEmail).trim() : null,
        fulfillment,
        address ? String(address).trim() : null,
        notes ? String(notes).trim() : null,
        subtotal,
        tax,
        total
      );

    const insertLine = db.prepare(
      `INSERT INTO order_items (order_id, menu_item_id, name, unit_price_cents, quantity)
       VALUES (?, ?, ?, ?, ?)`
    );
    for (const line of lines) {
      insertLine.run(result.lastInsertRowid, line.menuItemId, line.name, line.unitPriceCents, line.quantity);
    }
    return result.lastInsertRowid;
  });

  const orderId = place();
  const order = loadOrder(orderId);
  res.status(201).json({ order });
});

function loadOrder(id) {
  const order = db
    .prepare(
      `SELECT id, user_id AS userId, customer_name AS customerName, customer_phone AS customerPhone,
              customer_email AS customerEmail, fulfillment, address, notes, status,
              subtotal_cents AS subtotalCents, tax_cents AS taxCents, total_cents AS totalCents,
              created_at AS createdAt
       FROM orders WHERE id = ?`
    )
    .get(id);
  if (!order) return null;
  order.items = db
    .prepare(
      `SELECT id, menu_item_id AS menuItemId, name, unit_price_cents AS unitPriceCents, quantity
       FROM order_items WHERE order_id = ?`
    )
    .all(id);
  return order;
}

app.get('/api/orders/mine', authRequired, (req, res) => {
  const rows = db
    .prepare(
      `SELECT id FROM orders WHERE user_id = ? ORDER BY datetime(created_at) DESC, id DESC`
    )
    .all(req.user.id);
  res.json({ orders: rows.map((r) => loadOrder(r.id)) });
});

app.get('/api/orders/:id', authOptional, (req, res) => {
  const order = loadOrder(Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  // Guests can only see if they somehow know the id; logged-in users see their own
  if (req.user && order.userId && order.userId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json({ order });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
