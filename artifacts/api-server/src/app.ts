import express, { type Express, type ErrorRequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { requireBasicAuth } from "./middlewares/basic-auth";
import { apiRateLimiter } from "./middlewares/rate-limit";
import { getAppPassword } from "./lib/settings";

const requireAuth = requireBasicAuth(getAppPassword);
const corsOrigin = process.env["CORS_ORIGIN"];

const app: Express = express();

app.use(helmet());
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ origin: corsOrigin ? corsOrigin.split(",") : true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  "/api",
  apiRateLimiter,
  (req, res, next) => {
    // Health checks (systemd/monitoring) must stay reachable without credentials.
    if (req.path === "/healthz") {
      next();
      return;
    }
    requireAuth(req, res, next);
  },
  router,
);

const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
};
app.use(errorHandler);

export default app;
