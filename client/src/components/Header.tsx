import React from "react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Info, HelpCircle, BookOpen, Shield, MessageSquare, Zap } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import SparkWrapper from "./SparkWrapper";

interface User {
  name: string;
  email: string;
  profileImage?: string;
}

interface HeaderProps {
  user: User;
  onStartTour?: () => void;
}

export default function Header({ user, onStartTour }: HeaderProps) {
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
    <header className="sticky top-0 z-50">
      <div className="mx-8 my-4">
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg shadow-purple-500/5 border border-white/20">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-3 flex justify-between items-center">
            <SparkWrapper
              className="flex items-center space-x-3 cursor-pointer group logo-container"
              onClick={() => handleNavigation('/dashboard')}
            >
              <div className="p-2 rounded-xl bg-blue-600/10 group-hover:bg-blue-600/20 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 group-hover:text-blue-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <span className="text-xl font-semibold text-blue-600 group-hover:text-blue-500 transition-colors">MediAI</span>
            </SparkWrapper>
            
            <div className="flex items-center space-x-6">
              <SparkWrapper>
                <DropdownMenu>
                  <DropdownMenuTrigger className="p-2 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-slate-500 hover:text-slate-700 transition-all">
                    <Info className="h-6 w-6" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 bg-white/60 backdrop-blur-xl rounded-xl shadow-lg shadow-purple-500/5 border border-white/20 p-4">
                    <DropdownMenuLabel className="font-medium text-lg flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-primary" />
                      Quick Help
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-200/50 my-2" />
                    
                    <div className="space-y-4">
                      <SparkWrapper>
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-blue-50">
                            <MessageSquare className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-slate-800">Chat with MediAI</h3>
                            <p className="text-sm text-slate-600">Describe your symptoms in text, voice, or upload images for AI analysis.</p>
                          </div>
                        </div>
                      </SparkWrapper>
                      
                      <SparkWrapper>
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-purple-50">
                            <BookOpen className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-slate-800">Medical History</h3>
                            <p className="text-sm text-slate-600">Access your past consultations and medical records.</p>
                          </div>
                        </div>
                      </SparkWrapper>
                      
                      <SparkWrapper>
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-green-50">
                            <Zap className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-slate-800">Quick Tips</h3>
                            <p className="text-sm text-slate-600">Be specific with symptoms, include duration and severity for better analysis.</p>
                          </div>
                        </div>
                      </SparkWrapper>
                      
                      <SparkWrapper>
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-red-50">
                            <Shield className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-slate-800">Privacy & Security</h3>
                            <p className="text-sm text-slate-600">Your data is encrypted and protected with enterprise-grade security.</p>
                          </div>
                        </div>
                      </SparkWrapper>
                    </div>
                    
                    <DropdownMenuSeparator className="bg-slate-200/50 my-2" />
                    <SparkWrapper>
                      <DropdownMenuItem 
                        onClick={onStartTour}
                        className="text-sm text-slate-600 hover:text-primary focus:bg-slate-500/10"
                      >
                        Take the guided tour
                      </DropdownMenuItem>
                    </SparkWrapper>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SparkWrapper>
              
              <SparkWrapper>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center space-x-3 text-sm font-medium text-slate-700 hover:text-primary focus:outline-none transition-colors user-menu">
                    <span className="hidden sm:inline">{user.name}</span>
                    {user.profileImage ? (
                      <img 
                        src={user.profileImage} 
                        alt={`${user.name}'s profile`}
                        className={cn(
                          "h-10 w-10 rounded-xl object-cover",
                          "ring-2 ring-white/80 shadow-sm hover:ring-primary/20 transition-all"
                        )}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center ring-2 ring-white/80 shadow-sm hover:bg-primary/20 transition-all">
                        {user.name.charAt(0)}
                      </div>
                    )}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-2 bg-white/60 backdrop-blur-xl rounded-xl shadow-lg shadow-purple-500/5 border border-white/20">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-200/50" />
                    <SparkWrapper>
                      <DropdownMenuItem onClick={() => handleNavigation('/profile')} className="focus:bg-slate-500/10">
                        Profile
                      </DropdownMenuItem>
                    </SparkWrapper>
                    <SparkWrapper>
                      <DropdownMenuItem onClick={() => handleNavigation('/medical-history')} className="focus:bg-slate-500/10">
                        Medical History
                      </DropdownMenuItem>
                    </SparkWrapper>
                    <SparkWrapper>
                      <DropdownMenuItem onClick={() => handleNavigation('/symptom-diary')} className="focus:bg-slate-500/10">
                        Symptom Diary
                      </DropdownMenuItem>
                    </SparkWrapper>
                    <SparkWrapper>
                      <DropdownMenuItem onClick={() => handleNavigation('/settings')} className="focus:bg-slate-500/10">
                        Settings
                      </DropdownMenuItem>
                    </SparkWrapper>
                    <DropdownMenuSeparator className="bg-slate-200/50" />
                    <SparkWrapper>
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:bg-red-50">
                        Sign out
                      </DropdownMenuItem>
                    </SparkWrapper>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SparkWrapper>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
