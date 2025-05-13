import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Users Table
export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// Budgets Table
export const budgets = sqliteTable("budgets", {
  id: integer("id").primaryKey(),
  amount: integer("amount").notNull().default(0),
  userId: integer("user_id")
    .unique()
    .references(() => users.id),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// Spaces Table
export const spaces = sqliteTable("spaces", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: integer("type").notNull().default(0), // can represent types as 0, 1, etc.
  isDefault: integer("is_default").notNull().default(0), // 0 = false, 1 = true
  balance: integer("balance").notNull().default(0),
  userId: integer("user_id").references(() => users.id),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// Transactions Table
export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey(),
  amount: integer("amount").notNull(),
  userId: integer("user_id").references(() => users.id),
  spaceId: integer("space_id").references(() => spaces.id),
  type: text("type", { enum: ["income", "expense"] }).notNull(),
  description: text("description").notNull(),
  date: text("date").notNull(), // ISO string like 2025-05-08T12:00:00Z
  category: text("category").notNull(),
  receiptUrl: text("receipt_url"), // optional
  isRecurring: integer("is_recurring").notNull().default(0), // 0 = false, 1 = true
  recurringInterval: text("recurring_interval", {
    enum: ["daily", "weekly", "monthly", "yearly"],
  }),
  nextRecurringDate: text("next_recurring_date"),
  lastProcessedDate: text("last_processed_date"),
  status: text("status").default("completed"), // optional
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const test = sqliteTable("test", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
