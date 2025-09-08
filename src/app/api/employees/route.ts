import { NextResponse } from "next/server";
import { pool } from "@/config/db";

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM employees 
        ORDER BY employee_id DESC
      `);
      return NextResponse.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { error: "Error al obtener los empleados" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      first_name,
      last_name,
      email,
      phone,
      role
    } = data;

    const client = await pool.connect();
    try {
      // Check for unique email constraint
      if (email) {
        const emailCheck = await client.query(
          'SELECT employee_id FROM employees WHERE email = $1',
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
        `INSERT INTO employees (
          first_name, last_name, email, phone, role
        ) VALUES ($1, $2, $3, $4, $5) 
        RETURNING *`,
        [first_name, last_name, email, phone, role]
      );
      
      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json(
      { error: "Error al crear el empleado" },
      { status: 500 }
    );
  }
}
