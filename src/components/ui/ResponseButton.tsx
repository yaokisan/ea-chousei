'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Circle, Triangle, X } from 'lucide-react';
import type { ResponseStatus } from '@/types';

interface ResponseButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value' | 'onChange'> {
  value: ResponseStatus | null;
  onChange: (value: ResponseStatus) => void;
  status: ResponseStatus;
  size?: 'sm' | 'md' | 'lg';
}

const ResponseButton = forwardRef<HTMLButtonElement, ResponseButtonProps>(
  ({ value, onChange, status, size = 'md', className = '', disabled, ...props }, ref) => {
    const isSelected = value === status;

    const sizes = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
    };

    const iconSizes = {
      sm: 14,
      md: 18,
      lg: 22,
    };

    const getStyles = () => {
      if (!isSelected) {
        return 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50';
      }

      switch (status) {
        case 'ok':
          return 'bg-green-500 border-green-500 text-white';
        case 'maybe':
          return 'bg-amber-500 border-amber-500 text-white';
        case 'ng':
          return 'bg-red-500 border-red-500 text-white';
        default:
          return 'bg-white border-slate-200 text-slate-400';
      }
    };

    const getIcon = () => {
      const iconSize = iconSizes[size];
      switch (status) {
        case 'ok':
          return <Circle size={iconSize} strokeWidth={3} />;
        case 'maybe':
          return <Triangle size={iconSize} strokeWidth={3} />;
        case 'ng':
          return <X size={iconSize} strokeWidth={3} />;
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => onChange(status)}
        disabled={disabled}
        className={`
          ${sizes[size]}
          flex items-center justify-center
          border-2 rounded-lg
          transition-all duration-150
          disabled:opacity-50 disabled:cursor-not-allowed
          ${getStyles()}
          ${className}
        `}
        aria-label={status === 'ok' ? 'OK' : status === 'maybe' ? '調整可' : 'NG'}
        {...props}
      >
        {getIcon()}
      </button>
    );
  }
);

ResponseButton.displayName = 'ResponseButton';

export default ResponseButton;
