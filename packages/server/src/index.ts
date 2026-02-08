// ══════════════════════════════════════════════
// HomeAsisstan - Server Entry Point
// ══════════════════════════════════════════════

import "dotenv/config";
import { app } from "./app";
import { createServer } from "http";
import { setupSocketIO } from "./socket";

const PORT = parseInt(process.env.PORT || "3001", 10);

const httpServer = createServer(app);

// WebSocket setup
setupSocketIO(httpServer);

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║  🏠 HomeAsisstan Server             ║
  ║  Running on http://0.0.0.0:${PORT}   ║
  ║  Environment: ${process.env.NODE_ENV || "development"}       ║
  ╚══════════════════════════════════════╝
  `);
});
