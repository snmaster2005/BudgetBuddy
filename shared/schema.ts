import { pgTable, text, serial, integer, doublePrecision, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  upiId: text("upi_id"),
  pushNotifications: boolean("push_notifications").default(true),
  upiSpendingLimits: boolean("upi_spending_limits").default(true),
  darkMode: boolean("dark_mode").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  iconColor: text("icon_color").notNull(),
  userId: integer("user_id").notNull(),
});

// Budgets table
export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  totalAmount: doublePrecision("total_amount").notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Budget categories table
export const budgetCategories = pgTable("budget_categories", {
  id: serial("id").primaryKey(),
  budgetId: integer("budget_id").notNull(),
  categoryId: integer("category_id").notNull(),
  amount: doublePrecision("amount").notNull(),
});

// Expenses table
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  categoryId: integer("category_id").notNull(),
  amount: doublePrecision("amount").notNull(),
  date: timestamp("date").notNull(),
  note: text("note"),
  isUPI: boolean("is_upi").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define schemas for insert operations
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  createdAt: true
});

export const insertBudgetCategorySchema = createInsertSchema(budgetCategories).omit({
  id: true
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true
});

// Define types for insert and select operations
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgets.$inferSelect;

export type InsertBudgetCategory = z.infer<typeof insertBudgetCategorySchema>;
export type BudgetCategory = typeof budgetCategories.$inferSelect;

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

// Extended schemas for API operations
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof loginSchema>;

// Expense with category info
export type ExpenseWithCategory = Expense & {
  category: Category;
};

// Budget with category breakdown
export type BudgetWithCategories = Budget & {
  categories: (BudgetCategory & {
    category: Category;
    spent: number;
  })[];
  spent: number;
  remaining: number;
  daysLeft: number;
  dailyBudget: number;
};
