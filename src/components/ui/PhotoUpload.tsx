import { useRef } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface PhotoUploadProps {
  value?: string;
  onChange: (photo: string) => void;
  label?: string;
  className?: string;
}

export const PhotoUpload = ({ value, onChange, label = 'Profile Photo', className }: PhotoUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="relative shrink-0">
        {value ? (
          <img
            src={value}
            alt="Profile preview"
            className="w-24 h-24 rounded-full object-cover border-2 border-border"
          />
        ) : (
          <div className="w-24 h-24 rounded-full border-2 border-dashed border-border bg-background flex items-center justify-center text-surface-50">
            <Camera className="w-6 h-6" />
          </div>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-highlight text-highlight-foreground flex items-center justify-center border border-border shadow-lg hover:scale-105 transition-transform"
          aria-label="Change photo"
        >
          <Camera className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-bold text-surface-50 uppercase tracking-widest">{label}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="px-3 py-1.5 text-[12px] font-semibold rounded-full border border-border text-surface-cream hover:bg-muted transition-colors"
          >
            {value ? 'Change' : 'Upload'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="px-3 py-1.5 text-[12px] font-semibold rounded-full border border-fn-error/30 text-fn-error hover:bg-fn-error/10 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </button>
          )}
        </div>
        <p className="text-[11px] text-surface-50/60">JPG/PNG, max 5MB</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
};
