import React, { forwardRef, useId, useState } from 'react';
import { cn } from '@/lib/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  maxLength?: number;
  required?: boolean;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    error,
    hint,
    maxLength,
    required,
    className,
    containerClassName,
    id: idProp,
    onChange,
    value,
    defaultValue,
    rows = 4,
    disabled,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  // Track char count for uncontrolled usage
  const [localLength, setLocalLength] = useState<number>(
    typeof defaultValue === 'string' ? defaultValue.length : 0,
  );

  const currentLength =
    typeof value === 'string'
      ? value.length
      : localLength;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalLength(e.target.value.length);
    onChange?.(e);
  };

  const isOverLimit = maxLength !== undefined && currentLength > maxLength;
  const hasError = !!error || isOverLimit;

  const describedBy = [
    hasError ? errorId : undefined,
    hint && !hasError ? hintId : undefined,
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', containerClassName)}>
      {label && (
        <label
          htmlFor={id}
          className={cn(
            'text-[0.8125rem] font-medium text-[#6e6e73]',
            required && "after:content-['_*'] after:text-accent-error",
          )}
        >
          {label}
        </label>
      )}

      <div
        className={cn(
          'relative bg-surface-card border rounded-[0.625rem] transition-all duration-200',
          hasError
            ? 'border-accent-error shadow-[0_0_0_3px_rgba(255,68,68,0.15)] animate-[shake_0.35s_ease-in-out]'
            : 'border-surface-border focus-within:border-solana-purple focus-within:shadow-[0_0_0_3px_rgba(153,69,255,0.15)]',
        )}
      >
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          maxLength={maxLength}
          disabled={disabled}
          required={required}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          aria-invalid={hasError}
          aria-describedby={describedBy}
          className={cn(
            'w-full bg-transparent border-none outline-none resize-y',
            'text-[#1d1d1f] text-[0.9375rem] leading-relaxed',
            'px-3.5 py-[0.5625rem]',
            'placeholder:text-[#aeaeb2]',
            'disabled:opacity-45 disabled:cursor-not-allowed',
            'min-h-[5rem]',
            className,
          )}
          {...rest}
        />

        {maxLength !== undefined && (
          <div className="absolute bottom-2 right-3 pointer-events-none">
            <span
              className={cn(
                'text-[0.7rem] font-mono tabular-nums',
                isOverLimit ? 'text-accent-error' : 'text-[#aeaeb2]',
              )}
            >
              {currentLength}/{maxLength}
            </span>
          </div>
        )}
      </div>

      {hasError && (
        <p id={errorId} className="text-[0.75rem] text-accent-error flex items-center gap-1.5" role="alert">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="5.5" stroke="#FF4444" />
            <path d="M6 3.5V6.5" stroke="#FF4444" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="6" cy="8.5" r="0.6" fill="#FF4444" />
          </svg>
          {error ?? `Maximum ${maxLength} characters`}
        </p>
      )}

      {hint && !hasError && (
        <p id={hintId} className="text-[0.75rem] text-[#86868b]">
          {hint}
        </p>
      )}
    </div>
  );
});

export default Textarea;
