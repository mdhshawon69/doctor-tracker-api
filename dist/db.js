import mongoose from "mongoose";
import { config } from "./config.js";
let connectionPromise = null;
/**
 * A single shared connection for the whole process. The promise is cached so a
 * burst of requests during startup cannot open several pools.
 */
export async function connectToDatabase() {
    if (mongoose.connection.readyState === 1) {
        return mongoose;
    }
    if (!connectionPromise) {
        connectionPromise = mongoose
            .connect(config.mongoUri, {
            serverSelectionTimeoutMS: 8000,
            maxPoolSize: 10,
        })
            .then((instance) => {
            console.log("[db] connected to MongoDB");
            return instance;
        })
            .catch((error) => {
            // Let the next attempt retry instead of caching a failed connection.
            connectionPromise = null;
            throw error;
        });
    }
    return connectionPromise;
}
export async function disconnectFromDatabase() {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    connectionPromise = null;
}
//# sourceMappingURL=db.js.map