// ══════════════════════════════════════════════
// Express App Configuration
// ══════════════════════════════════════════════

import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middleware/error-handler";
import { authRouter } from "./modules/auth/auth.routes";
import { housesRouter } from "./routes/houses.routes";
import { usersRouter } from "./modules/users/users.routes";
import { tasksRouter } from "./routes/tasks.routes";
import { financeRouter } from "./modules/finance/finance.routes";
import { dashboardRouter } from "./routes/dashboard.routes";
import { communicationRouter } from "./routes/communication.routes";
import { calendarRouter } from "./routes/calendar.routes";
import { healthRouter } from "./routes/health.routes";
import { securityRouter } from "./routes/security.routes";
import { adminRouter } from "./routes/admin.routes";
import { petsRouter } from "./routes/pets.routes";
import { checkExternalAccess } from "./middleware/external-guard";

export const app: Express = express();

// ── Global Middleware ────────────────────────
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
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
app.use("/api/admin", adminRouter);
app.use("/api/pets", petsRouter);

// ── Module Routes (with external access guard) ──
const externalGuard = checkExternalAccess();
app.use("/api/tasks", externalGuard, tasksRouter);
app.use("/api/finance", externalGuard, financeRouter);
app.use("/api/dashboard", externalGuard, dashboardRouter);
app.use("/api/communication", externalGuard, communicationRouter);
app.use("/api/calendar", externalGuard, calendarRouter);
app.use("/api/health", externalGuard, healthRouter);
app.use("/api/security", externalGuard, securityRouter);

// ── Error Handler (must be last) ─────────────
app.use(errorHandler);
