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
    console.warn(`[Socket] Connected: ${socket.id}`);

    // Unirse a la sala de una casa
    socket.on("join:house", (houseId: string) => {
      socket.join(`house:${houseId}`);
      console.warn(`[Socket] ${socket.id} joined house:${houseId}`);
    });

    // Salir de la sala de una casa
    socket.on("leave:house", (houseId: string) => {
      socket.leave(`house:${houseId}`);
    });

    // Chat: enviar mensaje en tiempo real
    socket.on("chat:message", (data: { houseId: string; message: unknown }) => {
      socket.to(`house:${data.houseId}`).emit("chat:message", data.message);
    });

    // Pánico: alerta en tiempo real
    socket.on("panic:trigger", (data: { houseId: string; ping: unknown }) => {
      io.to(`house:${data.houseId}`).emit("panic:alert", data.ping);
    });

    // Notificación en tiempo real
    socket.on("notification:new", (data: { houseId: string; notification: unknown }) => {
      io.to(`house:${data.houseId}`).emit("notification:new", data.notification);
    });

    socket.on("disconnect", () => {
      console.warn(`[Socket] Disconnected: ${socket.id}`);
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
