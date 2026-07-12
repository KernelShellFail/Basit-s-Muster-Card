import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'mustermate-secret-key-12345';

const base64UrlEncode = (str: string): string => {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

const base64UrlDecode = (str: string): string => {
  let decoded = str.replace(/-/g, '+').replace(/_/g, '/');
  while (decoded.length % 4) {
    decoded += '=';
  }
  return Buffer.from(decoded, 'base64').toString('utf8');
};

export const signToken = (payload: any): string => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify({ 
    ...payload, 
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 Days expiration
  }));
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

export const verifyToken = (token: string): any | null => {
  try {
    const [headerStr, payloadStr, signature] = token.split('.');
    if (!headerStr || !payloadStr || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${headerStr}.${payloadStr}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(base64UrlDecode(payloadStr));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null; // Token expired
    }
    return payload;
  } catch {
    return null;
  }
};
