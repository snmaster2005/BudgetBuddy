import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LockKeyhole } from "lucide-react";
import { useLocation } from "wouter";

export function UpiBlockAlert() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  // If user doesn't exist or UPI is not blocked, don't show anything
  if (!user || !user.upiCurrentlyBlocked) {
    return null;
  }
  
  return (
    <Alert variant="destructive" className="mb-4">
      <div className="flex gap-2 items-start">
        <LockKeyhole className="h-5 w-5 mt-0.5" />
        <div className="flex-1">
          <AlertTitle className="mb-1">UPI Transactions Blocked</AlertTitle>
          <AlertDescription className="flex flex-col md:flex-row gap-2 items-start md:items-center">
            <span className="flex-1">
              Your UPI transactions have been blocked because you've exceeded your budget.
              You need to complete a financial quiz to unblock UPI transactions.
            </span>
            <Button size="sm" onClick={() => navigate("/quiz")}>
              Take Quiz to Unblock
            </Button>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}