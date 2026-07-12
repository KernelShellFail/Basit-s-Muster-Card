import { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

type MotionButtonProps = Omit<HTMLMotionProps<"button">, keyof ButtonProps> & ButtonProps;

export const Button = forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, leftIcon, rightIcon, ...props }, ref) => {
    
    const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-off-black-ink disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden";
    
    const variants = {
      primary: "bg-electric-lime text-off-black-ink hover:opacity-90 rounded-[28px]",
      secondary: "bg-ash text-off-black-ink hover:opacity-80 rounded-[28px]",
      outline: "border border-off-black-ink bg-transparent hover:bg-off-white-canvas text-off-black-ink rounded-[28px]",
      ghost: "hover:bg-off-white-canvas text-off-black-ink rounded-full",
      destructive: "bg-[#ff4444] text-white hover:opacity-90 rounded-[28px]",
    };
    
    const sizes = {
      sm: "h-[32px] px-3 text-[14px]",
      md: "h-[48px] px-5 text-[16px]",
      lg: "h-[56px] px-8 text-[18px]",
      icon: "h-[40px] w-[40px] rounded-full",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-inherit">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          </div>
        )}
        <span className={cn("flex items-center justify-center gap-2", isLoading && "opacity-0")}>
          {leftIcon}
          {children as React.ReactNode}
          {rightIcon}
        </span>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
