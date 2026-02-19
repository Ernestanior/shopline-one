# Implementation Plan: Taiwan Payment Gateway Integration

## Overview

本实现计划将台湾第三方支付网关（蓝新金流和绿界科技）集成到现有的电商系统中。实现将基于 Cloudflare Workers + Hono + D1 Database 后端架构和 React + TypeScript 前端架构。任务按照增量方式组织，每个任务都建立在前面的任务之上，确保核心功能尽早通过代码验证。

## Tasks

- [x] 1. 设置数据库Schema和类型定义
  - 创建支付相关的数据库表（payment_transactions, payment_callbacks, payment_refunds, payment_security_logs）
  - 定义TypeScript接口和类型（PaymentGateway, PaymentRequest, PaymentResponse等）
  - 添加数据库迁移脚本
  - _Requirements: 7.1, 7.2, 12.2_

- [x] 2. 实现加密工具函数
  - [x] 2.1 实现SHA256哈希函数（使用Web Crypto API）
    - 创建 `workers/src/utils/crypto.ts`
    - 实现sha256函数
    - _Requirements: 3.3, 3.4_
  
  - [x] 2.2 编写SHA256函数的属性测试
    - **Property 7: Signature Calculation Correctness**
    - **Validates: Requirements 3.3, 3.4**
  
  - [x] 2.3 实现AES-256-CBC加密和解密函数
    - 实现aesEncrypt和aesDecrypt函数（用于NewebPay）
    - 处理Base64编码/解码
    - _Requirements: 3.3_
  
  - [x] 2.4 编写加密函数的单元测试
    - 测试加密/解密往返
    - 测试边缘情况（空字符串、特殊字符）
    - _Requirements: 3.3_

- [x] 3. 实现PaymentGateway接口和基础适配器
  - [x] 3.1 创建PaymentGateway接口
    - 创建 `workers/src/services/payment/gateway.interface.ts`
    - 定义所有必需的方法签名
    - _Requirements: 3.2_
  
  - [x] 3.2 实现NewebPayAdapter
    - 创建 `workers/src/services/payment/newebpay.adapter.ts`
    - 实现createPayment方法（生成加密参数和HTML表单）
    - 实现verifyCallback方法（验证签名）
    - 实现parseCallback方法（解密和解析回调数据）
    - _Requirements: 3.2, 3.3, 5.2, 5.5_
  
  - [x] 3.3 编写NewebPay签名验证的属性测试
    - **Property 7: Signature Calculation Correctness**
    - **Property 11: Callback Signature Verification**
    - **Validates: Requirements 3.3, 5.2**
  
  - [x] 3.4 实现ECPayAdapter
    - 创建 `workers/src/services/payment/ecpay.adapter.ts`
    - 实现createPayment方法（生成CheckMacValue和HTML表单）
    - 实现verifyCallback方法（验证CheckMacValue）
    - 实现parseCallback方法（解析回调数据）
    - _Requirements: 3.2, 3.4, 5.3, 5.5_
  
  - [x] 3.5 编写ECPay签名验证的属性测试
    - **Property 7: Signature Calculation Correctness**
    - **Property 11: Callback Signature Verification**
    - **Validates: Requirements 3.4, 5.3**

- [x] 4. Checkpoint - 验证网关适配器
  - 确保所有测试通过，如有问题请询问用户


- [x] 5. 实现PaymentService核心服务
  - [x] 5.1 创建PaymentService类
    - 创建 `workers/src/services/payment/payment.service.ts`
    - 实现网关初始化逻辑
    - 实现createPayment方法
    - 实现数据库操作方法（createTransaction, updateTransaction等）
    - _Requirements: 3.1, 3.7, 7.2_
  
  - [x] 5.2 编写交易创建的属性测试
    - **Property 5: Transaction ID Uniqueness**
    - **Property 8: Transaction Record Creation**
    - **Validates: Requirements 3.1, 3.7**
  
  - [x] 5.3 实现handleCallback方法
    - 添加签名验证逻辑
    - 实现幂等性检查
    - 实现状态更新逻辑
    - 添加安全事件日志
    - _Requirements: 5.1, 5.4, 5.6, 5.8, 5.9_
  
  - [x] 5.4 编写回调处理的属性测试
    - **Property 12: Invalid Callback Rejection**
    - **Property 13: Callback Idempotence**
    - **Property 14: Transaction Status Update**
    - **Property 15: Order Status Synchronization**
    - **Validates: Requirements 5.4, 5.6, 5.8, 5.9**
  
  - [x] 5.5 实现queryPaymentStatus方法
    - 从数据库查询交易状态
    - _Requirements: 6.2_
  
  - [x] 5.6 编写状态查询的单元测试
    - 测试查询存在的交易
    - 测试查询不存在的交易
    - _Requirements: 6.2_

- [x] 6. 实现退款功能
  - [x] 6.1 在NewebPayAdapter中实现refund方法
    - 调用NewebPay退款API
    - 生成退款请求签名
    - _Requirements: 11.2, 11.3_
  
  - [x] 6.2 在ECPayAdapter中实现refund方法
    - 调用ECPay退款API
    - 生成退款请求签名
    - _Requirements: 11.2, 11.4_
  
  - [x] 6.3 在PaymentService中实现refundPayment方法
    - 验证原始支付状态
    - 验证退款金额
    - 调用网关退款API
    - 创建退款记录
    - 更新交易状态
    - _Requirements: 11.1, 11.5, 11.6, 11.7, 11.8_
  
  - [x] 6.4 编写退款功能的属性测试
    - **Property 29: Refund Validation**
    - **Property 32: Refund Status Update**
    - **Property 33: Partial Refund Support**
    - **Property 34: Refund Record Creation**
    - **Validates: Requirements 11.1, 11.5, 11.6, 11.7, 11.8**

- [x] 7. 实现验证和安全功能
  - [x] 7.1 实现配置验证
    - 创建 `workers/src/services/payment/config-validator.ts`
    - 验证必需的配置字段
    - _Requirements: 1.2, 1.3, 1.5_
  
  - [x] 7.2 编写配置验证的属性测试
    - **Property 1: Gateway Configuration Validation**
    - **Property 2: Invalid Credentials Prevention**
    - **Validates: Requirements 1.2, 1.3, 1.5**
  
  - [x] 7.3 实现输入验证和清理
    - 创建 `workers/src/middleware/payment-validation.ts`
    - 验证支付金额
    - 验证支付方式
    - 清理输入参数
    - _Requirements: 12.4, 12.5, 15.4_
  
  - [x] 7.4 编写输入验证的属性测试
    - **Property 35: Amount Storage Format**
    - **Property 37: Payment Amount Validation**
    - **Property 48: Input Sanitization**
    - **Validates: Requirements 12.4, 12.5, 15.4**
  
  - [x] 7.5 实现限流中间件
    - 创建 `workers/src/middleware/rate-limiter.ts`
    - 实现基于用户的限流（每分钟10次）
    - _Requirements: 15.5_
  
  - [x] 7.6 编写限流的单元测试
    - 测试正常请求通过
    - 测试超过限制被拒绝
    - _Requirements: 15.5_
  
  - [x] 7.7 实现CSRF保护
    - 添加CSRF token生成和验证
    - _Requirements: 15.8_

- [x] 8. Checkpoint - 验证核心服务和安全功能
  - 确保所有测试通过，如有问题请询问用户


- [x] 9. 实现API路由（Hono）
  - [x] 9.1 创建支付路由文件
    - 创建 `workers/src/routes/payment.ts`
    - 设置CORS和中间件
    - _Requirements: 15.3_
  
  - [x] 9.2 实现POST /api/payment/create端点
    - 验证用户身份
    - 获取订单信息
    - 调用PaymentService.createPayment
    - 返回支付表单HTML
    - _Requirements: 3.1, 3.2, 3.5, 3.6, 3.7_
  
  - [x] 9.3 编写创建支付端点的属性测试
    - **Property 6: Payment Request Parameter Completeness**
    - **Property 9: HTML Form Generation**
    - **Validates: Requirements 3.2, 3.5, 3.6, 4.1, 4.2**
  
  - [x] 9.4 实现POST /api/payment/callback/:gateway端点
    - 解析回调数据
    - 调用PaymentService.handleCallback
    - 返回网关期望的响应格式
    - _Requirements: 5.1, 5.10, 5.11_
  
  - [x] 9.5 编写回调端点的单元测试
    - 测试有效回调
    - 测试无效签名回调
    - 测试重复回调
    - _Requirements: 5.1, 5.4, 5.6_
  
  - [x] 9.6 实现GET /api/payment/status/:orderId端点
    - 验证用户身份和订单所有权
    - 调用PaymentService.queryPaymentStatus
    - 返回支付状态
    - _Requirements: 6.1, 6.2_
  
  - [x] 9.7 实现POST /api/payment/refund端点
    - 验证管理员权限
    - 调用PaymentService.refundPayment
    - 返回退款结果
    - _Requirements: 11.1, 11.2_
  
  - [x] 9.8 编写API路由的集成测试
    - 测试完整的支付流程（创建->回调->查询）
    - 测试退款流程
    - _Requirements: 3.1, 5.1, 6.1, 11.1_

- [x] 10. 实现错误处理
  - [x] 10.1 创建PaymentError类和错误代码
    - 创建 `workers/src/services/payment/errors.ts`
    - 定义所有错误类型和代码
    - _Requirements: 8.1_
  
  - [x] 10.2 实现错误处理中间件
    - 添加到Hono应用
    - 记录错误日志
    - 返回用户友好的错误消息
    - 脱敏敏感信息
    - _Requirements: 8.1, 8.3, 14.5_
  
  - [x] 10.3 实现重试逻辑
    - 创建retryWithBackoff工具函数
    - 应用到网关API调用
    - _Requirements: 8.5_
  
  - [x] 10.4 实现超时处理
    - 创建withTimeout工具函数
    - 应用到网关API调用（30秒超时）
    - _Requirements: 8.2_
  
  - [x] 10.5 编写错误处理的单元测试
    - 测试各种错误场景
    - 测试重试逻辑
    - 测试超时处理
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

- [x] 11. 实现日志和监控
  - [x] 11.1 创建结构化日志工具
    - 创建 `workers/src/utils/logger.ts`
    - 实现日志级别（DEBUG, INFO, WARN, ERROR）
    - 实现敏感信息脱敏
    - _Requirements: 14.1, 14.5, 14.6_
  
  - [x] 11.2 添加支付操作日志
    - 在createPayment中添加日志
    - 在handleCallback中添加日志
    - 在refundPayment中添加日志
    - _Requirements: 14.2, 14.3, 14.4_
  
  - [x] 11.3 编写日志功能的属性测试
    - **Property 43: Payment Initiation Logging**
    - **Property 44: Callback Logging Details**
    - **Property 46: Sensitive Data Masking**
    - **Validates: Requirements 14.2, 14.3, 14.5**
  
  - [x] 11.4 实现安全事件日志
    - 记录无效签名
    - 记录限流事件
    - 记录无效IP
    - _Requirements: 15.6_

- [x] 12. Checkpoint - 验证后端完整性
  - 确保所有测试通过，如有问题请询问用户


- [x] 13. 实现前端组件
  - [x] 13.1 创建PaymentMethodSelector组件
    - 创建 `client/src/components/PaymentMethodSelector.tsx`
    - 显示可用的支付网关（NewebPay和ECPay）
    - 显示每个网关支持的支付方式
    - 处理用户选择
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 13.2 编写PaymentMethodSelector的单元测试
    - 测试网关显示
    - 测试支付方式显示
    - 测试用户选择
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 13.3 创建CheckoutPage组件
    - 创建 `client/src/pages/CheckoutPage.tsx`
    - 显示订单摘要
    - 集成PaymentMethodSelector
    - 调用/api/payment/create API
    - 处理返回的HTML表单并自动提交
    - 显示加载状态和错误消息
    - _Requirements: 3.1, 4.1, 4.2_
  
  - [x] 13.4 编写CheckoutPage的单元测试
    - 测试订单显示
    - 测试支付创建流程
    - 测试错误处理
    - _Requirements: 3.1, 8.1_
  
  - [x] 13.5 创建PaymentReturnPage组件
    - 创建 `client/src/pages/PaymentReturnPage.tsx`
    - 查询支付状态
    - 显示支付结果（成功/待处理/失败）
    - 实现状态轮询（每5秒，最多1分钟）
    - 提供重试选项（失败时）
    - _Requirements: 6.1, 6.3, 6.4, 6.5_
  
  - [x] 13.6 编写PaymentReturnPage的单元测试
    - 测试成功状态显示
    - 测试待处理状态显示
    - 测试失败状态显示
    - _Requirements: 6.3, 6.4, 6.5_
  
  - [x] 13.7 添加支付相关的路由
    - 在React Router中添加/checkout/:orderId路由
    - 添加/payment/return/:orderId路由
    - _Requirements: 2.1, 6.1_

- [x] 14. 实现管理员功能
  - [x] 14.1 创建交易记录查询页面
    - 创建 `client/src/pages/admin/TransactionsPage.tsx`
    - 实现按日期范围、状态、订单ID查询
    - 显示交易列表
    - _Requirements: 7.5_
  
  - [x] 14.2 实现CSV导出功能
    - 添加导出按钮
    - 调用后端API生成CSV
    - 下载CSV文件
    - _Requirements: 7.7_
  
  - [x] 14.3 创建退款操作界面
    - 在交易详情页添加退款按钮
    - 实现退款表单（金额、原因）
    - 调用/api/payment/refund API
    - _Requirements: 11.1_
  
  - [x] 14.4 显示环境指示器
    - 在管理界面显示当前环境（测试/生产）
    - _Requirements: 9.4_

- [x] 15. 配置环境变量和部署设置
  - [x] 15.1 创建环境变量模板
    - 创建 `workers/.env.example`
    - 列出所有必需的环境变量
    - 添加说明文档
    - _Requirements: 1.1, 1.4_
  
  - [x] 15.2 配置Cloudflare Workers环境变量
    - 在wrangler.toml中配置变量绑定
    - 设置测试环境和生产环境的不同配置
    - _Requirements: 1.1, 9.1, 9.2, 9.3_
  
  - [x] 15.3 更新部署文档
    - 添加支付网关配置说明
    - 添加测试流程说明
    - 添加生产部署检查清单
    - _Requirements: 9.1_

- [x] 16. 实现支付过期处理
  - [x] 16.1 实现过期时间设置逻辑
    - 在createPayment中根据支付方式设置过期时间
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [x] 16.2 编写过期时间的属性测试
    - **Property 27: Payment Expiration Time**
    - **Validates: Requirements 10.1, 10.2, 10.3**
  
  - [x] 16.3 创建定时任务处理过期支付
    - 创建 `workers/src/cron/expire-payments.ts`
    - 查询过期的待支付交易
    - 更新状态为expired
    - _Requirements: 10.4, 10.5_
  
  - [x] 16.4 配置Cloudflare Workers Cron Trigger
    - 在wrangler.toml中配置定时任务
    - 设置每小时运行一次
    - _Requirements: 10.5_

- [x] 17. 实现多次支付尝试处理
  - [x] 17.1 修改createPayment支持多次尝试
    - 允许为同一订单创建多个交易
    - 检查并发待支付限制
    - _Requirements: 13.1, 13.2, 13.5_
  
  - [x] 17.2 编写多次支付尝试的属性测试
    - **Property 39: Multiple Payment Attempts**
    - **Property 40: Transaction-Order Linking**
    - **Property 42: Concurrent Payment Limit**
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.5**
  
  - [x] 17.3 实现成功支付后取消其他待支付
    - 在handleCallback中添加逻辑
    - 当支付成功时，取消同一订单的其他待支付交易
    - _Requirements: 13.4_
  
  - [x] 17.4 编写待支付取消的属性测试
    - **Property 41: Pending Transaction Cancellation**
    - **Validates: Requirements 13.4**

- [x] 18. 最终集成和测试
  - [x] 18.1 运行所有属性测试
    - 确保所有52个属性测试通过
    - 验证每个测试至少运行100次迭代
  
  - [x] 18.2 运行所有单元测试
    - 确保代码覆盖率达到目标（>80%行覆盖率）
  
  - [x] 18.3 运行集成测试
    - 测试完整的支付流程
    - 测试退款流程
    - 测试错误场景
  
  - [x] 18.4 手动测试
    - 在测试环境中测试NewebPay支付流程
    - 在测试环境中测试ECPay支付流程
    - 测试各种支付方式（信用卡、ATM、超商）
    - 测试退款功能
    - 测试错误处理

- [x] 19. 文档和交付
  - [x] 19.1 编写API文档
    - 记录所有支付相关的API端点
    - 包含请求/响应示例
    - _Requirements: 所有API相关需求_
  
  - [x] 19.2 编写用户指南
    - 如何配置支付网关
    - 如何测试支付流程
    - 如何处理常见问题
  
  - [x] 19.3 编写运维文档
    - 监控指标说明
    - 日志查询方法
    - 故障排查指南
    - 安全最佳实践

- [x] 20. Final Checkpoint - 完整性验证
  - 确保所有功能正常工作
  - 确保所有测试通过
  - 确保文档完整
  - 如有问题请询问用户

## Notes

- 每个任务都引用了具体的需求，便于追溯
- Checkpoint任务确保增量验证
- 属性测试验证通用正确性属性
- 单元测试验证特定示例和边缘情况
- 集成测试验证端到端流程
- 所有测试任务都是必需的，以确保从一开始就有全面的测试覆盖

