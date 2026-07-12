import { InputHTMLAttributes, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {

    return (
      <div className="flex flex-col space-y-1.5 w-full">
        {label && (
          <label className="text-[12px] font-medium text-graphite uppercase tracking-[0.1em] mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 flex items-center justify-center -translate-y-1/2 text-graphite pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "flex h-[48px] w-full rounded-[8px] border border-ash bg-pure-white px-4 py-2 text-[16px] text-off-black-ink ring-offset-pure-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-smoke focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-electric-lime focus-visible:border-electric-lime disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300",
              icon && "pl-12",
              error && "border-[#ff4444] focus-visible:ring-[#ff4444] focus-visible:border-[#ff4444]",
              className
            )}
            onFocus={(e) => {
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              props.onBlur?.(e);
            }}
            {...props}
          />
        </div>
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-sm text-destructive"
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
