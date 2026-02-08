// ══════════════════════════════════════════════
// Socket.IO Setup
// ══════════════════════════════════════════════

import { Server as HttpServer } from "http";
import { Server } from "socket.io";

let io: Server;

export function setupSocketIO(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // Unirse a la sala de una casa
    socket.on("join:house", (houseId: string) => {
      socket.join(`house:${houseId}`);
      console.log(`[Socket] ${socket.id} joined house:${houseId}`);
    });

    // Salir de la sala de una casa
    socket.on("leave:house", (houseId: string) => {
      socket.leave(`house:${houseId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
}
