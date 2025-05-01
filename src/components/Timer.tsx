import React from 'react';

interface TimerProps {
  seconds: number;
  isActive: boolean;
}

export const Timer: React.FC<TimerProps> = ({ seconds, isActive }) => {
  const flooredSeconds = Math.floor(seconds);
  const minutes = Math.floor(flooredSeconds / 60);
  const remainingSeconds = flooredSeconds % 60;

  return (
    <div className={`
      text-2xl 
      font-mono 
      font-bold 
      transition-colors 
      duration-300
      ${isActive ? 'text-white scale-110' : 'text-gray-500'}
    `}>
      {String(minutes).padStart(2, '0')}:{String(remainingSeconds).padStart(2, '0')}
    </div>
  );
};