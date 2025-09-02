import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";

export default function Navigation() {
  const [location, setLocation] = useLocation();
  
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
    queryFn: getCurrentUser,
  });

  const handleLogout = () => {
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("userEmail");
    setLocation("/auth");
  };

  const navItems = [
    { label: "Projects", path: "/projects" },
    { label: "Pre-Check", path: "/pre-check" },
    { label: "Auto-Package", path: "/auto-package" },
    { label: "Submit/Track", path: "/submit-track" },
  ];

  return (
    <nav className="bg-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <h1 
                className="text-xl font-semibold cursor-pointer hover:text-gray-200 transition-colors"
                onClick={() => setLocation("/")}
                data-testid="link-home"
              >
                Permit Orchestrator
              </h1>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => setLocation(item.path)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location === item.path
                        ? "bg-slate-700 text-white"
                        : "hover:bg-slate-700 text-gray-200"
                    }`}
                    data-testid={`nav-${item.label.toLowerCase().replace(/[\/\s]/g, '-')}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="text-gray-300">D&I Contracting</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-white hover:bg-slate-700"
                  data-testid="button-user-menu"
                >
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>
                  {user?.email || "Loading..."}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
