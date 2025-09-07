import { NextResponse } from 'next/server';
import { pool } from '@/config/db';

export async function GET() {
  console.log('Fetching usuarios from database');
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM users');
      return NextResponse.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
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
      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
