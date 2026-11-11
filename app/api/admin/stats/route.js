import { query } from "@/lib/db";
import { sesion, json } from "@/lib/auth";

// GET /api/admin/stats?dias=30  -> datos y porcentajes para el panel
export async function GET(req) {
  const s = await sesion();
  if (!s || s.rol !== "admin") return json({ error: "Solo administrador" }, 403);
  const dias = Number(new URL(req.url).searchParams.get("dias") ?? 30);
  const filtro = "r.fecha_hora_inicio >= now() - ($1::int * interval '1 day')";

  const [total, estados, diasSemana, zonas, top] = await Promise.all([
    query(`SELECT COUNT(*)::int AS total FROM reserva r WHERE ${filtro}`, [dias]),
    query(`SELECT r.estado, COUNT(*)::int AS n,
                  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1)::float AS porcentaje
           FROM reserva r WHERE ${filtro} GROUP BY r.estado ORDER BY n DESC`, [dias]),
    query(`SELECT EXTRACT(ISODOW FROM r.fecha_hora_inicio)::int AS dia, COUNT(*)::int AS n
           FROM reserva r WHERE ${filtro} GROUP BY 1 ORDER BY 1`, [dias]),
    query(`SELECT z.nombre AS zona, COUNT(*)::int AS n,
                  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1)::float AS porcentaje
           FROM reserva r JOIN mesa m USING (id_mesa) JOIN zona z USING (id_zona)
           WHERE ${filtro} GROUP BY z.nombre ORDER BY n DESC`, [dias]),
    query(`SELECT c.nombre || ' ' || c.apellido AS cliente, COUNT(*)::int AS reservas
           FROM reserva r JOIN cliente c USING (id_cliente)
           WHERE ${filtro} GROUP BY c.id_cliente, c.nombre, c.apellido
           ORDER BY reservas DESC LIMIT 5`, [dias]),
  ]);
  return json({
    total: total.rows[0].total,
    por_estado: estados.rows,
    por_dia_semana: diasSemana.rows,
    por_zona: zonas.rows,
    clientes_top: top.rows,
  });
}
