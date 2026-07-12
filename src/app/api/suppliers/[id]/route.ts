import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/config/db";
import { getSessionFromRequest } from "@/lib/auth";

// Los proveedores solo puede modificarlos un administrador; el resto de roles
// tiene acceso de solo lectura.
async function requireAdmin(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (session?.role !== "admin") {
    return NextResponse.json(
      { error: "Solo un administrador puede modificar proveedores" },
      { status: 403 }
    );
  }
  return null;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const id = parseInt(params.id);
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM suppliers WHERE supplier_id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Proveedor no encontrado" },
          { status: 404 }
        );
      }
      
      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching supplier:", error);
    return NextResponse.json(
      { error: "Error al obtener el proveedor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const forbidden = await requireAdmin(request);
  if (forbidden) return forbidden;
  const params = await context.params;
  try {
    const id = parseInt(params.id);
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
      // Check for unique email constraint if email is provided and different
      if (email) {
        const emailCheck = await client.query(
          'SELECT supplier_id FROM suppliers WHERE email = $1 AND supplier_id != $2',
          [email, id]
        );
        if (emailCheck.rows.length > 0) {
          return NextResponse.json(
            { error: "El correo electrónico ya está registrado" },
            { status: 400 }
          );
        }
      }

      const result = await client.query(
        `UPDATE suppliers SET 
          name = $1, 
          contact_name = $2, 
          phone = $3, 
          email = $4, 
          address = $5
        WHERE supplier_id = $6 
        RETURNING *`,
        [name, contact_name, phone, email, address, id]
      );
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Proveedor no encontrado" },
          { status: 404 }
        );
      }
      
      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating supplier:", error);
    return NextResponse.json(
      { error: "Error al actualizar el proveedor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const forbidden = await requireAdmin(request);
  if (forbidden) return forbidden;
  const params = await context.params;
  try {
    const id = parseInt(params.id);
    const client = await pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM suppliers WHERE supplier_id = $1 RETURNING *',
        [id]
      );
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Proveedor no encontrado" },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ message: "Proveedor eliminado correctamente" });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return NextResponse.json(
      { error: "Error al eliminar el proveedor" },
      { status: 500 }
    );
  }
}
