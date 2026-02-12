# E-commerce Workers API

Cloudflare Workers API for the e-commerce application.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create D1 Database

```bash
# Development database
wrangler d1 create ecommerce-db-dev

# Production database
wrangler d1 create ecommerce-db
```

Copy the database IDs and update `wrangler.toml`.

### 3. Create R2 Bucket

```bash
# Development bucket
wrangler r2 bucket create ecommerce-uploads-dev

# Production bucket
wrangler r2 bucket create ecommerce-uploads
```

### 4. Initialize Database Schema

```bash
# Development
wrangler d1 execute ecommerce-db-dev --file=./schema.sql

# Production
wrangler d1 execute ecommerce-db --file=./schema.sql
```

### 5. Set Secrets

```bash
# Development
wrangler secret put JWT_SECRET --env development

# Production
wrangler secret put JWT_SECRET --env production
```

### 6. Seed Database (Optional)

```bash
# Development
wrangler d1 execute ecommerce-db-dev --file=./seed.sql
```

## Development

```bash
npm run dev
```

## Deployment

```bash
# Deploy to development
npm run deploy:dev

# Deploy to production
npm run deploy
```

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Project Structure

```
workers/
├── src/
│   ├── index.ts              # Worker entry point
│   ├── routes/               # API routes
│   ├── middleware/           # Middleware functions
│   ├── services/             # Business logic services
│   └── types/                # TypeScript types
├── schema.sql                # Database schema
├── seed.sql                  # Seed data
├── wrangler.toml             # Wrangler configuration
└── package.json
```
