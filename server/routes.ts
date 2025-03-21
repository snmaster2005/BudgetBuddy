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
      const { name, email, upiId, pushNotifications, upiSpendingLimits, darkMode } = req.body;
      
      const updatedUser = await storage.updateUser(req.user.id, {
        name,
        email,
        upiId,
        pushNotifications,
        upiSpendingLimits,
        darkMode
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  
  // Mock UPI transaction
  app.post("/api/upi/transaction", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { amount, categoryId, note } = req.body;
      
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
          return res.status(400).json({
            message: "UPI transaction rejected. You've exceeded your budget for this category.",
            status: "BLOCKED",
            budgetExceeded: true
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
