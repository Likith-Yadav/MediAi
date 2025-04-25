import React from 'react';
import ClickSpark from './ClickSpark';

interface SparkWrapperProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const SparkWrapper: React.FC<SparkWrapperProps> = ({ children, className, onClick }) => {
  return (
    <ClickSpark
      sparkColor="#6366f1"
      sparkSize={6}
      sparkRadius={15}
      sparkCount={8}
      duration={400}
      onClick={onClick}
    >
      <div className={className}>
        {children}
      </div>
    </ClickSpark>
  );
};

export default SparkWrapper; 