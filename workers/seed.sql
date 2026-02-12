-- Seed Data for E-commerce D1 Database

-- Insert sample products
INSERT INTO products (name, category, price, description, image, stock, featured, status) VALUES
-- Productivity
('Minimalist Notebook', 'productivity', 29.99, 'Premium paper notebook for daily planning', '/images/products/productivity/productivity-1.jpg', 50, 1, 'available'),
('Desk Organizer', 'productivity', 39.99, 'Keep your workspace tidy', '/images/products/productivity/productivity-2.jpg', 30, 1, 'available'),
('Pen Set', 'productivity', 24.99, 'Smooth writing experience', '/images/products/productivity/productivity-3.jpg', 100, 0, 'available'),
('Sticky Notes Pack', 'productivity', 12.99, 'Colorful sticky notes for reminders', '/images/products/productivity/productivity-4.jpg', 150, 0, 'available'),
('Desk Lamp', 'productivity', 49.99, 'LED desk lamp with adjustable brightness', '/images/products/productivity/productivity-5.jpg', 40, 1, 'available'),

-- Mobility
('Slim Wallet', 'mobility', 49.99, 'Minimalist leather wallet', '/images/products/mobility/mobility-1.jpg', 40, 1, 'available'),
('Card Holder', 'mobility', 34.99, 'Compact card organizer', '/images/products/mobility/mobility-2.jpg', 60, 1, 'available'),
('Key Organizer', 'mobility', 19.99, 'Smart key management', '/images/products/mobility/mobility-3.jpg', 80, 0, 'available'),
('Travel Pouch', 'mobility', 29.99, 'Compact travel organizer', '/images/products/mobility/mobility-4.jpg', 45, 0, 'available'),
('Phone Stand', 'mobility', 24.99, 'Adjustable phone holder', '/images/products/mobility/mobility-5.jpg', 70, 0, 'available'),

-- Sanctuary
('Ceramic Vase', 'sanctuary', 44.99, 'Elegant home decoration', '/images/products/sanctuary/sanctuary-1.jpg', 25, 1, 'available'),
('Candle Set', 'sanctuary', 29.99, 'Aromatherapy candles', '/images/products/sanctuary/sanctuary-2.jpg', 45, 0, 'available'),
('Plant Pot', 'sanctuary', 19.99, 'Modern ceramic pot', '/images/products/sanctuary/sanctuary-3.jpg', 70, 0, 'available'),
('Wall Art', 'sanctuary', 59.99, 'Minimalist wall decoration', '/images/products/sanctuary/sanctuary-4.jpg', 30, 1, 'available'),
('Throw Pillow', 'sanctuary', 34.99, 'Comfortable decorative pillow', '/images/products/sanctuary/sanctuary-5.jpg', 55, 0, 'available'),

-- Savoriness
('Coffee Mug', 'savoriness', 24.99, 'Premium ceramic mug', '/images/products/savoriness/savoriness-1.jpg', 90, 1, 'available'),
('Tea Set', 'savoriness', 59.99, 'Complete tea ceremony set', '/images/products/savoriness/savoriness-2.jpg', 20, 0, 'available'),
('Coaster Set', 'savoriness', 14.99, 'Wooden coasters', '/images/products/savoriness/savoriness-3.jpg', 100, 0, 'available'),
('French Press', 'savoriness', 39.99, 'Premium coffee maker', '/images/products/savoriness/savoriness-4.jpg', 35, 1, 'available'),
('Wine Glasses', 'savoriness', 49.99, 'Set of 4 elegant wine glasses', '/images/products/savoriness/savoriness-5.jpg', 40, 0, 'available');

-- Note: Admin user will be created via API on first registration with admin email
-- Password hashing must be done via Web Crypto API in the application
