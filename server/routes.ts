import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { formatISO } from "date-fns";
import { insertBudgetSchema, insertExpenseSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  setupAuth(app);

  // Budget routes
  app.get("/api/budgets/current", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    
    const budget = await storage.getBudget(req.user.id, month, year);
    
    if (!budget) {
      return res.status(404).json({ message: "No budget found for current month" });
    }
    
    res.json(budget);
  });
  
  app.post("/api/budgets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validatedData = insertBudgetSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      
      const budget = await storage.createBudget(validatedData);
      
      // Create budget categories
      const categories = req.body.categories || [];
      
      for (const category of categories) {
        await storage.createBudgetCategory({
          budgetId: budget.id,
          categoryId: category.categoryId,
          amount: category.amount,
        });
      }
      
      const createdBudget = await storage.getBudget(
        req.user.id,
        budget.month,
        budget.year
      );
      
      res.status(201).json(createdBudget);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create budget" });
    }
  });
  
  // Category routes
  app.get("/api/categories", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const categories = await storage.getCategories(req.user.id);
    res.json(categories);
  });
  
  // Expense routes
  app.get("/api/expenses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const expenses = await storage.getExpenses(req.user.id);
    res.json(expenses);
  });
  
  app.get("/api/expenses/month/:month/year/:year", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const month = parseInt(req.params.month, 10);
    const year = parseInt(req.params.year, 10);
    
    if (isNaN(month) || isNaN(year)) {
      return res.status(400).json({ message: "Invalid month or year parameters" });
    }
    
    const expenses = await storage.getExpensesByMonth(req.user.id, month, year);
    res.json(expenses);
  });
  
  app.post("/api/expenses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Format date if it's a string
      let date = req.body.date;
      if (typeof date === 'string') {
        date = new Date(date);
      }
      
      const validatedData = insertExpenseSchema.parse({
        ...req.body,
        userId: req.user.id,
        date: date
      });
      
      // Check if user is exceeding budget for category
      const today = new Date();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      
      const budget = await storage.getBudget(req.user.id, month, year);
      
      if (budget && req.body.isUPI) {
        // For UPI transactions, check if category budget is exceeded
        const categoryBudget = budget.categories.find(
          bc => bc.categoryId === validatedData.categoryId
        );
        
        if (categoryBudget && categoryBudget.spent + validatedData.amount > categoryBudget.amount) {
          return res.status(400).json({
            message: "UPI transaction rejected. You've exceeded your budget for this category.",
            status: "BLOCKED",
            budgetExceeded: true
          });
        }
      }
      
      const expense = await storage.createExpense(validatedData);
      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create expense" });
    }
  });
  
  // User profile update
  app.put("/api/user/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { name, email, upiId, pushNotifications, upiSpendingLimits, darkMode, upiBlockEnabled } = req.body;
      
      const updatedUser = await storage.updateUser(req.user.id, {
        name,
        email,
        upiId,
        pushNotifications,
        upiSpendingLimits,
        darkMode,
        upiBlockEnabled
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  
  // Bank account routes
  app.post("/api/bank/connect", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { accountId } = req.body;
      
      if (!accountId) {
        return res.status(400).json({ message: "Account ID is required" });
      }
      
      const bankInfo = await storage.connectBankAccount(req.user.id, accountId);
      res.status(201).json(bankInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to connect bank account" });
    }
  });
  
  app.post("/api/bank/disconnect", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      await storage.disconnectBankAccount(req.user.id);
      res.status(200).json({ message: "Bank account disconnected successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to disconnect bank account" });
    }
  });
  
  app.get("/api/bank/info", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const bankInfo = await storage.getBankAccountInfo(req.user.id);
      
      if (!bankInfo) {
        return res.status(404).json({ message: "No bank account connected" });
      }
      
      res.json(bankInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to get bank account info" });
    }
  });
  
  app.put("/api/bank/balance", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { balance } = req.body;
      
      if (typeof balance !== 'number' || balance < 0) {
        return res.status(400).json({ message: "Valid balance amount is required" });
      }
      
      const bankInfo = await storage.updateBankBalance(req.user.id, balance);
      res.json(bankInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to update bank balance" });
    }
  });
  
  // Quiz related routes
  app.get("/api/quiz/questions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const difficulty = req.query.difficulty as string || 'medium';
      const count = parseInt(req.query.count as string || '5', 10);
      
      const questions = await storage.getQuizQuestions(difficulty, count);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quiz questions" });
    }
  });
  
  app.post("/api/quiz/start", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Get questions for the quiz
      const difficulty = req.body.difficulty || 'medium';
      const count = req.body.count || 5;
      
      const questions = await storage.getQuizQuestions(difficulty, count);
      
      // Create a quiz attempt
      const quizAttempt = await storage.createQuizAttempt(req.user.id, questions);
      
      // Return the questions with their correct answers removed
      const sanitizedQuestions = quizAttempt.questions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options,
        difficulty: q.difficulty,
      }));
      
      res.status(201).json({
        totalQuestions: quizAttempt.totalQuestions,
        questions: sanitizedQuestions
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to start quiz" });
    }
  });
  
  app.post("/api/quiz/complete", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { answers } = req.body;
      
      if (!Array.isArray(answers)) {
        return res.status(400).json({ message: "Answers must be an array" });
      }
      
      // Get the user's active quiz attempt
      const quizAttempt = await storage.getActiveQuizAttempt(req.user.id);
      
      if (!quizAttempt || quizAttempt.completed) {
        return res.status(400).json({ message: "No active quiz attempt found" });
      }
      
      // Calculate the number of correct answers
      const correctAnswers = answers.reduce((count, answer, index) => {
        const question = quizAttempt.questions[index];
        return count + (answer === question.correctAnswer ? 1 : 0);
      }, 0);
      
      // Complete the quiz attempt
      const passed = await storage.completeQuizAttempt(req.user.id, correctAnswers);
      
      // Return results
      res.json({
        correctAnswers,
        totalQuestions: quizAttempt.totalQuestions,
        passed,
        score: Math.round((correctAnswers / quizAttempt.totalQuestions) * 100),
        upiUnblocked: passed
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to complete quiz" });
    }
  });
  
  // UPI Control routes
  app.post("/api/upi/block", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const user = await storage.blockUPI(req.user.id);
      res.json({ upiBlocked: true, user });
    } catch (error) {
      res.status(500).json({ message: "Failed to block UPI" });
    }
  });
  
  app.post("/api/upi/unblock", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const user = await storage.unblockUPI(req.user.id);
      res.json({ upiBlocked: false, user });
    } catch (error) {
      res.status(500).json({ message: "Failed to unblock UPI" });
    }
  });
  
  // Mock UPI transaction
  app.post("/api/upi/transaction", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { amount, categoryId, note } = req.body;
      
      // Check if UPI is currently blocked for this user
      if (req.user.upiCurrentlyBlocked) {
        return res.status(403).json({
          message: "UPI transactions are currently blocked. Complete the financial quiz to unblock.",
          status: "BLOCKED",
          upiBlocked: true
        });
      }
      
      // Check if user is exceeding budget for category
      const today = new Date();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      
      const budget = await storage.getBudget(req.user.id, month, year);
      
      if (budget && req.user.upiSpendingLimits) {
        // For UPI transactions, check if category budget is exceeded
        const categoryBudget = budget.categories.find(
          bc => bc.categoryId === categoryId
        );
        
        if (categoryBudget && categoryBudget.spent + amount > categoryBudget.amount) {
          // If auto-blocking is enabled, block UPI
          if (req.user.upiBlockEnabled) {
            await storage.blockUPI(req.user.id);
          }
          
          return res.status(400).json({
            message: "UPI transaction rejected. You've exceeded your budget for this category.",
            status: "BLOCKED",
            budgetExceeded: true,
            upiBlocked: req.user.upiBlockEnabled
          });
        }
      }
      
      // Create the expense as a UPI transaction
      const expense = await storage.createExpense({
        userId: req.user.id,
        categoryId,
        amount,
        date: new Date(),
        note: note || "UPI Transaction",
        isUPI: true
      });
      
      // Check if the bank account balance should be updated
      const bankInfo = await storage.getBankAccountInfo(req.user.id);
      if (bankInfo) {
        const newBalance = bankInfo.balance - amount;
        if (newBalance >= 0) {
          await storage.updateBankBalance(req.user.id, newBalance);
        }
      }
      
      res.status(201).json({
        status: "SUCCESS",
        transactionId: `UPI${expense.id}`,
        expense
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to process UPI transaction",
        status: "FAILED"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
