import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/config/db";
import { hashPassword, getSessionFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const SAFE_COLUMNS =
  "id, first_name, last_name, email, role, is_active, employee_id, created_at";

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT ${SAFE_COLUMNS} FROM users ORDER BY id DESC`
      );
      return NextResponse.json(result.rows, { headers: corsHeaders });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { first_name, last_name, email, password, role, employee_id } =
      await request.json();

    if (!first_name || !last_name || !email || !password) {
      return NextResponse.json(
        { error: "Nombre, apellido, correo y contraseña son obligatorios" },
        { status: 400, headers: corsHeaders }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400, headers: corsHeaders }
      );
    }

    const passwordHash = await hashPassword(password);
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO users (first_name, last_name, email, password_hash, role, employee_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING ${SAFE_COLUMNS}`,
        [
          first_name,
          last_name,
          String(email).toLowerCase().trim(),
          passwordHash,
          role || "cajero",
          employee_id || null,
        ]
      );
      const created = result.rows[0];

      const session = await getSessionFromRequest(request);
      await logAudit(session?.userId ?? null, "create", "user", created.id, {
        email: created.email,
        role: created.role,
      });

      return NextResponse.json(created, { headers: corsHeaders });
    } finally {
      client.release();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isDuplicate = message.includes("duplicate key");
    return NextResponse.json(
      { error: isDuplicate ? "Ese correo ya está registrado" : message },
      { status: isDuplicate ? 409 : 500, headers: corsHeaders }
    );
  }
}
