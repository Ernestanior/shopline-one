# Taiwan Payment Gateway Operations Guide

## Table of Contents

1. [Monitoring](#monitoring)
2. [Log Management](#log-management)
3. [Troubleshooting](#troubleshooting)
4. [Security](#security)
5. [Maintenance](#maintenance)
6. [Incident Response](#incident-response)

---

## Monitoring

### Key Metrics

#### Payment Success Rate
- **Metric**: Percentage of successful payments vs total attempts
- **Target**: > 95%
- **Alert**: < 90%
- **Query**: 
  ```sql
  SELECT 
    COUNT(CASE WHEN status = 'success' THEN 1 END) * 100.0 / COUNT(*) as success_rate
  FROM payment_transactions
  WHERE created_at > datetime('now', '-1 hour');
  ```

#### Average Payment Time
- **Metric**: Time from payment initiation to completion
- **Target**: < 2 minutes
- **Alert**: > 5 minutes
- **Query**:
  ```sql
  SELECT 
    AVG(julianday(paid_at) - julianday(created_at)) * 24 * 60 as avg_minutes
  FROM payment_transactions
  WHERE status = 'success' AND paid_at > datetime('now', '-1 hour');
  ```

#### Callback Failure Rate
- **Metric**: Percentage of failed callback verifications
- **Target**: < 1%
- **Alert**: > 5%
- **Query**:
  ```sql
  SELECT 
    COUNT(CASE WHEN status = 'failed' THEN 1 END) * 100.0 / COUNT(*) as failure_rate
  FROM payment_callbacks
  WHERE created_at > datetime('now', '-1 hour');
  ```

#### Gateway Response Time
- **Metric**: Time for gateway API calls to complete
- **Target**: < 3 seconds
- **Alert**: > 10 seconds
- **Monitoring**: Check application logs for gateway API timing

#### Refund Rate
- **Metric**: Percentage of payments that are refunded
- **Target**: < 5%
- **Alert**: > 10%
- **Query**:
  ```sql
  SELECT 
    COUNT(DISTINCT transaction_id) * 100.0 / 
    (SELECT COUNT(*) FROM payment_transactions WHERE status = 'success')
    as refund_rate
  FROM payment_refunds
  WHERE created_at > datetime('now', '-1 day');
  ```

### Monitoring Setup

#### Cloudflare Workers Analytics

1. **Access Analytics Dashboard**:
   - Login to Cloudflare Dashboard
   - Navigate to Workers & Pages
   - Select your worker
   - Click "Analytics" tab

2. **Key Metrics to Monitor**:
   - Request count
   - Error rate
   - CPU time
   - Duration

#### Custom Monitoring

Set up custom monitoring using Cloudflare Workers Analytics Engine:

```typescript
// In your worker code
async function logMetric(env: Env, metric: string, value: number) {
  await env.ANALYTICS.writeDataPoint({
    blobs: [metric],
    doubles: [value],
    indexes: [new Date().toISOString()]
  });
}

// Example usage
await logMetric(env, 'payment_success', 1);
await logMetric(env, 'payment_duration_ms', duration);
```

#### Alert Configuration

Configure alerts in Cloudflare Dashboard:

1. Navigate to Notifications
2. Create new notification
3. Select "Workers" as service
4. Configure thresholds:
   - Error rate > 5%
   - Request rate drops > 50%
   - CPU time > 50ms

---

## Log Management

### Log Levels

The system uses structured logging with the following levels:

- **DEBUG**: Detailed information for debugging
- **INFO**: General informational messages
- **WARN**: Warning messages for potential issues
- **ERROR**: Error messages for failures

### Log Format

All logs follow this structure:

```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "level": "INFO",
  "message": "Payment created",
  "context": {
    "orderId": "ORD-12345",
    "gateway": "newebpay",
    "amount": 10000,
    "transactionId": "TXN-67890"
  }
}
```

### Accessing Logs

#### Real-time Logs

```bash
# Tail logs in development
wrangler tail

# Tail logs in production
wrangler tail --env production
```

#### Historical Logs

1. **Cloudflare Dashboard**:
   - Navigate to Workers & Pages
   - Select your worker
   - Click "Logs" tab
   - Filter by time range and log level

2. **Using Logpush** (Enterprise only):
   - Configure Logpush to send logs to external service
   - Supported destinations: S3, GCS, Azure Blob, Datadog, etc.

### Log Queries

#### Find Failed Payments

```bash
wrangler tail --format pretty | grep "ERROR.*payment"
```

#### Find Invalid Signatures

```bash
wrangler tail --format pretty | grep "Invalid.*signature"
```

#### Find Specific Transaction

```bash
wrangler tail --format pretty | grep "TXN-12345"
```

### Log Retention

- **Cloudflare Workers Logs**: 24 hours (free plan), 7 days (paid plans)
- **Database Logs**: 7 years (compliance requirement)
- **Security Logs**: Indefinite retention

### Sensitive Data Masking

The system automatically masks sensitive data in logs:

- Credit card numbers: `****-****-****-1234`
- API keys: `***KEY***`
- Hash keys: `***HASH***`
- Email addresses: `u***@example.com`

---

## Troubleshooting

### Common Issues

#### Issue: High Error Rate

**Symptoms**:
- Error rate > 5%
- Multiple failed payment attempts

**Investigation**:
1. Check error logs:
   ```bash
   wrangler tail --format pretty | grep ERROR
   ```

2. Identify error patterns:
   - Gateway timeouts?
   - Invalid signatures?
   - Database errors?

3. Check gateway status:
   - Visit gateway status pages
   - Check for maintenance windows

**Resolution**:
- If gateway issue: Wait for gateway recovery or switch to backup gateway
- If configuration issue: Verify environment variables
- If code issue: Review recent deployments and rollback if needed

#### Issue: Callback Not Received

**Symptoms**:
- Payment completed at gateway
- Order status not updated
- No callback logs

**Investigation**:
1. Check callback logs:
   ```sql
   SELECT * FROM payment_callbacks 
   WHERE transaction_id = 'TXN-12345'
   ORDER BY created_at DESC;
   ```

2. Verify callback URL is accessible:
   ```bash
   curl -X POST https://your-domain.com/api/payment/callback/newebpay \
     -d "test=1"
   ```

3. Check gateway dashboard for callback attempts

**Resolution**:
- Verify callback URL in gateway settings
- Check firewall rules
- Manually query payment status from gateway
- Update transaction status manually if needed

#### Issue: Signature Verification Failed

**Symptoms**:
- Callbacks rejected with "Invalid signature"
- Security logs show signature failures

**Investigation**:
1. Check security logs:
   ```sql
   SELECT * FROM payment_security_logs 
   WHERE event_type = 'invalid_signature'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

2. Verify credentials:
   ```bash
   wrangler secret list
   ```

3. Test signature calculation:
   - Use gateway's test tools
   - Compare with expected signature

**Resolution**:
- Verify Hash Key and Hash IV are correct
- Check key lengths (NewebPay: 32/16 chars)
- Ensure test/production credentials match environment
- Rotate keys if compromised

#### Issue: Database Connection Errors

**Symptoms**:
- Errors mentioning D1 database
- Failed to create/update transactions

**Investigation**:
1. Check D1 status in Cloudflare Dashboard
2. Verify database binding in wrangler.toml
3. Check database size and limits

**Resolution**:
- Verify database binding is correct
- Check D1 service status
- Review database size limits
- Consider database optimization

#### Issue: Rate Limit Exceeded

**Symptoms**:
- 429 Too Many Requests errors
- Users unable to create payments

**Investigation**:
1. Check rate limit logs
2. Identify source of excessive requests
3. Check for bot activity

**Resolution**:
- Increase rate limits if legitimate traffic
- Block malicious IPs
- Implement CAPTCHA for suspicious activity
- Review rate limit configuration

---

## Security

### Security Monitoring

#### Monitor for Suspicious Activity

1. **Multiple Failed Signature Verifications**:
   ```sql
   SELECT ip_address, COUNT(*) as failures
   FROM payment_security_logs
   WHERE event_type = 'invalid_signature'
     AND created_at > datetime('now', '-1 hour')
   GROUP BY ip_address
   HAVING failures > 5;
   ```

2. **Unusual Payment Patterns**:
   ```sql
   SELECT order_id, COUNT(*) as attempts
   FROM payment_transactions
   WHERE created_at > datetime('now', '-1 hour')
   GROUP BY order_id
   HAVING attempts > 5;
   ```

3. **Rate Limit Violations**:
   ```sql
   SELECT ip_address, COUNT(*) as violations
   FROM payment_security_logs
   WHERE event_type = 'rate_limit'
     AND created_at > datetime('now', '-1 hour')
   GROUP BY ip_address
   HAVING violations > 10;
   ```

### Security Best Practices

1. **Credential Management**:
   - Rotate keys every 90 days
   - Use separate keys for test/production
   - Never log credentials
   - Use Cloudflare Workers secrets

2. **Access Control**:
   - Limit admin access
   - Use role-based access control
   - Audit admin actions
   - Implement 2FA for admin accounts

3. **Network Security**:
   - Use HTTPS only
   - Validate callback source IPs
   - Implement rate limiting
   - Use CSRF protection

4. **Data Protection**:
   - Never store credit card data
   - Mask sensitive data in logs
   - Encrypt data at rest
   - Follow PCI DSS guidelines

### Incident Response

If security incident detected:

1. **Immediate Actions**:
   - Block suspicious IPs
   - Disable compromised accounts
   - Rotate affected credentials
   - Enable additional logging

2. **Investigation**:
   - Review security logs
   - Identify scope of breach
   - Document timeline
   - Preserve evidence

3. **Remediation**:
   - Fix vulnerabilities
   - Update security controls
   - Notify affected users
   - Report to authorities if required

4. **Post-Incident**:
   - Conduct post-mortem
   - Update security procedures
   - Implement preventive measures
   - Train team on lessons learned

---

## Maintenance

### Regular Maintenance Tasks

#### Daily
- [ ] Review error logs
- [ ] Check payment success rate
- [ ] Monitor gateway response times
- [ ] Review security logs

#### Weekly
- [ ] Analyze payment trends
- [ ] Review refund requests
- [ ] Check database size
- [ ] Update documentation

#### Monthly
- [ ] Review and optimize queries
- [ ] Analyze performance metrics
- [ ] Update dependencies
- [ ] Conduct security audit

#### Quarterly
- [ ] Rotate credentials
- [ ] Review and update documentation
- [ ] Conduct disaster recovery test
- [ ] Review compliance requirements

### Database Maintenance

#### Cleanup Old Records

```sql
-- Archive old transactions (keep 7 years)
DELETE FROM payment_transactions
WHERE created_at < datetime('now', '-7 years');

-- Archive old callbacks (keep 1 year)
DELETE FROM payment_callbacks
WHERE created_at < datetime('now', '-1 year');

-- Archive old security logs (keep 2 years)
DELETE FROM payment_security_logs
WHERE created_at < datetime('now', '-2 years');
```

#### Optimize Database

```sql
-- Rebuild indexes
REINDEX;

-- Vacuum database
VACUUM;

-- Analyze tables
ANALYZE;
```

### Deployment Procedures

#### Pre-Deployment Checklist

- [ ] Run all tests
- [ ] Review code changes
- [ ] Update documentation
- [ ] Backup database
- [ ] Notify team of deployment

#### Deployment Steps

1. **Deploy to staging**:
   ```bash
   npm run deploy:dev
   ```

2. **Test in staging**:
   - Run smoke tests
   - Test payment flow
   - Verify callbacks

3. **Deploy to production**:
   ```bash
   npm run deploy
   ```

4. **Post-deployment verification**:
   - Monitor error rates
   - Check payment success rate
   - Verify callbacks working

#### Rollback Procedure

If issues detected after deployment:

1. **Immediate rollback**:
   ```bash
   wrangler rollback
   ```

2. **Verify rollback**:
   - Check error rates
   - Test payment flow
   - Monitor logs

3. **Investigate issue**:
   - Review deployment changes
   - Check error logs
   - Identify root cause

4. **Fix and redeploy**:
   - Fix identified issues
   - Test thoroughly
   - Deploy again

---

## Incident Response

### Severity Levels

#### P0 - Critical
- Payment system completely down
- Data breach detected
- Financial loss occurring

**Response Time**: Immediate
**Escalation**: Notify management immediately

#### P1 - High
- Payment success rate < 50%
- Gateway integration broken
- Security vulnerability detected

**Response Time**: < 15 minutes
**Escalation**: Notify team lead

#### P2 - Medium
- Payment success rate < 90%
- Performance degradation
- Non-critical feature broken

**Response Time**: < 1 hour
**Escalation**: Notify on-call engineer

#### P3 - Low
- Minor bugs
- Documentation issues
- Enhancement requests

**Response Time**: < 1 day
**Escalation**: Create ticket

### Incident Response Workflow

1. **Detection**:
   - Alert triggered
   - User report
   - Monitoring system

2. **Assessment**:
   - Determine severity
   - Identify impact
   - Estimate scope

3. **Response**:
   - Assign incident commander
   - Assemble response team
   - Begin investigation

4. **Mitigation**:
   - Implement temporary fix
   - Restore service
   - Monitor stability

5. **Resolution**:
   - Implement permanent fix
   - Verify resolution
   - Close incident

6. **Post-Mortem**:
   - Document incident
   - Identify root cause
   - Implement preventive measures
   - Share learnings

### Contact Information

#### On-Call Rotation
- Primary: [Name] - [Phone] - [Email]
- Secondary: [Name] - [Phone] - [Email]
- Escalation: [Manager] - [Phone] - [Email]

#### External Contacts
- NewebPay Support: support@newebpay.com / [Phone]
- ECPay Support: techsupport@ecpay.com.tw / [Phone]
- Cloudflare Support: [Support Portal]

---

## Appendix

### Useful Commands

```bash
# View real-time logs
wrangler tail

# View logs with filtering
wrangler tail --format pretty | grep ERROR

# Deploy to production
npm run deploy

# Rollback deployment
wrangler rollback

# List secrets
wrangler secret list

# Update secret
wrangler secret put SECRET_NAME

# Run tests
npm test

# Check database
wrangler d1 execute DB_NAME --command "SELECT COUNT(*) FROM payment_transactions"
```

### Database Schema Reference

See `schema.sql` for complete database schema.

Key tables:
- `payment_transactions`: Main transaction records
- `payment_callbacks`: Callback logs
- `payment_refunds`: Refund records
- `payment_security_logs`: Security event logs

### Performance Benchmarks

- Payment creation: < 500ms
- Callback processing: < 200ms
- Status query: < 100ms
- Refund processing: < 1000ms

---

Last updated: 2024-01-01
Version: 1.0.0
