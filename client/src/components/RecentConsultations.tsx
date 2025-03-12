import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Consultation {
  id: string;
  title: string;
  date: string;
  status: string;
}

interface RecentConsultationsProps {
  consultations: Consultation[];
}

export default function RecentConsultations({ consultations }: RecentConsultationsProps) {
  return (
    <Card className="bg-white rounded-lg shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Recent Consultations</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {consultations.map((consultation) => (
          <div 
            key={consultation.id}
            className="p-3 rounded-md bg-slate-50 hover:bg-slate-100 transition cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-primary">{consultation.title}</h3>
                <p className="text-sm text-slate-500">{consultation.date}</p>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                {consultation.status}
              </Badge>
            </div>
          </div>
        ))}
        <Button 
          variant="link" 
          className="w-full text-sm text-primary hover:text-primary/80 font-medium mt-2 p-0"
        >
          View All History
        </Button>
      </CardContent>
    </Card>
  );
}
