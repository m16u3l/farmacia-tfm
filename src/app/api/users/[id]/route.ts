import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/config/db";
import { hashPassword, getSessionFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const SAFE_COLUMNS =
  "id, first_name, last_name, email, role, is_active, employee_id, created_at";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT ${SAFE_COLUMNS} FROM users WHERE id = $1`,
        [id]
      );
      if (result.rows.length === 0) {
        return NextResponse.json(
          { message: "Usuario no encontrado" },
          { status: 404 }
        );
      }
      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { first_name, last_name, email, password, role, is_active, employee_id } =
      await request.json();

    const client = await pool.connect();
    try {
      let result;
      if (password) {
        if (password.length < 8) {
          return NextResponse.json(
            { message: "La contraseña debe tener al menos 8 caracteres" },
            { status: 400 }
          );
        }
        const passwordHash = await hashPassword(password);
        result = await client.query(
          `UPDATE users SET first_name = $1, last_name = $2, email = $3,
             role = $4, is_active = $5, employee_id = $6, password_hash = $7
           WHERE id = $8 RETURNING ${SAFE_COLUMNS}`,
          [first_name, last_name, email, role, is_active, employee_id || null, passwordHash, id]
        );
      } else {
        result = await client.query(
          `UPDATE users SET first_name = $1, last_name = $2, email = $3,
             role = $4, is_active = $5, employee_id = $6
           WHERE id = $7 RETURNING ${SAFE_COLUMNS}`,
          [first_name, last_name, email, role, is_active, employee_id || null, id]
        );
      }

      if (result.rows.length === 0) {
        return NextResponse.json(
          { message: "Usuario no encontrado" },
          { status: 404 }
        );
      }

      const session = await getSessionFromRequest(request);
      await logAudit(session?.userId ?? null, "update", "user", Number(id), {
        email,
        role,
        is_active,
        password_changed: Boolean(password),
      });

      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const client = await pool.connect();
    try {
      await client.query("DELETE FROM users WHERE id = $1", [id]);
      const session = await getSessionFromRequest(request);
      await logAudit(session?.userId ?? null, "delete", "user", Number(id));
      return NextResponse.json({ message: "Usuario eliminado" });
    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
