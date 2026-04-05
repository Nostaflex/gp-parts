'use client';

import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';
import { forwardRef, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id || autoId;

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-body-sm font-body font-medium text-basalt"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'w-full rounded-lg border px-4 py-3 text-body font-body bg-white',
            'placeholder:text-basalt/40',
            'transition-colors duration-fast',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
            error
              ? 'border-error bg-error/5 focus-visible:ring-error/20'
              : 'border-lin hover:border-basalt/30 focus-visible:border-volcanic focus-visible:ring-volcanic/20',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-basalt/5',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="flex items-center gap-1 text-caption text-error mt-1"
          >
            <AlertCircle size={14} strokeWidth={1.75} />
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="text-caption text-basalt/60 mt-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
