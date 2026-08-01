import { cn } from '../utils/cn';

interface WatermarkProps {
  className?: string;
}

// "basit's Muster Card" — subtle fixed background mark layered behind content.
// Uses the theme-aware --color-watermark token (7% cream on dark, 7% ink on
// light) so it never fights the interface. Pointer-events disabled so it can
// never block clicks, text selection, or Lenis scroll.
export const Watermark = ({ className }: WatermarkProps) => (
  <div
    aria-hidden="true"
    className={cn(
      "pointer-events-none fixed select-none z-0",
      "font-semibold tracking-[-0.03em] leading-none whitespace-nowrap",
      "text-(--color-watermark)",
      className
    )}
  >
    basit&rsquo;s Muster Card
  </div>
);
