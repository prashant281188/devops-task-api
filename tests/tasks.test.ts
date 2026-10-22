
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { pool } from "../src/db/pool";

beforeAll(async () => {
  await pool.query("SELECT 1");
});

afterAll(async () => {
  await pool.end();
});

describe("Task Management API", () => {
  it("returns application health", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("reports database readiness", async () => {
    const response = await request(app).get("/ready");

    expect(response.status).toBe(200);
    expect(response.body.database).toBe("connected");
  });

  it("creates a task", async () => {
    const response = await request(app)
      .post("/api/tasks")
      .send({ title: "Automated test task" });

    expect(response.status).toBe(201);
    expect(response.body.data.title).toBe("Automated test task");
    expect(response.body.data.completed).toBe(false);

    // Clean up the record created by this test.
    await pool.query(
      "DELETE FROM tasks WHERE id = $1",
      [response.body.data.id]
    );
  });

  it("rejects an empty task title", async () => {
    const response = await request(app)
      .post("/api/tasks")
      .send({ title: "" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Validation failed");
  });

  it("returns 404 for an unknown route", async () => {
    const response = await request(app).get("/unknown-route");

    expect(response.status).toBe(404);
  });
});
