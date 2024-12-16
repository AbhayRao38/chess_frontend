import React from 'react';

interface TimerProps {
  seconds: number;
  isActive: boolean;
}

export const Timer: React.FC<TimerProps> = ({ seconds, isActive }) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return (
    <div className={`text-2xl font-mono font-bold ${isActive ? 'text-white' : 'text-gray-500'}`}>
      {String(minutes).padStart(2, '0')}:{String(remainingSeconds).padStart(2, '0')}
    </div>
  );
}