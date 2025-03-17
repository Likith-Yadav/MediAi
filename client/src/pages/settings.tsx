import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { currentUser, userProfile, updateEmail, updatePassword, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Redirect to landing page if not logged in
  React.useEffect(() => {
    if (!isLoading && !currentUser) {
      setLocation("/");
    }
  }, [isLoading, currentUser, setLocation]);

  // Show loading state if authentication is still loading
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Redirect if no user is logged in
  if (!currentUser) {
    return <div className="flex items-center justify-center min-h-screen">Redirecting...</div>;
  }

  const headerUser = {
    name: userProfile?.name || "User",
    email: userProfile?.email || "",
    profileImage: userProfile?.photoURL || undefined
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.currentPassword) {
      toast({
        variant: "destructive",
        title: "Required fields missing",
        description: "Please fill in all required fields."
      });
      return;
    }

    setIsUpdating(true);
    try {
      await updateEmail(formData.email, formData.currentPassword);
      setVerificationSent(true);
      toast({
        title: "Verification email sent",
        description: "Please check your new email address for a verification link. Your email will be updated after verification.",
      });
      setFormData(prev => ({ ...prev, email: "", currentPassword: "" }));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "Failed to update email. Please try again."
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Required fields missing",
        description: "Please fill in all required fields."
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "New password and confirmation password must match."
      });
      return;
    }

    setIsUpdating(true);
    try {
      await updatePassword(formData.currentPassword, formData.newPassword);
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully."
      });
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "Failed to update password. Please try again."
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen flex flex-col text-slate-800">
      <Header user={headerUser} />
      
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Update Email</h2>
              {verificationSent ? (
                <div className="rounded-lg bg-blue-50 p-4 text-blue-900">
                  <h3 className="font-medium">Verification Email Sent</h3>
                  <p className="mt-1 text-sm">
                    Please check your new email address for a verification link. 
                    Your email will be updated after you verify the new address.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleUpdateEmail} className="space-y-4">
                  <div>
                    <Label htmlFor="email">New Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter new email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      placeholder="Enter current password"
                    />
                  </div>
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? "Sending verification..." : "Update Email"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Update Password</h2>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <Label htmlFor="currentPasswordForNew">Current Password</Label>
                  <Input
                    id="currentPasswordForNew"
                    name="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm new password"
                  />
                </div>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 