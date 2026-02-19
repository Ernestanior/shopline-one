# Requirements Document

## Introduction

本文档定义了在电商系统中集成台湾第三方支付网关的需求。系统将支持蓝新金流（NewebPay）和绿界科技（ECPay）两个主流支付服务商，使用户能够通过这些支付方式完成订单交易。系统基于 Cloudflare Workers + Hono + D1 Database 后端架构，以及 React + TypeScript 前端架构。

## Glossary

- **Payment_Gateway**: 第三方支付网关系统，负责处理支付请求和回调
- **NewebPay**: 蓝新金流，台湾主流支付服务商
- **ECPay**: 绿界科技，台湾主流支付服务商
- **Payment_Service**: 系统内部的支付服务模块，负责与第三方支付网关交互
- **Order_System**: 订单管理系统，负责创建和管理订单状态
- **Callback_Handler**: 回调处理器，接收并处理来自支付网关的通知
- **Payment_Method**: 支付方式，包括信用卡、ATM转账、超商代码等
- **API_Credentials**: API凭证，包括商店代号、HashKey、HashIV等敏感信息
- **Payment_Status**: 支付状态，包括待支付、支付中、已支付、已取消、已退款等
- **Transaction_Record**: 交易记录，记录每笔支付的详细信息
- **Environment_Config**: 环境配置，区分测试环境和生产环境的配置

## Requirements

### Requirement 1: 支付网关配置管理

**User Story:** 作为系统管理员，我希望能够安全地配置和管理第三方支付网关的凭证信息，以便系统能够正确连接到支付服务商。

#### Acceptance Criteria

1. THE System SHALL store API_Credentials securely using Cloudflare Workers environment variables
2. WHERE NewebPay is configured, THE System SHALL validate the presence of MerchantID, HashKey, and HashIV
3. WHERE ECPay is configured, THE System SHALL validate the presence of MerchantID, HashKey, and HashIV
4. THE System SHALL support separate configurations for test and production environments
5. WHEN invalid API_Credentials are detected, THE System SHALL prevent payment operations and log error messages

### Requirement 2: 支付方式选择

**User Story:** 作为用户，我希望在结账时能够选择不同的支付方式，以便使用我偏好的支付渠道完成交易。

#### Acceptance Criteria

1. WHEN a user views the checkout page, THE System SHALL display available payment gateways (NewebPay and ECPay)
2. WHERE NewebPay is selected, THE System SHALL display supported Payment_Methods (credit card, ATM, convenience store)
3. WHERE ECPay is selected, THE System SHALL display supported Payment_Methods (credit card, ATM, convenience store, barcode)
4. WHEN a user selects a Payment_Method, THE System SHALL validate the selection before proceeding
5. THE System SHALL persist the selected payment gateway and method with the order

### Requirement 3: 支付请求创建

**User Story:** 作为用户，我希望系统能够正确生成支付请求，以便我能够被导向到支付网关完成付款。

#### Acceptance Criteria

1. WHEN a user initiates payment, THE Payment_Service SHALL create a unique transaction identifier
2. THE Payment_Service SHALL generate payment request parameters according to the selected gateway's API specification
3. WHERE NewebPay is selected, THE Payment_Service SHALL calculate the CheckValue using SHA256 encryption with HashKey and HashIV
4. WHERE ECPay is selected, THE Payment_Service SHALL calculate the CheckMacValue using SHA256 encryption with HashKey and HashIV
5. THE Payment_Service SHALL include order information (amount, description, buyer email) in the payment request
6. THE Payment_Service SHALL specify callback URLs (return URL, notify URL) in the payment request
7. WHEN payment request is created, THE System SHALL store the Transaction_Record in D1 Database with status "pending"

### Requirement 4: 支付页面跳转

**User Story:** 作为用户，我希望能够被安全地导向到支付网关页面，以便完成付款操作。

#### Acceptance Criteria

1. WHEN payment request is ready, THE System SHALL generate an HTML form with payment parameters
2. THE System SHALL auto-submit the form to redirect the user to the Payment_Gateway
3. WHERE NewebPay is selected, THE System SHALL redirect to NewebPay payment URL
4. WHERE ECPay is selected, THE System SHALL redirect to ECPay payment URL
5. THE System SHALL include all required parameters in the form submission

### Requirement 5: 支付回调处理

**User Story:** 作为系统，我需要接收并处理来自支付网关的回调通知，以便更新订单和支付状态。

#### Acceptance Criteria

1. WHEN a payment callback is received, THE Callback_Handler SHALL verify the request source using signature validation
2. WHERE NewebPay callback is received, THE Callback_Handler SHALL validate the CheckValue using SHA256 decryption
3. WHERE ECPay callback is received, THE Callback_Handler SHALL validate the CheckMacValue using SHA256 decryption
4. IF signature validation fails, THEN THE Callback_Handler SHALL reject the request and log a security warning
5. WHEN signature is valid, THE Callback_Handler SHALL parse the payment result data
6. THE Callback_Handler SHALL implement idempotent processing to handle duplicate callbacks
7. WHEN processing a callback, THE Callback_Handler SHALL check if the transaction has already been processed
8. THE Callback_Handler SHALL update the Transaction_Record status based on payment result
9. THE Callback_Handler SHALL update the Order_System status based on payment result
10. WHEN payment is successful, THE Callback_Handler SHALL return a success response to the Payment_Gateway
11. WHEN payment fails, THE Callback_Handler SHALL return an appropriate response to the Payment_Gateway
12. THE Callback_Handler SHALL complete processing within 30 seconds to prevent gateway timeout

### Requirement 6: 支付状态同步

**User Story:** 作为用户，我希望能够实时看到我的支付状态，以便了解交易是否成功。

#### Acceptance Criteria

1. WHEN a user returns from the Payment_Gateway, THE System SHALL display the current Payment_Status
2. THE System SHALL query the Transaction_Record from D1 Database to retrieve the latest status
3. WHERE payment is successful, THE System SHALL display a success message with order details
4. WHERE payment is pending, THE System SHALL display a pending message and provide status check options
5. WHERE payment fails, THE System SHALL display an error message and provide retry options
6. THE System SHALL provide a mechanism to manually query payment status from the Payment_Gateway

### Requirement 7: 交易记录管理

**User Story:** 作为系统管理员，我希望能够查看和管理所有的交易记录，以便进行对账和问题排查。

#### Acceptance Criteria

1. THE System SHALL store all Transaction_Records in D1 Database with complete payment details
2. WHEN a transaction is created, THE System SHALL record timestamp, amount, gateway, payment method, order ID, and unique transaction ID
3. WHEN a transaction status changes, THE System SHALL update the record and log the change timestamp
4. THE System SHALL record all callback attempts with timestamps and response codes
5. THE System SHALL provide an admin interface to query Transaction_Records by date range, status, or order ID
6. THE System SHALL retain transaction logs for at least 7 years for audit purposes
7. THE System SHALL export transaction records in CSV format for accounting purposes

### Requirement 8: 错误处理和重试机制

**User Story:** 作为用户，我希望在支付过程中遇到错误时能够得到清晰的提示，并有机会重试，以便成功完成支付。

#### Acceptance Criteria

1. WHEN a payment request fails, THE System SHALL return a descriptive error message to the user
2. IF network timeout occurs, THEN THE System SHALL allow the user to retry the payment
3. IF Payment_Gateway returns an error, THEN THE System SHALL log the error details and display a user-friendly message
4. THE System SHALL prevent duplicate payment submissions for the same order within a time window
5. WHEN callback processing fails, THE System SHALL implement retry logic with exponential backoff

### Requirement 9: 测试环境支持

**User Story:** 作为开发人员，我希望能够在测试环境中进行真实金钱交易测试，以便验证支付流程的正确性。

#### Acceptance Criteria

1. THE System SHALL support separate Environment_Config for test and production modes
2. WHERE test mode is enabled, THE System SHALL use test API endpoints and credentials
3. WHERE production mode is enabled, THE System SHALL use production API endpoints and credentials
4. THE System SHALL clearly indicate the current environment in admin interfaces
5. THE System SHALL prevent accidental use of production credentials in test environment

### Requirement 10: 支付超时和过期处理

**User Story:** 作为系统，我需要处理支付超时和过期的情况，以便释放库存并保持订单状态的准确性。

#### Acceptance Criteria

1. WHEN a payment is initiated, THE System SHALL set an expiration time based on the Payment_Method
2. WHERE ATM or convenience store payment is selected, THE System SHALL set expiration to 3 days
3. WHERE credit card payment is selected, THE System SHALL set expiration to 30 minutes
4. WHEN payment expiration time is reached, THE System SHALL automatically update the Transaction_Record status to "expired"
5. THE System SHALL provide a background job to check and update expired payments periodically

### Requirement 11: 退款处理

**User Story:** 作为系统管理员，我希望能够处理退款请求，以便在必要时将款项退还给用户。

#### Acceptance Criteria

1. WHEN an admin initiates a refund, THE System SHALL validate that the original payment was successful
2. THE System SHALL create a refund request to the Payment_Gateway with the original transaction identifier
3. WHERE NewebPay refund is requested, THE System SHALL call the NewebPay refund API with proper authentication
4. WHERE ECPay refund is requested, THE System SHALL call the ECPay refund API with proper authentication
5. WHEN refund is successful, THE System SHALL update the Transaction_Record status to "refunded"
6. WHEN refund is successful, THE System SHALL update the Order_System status accordingly
7. THE System SHALL support partial refunds where the gateway allows
8. THE System SHALL record all refund operations with timestamps and operator information

### Requirement 12: 金额和货币处理

**User Story:** 作为系统，我需要正确处理金额和货币信息，以便确保交易金额的准确性。

#### Acceptance Criteria

1. THE System SHALL use New Taiwan Dollar (TWD) as the default currency
2. THE System SHALL store all amounts as integers representing the smallest currency unit (cents)
3. WHEN displaying amounts to users, THE System SHALL format them with proper decimal places
4. THE System SHALL validate that payment amounts are positive integers
5. THE System SHALL validate that payment amounts match the order total before creating payment requests
6. THE System SHALL prevent amount tampering by including amounts in signature calculations

### Requirement 13: 多次支付尝试处理

**User Story:** 作为用户，我希望在支付失败后能够重新尝试支付，以便成功完成订单。

#### Acceptance Criteria

1. THE System SHALL allow multiple payment attempts for the same order
2. WHEN a new payment attempt is made, THE System SHALL create a new Transaction_Record
3. THE System SHALL link all Transaction_Records to the same order for tracking
4. WHEN a payment succeeds, THE System SHALL mark all other pending transactions for the same order as "cancelled"
5. THE System SHALL limit the number of concurrent pending payments per order to prevent abuse

### Requirement 14: 日志和监控

**User Story:** 作为开发人员和运维人员，我希望系统能够记录详细的日志信息，以便进行问题排查和性能监控。

#### Acceptance Criteria

1. THE System SHALL log all payment-related operations with structured logging format
2. WHEN a payment is initiated, THE System SHALL log the order ID, amount, gateway, and timestamp
3. WHEN a callback is received, THE System SHALL log the source IP, transaction ID, and processing result
4. THE System SHALL log all API calls to Payment_Gateways with request and response details
5. THE System SHALL mask sensitive information (API keys, credit card numbers) in all logs
6. THE System SHALL implement log levels (DEBUG, INFO, WARN, ERROR) for different severity events
7. THE System SHALL integrate with Cloudflare Workers logging for centralized log management

### Requirement 15: 安全性要求

**User Story:** 作为系统管理员，我希望系统能够安全地处理支付信息，以便保护用户和商家的资金安全。

#### Acceptance Criteria

1. THE System SHALL never store credit card information directly
2. THE System SHALL validate all callback requests using cryptographic signatures
3. THE System SHALL use HTTPS for all communication with Payment_Gateways
4. THE System SHALL sanitize and validate all input parameters before processing
5. THE System SHALL implement rate limiting on payment endpoints to prevent abuse (max 10 requests per minute per user)
6. THE System SHALL log all security-related events for audit purposes
7. THE System SHALL mask sensitive information in logs and error messages
8. THE System SHALL implement CSRF protection for payment initiation endpoints
9. THE System SHALL validate that callback requests originate from known Payment_Gateway IP addresses

