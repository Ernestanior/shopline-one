const { body, param, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
  }
  next();
};

// User validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  validate
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate
];

// Product validation rules
const productValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Product name must be between 1 and 255 characters'),
  body('category')
    .isIn(['productivity', 'mobility', 'sanctuary', 'savoriness'])
    .withMessage('Invalid category'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be between 1 and 1000 characters'),
  body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('status')
    .isIn(['available', 'coming-soon'])
    .withMessage('Invalid status'),
  validate
];

// Order validation rules
const checkoutValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Cart must contain at least one item'),
  body('items.*.product_id')
    .isInt({ min: 1 })
    .withMessage('Invalid product ID'),
  body('items.*.quantity')
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100'),
  body('shipping.firstName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name is required'),
  body('shipping.lastName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name is required'),
  body('shipping.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('shipping.address1')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Address is required'),
  body('shipping.city')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('City is required'),
  body('shipping.postalCode')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Postal code is required'),
  body('shipping.country')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Country is required'),
  validate
];

// Contact/Feedback validation
const contactValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters'),
  validate
];

// Newsletter validation
const newsletterValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  validate
];

// ID parameter validation
const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid ID'),
  validate
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  productValidation,
  checkoutValidation,
  contactValidation,
  newsletterValidation,
  idValidation
};
