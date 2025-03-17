import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileText, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { medicalAnalysisService } from "@/lib/gemini";

export default function MedicalAnalysis() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [fileType, setFileType] = useState<'text' | 'image' | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check file type
    if (selectedFile.type.startsWith('image/')) {
      setFileType('image');
    } else if (selectedFile.type === 'text/plain' || selectedFile.type === 'application/pdf') {
      setFileType('text');
    } else {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an image (JPG, PNG) or text file (TXT, PDF)",
      });
      return;
    }

    setFile(selectedFile);
    setAnalysis('');
  };

  const handleAnalyze = async () => {
    if (!file || !fileType) return;

    setIsLoading(true);
    try {
      let result: string;
      if (fileType === 'image') {
        result = await medicalAnalysisService.analyzeXRay(file);
      } else {
        result = await medicalAnalysisService.analyzeReport(file);
      }
      setAnalysis(result);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to analyze the file",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-sm font-medium text-primary hover:text-primary/80">
                    Upload a file
                  </span>
                  <Input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept="image/*,.txt,.pdf"
                    onChange={handleFileChange}
                    disabled={isLoading}
                  />
                </label>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Supported formats: JPG, PNG, TXT, PDF
              </p>
            </div>
          </div>

          {file && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-2">
                {fileType === 'image' ? (
                  <Image className="h-5 w-5" />
                ) : (
                  <FileText className="h-5 w-5" />
                )}
                <span className="text-sm">{file.name}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setFileType(null);
                  setAnalysis('');
                }}
                disabled={isLoading}
              >
                Remove
              </Button>
            </div>
          )}

          {file && (
            <Button
              onClick={handleAnalyze}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Analyzing..." : "Analyze"}
            </Button>
          )}

          {analysis && (
            <ScrollArea className="h-[300px] p-4 bg-muted rounded-lg">
              <div className="prose prose-sm max-w-none">
                <h3 className="text-lg font-semibold mb-2">Analysis Result:</h3>
                <p className="whitespace-pre-wrap">{analysis}</p>
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 