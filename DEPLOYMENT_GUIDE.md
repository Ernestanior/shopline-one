# Cloudflare Migration Deployment Guide

Complete guide to deploy the e-commerce application to Cloudflare Pages + Workers + D1.

## Prerequisites

1. Cloudflare account
2. Node.js 18+ installed
3. Wrangler CLI installed: `npm install -g wrangler`
4. Git repository (for Pages deployment)

## Step 1: Setup Cloudflare Resources

### 1.1 Login to Wrangler

```bash
wrangler login
```

### 1.2 Create D1 Database

```bash
# Development database
wrangler d1 create ecommerce-db-dev

# Production database
wrangler d1 create ecommerce-db
```

Copy the database IDs from the output and update `workers/wrangler.toml`:
- Replace `YOUR_DEV_DATABASE_ID_HERE` with dev database ID
- Replace `YOUR_PROD_DATABASE_ID_HERE` with production database ID

### 1.3 Create R2 Bucket

```bash
# Development bucket
wrangler r2 bucket create ecommerce-uploads-dev

# Production bucket
wrangler r2 bucket create ecommerce-uploads
```

### 1.4 Initialize Database Schema

```bash
cd workers

# Development
wrangler d1 execute ecommerce-db-dev --file=./schema.sql

# Production
wrangler d1 execute ecommerce-db --file=./schema.sql
```

### 1.5 Seed Database (Optional)

```bash
# Development only
wrangler d1 execute ecommerce-db-dev --file=./seed.sql
```

### 1.6 Set Secrets

```bash
# Generate a strong JWT secret
# You can use: openssl rand -base64 32

# Development
wrangler secret put JWT_SECRET --env development
# Enter your secret when prompted

# Production
wrangler secret put JWT_SECRET --env production
# Enter your secret when prompted
```

## Step 2: Deploy Workers API

### 2.1 Install Dependencies

```bash
cd workers
npm install
```

### 2.2 Test Locally

```bash
npm run dev
```

Visit http://localhost:8787 to test the API.

### 2.3 Deploy to Development

```bash
npm run deploy:dev
```

Note the deployed URL (e.g., `https://ecommerce-api-dev.your-subdomain.workers.dev`)

### 2.4 Deploy to Production

```bash
npm run deploy
```

Note the deployed URL (e.g., `https://ecommerce-api.your-subdomain.workers.dev`)

### 2.5 Configure Custom Domain (Optional)

In Cloudflare Dashboard:
1. Go to Workers & Pages
2. Select your worker
3. Go to Settings > Triggers
4. Add custom domain (e.g., `api.yourdomain.com`)

## Step 3: Configure R2 Public Access

### 3.1 Enable Public Access

```bash
# Development
wrangler r2 bucket domain add ecommerce-uploads-dev --domain r2-dev.yourdomain.com

# Production
wrangler r2 bucket domain add ecommerce-uploads --domain r2.yourdomain.com
```

Or use Cloudflare Dashboard:
1. Go to R2
2. Select your bucket
3. Settings > Public Access
4. Connect custom domain

## Step 4: Update Frontend Configuration

### 4.1 Update API Configuration

Edit `client/src/lib/api.ts`:

```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.yourdomain.com';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### 4.2 Create Environment Files

Create `client/.env.development`:
```
REACT_APP_API_URL=https://ecommerce-api-dev.your-subdomain.workers.dev
```

Create `client/.env.production`:
```
REACT_APP_API_URL=https://api.yourdomain.com
```

### 4.3 Build Frontend

```bash
cd client
npm install
npm run build
```

## Step 5: Deploy to Cloudflare Pages

### Option A: Using Wrangler

```bash
cd client
npx wrangler pages deploy build --project-name=ecommerce-frontend
```

### Option B: Using Git Integration (Recommended)

1. Push your code to GitHub/GitLab
2. Go to Cloudflare Dashboard > Pages
3. Click "Create a project"
4. Connect your Git repository
5. Configure build settings:
   - Build command: `cd client && npm run build`
   - Build output directory: `client/build`
   - Root directory: `/`
6. Add environment variables:
   - `REACT_APP_API_URL`: Your Workers API URL
7. Click "Save and Deploy"

### 5.1 Configure Custom Domain

In Cloudflare Dashboard:
1. Go to Pages > Your Project
2. Go to Custom domains
3. Add your domain (e.g., `yourdomain.com`)

### 5.2 Configure SPA Routing

Create `client/public/_redirects`:
```
/api/*  https://api.yourdomain.com/:splat  200
/*      /index.html  200
```

## Step 6: Update CORS Configuration

Update `workers/wrangler.toml` with your frontend domain:

```toml
[env.production.vars]
ALLOWED_ORIGINS = "https://yourdomain.com,https://www.yourdomain.com"
```

Redeploy Workers:
```bash
cd workers
npm run deploy
```

## Step 7: Testing

### 7.1 Test API Endpoints

```bash
# Health check
curl https://api.yourdomain.com/

# Get products
curl https://api.yourdomain.com/api/products

# Register user
curl -X POST https://api.yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 7.2 Test Frontend

1. Visit your frontend URL
2. Test user registration
3. Test product browsing
4. Test cart functionality
5. Test order creation

## Step 8: Monitoring and Logs

### 8.1 View Workers Logs

```bash
wrangler tail
```

### 8.2 View Analytics

Go to Cloudflare Dashboard:
- Workers & Pages > Your Worker > Analytics
- Pages > Your Project > Analytics

### 8.3 View D1 Database

```bash
# Query database
wrangler d1 execute ecommerce-db --command="SELECT COUNT(*) FROM users"

# Export data
wrangler d1 export ecommerce-db --output=backup.sql
```

## Troubleshooting

### Issue: CORS Errors

**Solution**: Ensure `ALLOWED_ORIGINS` in `wrangler.toml` includes your frontend domain.

### Issue: 401 Unauthorized

**Solution**: Check that JWT_SECRET is set correctly in both environments.

### Issue: Database Connection Failed

**Solution**: Verify database ID in `wrangler.toml` matches the created database.

### Issue: Images Not Loading

**Solution**: 
1. Check R2 bucket public access is enabled
2. Verify R2 domain is configured
3. Update image URLs in database to use R2 domain

### Issue: Build Fails

**Solution**:
1. Clear node_modules: `rm -rf node_modules && npm install`
2. Clear build cache: `rm -rf build`
3. Check Node.js version: `node --version` (should be 18+)

## Rollback Plan

### Rollback Workers

```bash
# List deployments
wrangler deployments list

# Rollback to previous version
wrangler rollback [deployment-id]
```

### Rollback Pages

In Cloudflare Dashboard:
1. Go to Pages > Your Project > Deployments
2. Find previous successful deployment
3. Click "..." > "Rollback to this deployment"

### Rollback Database

```bash
# Restore from backup
wrangler d1 execute ecommerce-db --file=backup.sql
```

## Performance Optimization

### 1. Enable Caching

Add cache headers in Workers:
```typescript
c.header('Cache-Control', 'public, max-age=3600');
```

### 2. Optimize Images

Use Cloudflare Images or compress images before uploading to R2.

### 3. Enable Compression

Cloudflare automatically compresses responses. Ensure it's enabled in your zone settings.

### 4. Use CDN

Cloudflare automatically uses CDN for Pages and Workers. No additional configuration needed.

## Security Checklist

- [ ] JWT_SECRET is strong and secret
- [ ] CORS is configured with specific origins (not *)
- [ ] HTTPS is enforced
- [ ] Rate limiting is enabled
- [ ] Input validation is working
- [ ] SQL injection protection is in place
- [ ] Sensitive data is not logged
- [ ] Environment variables are secure

## Cost Estimation

### Free Tier Limits

- **Workers**: 100,000 requests/day
- **Pages**: Unlimited requests, 500 builds/month
- **D1**: 5 million reads/day, 100,000 writes/day
- **R2**: 10 GB storage, 1 million Class A operations/month

### Paid Plans

If you exceed free tier:
- **Workers**: $5/month + $0.50 per million requests
- **D1**: $5/month + usage-based pricing
- **R2**: $0.015/GB/month storage

## Next Steps

1. Set up monitoring and alerts
2. Configure backup strategy
3. Set up CI/CD pipeline
4. Add custom error pages
5. Implement analytics
6. Add more features!

## Support

- Cloudflare Docs: https://developers.cloudflare.com/
- Hono Docs: https://hono.dev/
- Community: Cloudflare Discord

---

**Congratulations!** Your e-commerce application is now running on Cloudflare's edge network! 🎉
