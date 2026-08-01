import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, isToday, isSameMonth, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  maxDate?: string;
  minDate?: string;
  required?: boolean;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const DatePicker = ({ value, onChange, label, className, maxDate, minDate }: DatePickerProps) => {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => (value ? parseISO(value) : new Date()));
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedDate = value ? parseISO(value) : null;
  const max = maxDate ? parseISO(maxDate) : null;
  const min = minDate ? parseISO(minDate) : null;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current && !containerRef.current.contains(target) &&
          !(popoverRef.current && popoverRef.current.contains(target))) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (value) setViewMonth(parseISO(value));
  }, [value]);

  const popoverRef = useRef<HTMLDivElement>(null);

  const togglePopover = () => {
    if (open) {
      setOpen(false);
      return;
    }
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      let top = rect.bottom + 8;
      let left = rect.left;
      if (left + 300 > window.innerWidth) left = window.innerWidth - 300 - 8;
      if (left < 8) left = 8;
      if (top + 320 > window.innerHeight) top = rect.top - 328;
      setPopoverPos({ top, left });
    }
    setViewMonth(selectedDate || new Date());
    setOpen(true);
  };

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  const handleSelect = (day: Date) => {
    if (max && day > max) return;
    if (min && day < min) return;
    onChange(format(day, 'yyyy-MM-dd'));
    setOpen(false);
  };

  const calendar = (
    <div
      ref={popoverRef}
      className="fixed z-[70] w-[300px] rounded-[8px] border border-border bg-card shadow-2xl p-4"
      style={popoverPos || undefined}
    >
      {/* Month header */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setViewMonth(subMonths(viewMonth, 1))}
          className="p-1.5 rounded-full hover:bg-muted text-surface-cream transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-[14px] font-semibold text-surface-cream uppercase tracking-wider">
          {format(viewMonth, 'MMMM yyyy')}
        </span>
        <button
          type="button"
          onClick={() => setViewMonth(addMonths(viewMonth, 1))}
          className="p-1.5 rounded-full hover:bg-muted text-surface-cream transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-center text-[11px] font-bold text-surface-50 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const inMonth = isSameMonth(day, viewMonth);
          const selected = selectedDate && isSameDay(day, selectedDate);
          const today = isToday(day);
          const disabled = !!((max && day > max) || (min && day < min));
          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => handleSelect(day)}
              className={cn(
                "h-9 w-full rounded-[6px] text-[13px] font-medium transition-all flex items-center justify-center",
                !inMonth && "text-surface-50/40",
                inMonth && !selected && !today && "text-surface-cream hover:bg-muted",
                today && !selected && "border border-orangey text-orangey",
                selected && "bg-surface-cream text-just-black font-bold",
                disabled && "opacity-30 cursor-not-allowed hover:bg-transparent"
              )}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>

      {value && (
        <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false); }}
            className="text-[12px] font-semibold text-surface-50 hover:text-surface-cream transition-colors"
          >
            Clear
          </button>
          <span className="text-[11px] text-surface-50 font-medium">
            {selectedDate ? format(selectedDate, 'EEEE, dd MMM') : ''}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col space-y-1.5 w-full" ref={containerRef}>
      {label && (
        <label className="text-[11px] font-bold text-surface-50 uppercase tracking-widest mb-1">
          {label}
        </label>
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={togglePopover}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-[8px] border border-border bg-background px-4 text-[14px] font-medium text-surface-cream cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring",
          open && "ring-1 ring-ring border-ring",
          className
        )}
      >
        <span className={cn("flex items-center gap-2", !selectedDate && "text-surface-50")}>
          <CalendarIcon className="w-4 h-4 text-surface-50" />
          {selectedDate ? format(selectedDate, 'dd MMM yyyy') : 'Select date'}
        </span>
        <ChevronRight className="w-4 h-4 text-surface-50 rotate-90" />
      </button>

      {open && popoverPos && createPortal(calendar, document.body)}
    </div>
  );
};
