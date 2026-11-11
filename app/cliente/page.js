"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ancho = (c) => (c <= 2 ? 96 : c <= 4 ? 120 : c <= 6 ? 150 : 180);
const ETQ = { libre: "Libre", reservada: "Reservada", tu_reserva: "Tu reserva" };
const CLASE = { libre: "free", reservada: "res", tu_reserva: "mine" };
const JSON_H = { "Content-Type": "application/json" };
const cuando = (d) => new Date(d).toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" });

export default function Cliente() {
  const router = useRouter();
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("21:00");
  const [personas, setPersonas] = useState(2);
  const [mesas, setMesas] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [sel, setSel] = useState(null);
  const [msg, setMsg] = useState("");
  const inicio = fecha ? new Date(`${fecha}T${hora}`).toISOString() : null;

  const cargar = useCallback(async () => {
    const r = await fetch("/api/reservas");
    if (r.status === 401) return router.push("/");
    setReservas(await r.json());
    if (inicio) setMesas(await (await fetch(`/api/mesas?inicio=${encodeURIComponent(inicio)}`)).json());
  }, [inicio, router]);
  useEffect(() => { cargar(); }, [cargar]);

  async function reservar() {
    const r = await fetch("/api/reservas", { method: "POST", headers: JSON_H,
      body: JSON.stringify({ id_mesa: sel, fecha_hora_inicio: inicio, cantidad_personas: Number(personas) }) });
    const d = await r.json();
    setMsg(r.ok ? "Reserva creada, queda pendiente de confirmación." : d.error);
    setSel(null); cargar();
  }
  async function cancelar(id) {
    await fetch(`/api/reservas/${id}`, { method: "PATCH", headers: JSON_H, body: JSON.stringify({ estado: "cancelada" }) });
    cargar();
  }
  async function salir() { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); }

  const zonas = mesas.reduce((a, m) => ((a[m.zona] ??= []).push(m), a), {});
  return (
    <>
      <header className="top"><b>Café Reservas</b><button className="btn2 sm" onClick={salir}>Cerrar sesión</button></header>
      <main className="pg">
        <h1>Mis reservas</h1>
        <div className="grid g32 cols">
          <div className="card">
            <p className="h">Todas mis reservas</p>
            {reservas.length === 0 && <p className="k">Todavía no tenés reservas.</p>}
            {reservas.map((r) => (
              <div className="item" key={r.id_reserva}>
                <span>{cuando(r.fecha_hora_inicio)} · {r.zona} · Mesa {r.mesa} · {r.cantidad_personas} pers.</span>
                <span>
                  <span className={r.estado === "confirmada" ? "ok" : r.estado === "pendiente" ? "pe" : "ot"}>{r.estado}</span>{" "}
                  {["pendiente", "confirmada"].includes(r.estado) && <button className="btn2 sm" onClick={() => cancelar(r.id_reserva)}>Cancelar</button>}
                </span>
              </div>
            ))}
          </div>
          <div className="card">
            <p className="h">Reservar una mesa</p>
            <label htmlFor="f">Fecha</label><input id="f" type="date" onChange={(e) => { setFecha(e.target.value); setSel(null); }} />
            <label htmlFor="h">Hora</label><input id="h" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
            <label htmlFor="p">Personas</label><input id="p" type="number" min="1" value={personas} onChange={(e) => setPersonas(e.target.value)} />
            <button className="btn" style={{ width: "100%" }} disabled={!sel} onClick={reservar}>
              {sel ? "Reservar la mesa elegida" : "Elegí una mesa en el mapa"}
            </button>
            {msg && <p className="k" style={{ marginTop: 10 }}>{msg}</p>}
          </div>
        </div>
        <div className="card">
          <p className="h">Mapa de mesas{fecha ? ` · ${cuando(inicio)}` : ""}</p>
          {!fecha && <p className="k">Elegí una fecha para ver el estado de las mesas.</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
            {Object.entries(zonas).map(([z, ms]) => (
              <div className="zone" key={z}><p>{z}</p>
                <div className="tables">
                  {ms.map((m) => {
                    const txt = <><b>Mesa {m.numero}</b>{m.capacidad} pers. · {ETQ[m.estado]}</>;
                    return m.estado === "libre" ? (
                      <button key={m.id_mesa} className={`t free${sel === m.id_mesa ? " sel" : ""}`} style={{ width: ancho(m.capacidad) }}
                        disabled={m.capacidad < personas} onClick={() => setSel(m.id_mesa)}>{txt}</button>
                    ) : (<div key={m.id_mesa} className={`t ${CLASE[m.estado]}`} style={{ width: ancho(m.capacidad) }}>{txt}</div>);
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
