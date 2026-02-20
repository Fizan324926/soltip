import React, { forwardRef } from 'react';
import { cn } from '@/lib/cn';
import styles from './Card.module.css';

export type CardVariant = 'default' | 'elevated' | 'bordered' | 'glass';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  hoverable?: boolean;
  as?: React.ElementType;
}

const paddingClassMap: Record<CardPadding, string> = {
  none: styles.padNone,
  sm: styles.padSm,
  md: styles.padMd,
  lg: styles.padLg,
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    variant = 'default',
    padding = 'md',
    hoverable = false,
    as: Component = 'div',
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <Component
      ref={ref}
      className={cn(
        styles.card,
        styles[variant],
        paddingClassMap[padding],
        hoverable && styles.hoverable,
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
});

export default Card;
