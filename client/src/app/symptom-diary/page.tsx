import React from 'react';
import { SymptomDiary } from '@/components/SymptomDiary';
import { AuthProvider } from '@/hooks/use-auth'; // Assuming AuthProvider wraps routes

export default function SymptomDiaryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
      <SymptomDiary />
    </div>
  );
} 