import express from "express";
import cors from "cors";
import { testSupabaseConnection } from "./config/supabase.js";
import userRouter from "./routes/userRoute.js";
import foodRouter from "./routes/foodRoute.js";
import "dotenv/config";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import authRouter from "./routes/authRoute.js";
import { connectDB } from "./config/db.js";
import forcePasswordRouter from "./routes/forcePasswordRoute.js";


// app config
const app = express();
const port = process.env.PORT || 4000;

// middlewares
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

connectDB();
app.use("/api/food", foodRouter);
app.use("/images", express.static("uploads"));
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);

// Initialize connections
const initializeServer = async () => {
  console.log("🚀 Initializing server...");

  // Supabase connection test
  const supabaseConnected = await testSupabaseConnection();

  if (!supabaseConnected) {
    console.warn("⚠️  Server starting without Supabase connection");
    console.warn("   Authentication features may not work properly");
  }

  console.log("✅ Server initialization complete\n");
};

// Initialize connections
await initializeServer();

// api endpoints
// app.use("/api/user", userRouter);

app.use("/api/force", forcePasswordRouter);

app.use("/api/auth", authRouter);

app.get("/", (req, res) => {
  res.send("API Working");
});

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const supabaseHealthy = await testSupabaseConnection();

    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        supabase: supabaseHealthy ? "connected" : "disconnected",
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`🌟 Server started successfully on http://localhost:${port}`);
  console.log(`📋 Health check available at http://localhost:${port}/health`);
  console.log(
    `🔐 Auth endpoints available at http://localhost:${port}/api/auth`
  );
});
