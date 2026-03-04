// ============================================================================
// Server Entry Point
// ============================================================================

require("dotenv").config();

const app = require("./src/app");
const { connectDB, closeDB } = require("./src/config/database");
const { initializeCollections } = require("./src/models/schema");
const { logger } = require("./src/services/logger");

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Initialize collections, indexes, and TTL policies
    await initializeCollections();

    // 3. Start Express server
    const server = app.listen(PORT, () => {
      logger.info(`DPI Backend API listening on port ${PORT}`);
      console.log(`\n[Server] http://localhost:${PORT}`);
      console.log("[Server] Endpoints:");
      console.log("  POST /logs          — Ingest traffic logs from DPI engine");
      console.log("  POST /alerts        — Ingest security alerts");
      console.log("  POST /flows         — Upsert flow statistics");
      console.log("  GET  /traffic       — Query traffic logs");
      console.log("  GET  /blocked       — Query blocked events");
      console.log("  GET  /stats         — Summary statistics");
      console.log("  GET  /analytics/top-domains");
      console.log("  GET  /analytics/top-applications");
      console.log("  GET  /analytics/traffic-volume");
      console.log("  GET  /analytics/blocked-events");
      console.log("  GET  /health        — Health check\n");
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n[Server] ${signal} received — shutting down...`);
      server.close(async () => {
        await closeDB();
        process.exit(0);
      });
      // Force exit after 10s
      setTimeout(() => process.exit(1), 10000);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (err) {
    logger.error("Failed to start server", { error: err.message });
    console.error("[Server] Fatal:", err.message);
    process.exit(1);
  }
}

start();
