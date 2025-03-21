import { Header } from "@/components/nav/header";
import { BottomNavigation } from "@/components/nav/bottom-navigation";

export default function Learning() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <main className="max-w-md mx-auto pb-20">
        <section className="px-4 py-5">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Financial Learning</h2>
            <p className="text-gray-500 text-sm">Tips and tricks to manage your money better</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-5 mb-5">
            <h3 className="font-semibold text-lg mb-2">Budgeting Basics</h3>
            <p className="text-gray-700 mb-4">Learning how to budget is an important life skill that will help you make the most of your money.</p>
            <div className="w-full h-40 bg-gray-200 rounded-lg mb-4 flex items-center justify-center text-gray-400">
              Financial planning illustration
            </div>
            <p className="text-gray-700 mb-3">Here are some tips to get started:</p>
            <ul className="list-disc pl-5 mb-4 text-gray-700 space-y-2">
              <li>Track all your expenses, even small ones</li>
              <li>Categorize your spending to identify patterns</li>
              <li>Set realistic limits for each category</li>
              <li>Review your budget regularly and adjust as needed</li>
            </ul>
            <Button variant="link" className="text-primary font-medium p-0">Read More</Button>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-lg mb-2">Saving Strategies</h3>
            <p className="text-gray-700 mb-3">Want to save for something special? Here are some strategies:</p>
            <ul className="list-disc pl-5 mb-4 text-gray-700 space-y-2">
              <li>Set a specific goal (e.g., new phone, college fund)</li>
              <li>Create a separate savings account</li>
              <li>Save a percentage of any money you receive</li>
              <li>Look for ways to reduce expenses in your budget</li>
            </ul>
            <Button variant="link" className="text-primary font-medium p-0">Read More</Button>
          </div>
        </section>
      </main>
      
      <BottomNavigation />
    </div>
  );
}

function Button({ children, className, variant = "default", ...props }: any) {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";
  
  const variantStyles = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    link: "text-primary underline-offset-4 hover:underline",
  };
  
  const selectedVariant = variant as keyof typeof variantStyles;
  
  return (
    <button 
      className={`${baseStyles} ${variantStyles[selectedVariant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
