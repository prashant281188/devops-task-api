
import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool";

export const tasksRouter = Router();

const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).nullable().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  completed: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field is required",
});

tasksRouter.get("/", async (_req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tasks ORDER BY id DESC"
    );
    res.json({ data: result.rows });
  } catch (error) {
    next(error);
  }
});

tasksRouter.get("/:id", async (req, res, next) => {
  try {
    if (!/^[1-9]\d*$/.test(req.params.id)) {
      res.status(400).json({ error: "Invalid task ID" });
      return;
    }

    const result = await pool.query(
      "SELECT * FROM tasks WHERE id = $1",
      [req.params.id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

tasksRouter.post("/", async (req, res, next) => {
  try {
    const parsed = createTaskSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Validation failed",
        details: parsed.error.issues,
      });
      return;
    }

    const { title, description } = parsed.data;

    const result = await pool.query(
      `INSERT INTO tasks (title, description)
       VALUES ($1, $2)
       RETURNING *`,
      [title, description ?? null]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

tasksRouter.patch("/:id", async (req, res, next) => {
  try {
    if (!/^[1-9]\d*$/.test(req.params.id)) {
      res.status(400).json({ error: "Invalid task ID" });
      return;
    }

    const parsed = updateTaskSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Validation failed",
        details: parsed.error.issues,
      });
      return;
    }

    const current = await pool.query(
      "SELECT * FROM tasks WHERE id = $1",
      [req.params.id]
    );

    if (current.rowCount === 0) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const old = current.rows[0];
    const changes = parsed.data;

    const result = await pool.query(
      `UPDATE tasks
       SET title = $1,
           description = $2,
           completed = $3,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [
        changes.title ?? old.title,
        changes.description !== undefined
          ? changes.description
          : old.description,
        changes.completed ?? old.completed,
        req.params.id,
      ]
    );

    res.json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

tasksRouter.delete("/:id", async (req, res, next) => {
  try {
    if (!/^[1-9]\d*$/.test(req.params.id)) {
      res.status(400).json({ error: "Invalid task ID" });
      return;
    }

    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
