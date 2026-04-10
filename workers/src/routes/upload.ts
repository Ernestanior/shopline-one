/**
 * Upload Routes
 * Handle file uploads for product images
 */

import { Hono } from 'hono';
import { requireAdmin } from '../middleware/auth';
import type { Env } from '../types/env';

const upload = new Hono<{ Bindings: Env }>();

// All upload routes require admin authentication
upload.use('*', requireAdmin);

/**
 * Upload product image
 * Accepts multipart/form-data with 'image' field
 * Returns a data URL that can be stored in the database
 */
upload.post('/product-image', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('image');

    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No image file provided' }, 400);
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ 
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' 
      }, 400);
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return c.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, 400);
    }

    // Convert file to base64 data URL
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );
    
    const dataUrl = `data:${file.type};base64,${base64}`;

    return c.json({
      success: true,
      path: dataUrl,
      filename: file.name,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    console.error('Upload error:', error);
    return c.json({ 
      error: 'Failed to upload image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export { upload as uploadRoutes };
