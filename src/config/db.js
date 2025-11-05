import { Pool } from "pg";

if (!process.env.DB_CONNECTION) {
  throw new Error('Database connection string not found in environment variables');
}

const pool = new Pool({
  connectionString: process.env.DB_CONNECTION,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Add error handler for pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Only attempt connection in runtime, not during build
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV === 'production') {
  console.log('Testing database connection...');
  pool
    .connect()
    .then((client) => {
      console.log("Database connected successfully. Connection config:", {
        host: new URL(process.env.DB_CONNECTION).hostname,
        database: new URL(process.env.DB_CONNECTION).pathname.slice(1),
        ssl: true,
        max_connections: pool.totalCount,
        environment: process.env.NODE_ENV
      });
      client.release();
    })
    .catch((err) => {
      console.error("Error connecting to database:", {
        error: err.message,
        code: err.code,
        stack: err.stack,
        detail: err.detail
      });
    });
}

export { pool };
