import { Pool } from "@neondatabase/serverless";

let pool;

function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL não está configurada.");
  if (!pool) {
    pool = new Pool({ connectionString, max: 1 });
  }
  return pool;
}

export function query(text, values = []) {
  return getPool().query(text, values);
}
