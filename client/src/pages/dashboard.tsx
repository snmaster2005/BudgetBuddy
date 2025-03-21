import { Header } from "@/components/nav/header";
import { BottomNavigation } from "@/components/nav/bottom-navigation";
import { BudgetProgress } from "@/components/budgets/budget-progress";
import { BudgetAlert } from "@/components/budgets/budget-alert";
import { UpiBlockAlert } from "@/components/budgets/upi-block-alert";
import { TransactionList } from "@/components/expenses/transaction-list";
import { CategorySpending } from "@/components/budgets/category-spending";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BudgetWithCategories } from "@shared/schema";
import { format } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  
  // Query current budget
  const { data: budget, isLoading: isLoadingBudget } = useQuery<BudgetWithCategories>({
    queryKey: ['/api/budgets/current'],
  });
  
  // Get first name for greeting
  const firstName = user?.name ? user.name.split(' ')[0] : '';
  
  // Get current month
  const currentMonth = format(new Date(), 'MMMM yyyy');
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <main className="max-w-md mx-auto pb-20">
        <section className="px-4 py-5">
          {/* Welcome Message */}
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Hi, {firstName}!</h2>
            <p className="text-gray-500 text-sm">Let's check your budget status</p>
          </div>
          
          {/* UPI Block Alert */}
          <UpiBlockAlert />
          
          {/* Monthly Budget Overview */}
          <BudgetProgress budget={budget} isLoading={isLoadingBudget} />
          
          {/* Alert for Budget Warning */}
          <BudgetAlert budget={budget} />
          
          {/* Recent Transactions */}
          <div className="mb-5">
            <TransactionList limit={3} />
          </div>
          
          {/* Category Spending */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Spending by Category</h3>
              <a href="/budget" className="text-sm text-primary">Details</a>
            </div>
            
            <CategorySpending budget={budget} isLoading={isLoadingBudget} />
          </div>
        </section>
      </main>
      
      {/* Floating Action Button */}
      <ExpenseForm 
        isModalOpen={isExpenseModalOpen} 
        setIsModalOpen={setIsExpenseModalOpen} 
        buttonAction="floating"
      />
      
      <BottomNavigation />
    </div>
  );
}
