'use server'

import bcrypt from 'bcryptjs';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import db from '../lib/db';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const headerList = await headers();

  const ip = headerList.get('x-origin-ip') || '127.0.0.1';
  const userAgent = headerList.get('user-agent') || 'Unknown Device';

  const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email) as any;

  if (!admin || !(await bcrypt.compare(password, admin.password))) {
    db.prepare(`
            INSERT INTO auth_logs (event_type, details, ip_address, user_agent) 
            VALUES ('FAILED_LOGIN', ?, ?, ?)
        `).run(`Email: ${email}`, ip, userAgent);

    return { error: 'Invalid admin credentials' };
  }

  const sessionData = JSON.stringify({
    adminId: admin.admin_id,
    name: admin.name,
    role: admin.role
  });

  (await cookies()).set('admin_session', sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24,
    path: '/',
  });

  // Guncelleme: user_id yerine admin_id kullanildi
  db.prepare(`
        INSERT INTO auth_logs (admin_id, event_type, details, ip_address, user_agent) 
        VALUES (?, 'LOGIN', 'Admin Access Granted', ?, ?)
    `).run(admin.admin_id, ip, userAgent);

  redirect('/');
}


export async function logout() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('admin_session');

  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie.value);
      const headerList = await headers();
      const ip = headerList.get('x-origin-ip') || '127.0.0.1';
      const userAgent = headerList.get('user-agent') || 'Unknown';

      db.prepare(`
        INSERT INTO auth_logs (admin_id, event_type, details, ip_address, user_agent) 
        VALUES (?, 'LOGOUT', 'Admin Logged Out', ?, ?)
      `).run(session.adminId, ip, userAgent);
    } catch (error) {
      console.error("Logout Log Hatası:", error);
    }
  }

  cookieStore.set('admin_session', '', {
    maxAge: 0,
    path: '/',
    expires: new Date(0)
  });

  redirect('/login');
}
