import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { Card, CardContent } from './Card';
import { slideUp } from '../../utils/animations';

interface StatCardProps {
  label: string;
  value: ReactNode;
  sub?: string;
  icon?: ReactNode;
  accent?: boolean;
  tone?: 'default' | 'danger';
  className?: string;
}

// Uniform KPI / metric card used across dashboards.
export const StatCard = ({ label, value, sub, icon, accent, tone = 'default', className }: StatCardProps) => {
  const danger = tone === 'danger';
  const highlight = accent || danger;
  return (
    <motion.div variants={slideUp} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
      <Card className={cn("h-full border", highlight ? (danger ? 'border-fn-error/30' : 'border-primary/40') : 'border-border', className)}>
        <CardContent className="p-6 flex items-center justify-between h-full">
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-surface-50 uppercase tracking-[0.1em] mb-4">{label}</p>
            <h3 className={cn("text-4xl sm:text-5xl lg:text-[48px] font-semibold tracking-tight leading-[1]", danger ? 'text-fn-error' : highlight ? 'text-shockingly-green' : 'text-surface-cream')}>
              {value}
            </h3>
            {sub && <p className="text-[13px] font-medium text-surface-50 mt-4 min-h-[30px] leading-relaxed">{sub}</p>}
          </div>
          {icon && (
            <div className={cn(
              "w-12 h-12 rounded-full border flex items-center justify-center shrink-0",
              danger ? 'border-fn-error/30 text-fn-error' : highlight ? 'border-primary/40 text-shockingly-green' : 'border-border text-surface-cream'
            )}>
              {icon}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
