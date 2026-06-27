import mongoose from "mongoose";

/**
 * Establish a connection to MongoDB using the URI from environment variables.
 * Exits the process on failure so the app never runs in a half-broken state.
 */
const connectDB = async () => {
  // Fail fast instead of letting queries buffer for 10s and return a vague 500.
  mongoose.set("bufferTimeoutMS", 5000);

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    console.error(
      "\n👉 Is MongoDB running? Start a local server, run Docker, or set a\n" +
        "   MongoDB Atlas connection string in server/.env (MONGO_URI).\n"
    );
    process.exit(1);
  }
};

export default connectDB;