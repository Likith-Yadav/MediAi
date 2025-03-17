import React from "react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Info } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface User {
  name: string;
  email: string;
  profileImage?: string;
}

interface HeaderProps {
  user: User;
}

export default function Header({ user }: HeaderProps) {
  const { logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: error.message || "Something went wrong",
      });
    }
  };

  const handleNavigation = (path: string) => {
    setLocation(path);
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => handleNavigation('/dashboard')}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 5.879a1 1 0 001.415 0 3 3 0 014.242 0 1 1 0 001.415-1.415 5 5 0 00-7.072 0 1 1 0 000 1.415z" clipRule="evenodd" />
          </svg>
          <span className="text-xl font-semibold text-primary">MediAI</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <button type="button" className="text-slate-500 hover:text-slate-700">
            <Info className="h-6 w-6" />
          </button>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center space-x-2 text-sm font-medium text-slate-700 hover:text-primary focus:outline-none">
              <span>{user.name}</span>
              {user.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt={`${user.name}'s profile`}
                  className={cn(
                    "h-8 w-8 rounded-full object-cover",
                    "ring-2 ring-white"
                  )}
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                  {user.name.charAt(0)}
                </div>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleNavigation('/profile')}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNavigation('/medical-history')}>
                Medical History
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNavigation('/settings')}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
