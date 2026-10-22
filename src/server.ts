
import "dotenv/config";
import { app } from "./app";

const port = Number(process.env.PORT ?? 3000);

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Task API listening on port ${port}`);
});

function shutdown(signal: string) {
  console.log(`${signal} received; shutting down`);

  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("Graceful shutdown timed out");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
