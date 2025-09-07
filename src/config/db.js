import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DB_CONNECTION,
});

pool
  .connect()
  .then((client) => {
    console.log("Database connected successfully");
    client.release();
  })
  .catch((err) => {
    console.error("Error connecting to database:", err);
  });

export { pool };
