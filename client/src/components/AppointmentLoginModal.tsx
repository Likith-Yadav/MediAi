import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Define the login API endpoint
const LOGIN_API_URL = "https://doctor-appointment-backend-7htx.onrender.com/api/v1/user/login";

interface AppointmentLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (userData: any) => void;
}

export default function AppointmentLoginModal({ 
  isOpen, 
  onClose,
  onLoginSuccess 
}: AppointmentLoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing Fields",
        description: "Please enter both email and password",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Trim and normalize email and password
      // Convert email to lowercase as many APIs expect lowercase emails
      const normalizedEmail = email.trim().toLowerCase();
      const trimmedPassword = password.trim();
      
      // Prepare the request payload
      const requestBody = { 
        email: normalizedEmail, 
        password: trimmedPassword 
      };
      
      // Log what we're sending (without password for security)
      console.log("Login API Request:", {
        url: LOGIN_API_URL,
        email: normalizedEmail,
        originalEmail: email,
        passwordLength: trimmedPassword.length,
        body: { ...requestBody, password: "***" }
      });
      
      // Call the login API
      const response = await fetch(LOGIN_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      // Log the full response for debugging
      console.log("Login API Response:", {
        status: response.status,
        ok: response.ok,
        data: data
      });
      
      // Check if response indicates failure
      // Handle different response structures:
      // 1. HTTP error status
      // 2. success: false in response body
      // 3. error message in response
      if (!response.ok) {
        const errorMessage = data.message || data.error || "Login failed";
        throw new Error(errorMessage);
      }
      
      // Check for explicit failure indicators
      if (data.success === false || data.error) {
        const errorMessage = data.message || data.error || "Login failed";
        
        // Provide more helpful error message
        console.error("Login failed - API response:", {
          success: data.success,
          message: data.message,
          error: data.error,
          fullResponse: data
        });
        
        // Check if it's a credentials error and provide helpful guidance
        if (errorMessage.toLowerCase().includes('invalid') || 
            errorMessage.toLowerCase().includes('password') ||
            errorMessage.toLowerCase().includes('email')) {
          throw new Error(`${errorMessage}. Please verify your credentials. If you haven't registered with the appointment system yet, you may need to create an account first.`);
        }
        
        throw new Error(errorMessage);
      }
      
      // Try to find token in different possible locations
      const token = data.token || data.data?.token || data.accessToken || data.access_token;
      
      if (!token) {
        console.error("No token found in response:", data);
        throw new Error("Authentication token not received from server");
      }
      
      console.log("Login successful, token found");
      
      // Store authentication data
      localStorage.setItem("appointment_auth_token", token);
      
      // Store the full user data if available
      const userData = {
        ...data,
        token: token
      };
      
      // Notify parent component about successful login
      onLoginSuccess(userData);
      
      // Clear form
      setEmail("");
      setPassword("");
      
      // Show success toast
      toast({
        title: "Login Successful",
        description: "You can now book an appointment",
      });
      
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Login to Book Appointment</DialogTitle>
          <DialogDescription>
            Please enter your credentials to book an appointment with a doctor.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleLogin} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          
          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 