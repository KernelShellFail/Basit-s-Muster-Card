import { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { tv, type VariantProps } from 'tailwind-variants';

const buttonVariants = tv({
  base: 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden',
  variants: {
    variant: {
      primary: 'bg-primary text-primary-foreground hover:opacity-90 rounded-[28px]',
      ghost: 'bg-transparent text-foreground hover:text-muted-foreground rounded-full',
      destructive: 'bg-destructive text-destructive-foreground hover:opacity-90 rounded-[28px]',
      outline: 'bg-transparent text-foreground border-b border-foreground rounded-none hover:opacity-80 pb-0.5',
    },
    size: {
      sm: 'py-2 px-3 text-sm font-medium',
      md: 'py-4 pl-4 pr-3 text-base font-medium', // 16px top/bottom, 16px left, 12px right
      lg: 'py-5 pl-6 pr-5 text-lg font-medium',
      icon: 'h-10 w-10 rounded-full',
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
