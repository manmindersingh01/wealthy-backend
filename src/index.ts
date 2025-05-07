import { Hono } from "hono";
import { createDb } from "./db";
import { users } from "./db/schema";
import { DrizzleD1Database } from "drizzle-orm/d1";
import { requireAuth } from "./middleware/auth";
import auth from "./routes/auth";

type Variables = {
  db: DrizzleD1Database;
};

const app = new Hono<{
  Bindings: {
    DB: D1Database;
  };
  Variables: Variables;
}>();

app.use("*", async (c, next) => {
  const db = createDb(c.env.DB);
  //@ts-ignore
  c.set("db", db);
  await next();
});

app.get("/", (c) => {
  return c.json({
    message:
      "Hello Hono , this is a public route only available for test purposes !",
  });
});

app.route("/auth", auth);

app.use("/users/*", requireAuth);

// Get all users
app.get("/users", async (c) => {
  const db = c.get("db");
  const allUsers = await db.select().from(users);
  return c.json(allUsers);
});

// Create a user
app.post("/users", async (c) => {
  const db = c.get("db");
  const body = await c.req.json();

  try {
    const newUser = await db
      .insert(users)
      //@ts-ignore
      .values({
        name: body.name,
        email: body.email,
      })
      .returning();

    return c.json(newUser[0], 201);
  } catch (error) {
    return c.json({ error: "Failed to create user" }, 400);
  }
});

export default app;
