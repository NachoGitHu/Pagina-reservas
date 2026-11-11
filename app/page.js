"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Inicio() {
  const router = useRouter();
  const [modo, setModo] = useState("login");
  const [f, setF] = useState({});
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    const r = await fetch(`/api/auth/${modo === "login" ? "login" : "registro"}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f),
    });
    const d = await r.json();
    if (!r.ok) return setErr(d.error);
    router.push(d.rol === "admin" ? "/admin" : "/cliente");
  }
  const campo = (k, etq, tipo = "text") => (
    <div key={k}><label htmlFor={k}>{etq}</label><input id={k} type={tipo} required onChange={set(k)} /></div>
  );
  return (
    <main className="pg" style={{ maxWidth: 420 }}>
      <h1>Café Reservas</h1>
      <form className="card" onSubmit={enviar}>
        <p className="h">{modo === "login" ? "Iniciar sesión" : "Crear cuenta"}</p>
        {modo === "registro" && [campo("nombre", "Nombre"), campo("apellido", "Apellido"), campo("telefono", "Teléfono")]}
        {campo("email", "Email", "email")}
        {campo("password", "Contraseña (8+ caracteres)", "password")}
        {err && <p className="err">{err}</p>}
        <button className="btn" style={{ width: "100%" }}>{modo === "login" ? "Entrar" : "Registrarme"}</button>
        <p className="k" style={{ marginTop: 14 }}>
          <button type="button" className="btn2 sm" onClick={() => { setModo(modo === "login" ? "registro" : "login"); setErr(""); }}>
            {modo === "login" ? "No tengo cuenta" : "Ya tengo cuenta"}
          </button>
        </p>
      </form>
    </main>
  );
}
