import { cn } from '../../utils/cn';

interface EyebrowProps {
  text: string;
  color?: string;
  className?: string;
}

// Curly-bracket section annotation — the recurring typographic signature.
export const Eyebrow = ({ text, color = 'text-surface-cream', className }: EyebrowProps) => (
  <span className={cn("text-[16px] sm:text-[19px] font-medium tracking-wide text-surface-cream", className)}>
    {'{ '}
    <span className={color}>{text}</span>
    {' }'}
  </span>
);
