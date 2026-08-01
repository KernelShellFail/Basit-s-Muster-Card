// Central runtime configuration.
// All environment-driven values that were previously hardcoded across the
// codebase (rate limits, security settings) live here so nothing in the app
// relies on magic strings.

const bool = (value: string | undefined, fallback: boolean): boolean =>
  value === undefined ? fallback : value.toLowerCase() === 'true';

export const config = {
  rateLimit: {
    loginWindowMs: Number(process.env.LOGIN_WINDOW_MS || 15 * 60 * 1000),
    loginMax: Number(process.env.LOGIN_MAX_REQUESTS || 20),
    registerWindowMs: Number(process.env.REGISTER_WINDOW_MS || 15 * 60 * 1000),
    registerMax: Number(process.env.REGISTER_MAX_REQUESTS || 10),
  },
};
