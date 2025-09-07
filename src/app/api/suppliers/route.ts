import { NextResponse } from "next/server";
import { pool } from "@/config/db";

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM suppliers 
        ORDER BY supplier_id DESC
      `);
      return NextResponse.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json(
      { error: "Error al obtener los proveedores" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      name,
      contact_name,
      phone,
      email,
      address
    } = data;

    const client = await pool.connect();
    try {
      // Check for unique email constraint if email is provided
      if (email) {
        const emailCheck = await client.query(
          'SELECT supplier_id FROM suppliers WHERE email = $1',
          [email]
        );
        if (emailCheck.rows.length > 0) {
          return NextResponse.json(
            { error: "El correo electrónico ya está registrado" },
            { status: 400 }
          );
        }
      }

      const result = await client.query(
        `INSERT INTO suppliers (
          name, contact_name, phone, email, address
        ) VALUES ($1, $2, $3, $4, $5) 
        RETURNING *`,
        [name, contact_name, phone, email, address]
      );
      
      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating supplier:", error);
    return NextResponse.json(
      { error: "Error al crear el proveedor" },
      { status: 500 }
    );
  }
}
