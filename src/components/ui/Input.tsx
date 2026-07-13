import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, ...props }, ref) => {
    
    const defaultId = useId();
    const inputId = id || defaultId;
    const errorId = `${inputId}-error`;

    return (
      <div className="flex flex-col space-y-1.5 w-full">
        {label && (
          <label 
            htmlFor={inputId} 
            className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 flex items-center justify-center -translate-y-1/2 text-muted-foreground pointer-events-none" aria-hidden="true">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              "flex h-14 w-full rounded-[28px] border border-border bg-background px-6 py-3 text-[16px] font-medium text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
              icon && "pl-14",
              error && "border-destructive focus-visible:ring-destructive focus-visible:border-destructive",
              className
            )}
            {...props}
          />
        </div>
        <AnimatePresence>
          {error && (
            <motion.p
              id={errorId}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-sm font-medium text-destructive mt-1"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = 'Input';
