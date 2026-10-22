
import { pool } from "./pool";

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  console.log("Tasks table is ready.");
}

initializeDatabase()
  .catch((error) => {
    console.error("Database initialization failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
