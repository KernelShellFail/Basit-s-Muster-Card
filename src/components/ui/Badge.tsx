import { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'lilac' | 'blue' | 'orange' | 'cream' | 'muted';
}

const colorMap: Record<NonNullable<BadgeProps['color']>, string> = {
  default: 'bg-card border-border text-surface-cream',
  success: 'bg-fn-success/10 text-fn-success border-fn-success/30',
  warning: 'bg-fn-warning/10 text-fn-warning border-fn-warning/30',
  error: 'bg-fn-error/10 text-fn-error border-fn-error/30',
  info: 'bg-fn-info/10 text-fn-info border-fn-info/30',
  lilac: 'bg-lilac/10 text-lilac border-lilac/30',
  blue: 'bg-blue/10 text-blue border-blue/30',
  orange: 'bg-orangey/10 text-orangey border-orangey/30',
  cream: 'bg-highlight text-highlight-foreground border-highlight',
  muted: 'bg-background border-border text-surface-50',
};

// Uniform status / category pill.
export const Badge = ({ className, color = 'default', children, ...props }: BadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border whitespace-nowrap",
      colorMap[color],
      className
    )}
    {...props}
  >
    {children}
  </span>
);
