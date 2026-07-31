import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { Eyebrow } from './Eyebrow';
import { slideUp } from '../../utils/animations';

interface PageHeaderProps {
  eyebrow?: string;
  eyebrowColor?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

// Consistent page title block used across all module screens.
export const PageHeader = ({ eyebrow, eyebrowColor = 'text-surface-cream', title, description, actions, className }: PageHeaderProps) => (
  <motion.div
    variants={slideUp}
    className={cn("flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 border-b border-border pb-10", className)}
  >
    <div className="min-w-0">
      {eyebrow && <Eyebrow text={eyebrow} color={eyebrowColor} />}
      <h1 className="mt-4 text-4xl sm:text-5xl lg:text-[64px] font-semibold tracking-[-0.02em] leading-[1] text-surface-cream">
        {title}
      </h1>
      {description && (
        <p className="text-[16px] text-surface-50 font-medium mt-4 max-w-2xl">{description}</p>
      )}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-3 shrink-0">{actions}</div>}
  </motion.div>
);
