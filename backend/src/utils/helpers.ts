import { v4 as uuidv4 } from 'uuid';

// Generate unique order number
export function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000);
  return `SNAP-${dateStr}-${random.toString().padStart(4, '0')}`;
}

// Generate transaction ID
export function generateTransactionId(): string {
  return `TXN-${uuidv4().substring(0, 8).toUpperCase()}`;
}

// Hash password (using bcryptjs)
export async function hashPassword(password: string): Promise<string> {
  const bcryptModule = await import('bcryptjs');
  const bcrypt = bcryptModule.default ?? bcryptModule;
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Compare password
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  const bcryptModule = await import('bcryptjs');
  const bcrypt = bcryptModule.default ?? bcryptModule;
  return bcrypt.compare(password, hash);
}


// Format currency
export function formatCurrency(amount: number, currency: string = 'PKR'): string {
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Calculate tax
export function calculateTax(amount: number, taxPercentage: number): number {
  return (amount * taxPercentage) / 100;
}

// Calculate total with shipping and tax
export function calculateTotal(
  subtotal: number,
  shippingCharge: number,
  taxPercentage: number
): number {
  const tax = calculateTax(subtotal + shippingCharge, taxPercentage);
  return subtotal + shippingCharge + tax;
}

// Date helpers
export function getDateAfterDays(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

// Validate email
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone number (Pakistani format)
export function validatePakistaniPhone(phone: string): boolean {
  const phoneRegex = /^(\+92|0)[3][0-9]{9}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

// Slugify text
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Parse query parameters
export function parseQueryString(queryString: string): Record<string, string | string[]> {
  const params = new URLSearchParams(queryString);
  const result: Record<string, string | string[]> = {};

  for (const [key, value] of params) {
    if (result[key]) {
      if (Array.isArray(result[key])) {
        (result[key] as string[]).push(value);
      } else {
        result[key] = [result[key] as string, value];
      }
    } else {
      result[key] = value;
    }
  }

  return result;
}

// Sleep function (for testing)
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default {
  generateOrderNumber,
  generateTransactionId,
  hashPassword,
  comparePassword,
  formatCurrency,
  calculateTax,
  calculateTotal,
  getDateAfterDays,
  validateEmail,
  validatePakistaniPhone,
  slugify,
  parseQueryString,
  sleep,
};