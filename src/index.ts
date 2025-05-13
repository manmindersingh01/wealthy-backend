import { Hono } from "hono";
import { createDb } from "./db";
import { budgets, spaces, transactions, users } from "./db/schema";
import { DrizzleD1Database } from "drizzle-orm/d1";
import { requireAuth } from "./middleware/auth";
import auth from "./routes/auth";
import { JWTPayload } from "hono/utils/jwt/types";
import { cors } from "hono/cors";
import { and, desc, eq, gte, lte } from "drizzle-orm";
type Variables = {
  db: DrizzleD1Database;
  user: JWTPayload;
};

const app = new Hono<{
  Bindings: {
    DB: D1Database;
  };
  Variables: Variables;
}>();

app.use("*", cors());
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

app.use("/api/v1/*", requireAuth);

// Get all users

app.get("/api/v1/users", async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  console.log(user);
  const allUsers = await db.select().from(users);
  return c.json({
    allUsers,
    user,
  });
});

// Create a user

app.post("/api/v1/users", async (c) => {
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
app.get("/api/v1/user", async (c) => {
  const res = c.get("user");
  const db = c.get("db");
  const userid = res.userId;
  // const userData = await db
  //   .select()
  //   .from(users)
  //   .where(eq(users.id, 10))
  //   .then((userData) => {
  //     return c.json(userData[0]);
  //   });
  if (res) {
    const userData = await db
      .select()
      .from(users)
      //@ts-ignore
      .where(eq(users.id, userid));
    return c.json(userData[0]);
  }
});
app.post("/api/v1/createSpace", async (c) => {
  const db = c.get("db");
  const body = await c.req.json();
  const user = c.get("user");
  const { balance, name, description, isDefault } = body;

  const parsedBalance = parseFloat(balance);

  if (isNaN(parsedBalance)) {
    return c.json({ error: "Invalid balance" }, 400);
  }

  const existingSpaces = await db.select().from(spaces);

  const shouldBeDefault = existingSpaces.length === 0 ? true : isDefault;
  if (shouldBeDefault) {
    await db.update(spaces).set({
      isDefault: 0,
    });
  }

  const newSpace = await db
    .insert(spaces)
    //@ts-ignore
    .values({
      name,
      balance: parsedBalance,
      description,
      isDefault,
      userId: user.userId,
    })
    .returning();
  return c.json(newSpace[0], 201);
});

app.get("/api/v1/spaces", async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const data = await db
    .select()
    .from(spaces)
    .leftJoin(transactions, eq(spaces.id, transactions.spaceId))
    //@ts-ignore
    .where(eq(spaces.userId, user.userId))
    .orderBy(desc(spaces.createdAt));
  return c.json(data);
});

app.get("/api/v1/space/:id", async (c) => {
  const db = c.get("db");
  const { id } = c.req.param();

  const data = await db
    .select()
    .from(spaces)
    .leftJoin(transactions, eq(spaces.id, transactions.spaceId))
    //@ts-ignore
    .where(eq(spaces.id, id));
  return c.json(data);
});

app.get("/api/v1/budget", async (c) => {
  const db = c.get("db");
  const user = c.get("user");

  const data = await db
    .select()
    .from(budgets)
    //@ts-ignore
    .where(eq(budgets.id, user.userId));

  const currentDate = new Date();
  const startOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const endOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );
  console.log("reach before expances ");
  const expances = await db.select().from(transactions);
  // .where(
  //   and(
  //     //@ts-ignore
  //     gte(transactions.date, startOfMonth),
  //     //@ts-ignore
  //     lte(transactions.date, endOfMonth)
  //   )
  // );
  console.log(expances);
  const budget = await db
    .select()
    .from(budgets)
    //@ts-ignore
    .where(eq(budgets.userId, user.userId));
  const totalExpenses = expances.reduce((acc, curr) => {
    return acc + curr.amount;
  }, 0);
  console.log("reach after expances ");
  return c.json({ totalExpenses, budget });
});

app.post("/api/v1/update-budget", async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const { amount } = await c.req.json();

  const checkBudget = await db
    .select()
    .from(budgets)
    //@ts-ignore
    .where(eq(budgets.id, user.userId));
  if (checkBudget.length === 0) {
    //@ts-ignore
    await db.insert(budgets).values({
      amount,
      userId: user.userId,
    });
  } else {
    //@ts-ignore
    await db.update(budgets).set({ amount }).where(eq(budgets.id, user.userId));
  }
  return c.json({ message: "Budget updated" }, 200);
});
export default app;
