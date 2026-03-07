// server.ts
import { app } from "./app";

const PORT = process.env.PORT || 3000;

app.get("/", () => "Hello Elysia").listen(PORT);

console.log(`🚀 Server running at http://localhost:${PORT}`);
console.log(`📚 Swagger docs at http://localhost:${PORT}/docs`);
