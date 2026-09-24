/**
 * Initialize SQLite schema and seed menu + demo user for Nonna's Kitchen.
 * Run: npm run init-db  (or npm run seed)
 */
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'data.db');
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Removed existing database:', dbPath);
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price_cents INTEGER NOT NULL,
    image_emoji TEXT DEFAULT '🍽️',
    available INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    fulfillment TEXT NOT NULL CHECK (fulfillment IN ('pickup', 'delivery')),
    address TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'placed',
    subtotal_cents INTEGER NOT NULL,
    tax_cents INTEGER NOT NULL,
    total_cents INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INTEGER,
    name TEXT NOT NULL,
    unit_price_cents INTEGER NOT NULL,
    quantity INTEGER NOT NULL
  );
`);

const categories = [
  { name: 'Antipasti', sort_order: 1 },
  { name: 'Pizza', sort_order: 2 },
  { name: 'Pasta', sort_order: 3 },
  { name: 'Secondi', sort_order: 4 },
  { name: 'Dolci & Drinks', sort_order: 5 },
];

const insertCat = db.prepare(
  'INSERT INTO categories (name, sort_order) VALUES (?, ?)'
);
const catIds = {};
for (const c of categories) {
  const r = insertCat.run(c.name, c.sort_order);
  catIds[c.name] = r.lastInsertRowid;
}

const items = [
  // Antipasti
  ['Antipasti', 'Bruschetta Classica', 'Toasted ciabatta, marinated tomatoes, basil, garlic oil', 899, '🍅', 1],
  ['Antipasti', 'Caprese Plate', 'Fresh mozzarella, heirloom tomatoes, balsamic glaze', 1099, '🧀', 2],
  ['Antipasti', 'Calamari Fritti', 'Lightly fried squid, lemon aioli, marinara', 1299, '🦑', 3],
  ['Antipasti', 'Soup of the Day', 'Ask your server — always housemade', 699, '🥣', 4],
  // Pizza
  ['Pizza', 'Margherita', 'San Marzano tomato, fresh mozzarella, basil', 1499, '🍕', 1],
  ['Pizza', 'Pepperoni Classico', 'Tomato, mozzarella, cup-and-char pepperoni', 1699, '🍕', 2],
  ['Pizza', 'Funghi Tartufo', 'Roasted mushrooms, fontina, truffle oil, thyme', 1899, '🍄', 3],
  ['Pizza', 'Diavola', 'Spicy salami, chili honey, mozzarella, oregano', 1799, '🌶️', 4],
  ['Pizza', 'Prosciutto & Arugula', 'White pie, prosciutto, arugula, shaved parmesan', 1999, '🥗', 5],
  // Pasta
  ['Pasta', 'Spaghetti Pomodoro', 'Simple tomato sauce, basil, EVOO, pecorino', 1499, '🍝', 1],
  ['Pasta', 'Fettuccine Alfredo', 'Creamy parmesan sauce, black pepper', 1599, '🍝', 2],
  ['Pasta', 'Penne Arrabbiata', 'Spicy tomato, garlic, chili flake', 1499, '🍝', 3],
  ['Pasta', 'Lasagna della Nonna', 'Beef ragù, béchamel, mozzarella, baked', 1799, '🥘', 4],
  ['Pasta', 'Ravioli Ricotta', 'Spinach-ricotta pillows, brown butter sage', 1699, '🥟', 5],
  // Secondi
  ['Secondi', 'Chicken Parmesan', 'Breaded cutlet, marinara, mozzarella, side pasta', 1899, '🍗', 1],
  ['Secondi', 'Salmon al Limone', 'Pan-seared salmon, lemon butter, seasonal veg', 2199, '🐟', 2],
  ['Secondi', 'Eggplant Parmigiana', 'Layers of eggplant, tomato, mozzarella', 1599, '🍆', 3],
  // Dolci & Drinks
  ['Dolci & Drinks', 'Tiramisu', 'Espresso-soaked ladyfingers, mascarpone', 799, '☕', 1],
  ['Dolci & Drinks', 'Cannoli (2)', 'Crisp shells, sweet ricotta, chocolate chips', 699, '🍪', 2],
  ['Dolci & Drinks', 'Gelato Scoop', 'Rotating flavors — ask for today\'s selection', 499, '🍨', 3],
  ['Dolci & Drinks', 'Italian Soda', 'Blood orange, lemon, or blackberry', 399, '🥤', 4],
  ['Dolci & Drinks', 'Espresso / Americano', 'Single or double', 349, '☕', 5],
  ['Dolci & Drinks', 'House Red / White (glass)', 'Ask for current pours', 899, '🍷', 6],
];

const insertItem = db.prepare(`
  INSERT INTO menu_items (category_id, name, description, price_cents, image_emoji, sort_order)
  VALUES (?, ?, ?, ?, ?, ?)
`);

for (const [cat, name, desc, price, emoji, sort] of items) {
  insertItem.run(catIds[cat], name, desc, price, emoji, sort);
}

const demoHash = bcrypt.hashSync('demo1234', 10);
db.prepare(
  `INSERT INTO users (email, password_hash, name, phone) VALUES (?, ?, ?, ?)`
).run('demo@nonnas.example', demoHash, 'Demo Guest', '555-0100');

console.log('Database initialized at', dbPath);
console.log(`Seeded ${categories.length} categories, ${items.length} menu items`);
console.log('Demo user: demo@nonnas.example / demo1234');
db.close();
