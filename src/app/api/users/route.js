import { NextResponse } from 'next/server';
import { pool } from '@/config/db';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  console.log('Fetching usuarios from database');
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM users');
      return NextResponse.json(result.rows, { headers: corsHeaders });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request) {
  try {
    const { first_name, last_name, email } = await request.json();
    const client = await pool.connect();
    try {
      const result = await client.query(
        "INSERT INTO users (first_name, last_name, email) VALUES ($1, $2, $3) RETURNING *",
        [first_name, last_name, email]
      );
      return NextResponse.json(result.rows[0], { headers: corsHeaders });
    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
