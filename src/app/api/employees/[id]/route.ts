import { NextResponse } from "next/server";
import { pool } from "@/config/db";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        "SELECT * FROM employees WHERE employee_id = $1",
        [params.id]
      );
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Empleado no encontrado" },
          { status: 404 }
        );
      }

      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching employee:", error);
    return NextResponse.json(
      { error: "Error al obtener el empleado" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
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
          'SELECT employee_id FROM employees WHERE email = $1 AND employee_id != $2',
          [email, params.id]
        );
        if (emailCheck.rows.length > 0) {
          return NextResponse.json(
            { error: "El correo electrónico ya está registrado" },
            { status: 400 }
          );
        }
      }

      const result = await client.query(
        `UPDATE employees 
         SET first_name = $1, last_name = $2, email = $3, 
             phone = $4, role = $5
         WHERE employee_id = $6
         RETURNING *`,
        [first_name, last_name, email, phone, role, params.id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Empleado no encontrado" },
          { status: 404 }
        );
      }

      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating employee:", error);
    return NextResponse.json(
      { error: "Error al actualizar el empleado" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        "DELETE FROM employees WHERE employee_id = $1 RETURNING *",
        [params.id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Empleado no encontrado" },
          { status: 404 }
        );
      }

      return NextResponse.json({ message: "Empleado eliminado correctamente" });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { error: "Error al eliminar el empleado" },
      { status: 500 }
    );
  }
}
