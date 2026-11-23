import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/auth";

const app: Express = express();

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

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(cookieParser(process.env.SESSION_SECRET || "postforge_secret_key_session"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware as any);

app.use("/api", router);

app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    logger.error({ err }, "Unhandled API error");
    const statusCode = typeof err.status === "number" ? err.status : 500;
    res.status(statusCode).json({
      message: err.message || "An unexpected error occurred while processing your request.",
    });
  },
);

export default app;
