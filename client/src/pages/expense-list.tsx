import { useState } from "react";
import { Header } from "@/components/nav/header";
import { BottomNavigation } from "@/components/nav/bottom-navigation";
import { TransactionList } from "@/components/expenses/transaction-list";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ExpenseList() {
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <main className="max-w-md mx-auto pb-20">
        <section className="px-4 py-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold">Expense History</h2>
              <p className="text-gray-500 text-sm">Track all your spending</p>
            </div>
            
            <Button onClick={() => setIsExpenseModalOpen(true)} className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
          
          <TransactionList showHeader={false} />
        </section>
      </main>
      
      <ExpenseForm 
        isModalOpen={isExpenseModalOpen} 
        setIsModalOpen={setIsExpenseModalOpen}
      />
      
      <BottomNavigation />
    </div>
  );
}
