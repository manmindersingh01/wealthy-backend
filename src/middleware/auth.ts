import { Context, Next } from "hono";
import { jwt, verify } from "hono/jwt";
import { HTTPException } from "hono/http-exception";

// JWT secret key - in production, use environment variables
const JWT_SECRET = "your-secret-key";

// Custom middleware to check if user is authenticated
export const requireAuth = async (c: Context, next: Next) => {
  try {
    // Get token from header
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new HTTPException(401, { message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // const jwtMiddleware = jwt({
    //   secret: JWT_SECRET,
    // });

    // Apply JWT middleware
    // await jwtMiddleware(c, async () => {
    //   const payload = c.get("jwtPayload");
    //   if (!payload) {
    //     throw new HTTPException(401, { message: "Invalid token" });
    //   }

    //   // Add user to context
    //   c.set("user", payload);
    //   await next();
    // });

    try {
      const decodedPayload = await verify(token, JWT_SECRET);
      c.set("user", decodedPayload);
      console.log("user", decodedPayload);
      await next();
    } catch (error) {}
  } catch (error) {
    console.error("Auth error:", error);
    throw new HTTPException(401, {
      message: "Invalid token",
      cause: error instanceof Error ? error.message : String(error),
    });
  }
};
