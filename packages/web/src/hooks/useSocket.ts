// ══════════════════════════════════════════════
// WebSocket Hook
// ══════════════════════════════════════════════

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/auth.store";

const SOCKET_URL = window.location.origin.replace(":5173", ":3001");

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const house = useAuthStore((s) => s.house);

  useEffect(() => {
    if (!house?.id) return;

    // Crear conexión
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Socket] Connected");
      socket.emit("join:house", house.id);
    });

    socket.on("disconnect", () => {
      console.log("[Socket] Disconnected");
    });

    return () => {
      socket.emit("leave:house", house.id);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [house?.id]);

  return socketRef.current;
}
