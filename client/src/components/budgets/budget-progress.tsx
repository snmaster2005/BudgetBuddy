import { ProgressIndicator } from "@/components/ui/progress-indicator";
import { BudgetWithCategories } from "@shared/schema";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface BudgetProgressProps {
  budget?: BudgetWithCategories;
  isLoading?: boolean;
}

export function BudgetProgress({ budget, isLoading = false }: BudgetProgressProps) {
  if (isLoading) {
    return <BudgetProgressSkeleton />;
  }
  
  if (!budget) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 mb-5">
        <p className="text-center py-3 text-gray-500">No budget set for this month</p>
      </div>
    );
  }
  
  // Calculate current month
  const currentMonth = format(new Date(budget.year, budget.month - 1), 'MMMM yyyy');
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-5">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium">Monthly Budget</h3>
        <span className="text-sm text-gray-500">{currentMonth}</span>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Total Spent</span>
          <div>
            <span className="font-semibold">₹{budget.spent.toFixed(2)}</span>
            <span className="text-gray-500">/</span>
            <span className="text-gray-500">₹{budget.totalAmount.toFixed(2)}</span>
          </div>
        </div>
        <ProgressIndicator 
          value={budget.spent} 
          max={budget.totalAmount} 
          color="auto"
        />
      </div>
      
      <div className="flex justify-between">
        <div className="text-center">
          <p className="text-xs text-gray-500">Remaining</p>
          <p className="font-semibold text-green-500">₹{budget.remaining.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Days Left</p>
          <p className="font-semibold">{budget.daysLeft}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Daily Budget</p>
          <p className="font-semibold">₹{budget.dailyBudget.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

function BudgetProgressSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-5">
      <div className="flex justify-between items-center mb-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-5 w-24" />
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-2.5 w-full rounded-full" />
      </div>
      
      <div className="flex justify-between">
        <div className="text-center">
          <Skeleton className="h-3 w-16 mx-auto mb-1" />
          <Skeleton className="h-5 w-12 mx-auto" />
        </div>
        <div className="text-center">
          <Skeleton className="h-3 w-16 mx-auto mb-1" />
          <Skeleton className="h-5 w-8 mx-auto" />
        </div>
        <div className="text-center">
          <Skeleton className="h-3 w-16 mx-auto mb-1" />
          <Skeleton className="h-5 w-12 mx-auto" />
        </div>
      </div>
    </div>
  );
}
