import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ShoppingBag, Utensils, Film, Bus, BookOpen, MoreHorizontal, Loader2 } from "lucide-react";

// Schema for the budget form
const budgetFormSchema = z.object({
  totalAmount: z.coerce.number().positive("Total amount must be positive"),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
  categories: z.array(
    z.object({
      categoryId: z.coerce.number(),
      amount: z.coerce.number().nonnegative("Amount must be non-negative"),
      name: z.string().optional(),
      icon: z.string().optional(),
    })
  )
});

type BudgetFormValues = z.infer<typeof budgetFormSchema>;

export function BudgetForm() {
  const { toast } = useToast();
  const [currentMonth] = useState(() => new Date().getMonth() + 1); // 1-12
  const [currentYear] = useState(() => new Date().getFullYear());
  
  // Initialize form with defaults
  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      totalAmount: 0,
      month: currentMonth,
      year: currentYear,
      categories: []
    }
  });
  
  // Create a field array for budget categories
  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "categories"
  });
  
  // Query categories to populate the form
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/categories'],
  });
  
  // Query current budget to pre-fill form if it exists
  const { data: currentBudget, isLoading: isLoadingBudget } = useQuery({
    queryKey: ['/api/budgets/current'],
  });
  
  // When categories and/or current budget load, update the form
  useEffect(() => {
    if (categories && !isLoadingCategories) {
      const categoryFields = categories.map((category: any) => {
        const existingBudgetCategory = currentBudget?.categories?.find(
          (bc: any) => bc.categoryId === category.id
        );
        
        return {
          categoryId: category.id,
          name: category.name,
          icon: category.icon,
          amount: existingBudgetCategory?.amount || 0
        };
      });
      
      replace(categoryFields);
      
      // Also update total amount if we have current budget
      if (currentBudget && !form.getValues('totalAmount')) {
        form.setValue('totalAmount', currentBudget.totalAmount);
      }
    }
  }, [categories, currentBudget, replace, form]);
  
  // Function to get icon based on category
  const getCategoryIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case "utensils":
        return <Utensils className="text-green-500 mr-2" />;
      case "shopping-bag":
        return <ShoppingBag className="text-blue-500 mr-2" />;
      case "film":
        return <Film className="text-purple-500 mr-2" />;
      case "bus":
        return <Bus className="text-yellow-500 mr-2" />;
      case "book":
        return <BookOpen className="text-pink-500 mr-2" />;
      default:
        return <MoreHorizontal className="text-gray-500 mr-2" />;
    }
  };
  
  // Create budget mutation
  const { mutate: createBudget, isPending } = useMutation({
    mutationFn: async (data: BudgetFormValues) => {
      const res = await apiRequest("POST", "/api/budgets", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Budget saved successfully!",
      });
      
      // Invalidate current budget query
      queryClient.invalidateQueries({ queryKey: ['/api/budgets/current'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  function onSubmit(data: BudgetFormValues) {
    createBudget(data);
  }
  
  if (isLoadingCategories || isLoadingBudget) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-5">
          <FormField
            control={form.control}
            name="totalAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Monthly Budget (₹)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g. 5000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <input type="hidden" {...form.register("month")} />
          <input type="hidden" {...form.register("year")} />
          
          <h3 className="font-medium mb-3 mt-4">Category Budgets</h3>
          
          {fields.map((field, index) => (
            <div key={field.id} className="mb-4">
              <div className="flex items-center mb-1">
                {field.icon && getCategoryIcon(field.icon)}
                <label className="text-sm font-medium text-gray-700">{field.name}</label>
              </div>
              <input type="hidden" {...form.register(`categories.${index}.categoryId`)} />
              <input type="hidden" {...form.register(`categories.${index}.name`)} />
              <input type="hidden" {...form.register(`categories.${index}.icon`)} />
              <Input 
                type="number" 
                {...form.register(`categories.${index}.amount`)}
                placeholder={`e.g. ${1000 + index * 250}`}
              />
              {form.formState.errors.categories?.[index]?.amount && (
                <p className="text-sm font-medium text-red-500 mt-1">
                  {form.formState.errors.categories[index]?.amount?.message}
                </p>
              )}
            </div>
          ))}
        </div>
        
        <Button type="submit" className="w-full py-3 font-medium" disabled={isPending}>
          {isPending ? "Saving..." : "Save Budget"}
        </Button>
      </form>
    </Form>
  );
}
