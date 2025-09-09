import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DB_CONNECTION,
});

// Only attempt connection in runtime, not during build
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV === 'production') {
  pool
    .connect()
    .then((client) => {
      console.log("Database connected successfully");
      client.release();
    })
    .catch((err) => {
      console.error("Error connecting to database:", err);
    });
}

export { pool };
