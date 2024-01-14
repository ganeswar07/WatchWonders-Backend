import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./utils/index.js";

const app = express();

// Middleware for logging requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));

app.use(express.json({ limit: "64kb" }));

app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(express.static("public"));

app.use(cookieParser());

////////////////////////////////////////////////////////////////
import userRouter from "./routes/user.route.js";
import channelRouter from "./routes/channel.route.js";
import videoRouter from "./routes/video.route.js";

app.use("/api/v1/users", userRouter);

app.use("/api/v1/videos", videoRouter);

app.use(errorHandler);

export default app;
