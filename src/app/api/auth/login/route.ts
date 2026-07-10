import { NextResponse } from "next/server";
import { pool } from "@/config/db";
import {
  verifyPassword,
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
} from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Correo y contraseña son obligatorios" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT id, first_name, last_name, email, password_hash, role, is_active
       FROM users WHERE email = $1`,
      [String(email).toLowerCase().trim()]
    );

    const user = result.rows[0];
    if (!user || !user.is_active) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
    });

    await logAudit(user.id, "login", "user", user.id, { email: user.email });

    const response = NextResponse.json({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("Error en login:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
