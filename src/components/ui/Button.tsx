import { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { tv, type VariantProps } from 'tailwind-variants';

const buttonVariants = tv({
  base: 'inline-flex items-center justify-center font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden rounded-full',
  variants: {
    variant: {
      // Brand action — the single chromatic control (gradient-stroked pill).
      primary: 'btn-gradient-cta text-surface-cream',
      // Secondary actions — outlined cream pill.
      ghost: 'btn-ghost-pill text-surface-cream',
      // Tertiary / quiet — borderless nav-style.
      outline: 'bg-transparent text-surface-cream hover:text-surface-50',
      // Danger — outlined, no fill.
      destructive: 'bg-transparent text-fn-error border border-fn-error/60 hover:border-fn-error',
      link: 'bg-transparent text-surface-cream underline-offset-4 hover:underline p-0',
    },
    size: {
      sm: 'h-11 px-5 text-[14px]',
      md: 'h-12 px-6 text-[15px]',
      lg: 'h-14 px-8 text-[16px]',
      icon: 'h-11 w-11 rounded-full',
      link: 'p-0 text-sm font-medium',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

export interface ButtonProps extends VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

type MotionButtonProps = Omit<HTMLMotionProps<"button">, keyof ButtonProps> & ButtonProps;

export const Button = forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, leftIcon, rightIcon, ...props }, ref) => {

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        className={buttonVariants({ variant, size, className })}
        disabled={disabled || isLoading}
        aria-disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-inherit" aria-hidden="true">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          </div>
        )}
        <span className={`flex items-center justify-center gap-2 ${isLoading ? "opacity-0" : ""}`}>
          {leftIcon && <span className="shrink-0" aria-hidden="true">{leftIcon}</span>}
          {children as React.ReactNode}
          {rightIcon && <span className="shrink-0" aria-hidden="true">{rightIcon}</span>}
        </span>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
