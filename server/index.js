const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5002;

const JWT_SECRET = process.env.JWT_SECRET || 'change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development, enable in production
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // limit each IP to 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later.'
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

const db = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'shop_dev',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'shop',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function ensureUsersTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      email VARCHAR(190) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_users_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

function issueToken(user) {
  return jwt.sign(
    { sub: String(user.id), email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

const AUTH_COOKIE_NAME = 'shop_auth';

function getAllowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS || '';
  const origins = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  
  // Log for debugging
  console.log('Allowed origins:', origins);
  
  return origins;
}

function shouldAllowOrigin(origin) {
  if (!origin) return true;
  const allowed = getAllowedOrigins();
  
  // In development, allow localhost on any port
  if (process.env.NODE_ENV !== 'production') {
    if (origin && origin.match(/^https?:\/\/localhost(:\d+)?$/)) {
      console.log(`Allowing localhost origin: ${origin}`);
      return true;
    }
  }
  
  if (allowed.length === 0) return true;
  const isAllowed = allowed.includes(origin);
  console.log(`Origin ${origin} allowed:`, isAllowed);
  return isAllowed;
}

function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

function clearAuthCookie(res) {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/'
  });
}

// Middleware
app.use(
  cors({
    origin: (origin, cb) => {
      if (shouldAllowOrigin(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());

// Basic CSRF protection: allow only same-origin / allowed origins for mutating requests.
app.use((req, res, next) => {
  const method = String(req.method || '').toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next();
  const origin = req.headers.origin;
  if (shouldAllowOrigin(origin)) return next();
  return res.status(403).json({ error: 'forbidden' });
});

const buildPath = path.join(__dirname, '../client/build');
const buildIndexPath = path.join(buildPath, 'index.html');
const hasBuild = fs.existsSync(buildIndexPath);

if (hasBuild) {
  app.use(express.static(buildPath));
}

app.use(express.static(path.join(__dirname, '../client/public')));

// Auth middleware - attach user to request
app.use(async (req, res, next) => {
  req.db = db;
  req.user = null;
  
  const token = req.cookies ? req.cookies[AUTH_COOKIE_NAME] : null;
  if (!token) return next();
  
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: parseInt(payload.sub), email: payload.email };
  } catch {
    // Invalid token, ignore
  }
  
  next();
});

// Image Upload API
const multer = require('multer');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../client/public/images/products/uploads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

app.post('/api/upload/product-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Return the relative path that will be stored in database
    const imagePath = `/images/products/uploads/${req.file.filename}`;
    res.json({ 
      success: true, 
      path: imagePath,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Admin API Routes
const { router: adminRouter } = require('./admin-api');
app.use('/api/admin', adminRouter);

// Public API - Contact/Feedback
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await db.execute(
      'INSERT INTO feedback (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name, email, subject || '', message]
    );

    res.json({ success: true, message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Public API - Newsletter Subscribe
app.post('/api/newsletter/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if already subscribed
    const [existing] = await db.execute(
      'SELECT id FROM newsletter_subscribers WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.json({ success: true, message: 'Already subscribed' });
    }

    await db.execute(
      'INSERT INTO newsletter_subscribers (email) VALUES (?)',
      [email]
    );

    res.json({ success: true, message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// Import validators and error handlers
const { 
  registerValidation, 
  loginValidation, 
  contactValidation, 
  newsletterValidation 
} = require('./validators');
const { errorHandler, notFoundHandler, asyncHandler } = require('./errorHandler');

// API Routes
app.post('/api/auth/register', registerValidation, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const normalizedEmail = email.trim().toLowerCase();
  const [existing] = await db.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
  
  if (Array.isArray(existing) && existing.length > 0) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 12); // Increased from 10 to 12 rounds
  const [result] = await db.execute(
    'INSERT INTO users (email, password_hash) VALUES (?, ?)',
    [normalizedEmail, passwordHash]
  );

  const userId = result && typeof result.insertId !== 'undefined' ? result.insertId : null;
  const token = issueToken({ id: userId, email: normalizedEmail, is_admin: 0 });
  setAuthCookie(res, token);

  return res.status(201).json({ user: { id: userId, email: normalizedEmail, is_admin: 0 } });
}));

app.post('/api/auth/login', loginValidation, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const normalizedEmail = email.trim().toLowerCase();
  const [rows] = await db.execute(
    'SELECT id, email, password_hash, is_admin FROM users WHERE email = ? LIMIT 1',
    [normalizedEmail]
  );
  
  const user = Array.isArray(rows) ? rows[0] : null;
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = issueToken({ id: user.id, email: user.email, is_admin: user.is_admin });
  setAuthCookie(res, token);
  return res.json({ user: { id: user.id, email: user.email, is_admin: user.is_admin } });
}));

app.post('/api/auth/logout', async (req, res) => {
  clearAuthCookie(res);
  return res.json({ ok: true });
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.cookies ? req.cookies[AUTH_COOKIE_NAME] : null;
    if (!token) return res.status(401).json({ error: 'unauthorized' });

    const payload = jwt.verify(token, JWT_SECRET);
    const userId = payload && payload.sub ? Number(payload.sub) : null;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });

    const [rows] = await db.execute('SELECT id, email, is_admin FROM users WHERE id = ? LIMIT 1', [userId]);
    const user = Array.isArray(rows) ? rows[0] : null;
    if (!user) return res.status(401).json({ error: 'unauthorized' });
    return res.json({ user: { id: user.id, email: user.email, is_admin: user.is_admin } });
  } catch (err) {
    return res.status(401).json({ error: 'unauthorized' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const { category } = req.query;
    
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY featured DESC, created_at DESC';
    
    const [products] = await db.execute(query, params);
    
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [products] = await db.execute('SELECT * FROM products WHERE id = ? LIMIT 1', [id]);
    
    if (!products || products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(products[0]);
  } catch (error) {
    console.error('Get product detail error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

app.get('/api/categories', (req, res) => {
  const categories = [
    { id: 'mobility', name: 'Mobility', description: 'Minimalist wallets and carry solutions' },
    { id: 'productivity', name: 'Productivity', description: 'Useful tools for daily tasks' },
    { id: 'sanctuary', name: 'Sanctuary', description: 'Home and lifestyle products' },
    { id: 'savoriness', name: 'Savoriness', description: 'Food and dining accessories' }
  ];
  res.json(categories);
});

// Create order
app.post('/api/orders', async (req, res) => {
  try {
    const { items, contact, address, totals } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order items are required' });
    }
    
    if (!contact || !contact.email) {
      return res.status(400).json({ error: 'Contact email is required' });
    }
    
    if (!address || !address.firstName || !address.lastName || !address.address1) {
      return res.status(400).json({ error: 'Shipping address is required' });
    }
    
    // Generate order number
    const orderNumber = `XYVN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Get user ID if logged in, otherwise use NULL for guest checkout
    const userId = req.user ? req.user.id : null;
    
    // Calculate total
    const totalAmount = totals?.total || items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Create order
    const [orderResult] = await db.execute(
      `INSERT INTO orders (
        user_id, order_number, total_amount, status, payment_status,
        shipping_name, shipping_email, shipping_phone, shipping_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        orderNumber,
        totalAmount,
        'pending',
        'unpaid',
        `${address.firstName} ${address.lastName}`,
        contact.email,
        contact.phone || '',
        JSON.stringify(address)
      ]
    );
    
    const orderId = orderResult.insertId;
    
    // Create order items
    for (const item of items) {
      await db.execute(
        `INSERT INTO order_items (
          order_id, product_id, product_name, product_image, quantity, price, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.id,
          item.name,
          item.image || '',
          item.quantity,
          item.price,
          item.price * item.quantity
        ]
      );
    }
    
    res.status(201).json({
      success: true,
      order: {
        id: orderId,
        orderNumber,
        totalAmount,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlMessage: error.sqlMessage
    });
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// User Profile APIs
app.get('/api/user/profile', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [profiles] = await db.execute(
      'SELECT * FROM user_profiles WHERE user_id = ?',
      [req.user.id]
    );

    res.json({ profile: profiles[0] || null });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.put('/api/user/profile', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { first_name, last_name, phone } = req.body;

    const [existing] = await db.execute(
      'SELECT id FROM user_profiles WHERE user_id = ?',
      [req.user.id]
    );

    if (existing.length > 0) {
      await db.execute(
        'UPDATE user_profiles SET first_name = ?, last_name = ?, phone = ? WHERE user_id = ?',
        [first_name, last_name, phone, req.user.id]
      );
    } else {
      await db.execute(
        'INSERT INTO user_profiles (user_id, first_name, last_name, phone) VALUES (?, ?, ?, ?)',
        [req.user.id, first_name, last_name, phone]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// User Addresses APIs
app.get('/api/user/addresses', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [addresses] = await db.execute(
      'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    );

    res.json({ addresses });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
});

app.post('/api/user/addresses', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { label, first_name, last_name, phone, country, city, address1, address2, postal_code, is_default } = req.body;

    if (is_default) {
      await db.execute('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    }

    const [result] = await db.execute(
      `INSERT INTO user_addresses (user_id, label, first_name, last_name, phone, country, city, address1, address2, postal_code, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, label || 'default', first_name, last_name, phone, country, city, address1, address2, postal_code, is_default ? 1 : 0]
    );

    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ error: 'Failed to add address' });
  }
});

app.put('/api/user/addresses/:id', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { label, first_name, last_name, phone, country, city, address1, address2, postal_code, is_default } = req.body;

    if (is_default) {
      await db.execute('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    }

    await db.execute(
      `UPDATE user_addresses 
       SET label = ?, first_name = ?, last_name = ?, phone = ?, country = ?, city = ?, address1 = ?, address2 = ?, postal_code = ?, is_default = ?
       WHERE id = ? AND user_id = ?`,
      [label, first_name, last_name, phone, country, city, address1, address2, postal_code, is_default ? 1 : 0, id, req.user.id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ error: 'Failed to update address' });
  }
});

app.delete('/api/user/addresses/:id', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    await db.execute('DELETE FROM user_addresses WHERE id = ? AND user_id = ?', [id, req.user.id]);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

// User Payment Methods APIs
app.get('/api/user/payment-methods', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [methods] = await db.execute(
      'SELECT * FROM user_payment_methods WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    );

    res.json({ payment_methods: methods });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

app.post('/api/user/payment-methods', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { card_type, card_last4, card_holder_name, expiry_month, expiry_year, is_default } = req.body;

    if (is_default) {
      await db.execute('UPDATE user_payment_methods SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    }

    const [result] = await db.execute(
      `INSERT INTO user_payment_methods (user_id, card_type, card_last4, card_holder_name, expiry_month, expiry_year, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, card_type, card_last4, card_holder_name, expiry_month, expiry_year, is_default ? 1 : 0]
    );

    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Add payment method error:', error);
    res.status(500).json({ error: 'Failed to add payment method' });
  }
});

app.delete('/api/user/payment-methods/:id', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    await db.execute('DELETE FROM user_payment_methods WHERE id = ? AND user_id = ?', [id, req.user.id]);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({ error: 'Failed to delete payment method' });
  }
});

// User Orders API
app.get('/api/user/orders', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [orders] = await db.execute(
      `SELECT o.*, COUNT(oi.id) as items_count
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    res.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.get('/api/user/orders/:id', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const [orders] = await db.execute(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const [items] = await db.execute(
      'SELECT * FROM order_items WHERE order_id = ?',
      [id]
    );

    const order = { ...orders[0], items };
    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order payment status
app.patch('/api/user/orders/:id/payment', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Check if order belongs to user
    const [orders] = await db.execute(
      'SELECT id, payment_status FROM orders WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update payment status to paid
    await db.execute(
      'UPDATE orders SET payment_status = ? WHERE id = ?',
      ['paid', id]
    );

    res.json({ success: true, message: 'Payment status updated successfully' });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

// Delete user order
app.delete('/api/user/orders/:id', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Check if order belongs to user
    const [orders] = await db.execute(
      'SELECT id FROM orders WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Delete order items first (foreign key constraint)
    await db.execute('DELETE FROM order_items WHERE order_id = ?', [id]);
    
    // Delete order
    await db.execute('DELETE FROM orders WHERE id = ?', [id]);

    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// Cart API - Get cart items
app.get('/api/cart', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const [cartItems] = await db.execute(
      `SELECT ci.id, ci.product_id, ci.quantity, 
              p.name, p.price, p.image, p.status
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = ?`,
      [req.user.id]
    );
    
    res.json(cartItems);
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// Cart API - Add item to cart
app.post('/api/cart/items', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { product_id, quantity = 1 } = req.body;
    
    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    
    // Check if product exists
    const [products] = await db.execute('SELECT id FROM products WHERE id = ?', [product_id]);
    if (!products || products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Check if item already in cart
    const [existing] = await db.execute(
      'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
      [req.user.id, product_id]
    );
    
    if (existing && existing.length > 0) {
      // Update quantity
      await db.execute(
        'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?',
        [quantity, existing[0].id]
      );
    } else {
      // Insert new item
      await db.execute(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [req.user.id, product_id, quantity]
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

// Cart API - Update cart item quantity
app.put('/api/cart/items/:id', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }
    
    await db.execute(
      'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?',
      [quantity, id, req.user.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// Cart API - Remove item from cart
app.delete('/api/cart/items/:id', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    
    await db.execute(
      'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove from cart' });
  }
});

// Cart API - Clear cart
app.delete('/api/cart', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    await db.execute('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

// Solar API Routes - SolisCloud Integration
const solisAPI = require('./soliscloud-api');

// Get station list
app.get('/api/solar/stations', async (req, res) => {
  try {
    const data = await solisAPI.getStationList();
    res.json(data);
  } catch (error) {
    console.error('Error fetching station list:', error);
    res.status(500).json({ error: 'Failed to fetch station list', message: error.message });
  }
});

// Get station detail
app.get('/api/solar/stations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await solisAPI.getStationDetail(id);
    res.json(data);
  } catch (error) {
    console.error('Error fetching station detail:', error);
    res.status(500).json({ error: 'Failed to fetch station detail', message: error.message });
  }
});

// Get inverter list for a station
app.get('/api/solar/stations/:id/inverters', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await solisAPI.getInverterList(id);
    res.json(data);
  } catch (error) {
    console.error('Error fetching inverter list:', error);
    res.status(500).json({ error: 'Failed to fetch inverter list', message: error.message });
  }
});

// Get inverter detail
app.get('/api/solar/inverters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await solisAPI.getInverterDetail(id);
    res.json(data);
  } catch (error) {
    console.error('Error fetching inverter detail:', error);
    res.status(500).json({ error: 'Failed to fetch inverter detail', message: error.message });
  }
});

// Get station daily data
app.get('/api/solar/stations/:id/day/:date', async (req, res) => {
  try {
    const { id, date } = req.params;
    const data = await solisAPI.getStationDay(id, date);
    res.json(data);
  } catch (error) {
    console.error('Error fetching daily data:', error);
    res.status(500).json({ error: 'Failed to fetch daily data', message: error.message });
  }
});

// Get station monthly data
app.get('/api/solar/stations/:id/month/:month', async (req, res) => {
  try {
    const { id, month } = req.params;
    const data = await solisAPI.getStationMonth(id, month);
    res.json(data);
  } catch (error) {
    console.error('Error fetching monthly data:', error);
    res.status(500).json({ error: 'Failed to fetch monthly data', message: error.message });
  }
});

// Get station yearly data
app.get('/api/solar/stations/:id/year/:year', async (req, res) => {
  try {
    const { id, year } = req.params;
    const data = await solisAPI.getStationYear(id, year);
    res.json(data);
  } catch (error) {
    console.error('Error fetching yearly data:', error);
    res.status(500).json({ error: 'Failed to fetch yearly data', message: error.message });
  }
});

// The "catchall" handler: for any request that doesn't match one above, send back React's index.html file.
app.get('*', (req, res) => {
  if (!hasBuild) {
    return res.status(404).json({ error: 'Not found' });
  }

  res.sendFile(buildIndexPath);
});

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

ensureUsersTable()
  .then(() => {
    console.log('MySQL users table ensured');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to ensure users table', err);
    process.exitCode = 1;
  });
