import { useAuth } from "@/hooks/use-auth";
import { Bell, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function Header() {
  const { user } = useAuth();
  
  // Get initials from user's name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };
  
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/">
          <a className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Wallet className="text-white h-5 w-5" />
            </div>
            <h1 className="ml-2 text-xl font-semibold text-primary">BudgetBuddy</h1>
          </a>
        </Link>
        
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mr-3 text-gray-500" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Button>
          
          <Link href="/profile">
            <a className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-sm font-medium">
                {user?.name ? getInitials(user.name) : "?"}
              </span>
            </a>
          </Link>
        </div>
      </div>
    </header>
  );
}
