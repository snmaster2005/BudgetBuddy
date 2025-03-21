import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { InsertExpense } from "@shared/schema";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const expenseFormSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  categoryId: z.coerce.number({ required_error: "Please select a category" }),
  date: z.date(),
  note: z.string().optional(),
  isUPI: z.boolean().default(false)
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface ExpenseFormProps {
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  buttonAction?: "floating" | "normal";
}

export function ExpenseForm({ isModalOpen, setIsModalOpen, buttonAction = "normal" }: ExpenseFormProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(isModalOpen);
  
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      amount: 0,
      date: new Date(),
      note: "",
      isUPI: false
    }
  });
  
  // Query categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/categories'],
  });
  
  // Create expense mutation
  const { mutate: createExpense, isPending } = useMutation({
    mutationFn: async (data: InsertExpense) => {
      const res = await apiRequest("POST", "/api/expenses", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expense added successfully!",
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/budgets/current'] });
      
      // Close the modal and reset form
      setIsModalOpen(false);
      form.reset({
        amount: 0,
        date: new Date(),
        note: "",
        isUPI: false
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  function onSubmit(data: ExpenseFormValues) {
    createExpense(data);
  }
  
  // Floating action button for expense
  if (buttonAction === "floating") {
    return (
      <div className="fixed bottom-20 right-4 z-10">
        <Dialog open={open} onOpenChange={(newOpen) => {
          setOpen(newOpen);
          setIsModalOpen(newOpen);
        }}>
          <DialogTrigger asChild>
            <Button className="w-14 h-14 rounded-full shadow-lg" size="icon">
              <Plus className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          
          <ExpenseFormContent 
            form={form} 
            onSubmit={onSubmit} 
            categories={categories} 
            isLoadingCategories={isLoadingCategories}
            isPending={isPending}
          />
        </Dialog>
      </div>
    );
  }
  
  // Regular button
  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      setIsModalOpen(newOpen);
    }}>
      <DialogTrigger asChild>
        <Button>Add Expense</Button>
      </DialogTrigger>
      
      <ExpenseFormContent 
        form={form} 
        onSubmit={onSubmit} 
        categories={categories} 
        isLoadingCategories={isLoadingCategories}
        isPending={isPending}
      />
    </Dialog>
  );
}

interface ExpenseFormContentProps {
  form: any;
  onSubmit: (data: ExpenseFormValues) => void;
  categories: any;
  isLoadingCategories: boolean;
  isPending: boolean;
}

function ExpenseFormContent({ form, onSubmit, categories, isLoadingCategories, isPending }: ExpenseFormContentProps) {
  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Add Expense</DialogTitle>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (₹)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value?.toString()}
                  disabled={isLoadingCategories}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories?.map((category: any) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Note (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="What was this for?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="isUPI"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-primary rounded"
                    checked={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal">This is a UPI transaction</FormLabel>
              </FormItem>
            )}
          />
          
          <div className="flex justify-end gap-3 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Expense"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}
