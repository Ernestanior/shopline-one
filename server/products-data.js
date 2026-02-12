// Product data with Unsplash images
const products = [
  // ========== PRODUCTIVITY (30+ items) ==========
  {
    id: 1,
    name: 'Memo X',
    category: 'productivity',
    price: 29.99,
    description: 'Complete cutting and applying tapes in one motion. Make creative sticky memos.',
    image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80',
    status: 'available',
    featured: true
  },
  {
    id: 2,
    name: 'Tool Card',
    category: 'productivity',
    price: 39.99,
    description: 'Equipped with 14+ functions. Stores iPhone ejector tool with push & click.',
    image: 'https://images.unsplash.com/photo-1565688534245-05d6b5be184a?w=800&q=80',
    status: 'coming-soon',
    featured: true
  },
  {
    id: 3,
    name: 'CoinSlide',
    category: 'productivity',
    price: 49.99,
    description: 'Palm-sized auto-sorting coin device. Makes collecting coins fast and fun.',
    image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80',
    status: 'coming-soon',
    featured: true
  },
  {
    id: 7,
    name: 'Memo X Tapes',
    category: 'productivity',
    price: 12.99,
    description: 'Refill tapes for Memo X. Various colors and sizes available.',
    image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&q=80',
    status: 'available',
    featured: false
  },
  {
    id: 14,
    name: 'Desk Planner Pad',
    category: 'productivity',
    price: 14.99,
    description: 'Clean daily planner pad with tear-off sheets and minimalist grid.',
    image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&q=80',
    status: 'available',
    featured: false
  },
  {
    id: 15,
    name: 'Notebook + Pen Set',
    category: 'productivity',
    price: 19.99,
    description: 'Compact notebook and smooth-writing pen for quick captures.',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80',
    status: 'available',
    featured: true
  },
  {
    id: 16,
    name: 'Minimal Clip Kit',
    category: 'productivity',
    price: 9.99,
    description: 'Small set of clips for organizing papers and desk essentials.',
    image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80',
    status: 'available',
    featured: false
  },
  {
    id: 17,
    name: 'Cable Tidy Straps',
    category: 'productivity',
    price: 11.99,
    description: 'Reusable straps to keep cables neat. No sticky residue.',
    image: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=800&q=80',
    status: 'available',
    featured: false
  },
  {
    id: 18,
    name: 'Focus Timer',
    category: 'productivity',
    price: 24.99,
    description: 'Simple desk timer for deep work sessions. No apps required.',
    image: 'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=800&q=80',
    status: 'coming-soon',
    featured: false
  },
  {
    id: 19,
    name: 'Swiss Pocket Tool',
    category: 'productivity',
    price: 29.99,
    description: 'Compact multitool for quick fixes. Built for daily carry.',
    image: 'https://images.unsplash.com/photo-1565688534245-05d6b5be184a?w=800&q=80',
    status: 'available',
    featured: false
  },
  {
    id: 20,
    name: 'Workspace Starter Set',
    category: 'productivity',
    price: 34.99,
    description: 'Curated desk essentials for a clean, functional workspace.',
    image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80',
    status: 'available',
    featured: true
  },
  {
    id: 21,
    name: 'Meeting Notes Journal',
    category: 'productivity',
    price: 17.99,
    description: 'Structured journal for meetings and project updates.',
    image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&q=80',
    status: 'available',
    featured: false
  },
  {
    id: 101,
    name: 'Desk Organizer Tray',
    category: 'productivity',
    price: 22.99,
    description: 'Bamboo organizer with multiple compartments.',
    image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80',
    status: 'available',
    featured: false
  },
  {
    id: 102,
    name: 'Wireless Charging Pad',
    category: 'productivity',
    price: 35.99,
    description: 'Fast wireless charger with non-slip surface.',
    image: 'https://images.unsplash.com/photo-1591290619762-c588f7e8e86f?w=800&q=80',
    status: 'available',
    featured: false
  },
  {
    id: 103,
    name: 'Ergonomic Mouse Pad',
    category: 'productivity',
    price: 18.99,
    description: 'Memory foam wrist support for all-day comfort.',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80',
    status: 'available',
    featured: false
  },
  {
    id: 104,
    name: 'LED Desk Lamp',
    category: 'productivity',
    price: 45.99,
    description: 'Adjustable brightness and color temperature.',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80',
    status: 'available',
    featured: true
  },
  {
    id: 105,
    name: 'Sticky Note Set',
    category: 'productivity',
    price: 8.99,
    description: 'Colorful sticky notes in various sizes.',
    image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&q=80',
    status: 'available',
    featured: false
  },
  {
    id: 106,
    name: 'Document Holder Stand',
    category: 'productivity',
    price: 16.99,
    description: 'Adjustable stand for papers and tablets.',
    image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80',
    status: 'available',
    featured: false
  },
  {
    id: 107,
    name: 'Desk Calendar 2026',
    category: 'productivity',
    price: 13.99,
    description: 'Minimalist monthly desk calendar.',
    image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&q=80',
    status: 'available',
    featured: false
  },
  {
    id: 108,
    name: 'Pencil Cup Holder',
    category: 'productivity',
    price: 11.99,
    description: 'Ceramic holder for pens and pencils.',
    image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80',
    status: 'available',
    featured: false
  },
  {
    id: 109,
    name: 'Laptop Stand',
    category: 'productivity',
    price: 39.99,
    description: 'Aluminum stand with adjustable height.',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80',
    status: 'available',
    featured: true
  },
  {
    id: 110,
    name: 'Whiteboard Markers Set',
    category: 'productivity',
    price: 14.99,
    description: 'Vibrant colors with fine and chisel tips.',
    image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&q=80',
    status: 'available',
    featured: false
  },
];

module.exports = products;
