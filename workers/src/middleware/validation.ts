/**
 * Validation Middleware
 * Provides request validation using Zod schemas
 */

import { Context, Next } from 'hono';
import { z, ZodSchema } from 'zod';
import { ValidationError } from './error';

/**
 * Validate request body against a Zod schema
 */
export function validate(schema: ZodSchema) {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      const validated = schema.parse(body);
      c.set('validatedData', validated);
      return next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Validation failed', error.errors);
      }
      throw error;
    }
  };
}

/**
 * Common validation schemas
 */
export const schemas = {
  // Auth schemas
  register: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters')
  }),

  login: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
  }),

  // Product schemas
  createProduct: z.object({
    name: z.string().min(1, 'Name is required'),
    category: z.string().min(1, 'Category is required'),
    price: z.union([z.number(), z.string()]).transform(val => {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      if (isNaN(num) || num <= 0) throw new Error('Invalid price');
      return num;
    }),
    description: z.string().optional().nullable(),
    image: z.string().optional().nullable(),
    stock: z.union([z.number(), z.string()]).transform(val => {
      const num = typeof val === 'string' ? parseInt(val, 10) : val;
      if (isNaN(num) || num < 0) throw new Error('Invalid stock');
      return num;
    }).default(0),
    featured: z.union([z.number(), z.string(), z.boolean()]).transform(val => {
      if (typeof val === 'boolean') return val ? 1 : 0;
      if (typeof val === 'number') return val;
      if (typeof val === 'string') return val === 'true' || val === '1' ? 1 : 0;
      return 0;
    }).default(0)
  }),

  updateProduct: z.object({
    name: z.string().min(1).optional(),
    category: z.string().min(1).optional(),
    price: z.union([z.number(), z.string()]).transform(val => {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      if (isNaN(num) || num <= 0) throw new Error('Invalid price');
      return num;
    }).optional(),
    description: z.string().optional().nullable(),
    image: z.string().optional().nullable(),
    stock: z.union([z.number(), z.string()]).transform(val => {
      const num = typeof val === 'string' ? parseInt(val, 10) : val;
      if (isNaN(num) || num < 0) throw new Error('Invalid stock');
      return num;
    }).optional(),
    featured: z.union([z.number(), z.string(), z.boolean()]).transform(val => {
      if (typeof val === 'boolean') return val ? 1 : 0;
      if (typeof val === 'number') return val;
      if (typeof val === 'string') return val === 'true' || val === '1' ? 1 : 0;
      return 0;
    }).optional(),
    status: z.string().optional()
  }),

  // Cart schemas
  addToCart: z.object({
    product_id: z.union([z.number(), z.string()]).transform(val => {
      const num = typeof val === 'string' ? parseInt(val, 10) : val;
      if (isNaN(num) || num <= 0) throw new Error('Invalid product ID');
      return num;
    }),
    quantity: z.union([z.number(), z.string()]).transform(val => {
      const num = typeof val === 'string' ? parseInt(val, 10) : val;
      if (isNaN(num) || num <= 0) throw new Error('Invalid quantity');
      return num;
    }).default(1)
  }),

  updateCartItem: z.object({
    quantity: z.union([z.number(), z.string()]).transform(val => {
      const num = typeof val === 'string' ? parseInt(val, 10) : val;
      if (isNaN(num) || num <= 0) throw new Error('Invalid quantity');
      return num;
    })
  }),

  // Order schemas
  createOrder: z.object({
    items: z.array(z.object({
      id: z.union([z.number(), z.string()]).transform(val => {
        const num = typeof val === 'string' ? parseInt(val, 10) : val;
        if (isNaN(num) || num <= 0) throw new Error('Invalid item ID');
        return num;
      }),
      name: z.string(),
      price: z.union([z.number(), z.string()]).transform(val => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        if (isNaN(num) || num <= 0) throw new Error('Invalid price');
        return num;
      }),
      quantity: z.union([z.number(), z.string()]).transform(val => {
        const num = typeof val === 'string' ? parseInt(val, 10) : val;
        if (isNaN(num) || num <= 0) throw new Error('Invalid quantity');
        return num;
      }),
      image: z.string().optional().nullable()
    })).min(1, 'Order must have at least one item'),
    contact: z.object({
      email: z.string().email('Invalid email'),
      phone: z.string().optional().nullable()
    }),
    address: z.object({
      firstName: z.string().min(1, 'First name is required'),
      lastName: z.string().min(1, 'Last name is required'),
      address1: z.string().min(1, 'Address is required'),
      address2: z.string().optional().nullable(),
      city: z.string().min(1, 'City is required'),
      country: z.string().min(1, 'Country is required'),
      postalCode: z.string().min(1, 'Postal code is required')
    }),
    totals: z.object({
      subtotal: z.union([z.number(), z.string()]).transform(val => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return isNaN(num) ? 0 : num;
      }),
      estimatedTax: z.union([z.number(), z.string()]).transform(val => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return isNaN(num) ? 0 : num;
      }).optional(),
      shipping: z.union([z.number(), z.string()]).transform(val => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return isNaN(num) ? 0 : num;
      }),
      total: z.union([z.number(), z.string()]).transform(val => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        if (isNaN(num) || num <= 0) throw new Error('Invalid total');
        return num;
      })
    }).optional()
  }),

  // User profile schemas
  updateProfile: z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    phone: z.string().optional()
  }),

  // Address schemas
  createAddress: z.object({
    label: z.string().default('Home'),
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    phone: z.string().optional().nullable(),
    country: z.string().min(1, 'Country is required'),
    city: z.string().min(1, 'City is required'),
    address1: z.string().min(1, 'Address is required'),
    address2: z.string().optional().nullable(),
    postal_code: z.string().min(1, 'Postal code is required'),
    is_default: z.union([z.boolean(), z.number(), z.string()]).transform(val => {
      if (typeof val === 'boolean') return val;
      if (typeof val === 'number') return val === 1;
      if (typeof val === 'string') return val === 'true' || val === '1';
      return false;
    }).default(false)
  }),

  // Payment method schemas
  createPaymentMethod: z.object({
    card_type: z.string().min(1, 'Card type is required'),
    card_last4: z.string().length(4, 'Card last 4 digits must be exactly 4 characters'),
    card_holder_name: z.string().min(1, 'Card holder name is required'),
    expiry_month: z.union([z.number(), z.string()]).transform(val => {
      const num = typeof val === 'string' ? parseInt(val, 10) : val;
      if (isNaN(num) || num < 1 || num > 12) throw new Error('Invalid month');
      return num;
    }),
    expiry_year: z.union([z.number(), z.string()]).transform(val => {
      const num = typeof val === 'string' ? parseInt(val, 10) : val;
      const currentYear = new Date().getFullYear();
      if (isNaN(num) || num < currentYear) throw new Error('Invalid year');
      return num;
    }),
    is_default: z.union([z.boolean(), z.number(), z.string()]).transform(val => {
      if (typeof val === 'boolean') return val;
      if (typeof val === 'number') return val === 1;
      if (typeof val === 'string') return val === 'true' || val === '1';
      return false;
    }).default(false)
  }),

  // Feedback schemas
  submitFeedback: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    subject: z.string().optional(),
    message: z.string().min(1)
  }),

  // Newsletter schemas
  subscribe: z.object({
    email: z.string().email()
  })
};
