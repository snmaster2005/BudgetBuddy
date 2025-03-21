import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Utensils, Film, Bus, BookOpen, MoreHorizontal, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ExpenseWithCategory } from "@shared/schema";

interface TransactionListProps {
  limit?: number;
  showHeader?: boolean;
}

export function TransactionList({ limit, showHeader = true }: TransactionListProps) {
  const { data: transactions, isLoading, error } = useQuery<ExpenseWithCategory[]>({
    queryKey: ['/api/expenses'],
  });
  
  // Function to get icon based on category
  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case "food":
        return <Utensils className="text-green-500" />;
      case "shopping":
        return <ShoppingBag className="text-blue-500" />;
      case "entertainment":
        return <Film className="text-purple-500" />;
      case "transport":
        return <Bus className="text-yellow-500" />;
      case "education":
        return <BookOpen className="text-pink-500" />;
      default:
        return <MoreHorizontal className="text-gray-500" />;
    }
  };
  
  // Function to get color based on category
  const getCategoryColor = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case "food":
        return "bg-green-100";
      case "shopping":
        return "bg-blue-100";
      case "entertainment":
        return "bg-purple-100";
      case "transport":
        return "bg-yellow-100";
      case "education":
        return "bg-pink-100";
      default:
        return "bg-gray-100";
    }
  };
  
  // Format date relative to today
  const formatTransactionDate = (date: Date) => {
    const today = new Date();
    const transactionDate = new Date(date);
    
    if (transactionDate.toDateString() === today.toDateString()) {
      return `Today, ${format(transactionDate, 'h:mm a')}`;
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (transactionDate.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${format(transactionDate, 'h:mm a')}`;
    }
    
    return format(transactionDate, 'MMM d, h:mm a');
  };
  
  // Filter transactions based on limit
  const displayTransactions = limit && transactions ? transactions.slice(0, limit) : transactions;
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Error loading transactions
      </div>
    );
  }
  
  if (!displayTransactions || displayTransactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No transactions found
      </div>
    );
  }
  
  return (
    <div>
      {showHeader && (
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium">Recent Transactions</h3>
          {/* If there are more transactions than the limit, show a "See All" link */}
          {limit && transactions && transactions.length > limit && (
            <a href="/expenses" className="text-sm text-primary">See All</a>
          )}
        </div>
      )}
      
      <div className="space-y-3">
        {displayTransactions.map((transaction) => (
          <div 
            key={transaction.id} 
            className="bg-white rounded-lg shadow-sm p-3 flex justify-between items-center"
          >
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full ${getCategoryColor(transaction.category.name)} flex items-center justify-center mr-3`}>
                {getCategoryIcon(transaction.category.name)}
              </div>
              <div>
                <p className="font-medium">{transaction.category.name}</p>
                <p className="text-xs text-gray-500">
                  {formatTransactionDate(new Date(transaction.date))}
                  {transaction.isUPI && " • UPI"}
                </p>
              </div>
            </div>
            <p className="text-red-500 font-medium">-₹{transaction.amount.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
