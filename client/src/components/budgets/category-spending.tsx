import { ProgressIndicator } from "@/components/ui/progress-indicator";
import { BudgetWithCategories } from "@shared/schema";
import { ShoppingBag, Utensils, Film, Bus, BookOpen, MoreHorizontal, Loader2 } from "lucide-react";

interface CategorySpendingProps {
  budget?: BudgetWithCategories;
  isLoading?: boolean;
}

export function CategorySpending({ budget, isLoading = false }: CategorySpendingProps) {
  // Function to get icon based on category
  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case "food":
        return <Utensils className="text-green-500 mr-2" />;
      case "shopping":
        return <ShoppingBag className="text-blue-500 mr-2" />;
      case "entertainment":
        return <Film className="text-purple-500 mr-2" />;
      case "transport":
        return <Bus className="text-yellow-500 mr-2" />;
      case "education":
        return <BookOpen className="text-pink-500 mr-2" />;
      default:
        return <MoreHorizontal className="text-gray-500 mr-2" />;
    }
  };
  
  // Function to get color based on category
  const getCategoryColor = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case "food":
        return "bg-green-500";
      case "shopping":
        return "bg-blue-500";
      case "entertainment":
        return "bg-purple-500";
      case "transport":
        return "bg-yellow-500";
      case "education":
        return "bg-pink-500";
      default:
        return "bg-gray-500";
    }
  };
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex justify-center py-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }
  
  if (!budget || budget.categories.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <p className="text-center py-4 text-gray-500">No category budgets set</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      {budget.categories.map((category) => (
        <div key={category.categoryId} className="mb-4 last:mb-0">
          <div className="flex justify-between text-sm mb-1">
            <span className="flex items-center">
              {getCategoryIcon(category.category.name)}
              <span>{category.category.name}</span>
            </span>
            <div>
              <span className="font-semibold">₹{category.spent.toFixed(2)}</span>
              <span className="text-gray-500">/</span>
              <span className="text-gray-500">₹{category.amount.toFixed(2)}</span>
            </div>
          </div>
          <ProgressIndicator 
            value={category.spent} 
            max={category.amount} 
            color={getCategoryColor(category.category.name)}
            className="h-2"
          />
        </div>
      ))}
    </div>
  );
}
