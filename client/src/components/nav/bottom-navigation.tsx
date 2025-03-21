import { useLocation, Link } from "wouter";
import { 
  Home, 
  PieChart, 
  List, 
  GraduationCap, 
  User,
} from "lucide-react";

interface BottomNavigationItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  active: boolean;
}

const BottomNavigationItem = ({ icon, label, to, active }: BottomNavigationItemProps) => {
  return (
    <Link href={to}>
      <a className={`flex flex-col items-center py-1 px-3 ${active ? "text-primary" : "text-gray-500"}`}>
        <div className="text-xl">{icon}</div>
        <span className="text-xs mt-1">{label}</span>
      </a>
    </Link>
  );
};

export function BottomNavigation() {
  const [location] = useLocation();
  
  return (
    <nav className="bg-white shadow-lg fixed bottom-0 left-0 right-0 z-10">
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="flex justify-between">
          <BottomNavigationItem
            icon={<Home />}
            label="Home"
            to="/"
            active={location === "/"}
          />
          
          <BottomNavigationItem
            icon={<PieChart />}
            label="Budget"
            to="/budget"
            active={location === "/budget"}
          />
          
          <BottomNavigationItem
            icon={<List />}
            label="Expenses"
            to="/expenses"
            active={location === "/expenses"}
          />
          
          <BottomNavigationItem
            icon={<GraduationCap />}
            label="Learn"
            to="/learning"
            active={location === "/learning"}
          />
          
          <BottomNavigationItem
            icon={<User />}
            label="Profile"
            to="/profile"
            active={location === "/profile"}
          />
        </div>
      </div>
    </nav>
  );
}
