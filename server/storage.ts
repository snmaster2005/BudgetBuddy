import { 
  User, InsertUser, Category, InsertCategory, 
  Budget, InsertBudget, BudgetCategory, InsertBudgetCategory, 
  Expense, InsertExpense, BudgetWithCategories, ExpenseWithCategory,
  QuizQuestion, InsertQuizQuestion, QuizAttempt, BankAccountInfo
} from "@shared/schema";
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
  
  // Bank account
  connectBankAccount(userId: number, accountId: string): Promise<BankAccountInfo>;
  disconnectBankAccount(userId: number): Promise<void>;
  getBankAccountInfo(userId: number): Promise<BankAccountInfo | undefined>;
  updateBankBalance(userId: number, newBalance: number): Promise<BankAccountInfo>;
  
  // Quiz
  getQuizQuestions(difficulty: string, count: number): Promise<QuizQuestion[]>;
  createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion>;
  createQuizAttempt(userId: number, questions: QuizQuestion[]): Promise<QuizAttempt>;
  getActiveQuizAttempt(userId: number): Promise<QuizAttempt | undefined>;
  completeQuizAttempt(userId: number, correctAnswers: number): Promise<boolean>;
  
  // UPI Control
  blockUPI(userId: number): Promise<User>;
  unblockUPI(userId: number): Promise<User>;
  
  // Session store
  sessionStore: session.Store;
}

// Memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private budgets: Map<number, Budget>;
  private budgetCategories: Map<number, BudgetCategory>;
  private expenses: Map<number, Expense>;
  private quizQuestions: Map<number, QuizQuestion>;
  private bankAccounts: Map<number, BankAccountInfo>;
  private quizAttempts: Map<number, QuizAttempt>;
  
  sessionStore: session.Store;
  
  private userIdCounter: number;
  private categoryIdCounter: number;
  private budgetIdCounter: number;
  private budgetCategoryIdCounter: number;
  private expenseIdCounter: number;
  private quizQuestionIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.budgets = new Map();
    this.budgetCategories = new Map();
    this.expenses = new Map();
    this.quizQuestions = new Map();
    this.bankAccounts = new Map();
    this.quizAttempts = new Map();
    
    this.userIdCounter = 1;
    this.categoryIdCounter = 1;
    this.budgetIdCounter = 1;
    this.budgetCategoryIdCounter = 1;
    this.expenseIdCounter = 1;
    this.quizQuestionIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Clear expired sessions every 24h
    });
    
    // Initialize with default data
    this.initializeDefaultCategories();
    this.initializeDefaultQuizQuestions();
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
  
  private initializeDefaultQuizQuestions() {
    const defaultQuestions: InsertQuizQuestion[] = [
      {
        question: "What happens when you consistently spend more than you earn?",
        options: [
          "You build wealth faster",
          "Your debt increases over time",
          "Your credit score improves",
          "Banks offer you better interest rates"
        ],
        correctAnswer: 1,
        explanation: "Consistently spending more than you earn leads to increasing debt, which can become difficult to pay off due to compounding interest.",
        difficulty: "easy"
      },
      {
        question: "Which of these is a good budgeting habit?",
        options: [
          "Spending your entire paycheck immediately",
          "Only checking your account balance once a month",
          "Tracking your expenses and categorizing them",
          "Taking on debt for non-essential purchases"
        ],
        correctAnswer: 2,
        explanation: "Tracking and categorizing expenses helps you understand your spending patterns and identify areas where you can save.",
        difficulty: "easy"
      },
      {
        question: "Why is having an emergency fund important?",
        options: [
          "It's not important if you have good income",
          "It allows you to handle unexpected expenses without going into debt",
          "It helps you pay for luxury items",
          "Banks require it for account maintenance"
        ],
        correctAnswer: 1,
        explanation: "An emergency fund provides financial security by covering unexpected expenses like medical emergencies or car repairs without relying on credit cards or loans.",
        difficulty: "medium"
      },
      {
        question: "What's the difference between needs and wants in budgeting?",
        options: [
          "There is no difference, they're the same thing",
          "Needs are things you can't live without, wants are things you desire but can live without",
          "Needs are expensive, wants are cheap",
          "Needs are monthly expenses, wants are one-time purchases"
        ],
        correctAnswer: 1,
        explanation: "Needs are essential for survival (food, shelter, utilities, basic clothing) while wants are non-essential items that improve quality of life but aren't necessary for survival.",
        difficulty: "medium"
      },
      {
        question: "What is the 50/30/20 budgeting rule?",
        options: [
          "Spend 50% on entertainment, 30% on food, 20% on savings",
          "Spend 50% on needs, 30% on wants, and 20% on savings/debt repayment",
          "Spend 50% on housing, 30% on transportation, 20% on everything else",
          "Spend 50% of your time working, 30% having fun, 20% planning finances"
        ],
        correctAnswer: 1,
        explanation: "The 50/30/20 rule suggests allocating 50% of your income to needs, 30% to wants, and 20% to savings and debt repayment as a simple framework for budgeting.",
        difficulty: "hard"
      }
    ];
    
    for (const question of defaultQuestions) {
      this.createQuizQuestion(question);
    }
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
    let hasOverflow = false;
    
    const categoriesWithSpent = await Promise.all(
      budgetCats.map(async (bc) => {
        const category = await this.getCategory(bc.categoryId);
        const spent = categorySpending.find(cs => cs.categoryId === bc.categoryId)?.spent || 0;
        totalSpent += spent;
        
        // Calculate if over budget
        const overBudget = spent > bc.amount;
        const overflow = spent - bc.amount;
        
        if (overBudget) {
          hasOverflow = true;
        }
        
        return {
          ...bc,
          category: category!,
          spent,
          overBudget,
          overflow
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
    
    // Get the user to check UPI blocked status
    const user = await this.getUser(userId);
    const upiBlocked = user?.upiCurrentlyBlocked || false;
    
    // Get bank balance if connected
    const bankInfo = await this.getBankAccountInfo(userId);
    const bankBalance = bankInfo?.balance;
    
    return {
      ...budget,
      categories: categoriesWithSpent,
      spent: totalSpent,
      remaining,
      daysLeft,
      dailyBudget,
      bankBalance,
      hasOverflow,
      upiBlocked
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
    
    // Get the current month and year
    const date = new Date(insertExpense.date);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    // Check if the expense will cause an overflow in its category
    const userId = insertExpense.userId;
    const budget = await this.getBudget(userId, month, year);
    
    if (budget && insertExpense.isUPI) {
      // If UPI is currently blocked, throw an error
      const user = await this.getUser(userId);
      if (user?.upiCurrentlyBlocked) {
        throw new Error("UPI payments are currently blocked. Complete the financial quiz to unblock.");
      }
      
      // Check if this expense will cause a category to go over budget
      const categoryId = insertExpense.categoryId;
      const budgetCategory = budget.categories.find(bc => bc.categoryId === categoryId);
      
      if (budgetCategory) {
        const newTotal = budgetCategory.spent + insertExpense.amount;
        const willOverflow = newTotal > budgetCategory.amount;
        
        // Create expense with overflow tracking
        const expense: Expense = {
          ...insertExpense,
          id,
          createdAt: now,
          causedOverflow: willOverflow,
          overflowCategoryId: willOverflow ? categoryId : undefined
        };
        
        this.expenses.set(id, expense);
        
        // If this causes overflow, block UPI if that setting is enabled
        if (willOverflow && user?.upiBlockEnabled) {
          await this.blockUPI(userId);
        }
        
        return expense;
      }
    }
    
    // Default case - no overflow checks needed
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
  
  // Bank Account methods
  async connectBankAccount(userId: number, accountId: string): Promise<BankAccountInfo> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Create a new bank account info
    const bankInfo: BankAccountInfo = {
      accountId,
      balance: 5000, // Default starting balance for demo
      lastUpdated: new Date(),
      connected: true
    };
    
    // Store the bank info
    this.bankAccounts.set(userId, bankInfo);
    
    // Update user record to mark as connected
    await this.updateUser(userId, {
      bankAccountConnected: true,
      bankBalance: bankInfo.balance,
      lastBalanceUpdate: bankInfo.lastUpdated
    });
    
    return bankInfo;
  }
  
  async disconnectBankAccount(userId: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Remove bank account info
    this.bankAccounts.delete(userId);
    
    // Update user record
    await this.updateUser(userId, {
      bankAccountConnected: false,
      bankBalance: 0,
      lastBalanceUpdate: undefined
    });
  }
  
  async getBankAccountInfo(userId: number): Promise<BankAccountInfo | undefined> {
    return this.bankAccounts.get(userId);
  }
  
  async updateBankBalance(userId: number, newBalance: number): Promise<BankAccountInfo> {
    const bankInfo = await this.getBankAccountInfo(userId);
    if (!bankInfo) {
      throw new Error("Bank account not connected");
    }
    
    // Update the balance and timestamp
    const updatedBankInfo: BankAccountInfo = {
      ...bankInfo,
      balance: newBalance,
      lastUpdated: new Date()
    };
    
    // Save updated bank info
    this.bankAccounts.set(userId, updatedBankInfo);
    
    // Update user record
    await this.updateUser(userId, {
      bankBalance: newBalance,
      lastBalanceUpdate: updatedBankInfo.lastUpdated
    });
    
    return updatedBankInfo;
  }
  
  // Quiz methods
  async getQuizQuestions(difficulty: string, count: number): Promise<QuizQuestion[]> {
    let questions = Array.from(this.quizQuestions.values());
    
    // Filter by difficulty if provided
    if (difficulty) {
      questions = questions.filter(q => q.difficulty === difficulty);
    }
    
    // Shuffle the questions
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    
    // Return the requested number of questions
    return questions.slice(0, count);
  }
  
  async createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion> {
    const id = this.quizQuestionIdCounter++;
    const quizQuestion: QuizQuestion = { ...question, id };
    this.quizQuestions.set(id, quizQuestion);
    return quizQuestion;
  }
  
  async createQuizAttempt(userId: number, questions: QuizQuestion[]): Promise<QuizAttempt> {
    const quizAttempt: QuizAttempt = {
      questions,
      correctAnswers: 0,
      totalQuestions: questions.length,
      completed: false,
      userId
    };
    
    this.quizAttempts.set(userId, quizAttempt);
    
    return quizAttempt;
  }
  
  async getActiveQuizAttempt(userId: number): Promise<QuizAttempt | undefined> {
    const attempt = this.quizAttempts.get(userId);
    // Only return if it exists and is not completed
    if (attempt && !attempt.completed) {
      return attempt;
    }
    return undefined;
  }
  
  async completeQuizAttempt(userId: number, correctAnswers: number): Promise<boolean> {
    const quizAttempt = this.quizAttempts.get(userId);
    if (!quizAttempt) {
      throw new Error("No active quiz attempt found");
    }
    
    // Update the quiz attempt
    quizAttempt.correctAnswers = correctAnswers;
    quizAttempt.completed = true;
    this.quizAttempts.set(userId, quizAttempt);
    
    // Determine if the user passed (correct at least 60% of questions)
    const passThreshold = quizAttempt.totalQuestions * 0.6;
    const passed = correctAnswers >= passThreshold;
    
    // If passed, unblock UPI
    if (passed) {
      await this.unblockUPI(userId);
    }
    
    return passed;
  }
  
  // UPI Control methods
  async blockUPI(userId: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Update user to block UPI
    return await this.updateUser(userId, {
      upiCurrentlyBlocked: true
    }) as User;
  }
  
  async unblockUPI(userId: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Update user to unblock UPI
    return await this.updateUser(userId, {
      upiCurrentlyBlocked: false
    }) as User;
  }
}

export const storage = new MemStorage();
