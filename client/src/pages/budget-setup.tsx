import { Header } from "@/components/nav/header";
import { BottomNavigation } from "@/components/nav/bottom-navigation";
import { BudgetForm } from "@/components/budgets/budget-form";

export default function BudgetSetup() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <main className="max-w-md mx-auto pb-20">
        <section className="px-4 py-5">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Set Your Monthly Budget</h2>
            <p className="text-gray-500 text-sm">Allocate your money to different categories</p>
          </div>
          
          <BudgetForm />
        </section>
      </main>
      
      <BottomNavigation />
    </div>
  );
}
