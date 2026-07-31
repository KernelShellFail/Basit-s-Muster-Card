import { SelectHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '../../utils/cn';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, icon, id, children, ...props }, ref) => {

    const defaultId = useId();
    const selectId = id || defaultId;
    const errorId = `${selectId}-error`;

    return (
      <div className="flex flex-col space-y-1.5 w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="text-[11px] font-bold text-surface-50 uppercase tracking-widest mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 flex items-center justify-center -translate-y-1/2 text-muted-foreground pointer-events-none" aria-hidden="true">
              {icon}
            </div>
          )}
          <select
            id={selectId}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              "flex h-12 w-full rounded-[8px] border border-border bg-background px-4 text-[14px] font-medium text-surface-cream cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none",
              icon && "pl-11",
              error && "border-fn-error focus-visible:ring-fn-error focus-visible:border-fn-error",
              className
            )}
            {...props}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-50 text-[10px]">
            ▾
          </div>
        </div>
        {error && (
          <p id={errorId} className="text-sm font-medium text-fn-error mt-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
