import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/config/db";
import { getSessionFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// Helper function for error responses with CORS
const errorResponse = (error: unknown, message: string) => {
  console.error(`API Error (${message}):`, error);
  return NextResponse.json(
    { 
      error: message,
      details: error instanceof Error ? error.message : String(error)
    },
    { status: 500, headers: corsHeaders }
  );
};

// Helper function for CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  let client;
  try {
    // Log connection attempt
    console.log('Attempting to connect to database...');
    client = await pool.connect();
    console.log('Database connection successful');

    // Perform query
    const result = await client.query(
      "SELECT * FROM products ORDER BY product_id DESC"
    );
    console.log(`Query executed successfully. Found ${result.rows?.length ?? 0} products`);

    if (!result.rows) {
      return NextResponse.json([], { headers: corsHeaders });
    }
    return NextResponse.json(result.rows, { headers: corsHeaders });
  } catch (error) {
    // Detailed error logging
    if (error instanceof Error) {
      console.error('Database error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        cause: error.cause
      });
    } else {
      console.error('Unknown error type:', error);
    }
    return errorResponse(error, "Error al obtener los productos - verifique la conexión a la base de datos");
  } finally {
    if (client) {
      console.log('Releasing database connection');
      client.release();
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      possible_uses,
      additional_info,
      laboratory,
      active_ingredient,
      concentration,
      health_registry,
      category,
      type,
      dosage_form,
      unit,
      dosage_instructions,
      barcode,
      status,
    } = body;
    const client = await pool.connect();
    try {
      const session = await getSessionFromRequest(request);
      const result = await client.query(
        `INSERT INTO products (name, description, possible_uses, additional_info, laboratory, active_ingredient, concentration, health_registry, category, type, dosage_form, unit, dosage_instructions, barcode, status, created_by)
				 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
        [name, description, possible_uses ?? null, additional_info ?? null, laboratory ?? null, active_ingredient ?? null, concentration ?? null, health_registry ?? null, category, type, dosage_form, unit, dosage_instructions ?? null, barcode, status, session?.userId ?? null]
      );
      await logAudit(session?.userId ?? null, "create", "product", result.rows[0].product_id, { name });
      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
