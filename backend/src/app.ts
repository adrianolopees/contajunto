import path from "node:path";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import groupRoutes from "./routes/group.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import healthRoutes from "./routes/health.routes.js";
import categorieRoutes from "./routes/category.routes.js";
import errorMiddleware from "./middlewares/error.middleware.js";

const app = express();

// Render (e qualquer PaaS) coloca 1 proxy TLS na frente: sem isto o Express
// vê a conexão como http (secure cookie não gruda) e o express-rate-limit
// lança erro por não conseguir identificar o IP real do cliente.
app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use("/health", healthRoutes);
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/groups", groupRoutes);
app.use("/transactions", transactionRoutes);
app.use("/categories", categorieRoutes);

// Em produção o mesmo serviço serve a SPA e a API (origem única -> cookie
// first-party, sem CORS). Assets estáticos primeiro; qualquer GET restante
// que não seja rota de API cai no index.html (client-side routing).
if (process.env.NODE_ENV === "production") {
  const clientDist = path.resolve(import.meta.dirname, "../../frontend/dist");
  const apiPrefixes =
    /^\/(auth|users|groups|transactions|categories|health)(\/|$)/;

  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method !== "GET" || apiPrefixes.test(req.path)) {
      next();
      return;
    }
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use(errorMiddleware);

export default app;
