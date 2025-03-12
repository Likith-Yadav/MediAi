import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { FirebaseUser } from "@/lib/firebase";

interface UserProps {
  user: Partial<FirebaseUser>;
}

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"];

export default function UserProfile({ user }: UserProps) {
  const { toast } = useToast();
  const { updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: user.name || "",
    age: user.age || "",
    bloodType: user.bloodType || "",
    allergies: user.allergies || "",
    photoURL: user.photoURL || ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, bloodType: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let photoURL = user.photoURL;

      // Upload image if a new one is selected
      if (profileImage) {
        try {
          // First, try the upload
          const storageRef = ref(storage, `profile-images/${user.uid}/${profileImage.name}`);
          const snapshot = await uploadBytes(storageRef, profileImage);
          photoURL = await getDownloadURL(snapshot.ref);
        } catch (uploadError: any) {
          console.error("Image upload error:", uploadError);

          // Show specific error toast for CORS issues
          if (uploadError.message?.includes("CORS") || 
              uploadError.code === "storage/unauthorized" || 
              uploadError.code === "cors-error") {
            toast({
              variant: "destructive",
              title: "Image upload failed",
              description: "Your Firebase Storage CORS settings need to be configured to allow uploads from this domain. Continuing without image update.",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Image upload failed",
              description: "Could not upload profile image. Continuing with other profile updates."
            });
          }
          // Continue with the rest of the profile update, without the new image
        }
      }

      // Update profile data
      await updateProfile({
        name: formData.name,
        age: formData.age ? parseInt(formData.age.toString()) : undefined,
        bloodType: formData.bloodType,
        allergies: formData.allergies,
        photoURL
      });

      toast({
        title: "Profile updated!",
        description: "Your profile information has been saved successfully."
      });
      setIsEditing(false);
    } catch (error: any) {
      console.error("Profile update error:", error);

      let errorTitle = "Update failed";
      let errorMessage = "Failed to update profile. Please try again.";

      if (error.code === "permission-denied" || error.code === "storage/unauthorized") {
        errorTitle = "Firebase permissions error";
        errorMessage = "You don't have permission to update this profile. Check your Firebase rules configuration.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        variant: "destructive",
        title: errorTitle,
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Display mode - shows user information
  if (!isEditing) {
    return (
      <Card className="bg-white rounded-lg shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              {user.photoURL ? (
                <AvatarImage src={user.photoURL} alt={user.name} />
              ) : (
                <AvatarFallback className="bg-primary text-white text-xl">
                  {user.name?.charAt(0) || "U"}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{user.name}</h2>
              <p className="text-slate-500 text-sm">{user.email}</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div>
            <h3 className="text-sm font-medium text-slate-500 mb-2">Medical Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Age</span>
                <span className="text-sm font-medium">{user.age || "Not specified"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Blood Type</span>
                <span className="text-sm font-medium">{user.bloodType || "Not specified"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Allergies</span>
                <span className="text-sm font-medium">{user.allergies || "None specified"}</span>
              </div>
            </div>
          </div>

          <Button 
            className="w-full mt-4" 
            variant="outline" 
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Edit mode - form to update user information
  return (
    <Card className="bg-white rounded-lg shadow-sm">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center mb-4">
            <Avatar className="h-24 w-24 mb-4">
              {profileImage ? (
                <AvatarImage src={URL.createObjectURL(profileImage)} alt="Preview" />
              ) : user.photoURL ? (
                <AvatarImage src={user.photoURL} alt={user.name} />
              ) : (
                <AvatarFallback className="bg-primary text-white text-2xl">
                  {user.name?.charAt(0) || "U"}
                </AvatarFallback>
              )}
            </Avatar>

            <Label htmlFor="photo" className="cursor-pointer text-primary text-sm font-medium">
              Change Profile Photo
              <Input 
                id="photo" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageChange}
              />
            </Label>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name"
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                placeholder="Your name"
              />
            </div>

            <div>
              <Label htmlFor="age">Age</Label>
              <Input 
                id="age"
                name="age" 
                type="number" 
                value={formData.age} 
                onChange={handleInputChange} 
                placeholder="Your age"
              />
            </div>

            <div>
              <Label htmlFor="bloodType">Blood Type</Label>
              <Select 
                value={formData.bloodType} 
                onValueChange={handleSelectChange}
              >
                <SelectTrigger id="bloodType">
                  <SelectValue placeholder="Select blood type" />
                </SelectTrigger>
                <SelectContent>
                  {bloodTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="allergies">Allergies</Label>
              <Textarea 
                id="allergies"
                name="allergies" 
                value={formData.allergies} 
                onChange={handleInputChange} 
                placeholder="List your allergies"
                rows={3}
              />
            </div>
          </div>

          <div className="flex space-x-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => setIsEditing(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}