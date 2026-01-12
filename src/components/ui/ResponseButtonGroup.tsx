'use client';

import { forwardRef } from 'react';
import ResponseButton from './ResponseButton';
import type { ResponseStatus } from '@/types';

interface ResponseButtonGroupProps {
  value: ResponseStatus | null;
  onChange: (value: ResponseStatus) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

const ResponseButtonGroup = forwardRef<HTMLDivElement, ResponseButtonGroupProps>(
  ({ value, onChange, size = 'md', disabled, className = '' }, ref) => {
    return (
      <div ref={ref} className={`flex items-center gap-2 ${className}`}>
        <ResponseButton
          value={value}
          onChange={onChange}
          status="ok"
          size={size}
          disabled={disabled}
        />
        <ResponseButton
          value={value}
          onChange={onChange}
          status="maybe"
          size={size}
          disabled={disabled}
        />
        <ResponseButton
          value={value}
          onChange={onChange}
          status="ng"
          size={size}
          disabled={disabled}
        />
      </div>
    );
  }
);

ResponseButtonGroup.displayName = 'ResponseButtonGroup';

export default ResponseButtonGroup;
