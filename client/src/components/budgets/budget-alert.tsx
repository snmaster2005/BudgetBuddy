import { AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { BudgetWithCategories } from "@shared/schema";

interface BudgetAlertProps {
  budget?: BudgetWithCategories;
}

export function BudgetAlert({ budget }: BudgetAlertProps) {
  if (!budget) return null;
  
  // Check if any category is close to limit (over 90%)
  const categoryOverBudget = budget.categories.find(cat => {
    const percentUsed = cat.spent / cat.amount;
    return percentUsed >= 0.9;
  });
  
  if (!categoryOverBudget) return null;
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex items-start">
      <div className="text-red-500 mr-3">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div>
        <h4 className="font-medium text-red-500">Watch your spending!</h4>
        <p className="text-sm text-gray-700">
          You've spent {Math.round((categoryOverBudget.spent / categoryOverBudget.amount) * 100)}% of 
          your {categoryOverBudget.category.name} budget. UPI transactions for this category will be limited.
        </p>
        <Link href="/budget">
          <a className="mt-2 inline-block text-sm font-medium text-primary">Review Budget</a>
        </Link>
      </div>
    </div>
  );
}
