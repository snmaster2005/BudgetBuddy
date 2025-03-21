import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { BankAccountInfo } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Wallet, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

interface BankAccountConnectionProps {
  bankInfo?: BankAccountInfo;
  userId: number;
}

export function BankAccountConnection({ bankInfo, userId }: BankAccountConnectionProps) {
  const { toast } = useToast();
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [loading, setLoading] = useState(false);

  // Mutation for connecting bank account
  const { mutate: connectBankAccount, isPending } = useMutation({
    mutationFn: async (data: { accountId: string; userId: number }) => {
      const res = await apiRequest("POST", "/api/bank/connect", data);
      return await res.json();
    },
    onSuccess: (data: BankAccountInfo) => {
      toast({
        title: "Bank Account Connected",
        description: "Your bank account has been successfully connected.",
      });
      setIsConnectDialogOpen(false);
      // Update bank info in cache
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bank/info"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation for refreshing bank balance
  const { mutate: refreshBalance, isPending: isRefreshing } = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/bank/refresh", { userId });
      return await res.json();
    },
    onSuccess: (data: BankAccountInfo) => {
      toast({
        title: "Balance Updated",
        description: "Your bank balance has been refreshed.",
      });
      // Update bank info in cache
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bank/info"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Refresh Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Function to handle disconnect
  const handleDisconnect = async () => {
    try {
      setLoading(true);
      await apiRequest("POST", "/api/bank/disconnect", { userId });
      toast({
        title: "Bank Account Disconnected",
        description: "Your bank account has been disconnected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bank/info"] });
    } catch (error) {
      toast({
        title: "Disconnect Failed",
        description: "Could not disconnect your bank account.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="p-5 mb-5">
        <h3 className="font-semibold mb-4">Bank Account</h3>
        
        {bankInfo?.connected ? (
          <div>
            <div className="flex items-center mb-3">
              <CheckCircle2 className="text-green-500 mr-2 h-5 w-5" />
              <p className="font-medium">Account Connected</p>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-500 text-sm mb-1">Account ID</p>
              <p className="font-medium">{bankInfo.accountId}</p>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <p className="text-gray-500 text-sm">Current Balance</p>
                <p className="text-xs text-gray-500">
                  Last updated: {format(new Date(bankInfo.lastUpdated), "MMM d, h:mm a")}
                </p>
              </div>
              <p className="font-semibold text-xl">₹{bankInfo.balance.toFixed(2)}</p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => refreshBalance()}
                disabled={isRefreshing || loading}
              >
                {isRefreshing ? "Refreshing..." : "Refresh Balance"}
                {!isRefreshing && <RefreshCw className="ml-2 h-4 w-4" />}
              </Button>
              
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={handleDisconnect}
                disabled={isRefreshing || loading}
              >
                Disconnect Account
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center mb-3">
              <AlertCircle className="text-amber-500 mr-2 h-5 w-5" />
              <p className="font-medium">No Bank Account Connected</p>
            </div>
            
            <p className="text-gray-500 text-sm mb-4">
              Connecting your bank account allows the app to monitor your actual balance 
              and provide better budgeting recommendations.
            </p>
            
            <Button 
              className="w-full"
              onClick={() => setIsConnectDialogOpen(true)}
            >
              <Wallet className="mr-2 h-4 w-4" />
              Connect Bank Account
            </Button>
          </div>
        )}
      </Card>
      
      {/* Bank Connection Dialog */}
      <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect your Bank Account</DialogTitle>
            <DialogDescription>
              Enter your bank account ID to connect. This will allow the app to monitor your balance.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <label htmlFor="accountId" className="text-sm font-medium mb-2 block">
              Account ID
            </label>
            <Input
              id="accountId"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="Enter your bank account ID"
              className="mb-2"
            />
            <p className="text-xs text-gray-500">
              For demo purposes, enter any valid account ID format (e.g., ACCT1234567890)
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsConnectDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => connectBankAccount({ accountId, userId })}
              disabled={isPending || !accountId}
            >
              {isPending ? "Connecting..." : "Connect Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}