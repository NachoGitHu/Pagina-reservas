import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const clave = () => new TextEncoder().encode(process.env.AUTH_SECRET);

export const json = (data, status = 200) => Response.json(data, { status });

export async function crearSesion(u) {
  const token = await new SignJWT({ id: u.id_usuario, rol: u.rol, cid: u.id_cliente })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(clave());
  (await cookies()).set("sesion", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

// Devuelve { id, rol, cid } o null si no hay sesión válida
export async function sesion() {
  try {
    const token = (await cookies()).get("sesion")?.value;
    if (!token) return null;
    return (await jwtVerify(token, clave())).payload;
  } catch {
    return null;
  }
}
