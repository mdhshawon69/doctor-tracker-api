import { createApp } from "./app.js";
import { config } from "./config.js";
import { connectToDatabase, disconnectFromDatabase } from "./db.js";
async function start() {
    await connectToDatabase();
    const app = createApp();
    const server = app.listen(config.port, () => {
        console.log(`[api] listening on http://localhost:${config.port}`);
        console.log(`[api] allowing browser origin(s): ${config.frontendOrigins.join(", ")}`);
    });
    let shuttingDown = false;
    async function shutdown(signal) {
        if (shuttingDown)
            return;
        shuttingDown = true;
        console.log(`[api] ${signal} received, shutting down`);
        server.close(async () => {
            await disconnectFromDatabase();
            process.exit(0);
        });
    }
    process.on("SIGINT", () => void shutdown("SIGINT"));
    process.on("SIGTERM", () => void shutdown("SIGTERM"));
}
start().catch((error) => {
    console.error("[api] failed to start", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map