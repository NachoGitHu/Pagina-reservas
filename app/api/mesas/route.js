import { query } from "@/lib/db";
import { sesion, json } from "@/lib/auth";

// GET /api/mesas?inicio=2026-11-06T21:00:00-03:00&horas=2
// Devuelve todas las mesas con su estado: libre | reservada | tu_reserva
export async function GET(req) {
  const s = await sesion();
  if (!s) return json({ error: "No autenticado" }, 401);
  const p = new URL(req.url).searchParams;
  const inicio = new Date(p.get("inicio") ?? Date.now());
  if (isNaN(inicio)) return json({ error: "Fecha inválida" }, 400);
  const fin = new Date(inicio.getTime() + Number(p.get("horas") ?? 2) * 3600000);

  const r = await query(
    `SELECT m.id_mesa, z.nombre AS zona, m.numero, m.capacidad, m.pos_x, m.pos_y,
            CASE WHEN r.id_reserva IS NULL THEN 'libre'
                 WHEN r.id_cliente = $3::int THEN 'tu_reserva'
                 ELSE 'reservada' END AS estado
     FROM mesa m
     JOIN zona z USING (id_zona)
     LEFT JOIN reserva r ON r.id_mesa = m.id_mesa
          AND r.estado IN ('pendiente','confirmada')
          AND tstzrange(r.fecha_hora_inicio, r.fecha_hora_fin) && tstzrange($1::timestamptz, $2::timestamptz)
     WHERE m.activa
     ORDER BY z.id_zona, m.numero`,
    [inicio.toISOString(), fin.toISOString(), s.cid ?? null]
  );
  return json(r.rows);
}
