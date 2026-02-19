#!/bin/bash

# Apply payment tables migration to D1 database
# Usage: ./apply-payment-migration.sh [database-name]

DATABASE_NAME=${1:-"ecommerce-db"}

echo "Applying payment tables migration to database: $DATABASE_NAME"
echo "================================================"

# Apply the migration
npx wrangler d1 execute $DATABASE_NAME --file=./migrations/001_add_payment_tables.sql

if [ $? -eq 0 ]; then
  echo "✓ Migration applied successfully!"
else
  echo "✗ Migration failed!"
  exit 1
fi
