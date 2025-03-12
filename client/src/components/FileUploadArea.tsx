import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CloudIcon } from "lucide-react";

interface FileUploadAreaProps {
  onClose: () => void;
  onUpload: (files: File[]) => void;
}

export default function FileUploadArea({ onClose, onUpload }: FileUploadAreaProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };
  
  const handleUpload = () => {
    onUpload(selectedFiles);
  };
  
  return (
    <div className="border-t border-slate-200 p-4">
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
          isDragOver 
            ? "border-primary bg-primary/5" 
            : "border-slate-300 hover:bg-slate-50"
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CloudIcon className="mx-auto h-12 w-12 text-slate-400" />
        <p className="mt-2 text-sm text-slate-600">
          Drag and drop medical files or <span className="text-primary font-medium">browse</span>
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Supports X-rays, CT scans, MRIs, and lab reports
        </p>
        <input 
          type="file" 
          className="hidden" 
          ref={fileInputRef}
          accept="image/*,.pdf" 
          multiple
          onChange={handleFileSelect}
        />
      </div>
      
      {selectedFiles.length > 0 && (
        <div className="mt-3 bg-slate-50 p-3 rounded-md">
          <h3 className="text-sm font-medium mb-2">Selected Files:</h3>
          <ul className="text-xs space-y-1">
            {selectedFiles.map((file, index) => (
              <li key={index} className="flex justify-between">
                <span className="truncate">{file.name}</span>
                <span className="text-slate-500">{formatFileSize(file.size)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="flex justify-end mt-3">
        <Button
          variant="outline"
          onClick={onClose}
          className="mr-2"
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          disabled={selectedFiles.length === 0}
        >
          Upload Files
        </Button>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}
