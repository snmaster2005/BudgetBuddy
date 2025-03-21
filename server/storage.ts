import { User, InsertUser, Category, InsertCategory, Budget, InsertBudget, BudgetCategory, InsertBudgetCategory, Expense, InsertExpense, BudgetWithCategories, ExpenseWithCategory } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Define the storage interface
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Categories
  getCategories(userId: number): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Budgets
  getBudget(userId: number, month: number, year: number): Promise<BudgetWithCategories | undefined>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: number, budget: Partial<Budget>): Promise<Budget | undefined>;
  
  // Budget categories
  getBudgetCategories(budgetId: number): Promise<BudgetCategory[]>;
  createBudgetCategory(budgetCategory: InsertBudgetCategory): Promise<BudgetCategory>;
  updateBudgetCategory(id: number, budgetCategory: Partial<BudgetCategory>): Promise<BudgetCategory | undefined>;
  
  // Expenses
  getExpenses(userId: number): Promise<ExpenseWithCategory[]>;
  getExpensesByCategory(userId: number, categoryId: number): Promise<Expense[]>;
  getExpensesByMonth(userId: number, month: number, year: number): Promise<ExpenseWithCategory[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  
  // Summaries
  getCategorySpending(userId: number, month: number, year: number): Promise<{categoryId: number, spent: number}[]>;
  
  // Session store
  sessionStore: session.SessionStore;
}

// Memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private budgets: Map<number, Budget>;
  private budgetCategories: Map<number, BudgetCategory>;
  private expenses: Map<number, Expense>;
  
  sessionStore: session.SessionStore;
  
  private userIdCounter: number;
  private categoryIdCounter: number;
  private budgetIdCounter: number;
  private budgetCategoryIdCounter: number;
  private expenseIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.budgets = new Map();
    this.budgetCategories = new Map();
    this.expenses = new Map();
    
    this.userIdCounter = 1;
    this.categoryIdCounter = 1;
    this.budgetIdCounter = 1;
    this.budgetCategoryIdCounter = 1;
    this.expenseIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Clear expired sessions every 24h
    });
    
    // Initialize with default categories
    this.initializeDefaultCategories();
  }
  
  private initializeDefaultCategories() {
    const defaultCategories = [
      { name: "Food", icon: "utensils", iconColor: "#10B981" },
      { name: "Shopping", icon: "shopping-bag", iconColor: "#3B82F6" },
      { name: "Entertainment", icon: "film", iconColor: "#8B5CF6" },
      { name: "Transport", icon: "bus", iconColor: "#F59E0B" },
      { name: "Education", icon: "book", iconColor: "#EC4899" },
      { name: "Other", icon: "ellipsis-h", iconColor: "#6B7280" }
    ];
    
    // Will be associated with users upon creation
  }
  
  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    
    // Create default categories for the user
    this.createDefaultCategoriesForUser(id);
    
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  private async createDefaultCategoriesForUser(userId: number) {
    const defaultCategories = [
      { name: "Food", icon: "utensils", iconColor: "#10B981" },
      { name: "Shopping", icon: "shopping-bag", iconColor: "#3B82F6" },
      { name: "Entertainment", icon: "film", iconColor: "#8B5CF6" },
      { name: "Transport", icon: "bus", iconColor: "#F59E0B" },
      { name: "Education", icon: "book", iconColor: "#EC4899" },
      { name: "Other", icon: "ellipsis-h", iconColor: "#6B7280" }
    ];
    
    for (const cat of defaultCategories) {
      await this.createCategory({
        name: cat.name,
        icon: cat.icon,
        iconColor: cat.iconColor,
        userId
      });
    }
  }
  
  // Categories
  async getCategories(userId: number): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(
      (category) => category.userId === userId
    );
  }
  
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }
  
  // Budgets
  async getBudget(userId: number, month: number, year: number): Promise<BudgetWithCategories | undefined> {
    const budget = Array.from(this.budgets.values()).find(
      (budget) => budget.userId === userId && budget.month === month && budget.year === year
    );
    
    if (!budget) return undefined;
    
    const budgetCats = await this.getBudgetCategories(budget.id);
    const categorySpending = await this.getCategorySpending(userId, month, year);
    
    // Calculate total spent
    let totalSpent = 0;
    const categoriesWithSpent = await Promise.all(
      budgetCats.map(async (bc) => {
        const category = await this.getCategory(bc.categoryId);
        const spent = categorySpending.find(cs => cs.categoryId === bc.categoryId)?.spent || 0;
        totalSpent += spent;
        return {
          ...bc,
          category: category!,
          spent
        };
      })
    );
    
    // Calculate remaining budget and days info
    const remaining = budget.totalAmount - totalSpent;
    
    // Calculate days left in month
    const today = new Date();
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    let daysLeft = 0;
    
    if (today.getMonth() + 1 === month && today.getFullYear() === year) {
      daysLeft = lastDayOfMonth - today.getDate();
    }
    
    const dailyBudget = daysLeft > 0 ? remaining / daysLeft : 0;
    
    return {
      ...budget,
      categories: categoriesWithSpent,
      spent: totalSpent,
      remaining,
      daysLeft,
      dailyBudget
    };
  }
  
  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const id = this.budgetIdCounter++;
    const now = new Date();
    const budget: Budget = { ...insertBudget, id, createdAt: now };
    this.budgets.set(id, budget);
    return budget;
  }
  
  async updateBudget(id: number, budgetData: Partial<Budget>): Promise<Budget | undefined> {
    const budget = this.budgets.get(id);
    if (!budget) return undefined;
    
    const updatedBudget = { ...budget, ...budgetData };
    this.budgets.set(id, updatedBudget);
    return updatedBudget;
  }
  
  // Budget categories
  async getBudgetCategories(budgetId: number): Promise<BudgetCategory[]> {
    return Array.from(this.budgetCategories.values()).filter(
      (bc) => bc.budgetId === budgetId
    );
  }
  
  async createBudgetCategory(insertBudgetCategory: InsertBudgetCategory): Promise<BudgetCategory> {
    const id = this.budgetCategoryIdCounter++;
    const budgetCategory: BudgetCategory = { ...insertBudgetCategory, id };
    this.budgetCategories.set(id, budgetCategory);
    return budgetCategory;
  }
  
  async updateBudgetCategory(id: number, budgetCategoryData: Partial<BudgetCategory>): Promise<BudgetCategory | undefined> {
    const budgetCategory = this.budgetCategories.get(id);
    if (!budgetCategory) return undefined;
    
    const updatedBudgetCategory = { ...budgetCategory, ...budgetCategoryData };
    this.budgetCategories.set(id, updatedBudgetCategory);
    return updatedBudgetCategory;
  }
  
  // Expenses
  async getExpenses(userId: number): Promise<ExpenseWithCategory[]> {
    const expenses = Array.from(this.expenses.values())
      .filter(expense => expense.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const result: ExpenseWithCategory[] = [];
    
    for (const expense of expenses) {
      const category = await this.getCategory(expense.categoryId);
      if (category) {
        result.push({
          ...expense,
          category
        });
      }
    }
    
    return result;
  }
  
  async getExpensesByCategory(userId: number, categoryId: number): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(
      (expense) => expense.userId === userId && expense.categoryId === categoryId
    );
  }
  
  async getExpensesByMonth(userId: number, month: number, year: number): Promise<ExpenseWithCategory[]> {
    const expenses = Array.from(this.expenses.values())
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return (
          expense.userId === userId &&
          expenseDate.getMonth() + 1 === month &&
          expenseDate.getFullYear() === year
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const result: ExpenseWithCategory[] = [];
    
    for (const expense of expenses) {
      const category = await this.getCategory(expense.categoryId);
      if (category) {
        result.push({
          ...expense,
          category
        });
      }
    }
    
    return result;
  }
  
  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = this.expenseIdCounter++;
    const now = new Date();
    const expense: Expense = { ...insertExpense, id, createdAt: now };
    this.expenses.set(id, expense);
    return expense;
  }
  
  // Summaries
  async getCategorySpending(userId: number, month: number, year: number): Promise<{categoryId: number, spent: number}[]> {
    const expenses = Array.from(this.expenses.values()).filter(expense => {
      const expenseDate = new Date(expense.date);
      return (
        expense.userId === userId &&
        expenseDate.getMonth() + 1 === month &&
        expenseDate.getFullYear() === year
      );
    });
    
    // Group expenses by category
    const categorySpending = new Map<number, number>();
    
    for (const expense of expenses) {
      const { categoryId, amount } = expense;
      const currentAmount = categorySpending.get(categoryId) || 0;
      categorySpending.set(categoryId, currentAmount + amount);
    }
    
    return Array.from(categorySpending.entries()).map(([categoryId, spent]) => ({
      categoryId,
      spent
    }));
  }
}

export const storage = new MemStorage();
