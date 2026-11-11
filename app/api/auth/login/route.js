import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { crearSesion, json } from "@/lib/auth";

export async function POST(req) {
  const { email, password } = await req.json();
  const r = await query("SELECT * FROM usuario WHERE email = $1", [String(email).toLowerCase()]);
  const u = r.rows[0];
  if (!u || !(await bcrypt.compare(String(password), u.password_hash)))
    return json({ error: "Email o clave incorrectos" }, 401);
  await crearSesion(u);
  return json({ ok: true, rol: u.rol });
}
