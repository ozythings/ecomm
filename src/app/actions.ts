'use server'

import db from "../lib/db";
import { revalidatePath } from "next/cache";

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
            COUNT(oi.order_item_id) as sales_count,
            COALESCE(AVG(r.rating), 0) as avg_rating
        FROM products p
        LEFT JOIN order_items oi ON p.product_id = oi.product_id
        LEFT JOIN reviews r ON p.product_id = r.product_id
        WHERE 1=1
    `;

  const params = [];

  if (category && category !== 'All') {
    query += ' AND p.category = ?';
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
  return db.prepare('SELECT DISTINCT category FROM products ORDER BY category').all();
}

export async function getProductById(id: string) {
  return db.prepare('SELECT * FROM products WHERE product_id = ?').get(id);
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
            p.category, 
            SUM(oi.item_total) as revenue,
            AVG(p.rating) as avg_rating
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        GROUP BY p.category
        ORDER BY revenue DESC
    `).all();

  // left join where null (dead inventory check)
  const deadInventory = db.prepare(`
        SELECT p.product_name, p.category, p.price
        FROM products p
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
                p.category,
                p.product_name,
                SUM(oi.quantity) as total_sold,
                RANK() OVER (
                    PARTITION BY p.category 
                    ORDER BY SUM(oi.quantity) DESC
                ) as rank_in_category
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            GROUP BY p.category, p.product_id
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
        SELECT p.product_id, p.product_name, p.price, p.category, COUNT(*) as frequency
        FROM order_items oi1
        JOIN order_items oi2 ON oi1.order_id = oi2.order_id
        JOIN products p ON oi2.product_id = p.product_id
        WHERE oi1.product_id = ? 
        AND oi2.product_id != ? -- exclude itself
        GROUP BY p.product_id
        ORDER BY frequency DESC
        LIMIT 3
    `).all(productId, productId);
}

export async function getTableData(table: string, page: number = 1, limit: number = 50) {
  const allowed = ['users', 'products', 'orders', 'order_items', 'reviews', 'events'];
  if (!allowed.includes(table)) {
    return { data: [], total: 0, page, limit };
  }

  const offset = (page - 1) * limit;

  // Get paginated data
  const data = db.prepare(`SELECT * FROM ${table} LIMIT ? OFFSET ?`).all(limit, offset);

  // Get total count for pagination calculations
  const countResult = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as any;

  return {
    data,
    total: countResult.count,
    page,
    limit
  };
}

export async function getTableSchema(table: string) {
  const allowed = ['users', 'products', 'orders', 'order_items', 'reviews', 'events'];
  if (!allowed.includes(table)) return [];
  // SQLite PRAGMA to get column info (cid, name, type, notnull, dflt_value, pk)
  return db.prepare(`PRAGMA table_info(${table})`).all();
}

// --- CRUD Operations ---

function getPrimaryKey(table: string) {
  // Heuristic: users -> user_id, order_items -> order_item_id
  if (table === 'order_items') return 'order_item_id';
  return table.slice(0, -1) + '_id';
}

export async function deleteRecord(table: string, id: string | number) {
  const allowed = ['users', 'products', 'orders', 'order_items', 'reviews', 'events'];
  if (!allowed.includes(table)) throw new Error("Invalid table");

  const pk = getPrimaryKey(table);
  db.prepare(`DELETE FROM ${table} WHERE ${pk} = ?`).run(id);

  revalidatePath(`/tables/${table}`);
  revalidatePath('/');
  return { success: true };
}

export async function createRecord(table: string, data: Record<string, any>) {
  const allowed = ['users', 'products', 'orders', 'order_items', 'reviews', 'events'];
  if (!allowed.includes(table)) throw new Error("Invalid table");

  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map(() => '?').join(', ');

  const stmt = db.prepare(`INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`);
  stmt.run(...values);

  revalidatePath(`/tables/${table}`);
  return { success: true };
}

export async function updateRecord(table: string, id: string | number, data: Record<string, any>) {
  const allowed = ['users', 'products', 'orders', 'order_items', 'reviews', 'events'];
  if (!allowed.includes(table)) throw new Error("Invalid table");

  const pk = getPrimaryKey(table);
  const sets = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const values = [...Object.values(data), id];

  const stmt = db.prepare(`UPDATE ${table} SET ${sets} WHERE ${pk} = ?`);
  stmt.run(...values);

  revalidatePath(`/tables/${table}`);
  return { success: true };
}
