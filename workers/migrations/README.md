# Database Migrations

This directory contains database migration scripts for the payment gateway integration.

## Available Migrations

### 001_add_payment_tables.sql
Adds the following tables for Taiwan payment gateway integration:
- `payment_transactions` - Stores payment transaction records
- `payment_callbacks` - Logs payment gateway callbacks
- `payment_refunds` - Tracks refund operations
- `payment_security_logs` - Records security events

### 001_rollback_payment_tables.sql
Rollback script to remove payment gateway tables.

## Applying Migrations

### Local Development
```bash
# Apply migration to local database
npx wrangler d1 execute ecommerce-db --local --file=./migrations/001_add_payment_tables.sql
```

### Production
```bash
# Apply migration to production database
npx wrangler d1 execute ecommerce-db --file=./migrations/001_add_payment_tables.sql
```

### Using the Helper Script
```bash
# Make the script executable
chmod +x apply-payment-migration.sh

# Apply migration
./apply-payment-migration.sh ecommerce-db
```

## Rollback

To rollback the payment tables migration:

```bash
# Local
npx wrangler d1 execute ecommerce-db --local --file=./migrations/001_rollback_payment_tables.sql

# Production
npx wrangler d1 execute ecommerce-db --file=./migrations/001_rollback_payment_tables.sql
```

## Migration Best Practices

1. Always test migrations in local environment first
2. Backup production database before applying migrations
3. Review migration SQL carefully before execution
4. Keep rollback scripts up to date
5. Document any manual steps required after migration
