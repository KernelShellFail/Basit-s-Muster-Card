// Central client-side runtime configuration.
// Business constants that used to be inlined across pages (currency symbol,
// night-shift allowance, default photos, ID generation) live here. Values can
// be overridden at build time via VITE_* environment variables.

const envString = (key: string, fallback: string): string =>
  (import.meta.env[key] as string | undefined) || fallback;

const envNumber = (key: string, fallback: number): number => {
  const raw = import.meta.env[key] as string | undefined;
  const parsed = raw === undefined ? NaN : Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const appConfig = {
  currency: envString('VITE_CURRENCY', '₹'),
  nightShiftAllowance: envNumber('VITE_NIGHT_SHIFT_ALLOWANCE', 150),
  defaultWorkerPhoto: envString(
    'VITE_DEFAULT_WORKER_PHOTO',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'
  ),
  defaultAttendancePhoto: envString(
    'VITE_DEFAULT_ATTENDANCE_PHOTO',
    'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=150&q=80'
  ),
};

// Generate a collision-resistant, dynamic entity id (e.g. WRK-<ts>-<rand>).
export const makeId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const formatCurrency = (value: number): string =>
  `${appConfig.currency}${value.toLocaleString('en-IN')}`;
