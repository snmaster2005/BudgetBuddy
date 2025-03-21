import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

export function useUpiControl() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Block UPI access for the user
  const blockUpiMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/upi/block");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "UPI Blocked",
        description: "UPI transactions have been blocked. Take the quiz to unblock.",
      });
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to block UPI",
        description: error.message,
      });
    }
  });
  
  // Unblock UPI access for the user
  const unblockUpiMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/upi/unblock");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "UPI Unblocked",
        description: "UPI transactions are now available. Remember to stay within your budget!",
      });
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to unblock UPI",
        description: error.message,
      });
    }
  });
  
  // Utility to check if UPI is blocked and handle quiz redirect
  const redirectToQuizIfBlocked = () => {
    if (user?.upiCurrentlyBlocked) {
      toast({
        variant: "destructive",
        title: "UPI is Blocked",
        description: "You need to complete the financial quiz to use UPI transactions."
      });
      
      navigate("/quiz");
      return true;
    }
    return false;
  };
  
  return {
    isUpiBlocked: user?.upiCurrentlyBlocked || false,
    blockUpi: blockUpiMutation.mutate,
    unblockUpi: unblockUpiMutation.mutate,
    blockUpiLoading: blockUpiMutation.isPending,
    unblockUpiLoading: unblockUpiMutation.isPending,
    redirectToQuizIfBlocked,
  };
}