
import express from "express";
import { pool } from "./db/pool";
import { tasksRouter } from "./routes/tasks";

export const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "devops-task-api",
  });
});

app.get("/ready", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ready", database: "connected" });
  } catch {
    res.status(503).json({
      status: "not_ready",
      database: "unavailable",
    });
  }
});

app.use("/api/tasks", tasksRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((
  error: unknown,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction
) => {
  console.error("Request failed:", error);
  res.status(500).json({ error: "Internal server error" });
});
