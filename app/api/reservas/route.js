import { query } from "@/lib/db";
import { sesion, json } from "@/lib/auth";

// GET: el admin ve todas, el cliente solo las suyas
export async function GET() {
  const s = await sesion();
  if (!s) return json({ error: "No autenticado" }, 401);
  const r = await query(
    `SELECT r.id_reserva, c.nombre || ' ' || c.apellido AS cliente, z.nombre AS zona,
            m.numero AS mesa, r.fecha_hora_inicio, r.fecha_hora_fin,
            r.cantidad_personas, r.estado, r.observaciones
     FROM reserva r
     JOIN cliente c ON c.id_cliente = r.id_cliente
     JOIN mesa m ON m.id_mesa = r.id_mesa
     JOIN zona z ON z.id_zona = m.id_zona
     WHERE ($1 OR r.id_cliente = $2::int)
     ORDER BY r.fecha_hora_inicio DESC`,
    [s.rol === "admin", s.cid ?? null]
  );
  return json(r.rows);
}

// POST: un cliente reserva una mesa (2 horas de duración)
export async function POST(req) {
  const s = await sesion();
  if (!s || s.rol !== "cliente") return json({ error: "Solo clientes pueden reservar" }, 403);
  const { id_mesa, fecha_hora_inicio, cantidad_personas, observaciones } = await req.json();
  const inicio = new Date(fecha_hora_inicio);
  if (isNaN(inicio) || inicio < new Date()) return json({ error: "Elegí una fecha futura" }, 400);
  const fin = new Date(inicio.getTime() + 2 * 3600000);

  try {
    const r = await query(
      `INSERT INTO reserva (id_cliente, id_mesa, fecha_hora_inicio, fecha_hora_fin, cantidad_personas, estado, observaciones)
       SELECT $1, m.id_mesa, $3, $4, $5, 'pendiente', $6
       FROM mesa m WHERE m.id_mesa = $2 AND m.activa AND m.capacidad >= $5
       RETURNING *`,
      [s.cid, id_mesa, inicio.toISOString(), fin.toISOString(), cantidad_personas, observaciones ?? null]
    );
    if (!r.rows[0]) return json({ error: "Mesa inexistente o sin capacidad suficiente" }, 400);
    return json(r.rows[0], 201);
  } catch (e) {
    // 23P01 = la restricción anti-superposición de la base
    if (e.code === "23P01") return json({ error: "Esa mesa ya está reservada en ese horario" }, 409);
    return json({ error: "No se pudo crear la reserva" }, 500);
  }
}
