import { ReactNode, MouseEvent } from 'react';

interface ButtonProps {
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const Button = ({ 
  onClick, 
  children, 
  className = '', 
  disabled = false,
  type = 'button'
}: ButtonProps) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        px-6 py-3 
        bg-blue-600 
        text-white 
        rounded-lg 
        transition-all 
        duration-200
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:bg-blue-700 hover:shadow-lg active:transform active:scale-95'
        } 
        ${className}
      `}
    >
      {children}
    </button>
  );
};