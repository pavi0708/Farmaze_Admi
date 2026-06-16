import React from 'react';
import { cn } from '@/lib/utils';

interface QtyInputProps {
  value: string | number;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
  compact?: boolean;
  className?: string;
}

export const QtyInput: React.FC<QtyInputProps> = ({
  value,
  onChange,
  onBlur,
  disabled = false,
  invalid = false,
  placeholder = "0",
  compact = false,
  className,
}) => {
  const baseClasses = cn(
    // Base styling
    "text-center text-sm font-medium transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300",
    "placeholder:text-emerald-400",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    
    // Size variants
    compact ? "h-8 w-20 rounded-lg" : "h-9 w-24 rounded-xl px-3",
    
    // Color states
    invalid 
      ? "border-red-300 bg-red-50 focus:ring-red-300 focus:border-red-300"
      : "border border-emerald-200 bg-emerald-50/50 hover:border-emerald-300",
    
    // Dark mode support
    "dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:placeholder:text-emerald-300",
    "dark:focus:ring-emerald-600 dark:focus:border-emerald-600",
    
    className
  );

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled}
      placeholder={placeholder}
      className={baseClasses}
    />
  );
};
