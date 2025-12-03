'use server'

import db from "../lib/db";

export async function getDashboardStats() {
  const totalOrders = db.prepare('SELECT COUNT(*) as count, SUM(total_amount) as total FROM orders').get() as any;
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
  const recentOrders = db.prepare(`
        SELECT o.order_id, u.name, o.total_amount, o.order_status, o.order_date 
        FROM orders o 
        JOIN users u ON o.user_id = u.user_id 
        ORDER BY o.order_date DESC LIMIT 5
    `).all();

  return {
    revenue: totalOrders.total || 0,
    ordersCount: totalOrders.count || 0,
    usersCount: totalUsers.count || 0,
    recentOrders
  };
}

export async function getProducts(search?: string, category?: string) {
  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (category && category !== 'All') {
    query += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (product_name LIKE ? OR product_id = ?)';
    params.push(`%${search}%`, search);
  }

  query += ' LIMIT 50';
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
  // 1. Sales by Product
  const sales = db.prepare(`
        SELECT p.product_name, SUM(oi.quantity) as total_sold
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        GROUP BY p.product_name
        ORDER BY total_sold DESC
        LIMIT 10
    `).all();

  // 2. Reviews Distribution
  const ratings = db.prepare(`
        SELECT rating, COUNT(*) as count FROM reviews GROUP BY rating ORDER BY rating
    `).all();

  return { sales, ratings };
}

export async function getTableData(table: string) {
  // Safety check to prevent injection
  const allowed = ['users', 'products', 'orders', 'order_items', 'reviews', 'events'];
  if (!allowed.includes(table)) return [];
  return db.prepare(`SELECT * FROM ${table} LIMIT 100`).all();
}
