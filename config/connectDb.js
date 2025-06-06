import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();
const DB_URL = process.env.DB_URL;
if (!DB_URL) {
  console.error("❌ MONGO_URL is not defined in environment variables");
  process.exit(1); // Exit the process if DB URL is missing
}

mongoose
  .connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB is connected");
  })
  .catch((err) => {
    console.error("❌ Failed to connect MongoDB:", err.message);
    process.exit(1); // Optionally exit if the DB is critical
  });

  