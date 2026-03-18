require("dotenv").config();//Direct require direct exsecute the file 
const express = require("express");//special require need module.exports = function name 
const cors = require("cors");
const connectDB = require("./config/db");
const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const sectionRoutes = require("./routes/sections");
const billRoutes = require("./routes/bills");
const customerRoutes = require("./routes/customers");
const whatsappRoutes = require("./routes/whatsapp");
const settingsRoutes = require("./routes/settings");

connectDB();

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(requestLogger);

app.get("/", (req, res) => {
  res.json({ status: "ok", app: "Fashion Garments Billing System", version: "1.0.0" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/settings", settingsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "NotFound", message: `Route ${req.method} ${req.originalUrl} not found` });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Fashion Garments server running on port ${PORT}`);
});

module.exports = app;