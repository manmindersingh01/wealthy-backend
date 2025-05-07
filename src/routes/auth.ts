import { Hono } from "hono";
import { sign } from "hono/jwt";
import { HTTPException } from "hono/http-exception";
import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import { createDb } from "../db";
import * as bcrypt from "bcryptjs";

const auth = new Hono<{
  Bindings: {
    DB: D1Database;
  };
}>();

const JWT_SECRET = "your-secret-key";

auth.post("/register", async (c) => {
  const db = createDb(c.env.DB);
  const { name, email, password } = await c.req.json();

  if (!name || !email || !password) {
    throw new HTTPException(400, { message: "All fields are required" });
  }

  try {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    if (existingUser.length > 0) {
      throw new HTTPException(400, { message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // console.log("password hashed ");

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
      })
      .returning();
    console.log("user created");
    // Generate token
    const token = await sign({ userId: newUser[0].id }, JWT_SECRET);
    console.log("token generated");
    return c.json(
      {
        message: "User registered successfully",
        token,
        user: {
          id: newUser[0].id,
          name: newUser[0].name,
          email: newUser[0].email,
        },
      },
      201
    );
  } catch (error) {
    console.error("Registration error:", error);
    throw new HTTPException(500, {
      message: "Failed to register user",
      cause: error instanceof Error ? error.message : String(error),
    });
  }
});

// Login user
auth.post("/login", async (c) => {
  const db = createDb(c.env.DB);
  const { email, password } = await c.req.json();

  if (!email || !password) {
    throw new HTTPException(400, {
      message: "Email and password are required",
    });
  }

  try {
    const user = await db.select().from(users).where(eq(users.email, email));
    if (user.length === 0) {
      throw new HTTPException(401, { message: "Invalid credentials" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user[0].password);
    if (!isValidPassword) {
      throw new HTTPException(401, { message: "Invalid credentials" });
    }

    const token = await sign({ userId: user[0].id }, JWT_SECRET);

    return c.json({
      message: "Login successful",
      token,
      user: {
        id: user[0].id,
        name: user[0].name,
        email: user[0].email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    throw new HTTPException(500, {
      message: "Failed to login",
      cause: error instanceof Error ? error.message : String(error),
    });
  }
});

export default auth;
