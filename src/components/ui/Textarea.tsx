import { TextareaHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '../../utils/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {

    const defaultId = useId();
    const textareaId = id || defaultId;
    const errorId = `${textareaId}-error`;

    return (
      <div className="flex flex-col space-y-1.5 w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-[11px] font-bold text-surface-50 uppercase tracking-widest mb-1"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "flex min-h-[96px] w-full rounded-[8px] border border-border bg-background px-4 py-3 text-[14px] font-medium text-surface-cream placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-y",
            error && "border-fn-error focus-visible:ring-fn-error focus-visible:border-fn-error",
            className
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-sm font-medium text-fn-error mt-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
