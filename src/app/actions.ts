'use server'

import db from "../lib/db";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers"; // cookie eklendi

export async function getDashboardStats() {
  // aggregate
  const totalOrders = db.prepare('SELECT COUNT(*) as count, SUM(total_amount) as total FROM orders').get() as any;
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;

  // join + aggregate
  const recentOrders = db.prepare(`
        SELECT o.order_id, u.name, o.total_amount, o.order_status, o.order_date 
        FROM orders o 
        JOIN users u ON o.user_id = u.user_id 
        ORDER BY o.order_date DESC LIMIT 5
    `).all();

  // group by + having (vip customers)
  const topSpenders = db.prepare(`
        SELECT u.name, COUNT(o.order_id) as order_count, SUM(o.total_amount) as total_spent
        FROM users u
        JOIN orders o ON u.user_id = o.user_id
        GROUP BY u.user_id
        HAVING total_spent > 500
        ORDER BY total_spent DESC
        LIMIT 5
    `).all();

  return {
    revenue: totalOrders.total || 0,
    ordersCount: totalOrders.count || 0,
    usersCount: totalUsers.count || 0,
    recentOrders,
    topSpenders
  };
}

export async function getProducts(search?: string, category?: string) {
  // left join, subquery
  let query = `
        SELECT 
            p.*, 
            c.category_name as category,
            b.brand_name as brand,
            COUNT(oi.order_item_id) as sales_count,
            COALESCE(AVG(r.rating), 0) as avg_rating
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        LEFT JOIN brands b ON p.brand_id = b.brand_id
        LEFT JOIN order_items oi ON p.product_id = oi.product_id
        LEFT JOIN reviews r ON p.product_id = r.product_id
        WHERE 1=1
    `;

  const params = [];

  if (category && category !== 'All') {
    query += ' AND c.category_name = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (p.product_name LIKE ? OR p.product_id = ?)';
    params.push(`%${search}%`, search);
  }

  query += ' GROUP BY p.product_id LIMIT 50';

  return db.prepare(query).all(...params);
}

export async function getCategories() {
  return db.prepare('SELECT category_name as category FROM categories ORDER BY category_name').all();
}

export async function getProductById(id: string) {
  return db.prepare(`
        SELECT p.*, c.category_name as category, b.brand_name as brand
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        LEFT JOIN brands b ON p.brand_id = b.brand_id
        WHERE p.product_id = ?
    `).get(id);
}

export async function getProductReviews(productId: string, sortBy: string = 'newest') {
  let orderBy = 'r.review_date DESC';
  if (sortBy === 'oldest') orderBy = 'r.review_date ASC';
  if (sortBy === 'rating_high') orderBy = 'r.rating DESC';
  if (sortBy === 'rating_low') orderBy = 'r.rating ASC';

  return db.prepare(`
        SELECT r.*, u.name as user_name 
        FROM reviews r 
        JOIN users u ON r.user_id = u.user_id 
        WHERE r.product_id = ? 
        ORDER BY ${orderBy}
    `).all(productId);
}

export async function getGraphData() {
  // group by
  const categoryStats = db.prepare(`
        SELECT 
            c.category_name as category, 
            SUM(oi.quantity * oi.item_price) as revenue,
            AVG(ifnull(r.rating, 0)) as avg_rating
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        JOIN categories c ON p.category_id = c.category_id
        LEFT JOIN reviews r ON p.product_id = r.product_id
        GROUP BY c.category_name
        ORDER BY revenue DESC
    `).all();

  // left join where null (dead inventory check)
  const deadInventory = db.prepare(`
        SELECT p.product_name, c.category_name as category, p.price
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        LEFT JOIN order_items oi ON p.product_id = oi.product_id
        WHERE oi.order_item_id IS NULL
        LIMIT 10
    `).all();

  // users by city
  const citySegments = db.prepare(`
        SELECT city, COUNT(user_id) as user_count
        FROM users
        GROUP BY city
        ORDER BY user_count DESC
        LIMIT 10
    `).all();

  return { categoryStats, deadInventory, citySegments };
}

export async function getAdvancedStats() {
  // aggregates revenue by YYYY-MM
  const monthlyRevenue = db.prepare(`
        SELECT 
            strftime('%Y-%m', order_date) as month, 
            SUM(total_amount) as revenue,
            COUNT(order_id) as order_count
        FROM orders
        WHERE order_date IS NOT NULL
        GROUP BY month
        ORDER BY month ASC
        LIMIT 12
    `).all();

  // conditional aggregation (case statements)
  // groups users into segments based on total spend
  const customerSegments = db.prepare(`
        SELECT
            CASE
                WHEN total_spent > 1000 THEN 'Gold (> $1000)'
                WHEN total_spent > 500 THEN 'Silver ($500 - $1k)'
                ELSE 'Bronze (< $500)'
            END as tier,
            COUNT(user_id) as user_count,
            AVG(total_spent) as avg_tier_spend
        FROM (
            SELECT user_id, SUM(total_amount) as total_spent
            FROM orders
            GROUP BY user_id
        )
        GROUP BY tier
    `).all();

  // CTE + window functions (rank)
  // ranks products by sales quantity within their own category
  const topProductsByCategory = db.prepare(`
        WITH CategorySales AS (
            SELECT 
                c.category_name as category,
                p.product_name,
                SUM(oi.quantity) as total_sold,
                RANK() OVER (
                    PARTITION BY c.category_name 
                    ORDER BY SUM(oi.quantity) DESC
                ) as rank_in_category
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            JOIN categories c ON p.category_id = c.category_id
            GROUP BY c.category_name, p.product_id
        )
        SELECT category, product_name, total_sold
        FROM CategorySales
        WHERE rank_in_category <= 3
        ORDER BY category, total_sold DESC
    `).all();

  // sales funnel (cross-table aggregation)
  // counts unique users at each stage: view (event) -> cart (event) -> purchase (order)
  const views = db.prepare("SELECT COUNT(DISTINCT user_id) as count FROM events WHERE event_type = 'view'").get() as any;
  const carts = db.prepare("SELECT COUNT(DISTINCT user_id) as count FROM events WHERE event_type = 'cart'").get() as any;
  const purchases = db.prepare("SELECT COUNT(DISTINCT user_id) as count FROM orders").get() as any;

  const funnel = [
    { stage: 'Product View', count: views?.count || 0 },
    { stage: 'Add to Cart', count: carts?.count || 0 },
    { stage: 'Purchase', count: purchases?.count || 0 }
  ];

  return { monthlyRevenue, customerSegments, topProductsByCategory, funnel };
}

export async function getRelatedProducts(productId: string) {
  // market basket analysis (self-join)
  // find products that appear in the same order as the current product
  return db.prepare(`
        SELECT p.product_id, p.product_name, p.price, c.category_name as category, COUNT(*) as frequency
        FROM order_items oi1
        JOIN order_items oi2 ON oi1.order_id = oi2.order_id
        JOIN products p ON oi2.product_id = p.product_id
        LEFT JOIN categories c ON p.category_id = c.category_id
        WHERE oi1.product_id = ? 
        AND oi2.product_id != ? -- exclude itself
        GROUP BY p.product_id
        ORDER BY frequency DESC
        LIMIT 3
    `).all(productId, productId);
}

export async function getTableData(table: string, page: number = 1, limit: number = 50, search: string = '') {
  // categories ve brands eklendi
  const allowed = ['users', 'products', 'orders', 'order_items', 'reviews', 'events', 'admins', 'categories', 'brands'];
  if (!allowed.includes(table)) return { data: [], total: 0, page, limit };

  const offset = (page - 1) * limit;

  let query = `SELECT * FROM ${table}`;

  if (table === 'products') {
    query = `
        SELECT p.*, c.category_name as category_name, b.brand_name as brand_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        LEFT JOIN brands b ON p.brand_id = b.brand_id
     `;
  }

  let countQuery = `SELECT COUNT(*) as count FROM ${table}`;

  // Products count icin de join gerekebilir eger search varsa
  if (table === 'products' && search) {
    countQuery = `
        SELECT COUNT(*) as count 
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        LEFT JOIN brands b ON p.brand_id = b.brand_id
      `;
  }

  const params: any[] = [];

  if (search) {
    const searchCols: Record<string, string[]> = {
      users: ['name', 'email', 'city', 'user_id'],
      products: ['product_name', 'c.category_name', 'b.brand_name', 'p.product_id'], // Aliasli kolonlar
      orders: ['order_id', 'order_status', 'user_id'],
      reviews: ['review_text', 'user_id', 'product_id'],
      admins: ['email', 'name'],
      categories: ['category_name'],
      brands: ['brand_name']
    };

    // Table product ise searchCols key'i de products olsun ama sorgu farkli oldugu icin yukarida alias verdik
    let cols = searchCols[table] || [];

    if (cols.length > 0) {
      const whereClause = ' WHERE (' + cols.map(c => `${c} LIKE ?`).join(' OR ') + ')';
      query += whereClause;

      // Count query icin de where ekle
      if (table !== 'products') {
        countQuery += whereClause;
      } else {
        // Products count query zaten joinli tanimlandi
        countQuery += whereClause;
      }

      cols.forEach(() => params.push(`%${search}%`));
    }
  }

  query += ` LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  // arama parametrelerini count sorgusu için de kopyala
  const countParams = params.slice(0, params.length - 2);

  const data = db.prepare(query).all(...params);
  const countResult = db.prepare(countQuery).get(...countParams) as any;

  return {
    data,
    total: countResult.count,
    page,
    limit
  };
}

export async function getTableSchema(table: string) {
  const allowed = ['users', 'products', 'orders', 'order_items', 'reviews', 'events', 'categories', 'brands', 'admins'];
  if (!allowed.includes(table)) return [];
  return db.prepare(`PRAGMA table_info(${table})`).all();
}

// CRUD

function getPrimaryKey(table: string) {
  // users -> user_id, order_items -> order_item_id
  if (table === 'order_items') return 'order_item_id';
  if (table === 'categories') return 'category_id';
  if (table === 'brands') return 'brand_id';
  return table.slice(0, -1) + '_id';
}

export async function createRecord(table: string, data: Record<string, any>) {
  const allowed = ['users', 'products', 'orders', 'order_items', 'reviews', 'events', 'admins', 'categories', 'brands'];
  if (!allowed.includes(table)) throw new Error("Invalid table");

  // admin check (direct cookie)
  const cookieStore = await cookies();
  const sessionVal = cookieStore.get('admin_session')?.value;
  let adminId = null;
  if (sessionVal) {
    try { adminId = JSON.parse(sessionVal).adminId; } catch { }
  }

  if (table === 'order_items' && data.user_id) delete data.user_id;
  const dateFields = ['signup_date', 'order_date', 'review_date', 'event_timestamp', 'created_at'];
  dateFields.forEach(field => {
    if (!data[field] && (
      (table === 'users' && field === 'signup_date') ||
      (table === 'orders' && field === 'order_date') ||
      (table === 'reviews' && field === 'review_date') ||
      (table === 'events' && field === 'event_timestamp') ||
      (table === 'admins' && field === 'created_at')
    )) {
      data[field] = new Date().toISOString();
    }
  });

  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map(() => '?').join(', ');

  const stmt = db.prepare(`INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`);
  const info = stmt.run(...values);

  logAction(table, info.lastInsertRowid.toString(), 'CREATE', null, data, adminId);

  revalidatePath(`/tables/${table}`);
  return { success: true };
}

export async function updateRecord(table: string, id: string | number, data: Record<string, any>) {
  const allowed = ['users', 'products', 'orders', 'order_items', 'reviews', 'events', 'admins', 'categories', 'brands'];
  if (!allowed.includes(table)) throw new Error("Invalid table");

  const cookieStore = await cookies();
  const sessionVal = cookieStore.get('admin_session')?.value;
  let adminId = null;
  if (sessionVal) {
    try { adminId = JSON.parse(sessionVal).adminId; } catch { }
  }

  const pk = getPrimaryKey(table);

  const oldData = db.prepare(`SELECT * FROM ${table} WHERE ${pk} = ?`).get(id);

  if (table === 'order_items' && data.user_id) delete data.user_id;

  const sets = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(data), id];

  const stmt = db.prepare(`UPDATE ${table} SET ${sets} WHERE ${pk} = ?`);
  stmt.run(...values);

  logAction(table, String(id), 'UPDATE', oldData, data, adminId);

  revalidatePath(`/tables/${table}`);
  return { success: true };
}

export async function deleteRecord(table: string, id: string | number) {
  const allowed = ['users', 'products', 'orders', 'order_items', 'reviews', 'events', 'admins', 'categories', 'brands'];
  if (!allowed.includes(table)) throw new Error("Invalid table");

  const cookieStore = await cookies();
  const sessionVal = cookieStore.get('admin_session')?.value;
  let adminId = null;
  if (sessionVal) {
    try { adminId = JSON.parse(sessionVal).adminId; } catch { }
  }

  const pk = getPrimaryKey(table);

  const oldData = db.prepare(`SELECT * FROM ${table} WHERE ${pk} = ?`).get(id);

  db.prepare(`DELETE FROM ${table} WHERE ${pk} = ?`).run(id);

  logAction(table, String(id), 'DELETE', oldData, null, adminId);

  revalidatePath(`/tables/${table}`);
  revalidatePath('/');
  return { success: true };
}

export async function getTableReferences(table: string) {
  const allowed = ['users', 'products', 'orders', 'order_items', 'reviews', 'events', 'admins', 'categories', 'brands'];
  if (!allowed.includes(table)) return {};

  const fks = db.prepare(`PRAGMA foreign_key_list(${table})`).all() as any[];

  const references: Record<string, any[]> = {};

  for (const fk of fks) {
    const targetTable = fk.table;
    const sourceCol = fk.from;
    const targetCol = fk.to;

    const targetColumns = db.prepare(`PRAGMA table_info(${targetTable})`).all() as any[];
    const labelCol = targetColumns.find((c: any) =>
      ['name', 'product_name', 'email', 'title', 'brand_name', 'category_name'].includes(c.name)
    )?.name || targetCol; // Bulamazsa ID'yi kullan

    const options = db.prepare(`
      SELECT ${targetCol} as value, ${labelCol} as label 
      FROM ${targetTable} 
      LIMIT 100
    `).all();

    references[sourceCol] = options;
  }

  return references;
}

export async function generateSmartId(table: string, pkColumn: string) {
  const rules: Record<string, { prefix: string, length: number }> = {
    'users': { prefix: 'U', length: 6 },
    'orders': { prefix: 'O', length: 8 },

    'products': { prefix: 'P', length: 6 }, // P000023

    'admins': { prefix: 'ADM', length: 3 },
    'reviews': { prefix: 'REV', length: 6 },
    'events': { prefix: 'EVT', length: 9 },
    // Auto increment tablolar icin gerek yok ama yine de tanimlanabilir
    'categories': { prefix: 'CAT', length: 3 },
    'brands': { prefix: 'BRD', length: 3 },
  };

  const rule = rules[table] || { prefix: table.charAt(0).toUpperCase(), length: 6 };

  // Eger integer PK ise (categories, brands) smart ID uretmeyelim, DB halleder
  if (['categories', 'brands'].includes(table)) return null;

  const rows = db.prepare(`
    SELECT ${pkColumn} as id 
    FROM ${table} 
    WHERE ${pkColumn} LIKE ?
  `).all(`${rule.prefix}%`) as any[];

  let maxNum = 0;

  rows.forEach(row => {
    const numPart = row.id.replace(rule.prefix, '');
    const num = parseInt(numPart, 10);

    if (!isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  });

  const nextNum = maxNum + 1;
  const paddedNum = String(nextNum).padStart(rule.length, '0');

  return `${rule.prefix}${paddedNum}`;
}

function logAction(table: string, recordId: string, action: string, oldVal: any, newVal: any, adminId: string | null) {
  try {
    db.prepare(`
      INSERT INTO action_logs (table_name, record_id, action, performed_by, old_values, new_values)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      table,
      String(recordId),
      action,
      adminId || 'System',
      oldVal ? JSON.stringify(oldVal) : null,
      newVal ? JSON.stringify(newVal) : null
    );
  } catch (e) {
    console.error("Action Log Error:", e);
  }
}


export async function getActionLogs(limit: number = 50) {
  return db.prepare(`
    SELECT 
      a.*, 
      adm.name as admin_name,
      adm.email as admin_email
    FROM action_logs a
    LEFT JOIN admins adm ON a.performed_by = adm.admin_id
    ORDER BY a.timestamp DESC
    LIMIT ?
  `).all(limit);
}

export async function getAuthLogs(limit: number = 50) {
  return db.prepare(`
    SELECT 
      al.*, 
      adm.name as admin_name,
      adm.email as admin_email
    FROM auth_logs al
    LEFT JOIN admins adm ON al.admin_id = adm.admin_id
    ORDER BY al.timestamp DESC
    LIMIT ?
  `).all(limit);
}
