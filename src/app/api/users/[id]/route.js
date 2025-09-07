import { pool } from "@/config/db";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query("SELECT * FROM users WHERE id = $1", [
        params.id,
      ]);
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
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { first_name, last_name, email } = await request.json();
    const client = await pool.connect();
    try {
      await client.query(
        "UPDATE users SET first_name = $1, last_name = $2, email = $3 WHERE id = $4",
        [first_name, last_name, email, params.id]
      );
      return NextResponse.json({ id: params.id, first_name, last_name, email });
    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const client = await pool.connect();
    try {
      await client.query("DELETE FROM users WHERE id = $1", [params.id]);
      return NextResponse.json({ message: "Usuario eliminado" });
    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
