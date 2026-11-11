import { query } from "@/lib/db";
import { sesion, json } from "@/lib/auth";

const ESTADOS = ["pendiente", "confirmada", "cancelada", "completada", "no_show"];

// PATCH { estado }: el cliente solo puede cancelar las suyas; el admin cambia cualquiera
export async function PATCH(req, { params }) {
  const s = await sesion();
  if (!s) return json({ error: "No autenticado" }, 401);
  const { id } = await params;
  const { estado } = await req.json();
  const admin = s.rol === "admin";
  if (!ESTADOS.includes(estado) || (!admin && estado !== "cancelada"))
    return json({ error: "Cambio no permitido" }, 403);

  const r = await query(
    `UPDATE reserva SET estado = $1
     WHERE id_reserva = $2
       AND ($3 OR (id_cliente = $4::int AND estado IN ('pendiente','confirmada')))
     RETURNING *`,
    [estado, id, admin, s.cid ?? null]
  );
  if (!r.rows[0]) return json({ error: "Reserva no encontrada o no modificable" }, 404);
  return json(r.rows[0]);
}
