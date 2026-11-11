"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const cuando = (d) => new Date(d).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
const Barra = ({ etq, pct }) => (
  <div className="row"><span>{etq}</span><div className="track"><div className="fill" style={{ width: `${pct}%` }} /></div><b>{pct}%</b></div>
);

export default function Admin() {
  const router = useRouter();
  const [dias, setDias] = useState(30);
  const [s, setS] = useState(null);
  const [res, setRes] = useState([]);

  const cargar = useCallback(async () => {
    const [a, b] = await Promise.all([fetch(`/api/admin/stats?dias=${dias}`), fetch("/api/reservas")]);
    if (a.status === 401 || a.status === 403) return router.push("/");
    setS(await a.json()); setRes(await b.json());
  }, [dias, router]);
  useEffect(() => { cargar(); }, [cargar]);

  async function cambiar(id, estado) {
    await fetch(`/api/reservas/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estado }) });
    cargar();
  }
  async function salir() { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); }
  if (!s) return <p style={{ padding: 32 }}>Cargando…</p>;

  const pct = (e) => s.por_estado.find((x) => x.estado === e)?.porcentaje ?? 0;
  const porDia = DIAS.map((d, i) => s.por_dia_semana.find((x) => x.dia === i + 1)?.n ?? 0);
  const max = Math.max(1, ...porDia);
  return (
    <>
      <header className="top"><b>Café Reservas · Administración</b><button className="btn2 sm" onClick={salir}>Cerrar sesión</button></header>
      <main className="pg">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <h1>Panel general</h1>
          <select style={{ width: 180 }} value={dias} onChange={(e) => setDias(Number(e.target.value))} aria-label="Período">
            <option value={7}>Últimos 7 días</option><option value={30}>Últimos 30 días</option><option value={90}>Últimos 90 días</option>
          </select>
        </div>
        <div className="grid g4">
          <div className="card"><p className="k">Reservas</p><p className="v">{s.total}</p></div>
          <div className="card"><p className="k">Confirmadas</p><p className="v">{pct("confirmada")}%</p></div>
          <div className="card"><p className="k">Canceladas</p><p className="v">{pct("cancelada")}%</p></div>
          <div className="card"><p className="k">No-show</p><p className="v">{pct("no_show")}%</p></div>
        </div>
        <div className="grid g32">
          <div className="card">
            <p className="h">Reservas por día de la semana</p>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 190 }}>
              {porDia.map((n, i) => (
                <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 12 }}>
                  {n}<div style={{ height: Math.round((n / max) * 150), background: n === max ? "#B4532A" : "#E8C9B8", borderRadius: "4px 4px 0 0" }} />{DIAS[i]}
                </div>
              ))}
            </div>
          </div>
          <div className="card"><p className="h">Reservas por estado</p>{s.por_estado.map((e) => <Barra key={e.estado} etq={e.estado} pct={e.porcentaje} />)}</div>
        </div>
        <div className="grid g32">
          <div className="card">
            <p className="h">Últimas reservas</p>
            <table>
              <thead><tr><th>Cliente</th><th>Mesa</th><th>Fecha</th><th>Pers.</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {res.slice(0, 8).map((r) => (
                  <tr key={r.id_reserva}>
                    <td>{r.cliente}</td><td>{r.zona} · {r.mesa}</td><td>{cuando(r.fecha_hora_inicio)}</td><td>{r.cantidad_personas}</td>
                    <td><span className={r.estado === "confirmada" ? "ok" : r.estado === "pendiente" ? "pe" : "ot"}>{r.estado}</span></td>
                    <td>
                      {r.estado === "pendiente" && <button className="btn sm" onClick={() => cambiar(r.id_reserva, "confirmada")}>Confirmar</button>}
                      {["pendiente", "confirmada"].includes(r.estado) && <button className="btn2 sm" onClick={() => cambiar(r.id_reserva, "cancelada")}>Cancelar</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <div className="card" style={{ marginBottom: 16 }}><p className="h">Reservas por zona</p>{s.por_zona.map((z) => <Barra key={z.zona} etq={z.zona} pct={z.porcentaje} />)}</div>
            <div className="card"><p className="h">Clientes más frecuentes</p>
              {s.clientes_top.map((c) => <div className="item" key={c.cliente}><span>{c.cliente}</span><b>{c.reservas}</b></div>)}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
