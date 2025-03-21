import { Header } from "@/components/nav/header";
import { BottomNavigation } from "@/components/nav/bottom-navigation";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

// Profile form schema
const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  upiId: z.string().optional(),
  pushNotifications: z.boolean().default(true),
  upiSpendingLimits: z.boolean().default(true),
  darkMode: z.boolean().default(false)
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get initials from user's name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };
  
  // Initialize form with user data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      upiId: user?.upiId || '',
      pushNotifications: user?.pushNotifications !== undefined ? user.pushNotifications : true,
      upiSpendingLimits: user?.upiSpendingLimits !== undefined ? user.upiSpendingLimits : true,
      darkMode: user?.darkMode || false
    }
  });
  
  // Update profile mutation
  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PUT", "/api/user/profile", data);
      return await res.json();
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      
      // Update user data in cache
      queryClient.setQueryData(["/api/user"], updatedUser);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  function onSubmit(data: ProfileFormValues) {
    updateProfile(data);
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <main className="max-w-md mx-auto pb-20">
        <section className="px-4 py-5">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Profile Settings</h2>
            <p className="text-gray-500 text-sm">Manage your account</p>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="bg-white rounded-xl shadow-sm p-5 mb-5">
                <div className="flex items-center mb-5">
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                    <span className="text-xl font-medium">
                      {user?.name ? getInitials(user.name) : "?"}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{user?.name}</h3>
                    <p className="text-gray-500 text-sm">{user?.email}</p>
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="upiId"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>UPI ID</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full py-3" disabled={isPending}>
                  {isPending ? "Updating..." : "Update Profile"}
                </Button>
              </div>
            </form>
          </Form>
          
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold mb-4">App Settings</h3>
            
            <Form {...form}>
              <form onSubmit={(e) => e.preventDefault()}>
                <FormField
                  control={form.control}
                  name="pushNotifications"
                  render={({ field }) => (
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="font-medium">Push Notifications</p>
                        <p className="text-sm text-gray-500">Get alerts about your budget</p>
                      </div>
                      <FormItem className="m-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(newValue) => {
                              field.onChange(newValue);
                              updateProfile(form.getValues());
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    </div>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="upiSpendingLimits"
                  render={({ field }) => (
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="font-medium">UPI Spending Limits</p>
                        <p className="text-sm text-gray-500">Limit UPI when budget is exceeded</p>
                      </div>
                      <FormItem className="m-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(newValue) => {
                              field.onChange(newValue);
                              updateProfile(form.getValues());
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    </div>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="darkMode"
                  render={({ field }) => (
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Dark Mode</p>
                        <p className="text-sm text-gray-500">Switch to dark theme</p>
                      </div>
                      <FormItem className="m-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(newValue) => {
                              field.onChange(newValue);
                              updateProfile(form.getValues());
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    </div>
                  )}
                />
              </form>
            </Form>
          </div>
        </section>
      </main>
      
      <BottomNavigation />
    </div>
  );
}
