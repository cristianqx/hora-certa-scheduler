
import React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className, showText = true }) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="bg-primary-500 rounded-full p-1.5 flex items-center justify-center">
        <Clock className="h-5 w-5 text-white" />
      </div>
      {showText && (
        <div className="text-xl font-bold font-heading text-gray-800">
          Hora<span className="text-primary-500">Certa</span>
        </div>
      )}
    </div>
  );
};
