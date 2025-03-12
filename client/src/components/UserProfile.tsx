import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface UserProps {
  user: {
    name: string;
    email: string;
    age: number;
    bloodType: string;
    allergies: string;
  };
}

export default function UserProfile({ user }: UserProps) {
  return (
    <Card className="bg-white rounded-lg shadow-sm">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-primary text-white flex items-center justify-center text-xl font-semibold">
            {user.name.charAt(0)}
          </div>
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
              <span className="text-sm font-medium">{user.age}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Blood Type</span>
              <span className="text-sm font-medium">{user.bloodType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Allergies</span>
              <span className="text-sm font-medium">{user.allergies}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
