import Database from 'better-sqlite3';
import path from "path";

const dbPath = path.join(process.cwd(), 'ecomm.db');
const db = new Database(dbPath);

console.log("🚀 Starting Data Migration...");
console.log(`📂 Database: ${dbPath}`);

const migrationSql = `
-- 1. Güvenlik kilidini kapat (Tablo değişikliği için şart)
PRAGMA foreign_keys = OFF;

-- 2. Transaction Başlat (Bir hata olursa her şeyi geri alır)
BEGIN TRANSACTION;

-- ==========================================
-- A. ORDER_ITEMS MIGRATION (user_id silme)
-- ==========================================

-- Eski tabloyu yeniden adlandır
ALTER TABLE order_items RENAME TO order_items_old;

-- Yeni yapıda (user_id olmayan) tabloyu oluştur
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

-- Eski verileri yeni tabloya kopyala (user_id hariç)
INSERT INTO order_items (order_item_id, order_id, product_id, quantity, item_price, item_total)
SELECT order_item_id, order_id, product_id, quantity, item_price, item_total
FROM order_items_old;

-- Eski tabloyu sil
DROP TABLE order_items_old;

-- ==========================================
-- B. YENİ TABLOLARIN EKLENMESİ
-- ==========================================

-- Action Logs
CREATE TABLE IF NOT EXISTS action_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('CREATE', 'UPDATE', 'DELETE')),
    performed_by TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    old_values TEXT,
    new_values TEXT
);

-- Auth Logs (Eğer yoksa oluştur)
CREATE TABLE IF NOT EXISTS auth_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    event_type TEXT NOT NULL CHECK(event_type IN ('LOGIN', 'LOGOUT', 'REGISTER', 'FAILED_LOGIN')),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    details TEXT
);

-- 3. İşlemi Onayla ve Bitir
COMMIT;

-- 4. Güvenlik kilidini tekrar aç
PRAGMA foreign_keys = ON;
`;

try {
  db.exec(migrationSql);
  console.log("✅ Migration successful! Data preserved.");
  console.log("ℹ️  'order_items' updated (user_id removed).");
  console.log("ℹ️  'audit_logs' & 'auth_logs' created.");
} catch (error) {
  console.error("❌ Migration FAILED. Rolled back changes.");
  console.error(error);
  // Hata durumunda manuel rollback gerekebilir ama better-sqlite3 
  // script tek seferde (exec) çalıştığı için genellikle işlemi iptal eder.
}
