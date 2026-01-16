import Database from 'better-sqlite3';
import path from "path";
import bcrypt from 'bcryptjs';

const dbPath = path.join(process.cwd(), 'ecomm.db');
const db = new Database(dbPath);

// Admin Bilgileri
const ADMIN_EMAIL = 'admin@ecomm.com';
const ADMIN_PASSWORD = '123';
const ADMIN_NAME = 'oguzhan';

async function createAdmin() {
  // 1. Şifreyi Hashle
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const adminId = 'admin_' + Date.now(); // Benzersiz ID

  // 2. Admin zaten var mı kontrol et
  const existing = db.prepare('SELECT * FROM admins WHERE email = ?').get(ADMIN_EMAIL);

  if (existing) {
    console.log("🔄 Admin already exists. Updating password...");
    db.prepare('UPDATE admins SET password = ? WHERE email = ?').run(hashedPassword, ADMIN_EMAIL);
  } else {
    console.log("🆕 Creating NEW Admin...");
    db.prepare(`
            INSERT INTO admins (admin_id, email, password, name, role)
            VALUES (?, ?, ?, ?, 'super_admin')
        `).run(adminId, ADMIN_EMAIL, hashedPassword, ADMIN_NAME);
  }

  console.log(`✅ Admin Created! Login with: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

createAdmin();
