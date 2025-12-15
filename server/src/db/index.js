const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(process.cwd(), '../ecomm.db');
const db = new Database(dbPath);

module.exports = db;
