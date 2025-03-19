
import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

type TimerProps = {
  duration: number; // Duration in seconds
  onComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
};

const Timer: React.FC<TimerProps> = ({ 
  duration, 
  onComplete,
  size = 'md'
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          clearInterval(timer);
          setIsActive(false);
          onComplete?.();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, timeLeft, onComplete]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progress = (timeLeft / duration) * 100;

  // Determine size classes
  const sizeClasses = {
    sm: 'w-5 h-5 text-xs',
    md: 'w-6 h-6 text-sm',
    lg: 'w-8 h-8 text-base'
  };
  
  const containerClass = sizeClasses[size];

  return (
    <div className="inline-flex items-center gap-1.5 text-muted-foreground">
      <div className={`relative ${containerClass} timer-pulse`}>
        <svg className="w-full h-full" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeOpacity="0.2"
          />
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="100"
            strokeDashoffset={100 - progress}
            strokeLinecap="round"
            transform="rotate(-90 18 18)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Clock className="w-1/2 h-1/2" />
        </div>
      </div>
      <span className={`font-mono ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}>
        {formatTime(timeLeft)}
      </span>
    </div>
  );
};

export default Timer;
