import express from "express";
import routes from "./routes.js";

// ⭐ NEW: Load environment variables
import dotenv from "dotenv";
dotenv.config();

// ⭐ NEW: Import CORS
import cors from "cors";

const app = express();

// ⭐ NEW: Frontend URL from env (use fallback during development)
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// ⭐ NEW: Configure CORS
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,   // allows cookies/auth headers if needed
  })
);

app.use(express.json());
app.use("", routes);

export default app;
