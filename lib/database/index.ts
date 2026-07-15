import mongoose, { ConnectOptions } from "mongoose";
import "./models/news.model";
import "./models/category.model";
import "./models/tag.model";
import "./models/author.model";
import "./models/reporter.model";
import "./models/user.model";
import "./models/ad.model";
import "./models/poll.model";
import "./models/media.model";
import "./models/homepageLayout.model";
import "./models/setting.model";
import "./models/auditLog.model";
import "./models/page.model";
import "./models/menu.model";

const MONGODB_URI = process.env.MONGODB_URI;

// Set mongoose global options to suppress deprecation warnings
mongoose.set("returnDocument", "after");
mongoose.set("strictQuery", false);

interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend NodeJS global to include mongoose cache
declare global {
  // eslint-disable-next-line no-var
  var mongoose: CachedConnection | undefined;
}

const cached: CachedConnection = global.mongoose || {
  conn: null,
  promise: null,
};

export const connectToDatabase = async () => {
  if (cached.conn) return cached.conn;

  if (!MONGODB_URI) throw new Error("MONGODB_URI is missing");

  cached.promise =
    cached.promise ||
    mongoose.connect(MONGODB_URI, {
      dbName: "dailymuktimarg",
      bufferCommands: false,
      maxPoolSize: 20,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 10000, // wait max 10s for primary
    } as ConnectOptions); // explicitly cast as ConnectOptions

  try {
    cached.conn = await cached.promise;
    if (process.env.NODE_ENV !== "production") {
      console.log("✅ MongoDB connected");
    }
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    cached.conn = null;
    cached.promise = null;
    throw err;
  }

  global.mongoose = cached; // properly typed

  return cached.conn;
};
