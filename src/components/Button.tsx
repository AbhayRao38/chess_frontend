import { ReactNode, MouseEvent } from 'react';

interface ButtonProps {
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export const Button = ({ 
  onClick, 
  children, 
  className = '', 
  disabled = false 
}: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-3 bg-blue-600 text-white rounded-lg transition-colors
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:bg-blue-700'} 
        ${className}`}
    >
      {children}
    </button>
  );
};