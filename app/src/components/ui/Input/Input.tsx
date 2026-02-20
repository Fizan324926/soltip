import React, { forwardRef, useId } from 'react';
import { cn } from '@/lib/cn';
import styles from './Input.module.css';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  required?: boolean;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    hint,
    prefix,
    suffix,
    required,
    className,
    containerClassName,
    id: idProp,
    disabled,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const describedBy = [error ? errorId : undefined, hint && !error ? hintId : undefined]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div className={cn(styles.wrapper, containerClassName)}>
      {label && (
        <label htmlFor={id} className={cn(styles.label, required && styles.labelRequired)}>
          {label}
        </label>
      )}

      <div className={cn(styles.inputContainer, error && styles.errorContainer)}>
        {prefix && <span className={styles.prefix}>{prefix}</span>}

        <input
          ref={ref}
          id={id}
          className={cn(styles.input, className)}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          {...rest}
        />

        {suffix && <span className={styles.suffix}>{suffix}</span>}
      </div>

      {error && (
        <p id={errorId} className={styles.errorMessage} role="alert">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="5.5" stroke="#FF4444" />
            <path d="M6 3.5V6.5" stroke="#FF4444" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="6" cy="8.5" r="0.6" fill="#FF4444" />
          </svg>
          {error}
        </p>
      )}

      {hint && !error && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  );
});

export default Input;
