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
  // Bank integration
  bankAccountConnected: boolean("bank_account_connected").default(false),
  bankBalance: doublePrecision("bank_balance").default(0),
  lastBalanceUpdate: timestamp("last_balance_update"),
  // For handling category overflow
  allowCategoryOverflow: boolean("allow_category_overflow").default(true),
  // For UPI blocking feature
  upiBlockEnabled: boolean("upi_block_enabled").default(true),
  upiCurrentlyBlocked: boolean("upi_currently_blocked").default(false),
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
  // Track if this expense caused a category overflow
  causedOverflow: boolean("caused_overflow").default(false),
  // Track which category was affected if overflow happened
  overflowCategoryId: integer("overflow_category_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Financial quiz questions
export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  options: text("options").array().notNull(),
  correctAnswer: integer("correct_answer").notNull(),
  explanation: text("explanation").notNull(),
  difficulty: text("difficulty").notNull(),
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

export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).omit({
  id: true
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

export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;
export type QuizQuestion = typeof quizQuestions.$inferSelect;

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
    overBudget: boolean;
    overflow: number; // Amount over budget (negative means under budget)
  })[];
  spent: number;
  remaining: number;
  daysLeft: number;
  dailyBudget: number;
  bankBalance?: number;
  hasOverflow: boolean; // Does any category have overflow?
  upiBlocked: boolean; // Is UPI currently blocked due to budget issues?
};

// Type for quiz attempt
export type QuizAttempt = {
  questions: QuizQuestion[];
  correctAnswers: number;
  totalQuestions: number;
  completed: boolean;
  userId: number;
};

// Type for bank account
export type BankAccountInfo = {
  accountId: string;
  balance: number;
  lastUpdated: Date;
  connected: boolean;
};
