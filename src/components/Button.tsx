import { ReactNode, MouseEvent } from 'react';

interface ButtonProps {
  onClick: (event?: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
  className?: string;
}

export const Button = ({ onClick, children, className = '' }: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${className}`}
    >
      {children}
    </button>
  );
};