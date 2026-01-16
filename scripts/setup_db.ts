import Database from 'better-sqlite3';
import path from "path";

const dbPath = path.join(process.cwd(), 'ecomm.db');
const db = new Database(dbPath);

const initSql = `
-- 1. ÖNCE GÜVENLİK KİLİDİNİ KAPAT (Silme işlemi için şart)
PRAGMA foreign_keys = OFF;

-- 2. TABLOLARI TEMİZLE (Sıralama fark etmez çünkü kilit kapalı)
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS auth_logs;

-- 3. GÜVENLİK KİLİDİNİ TEKRAR AÇ (Yaratma işlemi için)
PRAGMA foreign_keys = ON;

-- 4. TABLOLARI OLUŞTUR

-- USERS
CREATE TABLE users (
    user_id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    gender TEXT,
    city TEXT,
    signup_date TIMESTAMP
);

-- PRODUCTS
CREATE TABLE products (
    product_id TEXT PRIMARY KEY,
    product_name TEXT,
    category TEXT,
    brand TEXT,
    price REAL,
    rating REAL
);

-- ORDERS
CREATE TABLE orders (
    order_id TEXT PRIMARY KEY,
    user_id TEXT,
    order_date TIMESTAMP,
    order_status TEXT,
    total_amount REAL,
    FOREIGN KEY(user_id) REFERENCES users(user_id)
);

-- ORDER ITEMS (3NF - user_id yok)
CREATE TABLE order_items (
    order_item_id TEXT PRIMARY KEY,
    order_id TEXT,
    product_id TEXT,
    quantity INTEGER,
    item_price REAL,
    item_total REAL,
    FOREIGN KEY(order_id) REFERENCES orders(order_id),
    FOREIGN KEY(product_id) REFERENCES products(product_id)
);

-- EVENTS
CREATE TABLE events (
    event_id TEXT PRIMARY KEY,
    user_id TEXT,
    product_id TEXT,
    event_type TEXT,
    event_timestamp TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(user_id),
    FOREIGN KEY(product_id) REFERENCES products(product_id)
);

-- REVIEWS
CREATE TABLE reviews (
    review_id TEXT PRIMARY KEY,
    order_id TEXT,
    product_id TEXT,
    user_id TEXT,
    rating INTEGER,
    review_text TEXT,
    review_date TIMESTAMP,
    FOREIGN KEY(order_id) REFERENCES orders(order_id),
    FOREIGN KEY(product_id) REFERENCES products(product_id),
    FOREIGN KEY(user_id) REFERENCES users(user_id)
);

-- AUDIT LOGS
CREATE TABLE audit_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('CREATE', 'UPDATE', 'DELETE')),
    performed_by TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    old_values TEXT,
    new_values TEXT
);

-- AUTH LOGS
CREATE TABLE auth_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    event_type TEXT NOT NULL CHECK(event_type IN ('LOGIN', 'LOGOUT', 'REGISTER', 'FAILED_LOGIN')),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    details TEXT
);
`;

console.log("⏳ Initializing Database...");

try {
  db.exec(initSql);
  console.log("✅ Database initialized successfully at: " + dbPath);
  console.log("ℹ️  Foreign Keys temporarily disabled for cleanup, then re-enabled.");
} catch (error) {
  console.error("❌ Error initializing database:", error);
}
