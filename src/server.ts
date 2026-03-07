// server.ts
import { app } from "./app";

const PORT = process.env.PORT || 3000;

app.listen(PORT);

console.log(`🚀 Server running at http://localhost:${PORT}/api`);
console.log(`📚 Swagger docs at http://localhost:${PORT}/api/docs`);
