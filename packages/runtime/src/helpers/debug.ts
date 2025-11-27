import { appendFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const LOG_DIR = join(__dirname, "../../logs");
const LOG_FILE = join(LOG_DIR, "debug.log");

// small utility to log debug messages to a file.
// this is useful for debugging cross-service issues, especially when running inside spawn runtimes or in testcontainers
export function debug(...messages: unknown[]): void {
    if (!existsSync(LOG_DIR)) {
        mkdirSync(LOG_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString();
    const formatted = messages
        .map((m) => (typeof m === "string" ? m : JSON.stringify(m)))
        .join(" ");

    appendFileSync(LOG_FILE, `[${timestamp}] ${formatted}\n`);
}
