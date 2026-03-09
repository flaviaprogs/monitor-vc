// api/server/db/sqlite.js
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = process.env.DB_PATH || "./data/app.sqlite";
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// helpers
export function exec(sql) {
  // aceita múltiplas instruções separadas por ';'
  return db.exec(sql);
}
export function run(sql, params = []) {
  return db.prepare(sql).run(params);
}
export function get(sql, params = []) {
  return db.prepare(sql).get(params);
}
export function all(sql, params = []) {
  return db.prepare(sql).all(params);
}
