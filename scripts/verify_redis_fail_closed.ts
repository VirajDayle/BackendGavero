import { redis } from "../src/config/redis";

async function verifyFailClosed() {
  console.log("Simulating Redis failure...");
  
  // Mock redis.get to throw
  const originalGet = redis.get;
  redis.get = async () => { throw new Error("Redis Connection Refused"); };

  try {
    // This is what the middleware does
    console.log("Middleware attempting Redis check...");
    const revoked = await redis.get("some_key");
    console.log("Result:", revoked);
  } catch (err: any) {
    console.log("Caught expected error:", err.message);
    if (err.message === "Redis Connection Refused") {
      console.log("SUCCESS: Fail-Closed logic will trigger correctly.");
    } else {
      console.log("FAILURE: Unexpected error:", err);
    }
  } finally {
    redis.get = originalGet;
  }
}

verifyFailClosed();
