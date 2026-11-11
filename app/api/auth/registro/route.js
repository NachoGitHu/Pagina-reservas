import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";
import { crearSesion, json } from "@/lib/auth";

export async function POST(req) {
  const { nombre, apellido, telefono, email, password } = await req.json();
  if (!nombre || !apellido || !telefono || !email || !password || password.length < 8)
    return json({ error: "Completá todos los datos (clave de 8+ caracteres)" }, 400);

  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const c = await db.query(
      "INSERT INTO cliente (nombre, apellido, telefono, email) VALUES ($1,$2,$3,$4) RETURNING id_cliente",
      [nombre, apellido, telefono, email.toLowerCase()]
    );
    const hash = await bcrypt.hash(password, 10);
    const u = await db.query(
      "INSERT INTO usuario (email, password_hash, rol, id_cliente) VALUES ($1,$2,'cliente',$3) RETURNING id_usuario, rol, id_cliente",
      [email.toLowerCase(), hash, c.rows[0].id_cliente]
    );
    await db.query("COMMIT");
    await crearSesion(u.rows[0]);
    return json({ ok: true, rol: "cliente" }, 201);
  } catch (e) {
    await db.query("ROLLBACK");
    if (e.code === "23505") return json({ error: "Ese email ya está registrado" }, 409);
    return json({ error: "No se pudo registrar" }, 500);
  } finally {
    db.release();
  }
}
