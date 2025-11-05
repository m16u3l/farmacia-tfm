import { NextResponse } from "next/server";
import { pool } from "@/config/db";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM employees 
        ORDER BY employee_id DESC
      `);
      if (!result.rows) {
        return NextResponse.json([], { headers: corsHeaders });
      }
      return NextResponse.json(result.rows, { headers: corsHeaders });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { error: "Error al obtener los empleados" },
      { status: 500, headers: corsHeaders }
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
            { status: 400, headers: corsHeaders }
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
      
      return NextResponse.json(result.rows[0], { headers: corsHeaders });
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
