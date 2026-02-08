// ══════════════════════════════════════════════
// Express App Configuration
// ══════════════════════════════════════════════

import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middleware/error-handler";
import { authRouter } from "./routes/auth.routes";
import { housesRouter } from "./routes/houses.routes";
import { usersRouter } from "./routes/users.routes";

export const app: Express = express();

// ── Global Middleware ────────────────────────
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health Check ─────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Routes ───────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/houses", housesRouter);
app.use("/api/users", usersRouter);

// ── Error Handler (must be last) ─────────────
app.use(errorHandler);
