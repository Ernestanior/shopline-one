# Fix Upload API URL Issue

## Problem
The admin product image upload was using a hardcoded `localhost:5002` URL, which caused failures in production.

## Root Cause
In `client/src/pages/Admin.tsx`, the image upload function was using:
```javascript
fetch('http://localhost:5002/api/upload/product-image', ...)
```

This hardcoded URL only works in development and fails in production.

## Solution
Updated the upload function to use the environment-based API URL:

```javascript
const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8787';
const uploadUrl = `${apiUrl}/api/upload/product-image`;
```

## Environment Configuration

### Development (.env.development)
- Uses default: `http://localhost:8787`

### Production (.env.production)
- Uses: `https://ecommerce-api.xyvn.workers.dev`

## Testing

### Development
```bash
cd client
npm start
# Upload should work at http://localhost:3000/admin
```

### Production
After deployment, the upload will automatically use:
`https://ecommerce-api.xyvn.workers.dev/api/upload/product-image`

## Files Changed
- `client/src/pages/Admin.tsx` - Fixed hardcoded URL to use environment variable

## Deployment Steps
1. Commit and push changes
2. Rebuild frontend: `npm run build`
3. Deploy to production
4. Test admin product creation with image upload

## Verification
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try uploading an image in admin panel
4. Check the request URL - should be production API URL, not localhost
