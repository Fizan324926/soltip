import React, { forwardRef, ElementType, ComponentPropsWithRef } from 'react';
import { cn } from '@/lib/cn';
import { Spinner } from '../Spinner/Spinner';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

type AsProp<C extends ElementType> = {
  as?: C;
};

type PropsToOmit<C extends ElementType, P> = keyof (AsProp<C> & P);

type PolymorphicComponentProp<C extends ElementType, Props = Record<string, never>> = React.PropsWithChildren<
  Props & AsProp<C>
> &
  Omit<ComponentPropsWithRef<C>, PropsToOmit<C, Props>>;

export interface ButtonOwnProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export type ButtonProps<C extends ElementType = 'button'> = PolymorphicComponentProp<C, ButtonOwnProps>;

const spinnerColorMap: Record<ButtonVariant, string> = {
  primary: '#ffffff',
  secondary: '#9945FF',
  ghost: 'rgba(255,255,255,0.75)',
  danger: '#ffffff',
  success: '#0D0D1A',
};

const spinnerSizeMap: Record<ButtonSize, 'xs' | 'sm' | 'md'> = {
  sm: 'xs',
  md: 'sm',
  lg: 'sm',
};

export const Button = forwardRef(function Button<C extends ElementType = 'button'>(
  {
    as,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className,
    children,
    onClick,
    ...rest
  }: ButtonProps<C>,
  ref: React.Ref<Element>,
) {
  const Component = (as ?? 'button') as ElementType;
  const isDisabled = disabled || loading;

  const handleClick = (e: React.MouseEvent) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    (onClick as React.MouseEventHandler | undefined)?.(e as never);
  };

  return (
    <Component
      ref={ref}
      className={cn(
        styles.btn,
        styles[variant],
        styles[size],
        loading && styles.loading,
        fullWidth && styles.fullWidth,
        className,
      )}
      disabled={Component === 'button' ? isDisabled : undefined}
      aria-disabled={isDisabled}
      aria-busy={loading}
      onClick={handleClick}
      {...rest}
    >
      {/* Primary loading gets shimmer overlay */}
      {loading && variant === 'primary' && <span className={cn(styles.shimmer, 'absolute inset-0 rounded-[inherit]')} />}

      {/* Invisible content placeholder keeps button size stable */}
      <span className={cn('inline-flex items-center gap-2', loading && styles.contentHidden)}>
        {leftIcon && <span className={styles.iconLeft}>{leftIcon}</span>}
        {children}
        {rightIcon && <span className={styles.iconRight}>{rightIcon}</span>}
      </span>

      {/* Loading overlay */}
      {loading && (
        <span className={styles.loadingContent}>
          <Spinner
            size={spinnerSizeMap[size]}
            color={spinnerColorMap[variant]}
          />
          <span className="text-[0.8125em] font-medium opacity-80">Loading…</span>
        </span>
      )}
    </Component>
  );
}) as <C extends ElementType = 'button'>(props: ButtonProps<C> & { ref?: React.Ref<Element> }) => React.ReactElement | null;

export default Button;
