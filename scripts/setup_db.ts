import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), 'ecomm.db');
const db = new Database(dbPath);

const initSql = `
PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS users;
CREATE TABLE users (
    user_id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    gender TEXT,
    city TEXT,
    signup_date TIMESTAMP
);

DROP TABLE IF EXISTS products;
CREATE TABLE products (
    product_id TEXT PRIMARY KEY,
    product_name TEXT,
    category TEXT,
    brand TEXT,
    price REAL,
    rating REAL
);

DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
    order_id TEXT PRIMARY KEY,
    user_id TEXT,
    order_date TIMESTAMP,
    order_status TEXT,
    total_amount REAL,
    FOREIGN KEY(user_id) REFERENCES users(user_id)
);

DROP TABLE IF EXISTS order_items;
CREATE TABLE order_items (
    order_item_id TEXT PRIMARY KEY,
    order_id TEXT,
    product_id TEXT,
    user_id TEXT,
    quantity INTEGER,
    item_price REAL,
    item_total REAL,
    FOREIGN KEY(order_id) REFERENCES orders(order_id),
    FOREIGN KEY(product_id) REFERENCES products(product_id)
);

DROP TABLE IF EXISTS events;
CREATE TABLE events (
    event_id TEXT PRIMARY KEY,
    user_id TEXT,
    product_id TEXT,
    event_type TEXT,
    event_timestamp TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(user_id),
    FOREIGN KEY(product_id) REFERENCES products(product_id)
);

DROP TABLE IF EXISTS reviews;
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
`;

console.log("Initializing Database...");
db.exec(initSql);
console.log("Database initialized at " + dbPath);
console.log("Please ensure you populate it with data (you can use your python script to load CSVs into this file).");
