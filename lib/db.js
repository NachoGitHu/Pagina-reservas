import { Pool } from "pg";

// Un solo pool reutilizado (evita abrir conexiones de más en Vercel)
const g = globalThis;
export const pool =
  g._pool ??
  (g._pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 3,
  }));

export const query = (texto, params) => pool.query(texto, params);
