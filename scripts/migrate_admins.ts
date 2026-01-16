import Database from 'better-sqlite3';
import path from "path";

const dbPath = path.join(process.cwd(), 'ecomm.db');
const db = new Database(dbPath);

console.log("🛡️ Setting up Admin Table...");

const migrationSql = `
    -- 1. ADMINS Tablosunu Oluştur
    CREATE TABLE IF NOT EXISTS admins (
        admin_id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,      -- Hashlenmiş şifre
        name TEXT,
        role TEXT DEFAULT 'super_admin', -- Belki ilerde 'editor', 'viewer' eklersin diye
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Auth Logs (Eğer yoksa oluştur)
    CREATE TABLE IF NOT EXISTS auth_logs (
        log_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT, -- Buraya artık admin_id gelecek
        event_type TEXT CHECK(event_type IN ('LOGIN', 'LOGOUT', 'REGISTER', 'FAILED_LOGIN')),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT,
        user_agent TEXT,
        details TEXT
    );
`;

try {
  db.exec(migrationSql);
  console.log("✅ 'admins' table created successfully.");
} catch (error) {
  console.error("❌ Migration Failed:", error);
}
