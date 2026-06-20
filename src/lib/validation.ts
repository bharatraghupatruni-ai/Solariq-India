/**
 * Security validation utilities
 * Protects against SQL injection, XSS, and malicious payloads
 */

import type { NextRequest } from "next/server";

// Input bounds
export const INPUT_BOUNDS = {
  ROOF_AREA: { min: 50, max: 50000 },
  MONTHLY_BILL: { min: 100, max: 100000 },
  CAPACITY_KWP: { min: 0.1, max: 1000 },
  ANNUAL_GENERATION: { min: 0, max: 1000000 },
  LOAN_AMOUNT: { min: 10000, max: 50000000 },
} as const;



// XSS/SQLi payload patterns
const MALICIOUS_PATTERNS = [
  // SQL injection
  /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
  /('|--|;|#|\/\*|\*\/)/i,
  /(\bor\b|\band\b).*(=|like)/i,
  // XSS
  /<(script|iframe|object|embed|form|img|svg|link|style|meta|base|input)/i,
  /(javascript:|data:|vbscript:|on[a-z]+=)/i,
  // HTML injection
  /<[^>]*>/,
  // Encoded attacks
  /(%3C|%3E|%27|%22|%3B|%2F)/i,
  // Known SQLi strings
  /(\b|;)(union|select|drop|delete|update|insert|exec|shutdown)\b/i,
  // Generic attack vectors
  /(<script|<\/script|<iframe|<object|<embed)/i,
  // Null bytes
  /\x00/,
  // Path traversal
  /(\.\.\/|\/\.\/)/i,
];

function isMalicious(input: string): boolean {
  return MALICIOUS_PATTERNS.some((pattern) => pattern.test(input));
}

/**
 * Validates a city name for security issues.
 * Returns { valid: true } or { valid: false, error: string }
 */
export function validateCity(
  city: string,
): { valid: true; sanitized: string } | { valid: false; error: string } {
  if (!city || city.trim().length < 2) {
    return { valid: false, error: "City name must be at least 2 characters" };
  }

  const trimmed = city.trim();

  if (trimmed.length > 100) {
    return { valid: false, error: "City name too long (max 100 chars)" };
  }

  if (isMalicious(trimmed)) {
    return {
      valid: false,
      error: "Invalid city name. Contains forbidden characters or patterns.",
    };
  }

  // Reject numeric-only or alphanumeric that isn't a real city
  const cityLower = trimmed.toLowerCase();
  const numericOnly = /^\d+$/.test(trimmed);
  if (numericOnly) {
    return { valid: false, error: "City name cannot be numeric only" };
  }

  // Check if it looks like a valid city name (alphabetic, spaces, hyphens, dots, apostrophes)
  const validChars = /^[a-zA-Z\s\-\.',]+$/;
  if (!validChars.test(trimmed)) {
    return { valid: false, error: "City name contains invalid characters" };
  }

  return { valid: true, sanitized: cityLower };
}

/**
 * Sanitizes a string by removing HTML tags and encoding special characters
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .replace(/javascript:/gi, "")
    .replace(/data:/gi, "")
    .replace(/vbscript:/gi, "");
}

/**
 * Validates that a value is within numeric bounds
 */
export function validateBounds(
  value: number,
  min: number,
  max: number,
  field: string,
): { valid: true } | { valid: false; error: string } {
  if (Number.isNaN(value)) {
    return { valid: false, error: `${field} is invalid (not a number)` };
  }
  if (value < min) {
    return { valid: false, error: `${field} must be at least ${min}` };
  }
  if (value > max) {
    return { valid: false, error: `${field} cannot exceed ${max}` };
  }
  return { valid: true };
}

/**
 * Security headers for API responses
 */
export const securityHeaders = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.openweathermap.org https://power.larc.nasa.gov; frame-ancestors 'none'; base-uri 'self';",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
};

/**
 * Adds security headers to a NextResponse
 */
export function applySecurityHeaders(response: Response): Response {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Validates and sanitizes all string fields in a request body
 */
export function sanitizeRequestBody(body: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeRequestBody(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
