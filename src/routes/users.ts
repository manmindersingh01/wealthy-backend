import { Hono } from "hono";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { DrizzleD1Database } from "drizzle-orm/d1";
import { JWTPayload } from "hono/utils/jwt/types";

type Variables = {
  db: DrizzleD1Database;
  user: JWTPayload;
};

const usersRouter = new Hono<{
  Variables: Variables;
}>();

// Get all users (protected route)
usersRouter.get("/", requireAuth, async (c) => {
  try {
    const db = c.get("db");
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users);
    const user = c.get("user");
    return c.json({
      message: "Users retrieved successfully",
      users: allUsers,
      user,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return c.json(
      { message: "Failed to fetch users", error: String(error) },
      500
    );
  }
});

// Get user by ID (protected route)
usersRouter.get("/:id", requireAuth, async (c) => {
  try {
    const db = c.get("db");
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      return c.json({ message: "Invalid user ID" }, 400);
    }

    const user = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .get();

    if (!user) {
      return c.json({ message: "User not found" }, 404);
    }

    return c.json({
      message: "User retrieved successfully",
      user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return c.json(
      { message: "Failed to fetch user", error: String(error) },
      500
    );
  }
});

export default usersRouter;
