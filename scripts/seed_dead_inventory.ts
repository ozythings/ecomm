import Database from "better-sqlite3";
import path from "path";

interface DeadInventoryItem {
  product_id: string;
  product_name: string;
  category: string;
  brand: string;
  price: number;
  rating: number;
}

const dbPath = path.join(process.cwd(), 'ecomm.db');
const db = new Database(dbPath);

console.log(`Connected to ${dbPath}`);
const deadInventoryItems: DeadInventoryItem[] = [
  {
    product_id: 'DEAD_001',
    product_name: 'Betamax Player 3000',
    category: 'Electronics',
    brand: 'RetroFail',
    price: 299.99,
    rating: 2.5
  },
  {
    product_id: 'DEAD_002',
    product_name: 'HD-DVD Player',
    category: 'Electronics',
    brand: 'Toshiba',
    price: 150.00,
    rating: 4.0
  },
  {
    product_id: 'DEAD_003',
    product_name: 'Zune MP3 Player (30GB)',
    category: 'Electronics',
    brand: 'Microsoft',
    price: 199.99,
    rating: 4.8
  },
  {
    product_id: 'DEAD_004',
    product_name: 'Ugly Christmas Sweater (July Edition)',
    category: 'Clothing',
    brand: 'SeasonMistake',
    price: 49.99,
    rating: 1.2
  },
  {
    product_id: 'DEAD_005',
    product_name: 'Expired 2024 Calendar',
    category: 'Stationery',
    brand: 'TimeLost',
    price: 5.00,
    rating: 5.0
  },
  {
    product_id: 'DEAD_006',
    product_name: 'Phone Case for iPhone 4',
    category: 'Accessories',
    brand: 'OldCase',
    price: 2.99,
    rating: 3.0
  }
];

const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO products (product_id, product_name, category, brand, price, rating) 
    VALUES ($product_id, $product_name, $category, $brand, $price, $rating)
`);

const checkStmt = db.prepare(`SELECT count(*) as count FROM order_items WHERE product_id = ?`);

const runTransaction = db.transaction((items: DeadInventoryItem[]) => {
  console.log("Seeding Dead Inventory...");

  for (const item of items) {
    const params: any = {
      $product_id: item.product_id,
      $product_name: item.product_name,
      $category: item.category,
      $brand: item.brand,
      $price: item.price,
      $rating: item.rating
    };

    insertStmt.run(params);

    const result = checkStmt.get(item.product_id) as { count: number };

    if (result && result.count > 0) {
      console.warn(`WARNING: Product ${item.product_id} is not dead! It has ${result.count} sales.`);
    } else {
      console.log(`Added Unsold Item: ${item.product_name}`);
    }
  }
});

runTransaction(deadInventoryItems);

console.log("Done! Check the 'Dead Inventory' table in your Analytics tab.");
